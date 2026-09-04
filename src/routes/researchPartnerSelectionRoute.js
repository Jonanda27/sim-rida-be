const express = require('express');
const {
  getPartnerSelections,
  getAvailableProposals,
  getPartnerSelectionStatistics,
  getPartnerSelectionById,
  getPartnerSelectionSummary,
  createPartnerSelection,
  updatePartnerSelection,
  submitPartnerSelection,
  returnPartnerSelection,
  finalizePartnerSelection,
  cancelPartnerSelection,
  getPartnerDocuments,
  uploadPartnerDocument,
  deletePartnerDocument,
} = require('../controllers/researchPartnerSelectionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');
const {
  createPartnerSelectionSchema,
  updatePartnerSelectionSchema,
  returnPartnerSelectionSchema,
  cancelPartnerSelectionSchema,
} = require('../validations/researchPartnerSelectionValidation');

const router = express.Router();

// Require login for all routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowActionRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');

/**
 * @route   GET /api/research-partner-selections/available-proposals
 * @desc    Get proposals available for partner assignment
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/available-proposals', allowReadRoles, getAvailableProposals);

/**
 * @route   GET /api/research-partner-selections/statistics
 * @desc    Get partner selection statistics
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/statistics', allowReadRoles, getPartnerSelectionStatistics);

/**
 * @route   GET /api/research-partner-selections
 * @desc    Get paginated partner selections
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-partner-selections
 * @desc    Create new partner selection for proposal
 * @access  Private (BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getPartnerSelections)
  .post(allowActionRoles, validate(createPartnerSelectionSchema), createPartnerSelection);

/**
 * @route   GET /api/research-partner-selections/:id/summary
 * @desc    Get partner selection summary & budget warning
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id/summary', allowReadRoles, getPartnerSelectionSummary);

/**
 * @route   GET /api/research-partner-selections/:id
 * @desc    Get detailed partner selection by ID
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   PATCH /api/research-partner-selections/:id
 * @desc    Update partner selection draft or revision
 * @access  Private (BRIDA)
 */
router.route('/:id')
  .get(allowReadRoles, getPartnerSelectionById)
  .patch(allowActionRoles, validate(updatePartnerSelectionSchema), updatePartnerSelection);

/**
 * @route   POST /api/research-partner-selections/:id/submit
 * @desc    Submit partner selection for review
 * @access  Private (BRIDA)
 */
router.post('/:id/submit', allowActionRoles, submitPartnerSelection);

/**
 * @route   POST /api/research-partner-selections/:id/return
 * @desc    Return partner selection for revision
 * @access  Private (BRIDA)
 */
router.post('/:id/return', allowActionRoles, validate(returnPartnerSelectionSchema), returnPartnerSelection);

/**
 * @route   POST /api/research-partner-selections/:id/finalize
 * @desc    Finalize partner selection (sets status to SELECTED and proposal to READY_FOR_IMPLEMENTATION)
 * @access  Private (BRIDA)
 */
router.post('/:id/finalize', allowActionRoles, finalizePartnerSelection);

/**
 * @route   POST /api/research-partner-selections/:id/cancel
 * @desc    Cancel partner selection draft
 * @access  Private (BRIDA)
 */
router.post('/:id/cancel', allowActionRoles, validate(cancelPartnerSelectionSchema), cancelPartnerSelection);

/**
 * @route   GET /api/research-partner-selections/:id/documents
 * @desc    Get supporting documents for partner selection
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-partner-selections/:id/documents
 * @desc    Upload supporting document for partner selection
 * @access  Private (BRIDA)
 */
router.route('/:id/documents')
  .get(allowReadRoles, getPartnerDocuments)
  .post(allowActionRoles, upload.single('file'), uploadPartnerDocument);

/**
 * @route   DELETE /api/research-partner-selections/:id/documents/:documentId
 * @desc    Delete supporting document
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.delete('/:id/documents/:documentId', allowActionRoles, deletePartnerDocument);

module.exports = router;
