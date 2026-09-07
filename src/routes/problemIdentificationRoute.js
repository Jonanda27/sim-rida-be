const express = require('express');
const {
  createProblemIdentification,
  getProblemIdentifications,
  getProblemIdentificationById,
  updateProblemIdentification,
  approveProblemIdentification,
  rejectProblemIdentification,
  validateProblemIdentification,
  deleteProblemIdentification,
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
const allowReadRoles = requireRole(['ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA']);
// Mutation routes: ADMIN_BRIDA, BRIDA
const allowMutationRoles = requireRole(['ADMIN_BRIDA', 'BRIDA']);

/**
 * @route   POST /api/problem-identifications
 * @desc    Create a new problem identification (BRIDA analysis)
 * @access  Private (ADMIN_BRIDA, BRIDA)
 */
router.post('/', allowMutationRoles, validate(createProblemIdentificationSchema), createProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/research-proposals
 * @desc    Create a research proposal directly from an approved problem identification
 * @access  Private (ADMIN_BRIDA, BRIDA)
 */
router.post(
  '/:id/research-proposals',
  allowMutationRoles,
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
 * @desc    Update problem identification (Edit by BRIDA)
 * @access  Private (ADMIN_BRIDA, BRIDA)
 */
router.patch('/:id', allowMutationRoles, validate(updateProblemIdentificationSchema), updateProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/approve
 * @desc    Approve problem identification
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/approve', allowReadRoles, approveProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/reject
 * @desc    Reject problem identification with reviewNote
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/reject', allowReadRoles, validate(rejectProblemIdentificationSchema), rejectProblemIdentification);

/**
 * @route   POST /api/problem-identifications/:id/validate
 * @desc    Validate (Approve or Reject) problem identification
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/validate', allowReadRoles, validateProblemIdentification);

/**
 * @route   DELETE /api/problem-identifications/:id
 * @desc    Delete problem identification
 * @access  Private (ADMIN_BRIDA, BRIDA)
 */
router.delete('/:id', allowMutationRoles, deleteProblemIdentification);

module.exports = router;
