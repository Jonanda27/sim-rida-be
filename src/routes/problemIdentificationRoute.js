const express = require('express');
const {
  createProblemIdentification,
  getProblemIdentifications,
  getProblemIdentificationById,
  updateProblemIdentification,
  approveProblemIdentification,
  rejectProblemIdentification,
  validateProblemIdentification,
} = require('../controllers/problemIdentificationController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createProblemIdentificationSchema,
  updateProblemIdentificationSchema,
  rejectProblemIdentificationSchema,
} = require('../validations/problemIdentificationValidation');
const { createResearchProposalFromProblem } = require('../controllers/researchProposalController');
const { createFromProblemSchema } = require('../validations/researchProposalValidation');

const router = express.Router();

// Require login for all routes
router.use(requireAuth);

// Read routes: Accessible by ADMIN_BRIDA, BRIDA, KEPALA_BRIDA
const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
// Mutation routes: BRIDA only
const allowBridaOnly = requireRole('BRIDA');

/**
 * @route   POST /api/problem-identifications
 * @desc    Create a new problem identification
 * @access  Private (BRIDA)
 */
router.post('/', allowBridaOnly, validate(createProblemIdentificationSchema), createProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/research-proposals
 * @desc    Create a research proposal directly from an approved problem identification
 * @access  Private (BRIDA)
 */
router.post(
  '/:id/research-proposals',
  allowBridaOnly,
  validate(createFromProblemSchema),
  createResearchProposalFromProblem
);

/**
 * @route   GET /api/problem-identifications
 * @desc    Get paginated problem identifications with filters
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/', allowReadRoles, getProblemIdentifications);

/**
 * @route   GET /api/problem-identifications/:id
 * @desc    Get problem identification detail
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id', allowReadRoles, getProblemIdentificationById);

/**
 * @route   PATCH /api/problem-identifications/:id
 * @desc    Update problem identification (Edit title, description, findings)
 * @access  Private (BRIDA)
 */
router.patch('/:id', allowBridaOnly, validate(updateProblemIdentificationSchema), updateProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/approve
 * @desc    Approve problem identification by BRIDA
 * @access  Private (BRIDA)
 */
router.post('/:id/approve', allowBridaOnly, approveProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/reject
 * @desc    Reject problem identification with reviewNote
 * @access  Private (BRIDA)
 */
router.post('/:id/reject', allowBridaOnly, validate(rejectProblemIdentificationSchema), rejectProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/validate
 * @desc    Validate / Decide problem identification (Approve or Reject)
 * @access  Private (BRIDA)
 */
router.post('/:id/validate', allowBridaOnly, validateProblemIdentification);

module.exports = router;

