const express = require('express');
const {
  getKaks,
  getKakById,
  createKak,
  updateKak,
  submitKak,
  returnKak,
  finalizeKak,
  cancelKak,
  getKakReview,
} = require('../controllers/researchKakController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createKakSchema,
  updateKakSchema,
  returnKakSchema,
  cancelKakSchema,
} = require('../validations/researchKakValidation');

const router = express.Router();

// Require login for all KAK routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowActionRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');

/**
 * @route   GET /api/research-kaks
 * @desc    Get paginated KAK list
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-kaks
 * @desc    Create new KAK for SELECTED proposal
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getKaks)
  .post(allowActionRoles, validate(createKakSchema), createKak);

/**
 * @route   GET /api/research-kaks/:id/review
 * @desc    Get KAK review notes
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id/review', allowReadRoles, getKakReview);

/**
 * @route   GET /api/research-kaks/:id
 * @desc    Get detailed KAK by ID
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   PATCH /api/research-kaks/:id
 * @desc    Update KAK draft or revision
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.route('/:id')
  .get(allowReadRoles, getKakById)
  .patch(allowActionRoles, validate(updateKakSchema), updateKak);

/**
 * @route   POST /api/research-kaks/:id/submit
 * @desc    Submit KAK for internal review
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/submit', allowActionRoles, submitKak);

/**
 * @route   POST /api/research-kaks/:id/return
 * @desc    Return KAK for revision
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/return', allowActionRoles, validate(returnKakSchema), returnKak);

/**
 * @route   POST /api/research-kaks/:id/finalize
 * @desc    Finalize KAK
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/finalize', allowActionRoles, finalizeKak);

/**
 * @route   POST /api/research-kaks/:id/cancel
 * @desc    Cancel KAK draft
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/cancel', allowActionRoles, validate(cancelKakSchema), cancelKak);

module.exports = router;
