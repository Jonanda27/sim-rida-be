const express = require('express');
const {
  getSelections,
  getSelectionStatistics,
  getCriteria,
  getSelectionById,
  createSelection,
  startAssessment,
  updateScore,
  bulkUpdateScores,
  finalizeSelection,
  cancelSelection,
} = require('../controllers/researchSelectionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createSelectionSchema,
  updateScoreSchema,
  bulkUpdateScoresSchema,
  finalizeSelectionSchema,
  cancelSelectionSchema,
} = require('../validations/researchSelectionValidation');

const router = express.Router();

// Require login for all selection routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowBridaOnly = requireRole('BRIDA');

/**
 * @route   GET /api/research-selections
 * @desc    Get paginated research selections with filters
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-selections
 * @desc    Create a new research selection for an approved proposal
 * @access  Private (BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getSelections)
  .post(allowBridaOnly, validate(createSelectionSchema), createSelection);

/**
 * @route   GET /api/research-selections/statistics
 * @desc    Get aggregated selection statistics
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/statistics', allowReadRoles, getSelectionStatistics);

/**
 * @route   GET /api/research-selections/criteria
 * @desc    Get active selection criteria
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/criteria', allowReadRoles, getCriteria);

/**
 * @route   GET /api/research-selections/:id
 * @desc    Get detailed research selection with criteria and scores
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id', allowReadRoles, getSelectionById);

/**
 * @route   POST /api/research-selections/:id/start
 * @desc    Start assessment (status DRAFT -> IN_ASSESSMENT)
 * @access  Private (BRIDA)
 */
router.post('/:id/start', allowBridaOnly, startAssessment);

/**
 * @route   PATCH /api/research-selections/:id/scores/:scoreId
 * @desc    Update single score entry
 * @access  Private (BRIDA)
 */
router.patch('/:id/scores/:scoreId', allowBridaOnly, validate(updateScoreSchema), updateScore);

/**
 * @route   PATCH /api/research-selections/:id/scores
 * @desc    Bulk update criteria scores
 * @access  Private (BRIDA)
 */
router.patch('/:id/scores', allowBridaOnly, validate(bulkUpdateScoresSchema), bulkUpdateScores);

/**
 * @route   POST /api/research-selections/:id/finalize
 * @desc    Finalize selection and set proposal status (SELECTED / NOT_SELECTED)
 * @access  Private (BRIDA)
 */
router.post('/:id/finalize', allowBridaOnly, validate(finalizeSelectionSchema), finalizeSelection);

/**
 * @route   POST /api/research-selections/:id/cancel
 * @desc    Cancel draft selection
 * @access  Private (BRIDA)
 */
router.post('/:id/cancel', allowBridaOnly, validate(cancelSelectionSchema), cancelSelection);

module.exports = router;
