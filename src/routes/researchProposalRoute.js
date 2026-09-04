const express = require('express');
const {
  getResearchProposals,
  getResearchProposalById,
  createResearchProposal,
  updateResearchProposal,
  submitResearchProposal,
  returnResearchProposal,
  approveResearchProposal,
  cancelResearchProposal,
  getResearchProposalReview,
  getResearchProposalTraceability,
} = require('../controllers/researchProposalController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createProposalSchema,
  updateProposalSchema,
  returnProposalSchema,
  cancelProposalSchema,
} = require('../validations/researchProposalValidation');

const router = express.Router();

// Require login for all proposal routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowBridaOnly = requireRole('BRIDA');

/**
 * @route   GET /api/research-proposals
 * @desc    Get paginated research proposals with filters
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-proposals
 * @desc    Create a new research proposal
 * @access  Private (BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getResearchProposals)
  .post(allowBridaOnly, validate(createProposalSchema), createResearchProposal);

/**
 * @route   GET /api/research-proposals/:id/review
 * @desc    Get internal review detail
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id/review', allowReadRoles, getResearchProposalReview);

/**
 * @route   GET /api/research-proposals/:id/traceability
 * @desc    Get visual traceability chain (Proposal -> Problem -> Version -> Document)
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id/traceability', allowReadRoles, getResearchProposalTraceability);

/**
 * @route   GET /api/research-proposals/:id
 * @desc    Get detailed research proposal
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   PATCH /api/research-proposals/:id
 * @desc    Update research proposal (DRAFT or REVISION_REQUIRED only)
 * @access  Private (BRIDA)
 */
router.route('/:id')
  .get(allowReadRoles, getResearchProposalById)
  .patch(allowBridaOnly, validate(updateProposalSchema), updateResearchProposal);

/**
 * @route   POST /api/research-proposals/:id/submit
 * @desc    Submit proposal for internal review (checks complete substantive fields)
 * @access  Private (BRIDA)
 */
router.post('/:id/submit', allowBridaOnly, submitResearchProposal);

/**
 * @route   POST /api/research-proposals/:id/return
 * @desc    Return proposal for revision
 * @access  Private (BRIDA)
 */
router.post('/:id/return', allowBridaOnly, validate(returnProposalSchema), returnResearchProposal);

/**
 * @route   POST /api/research-proposals/:id/approve
 * @desc    Approve proposal for selection stage (APPROVED_FOR_SELECTION)
 * @access  Private (BRIDA)
 */
router.post('/:id/approve', allowBridaOnly, approveResearchProposal);

/**
 * @route   POST /api/research-proposals/:id/cancel
 * @desc    Cancel research proposal
 * @access  Private (BRIDA)
 */
router.post('/:id/cancel', allowBridaOnly, validate(cancelProposalSchema), cancelResearchProposal);

module.exports = router;
