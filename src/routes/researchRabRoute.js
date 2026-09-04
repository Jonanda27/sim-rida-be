const express = require('express');
const {
  getRabs,
  getRabById,
  createRab,
  addRabItem,
  updateRabItem,
  deleteRabItem,
  bulkUpdateRabItems,
  reorderRabItems,
  getRabSummary,
  submitRab,
  returnRab,
  finalizeRab,
  cancelRab,
} = require('../controllers/researchRabController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createRabSchema,
  createRabItemSchema,
  updateRabItemSchema,
  bulkRabItemsSchema,
  reorderRabItemsSchema,
  returnRabSchema,
  cancelRabSchema,
} = require('../validations/researchRabValidation');

const router = express.Router();

// Require login for all RAB routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowActionRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');

/**
 * @route   GET /api/research-rabs
 * @desc    Get paginated RAB list
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-rabs
 * @desc    Create new RAB for KAK
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getRabs)
  .post(allowActionRoles, validate(createRabSchema), createRab);

/**
 * @route   GET /api/research-rabs/:id/summary
 * @desc    Get category summary of RAB
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id/summary', allowReadRoles, getRabSummary);

/**
 * @route   GET /api/research-rabs/:id
 * @desc    Get detailed RAB by ID
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:id', allowReadRoles, getRabById);

/**
 * @route   POST /api/research-rabs/:id/items
 * @desc    Add single item to RAB
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   PUT /api/research-rabs/:id/items
 * @desc    Bulk set/update items in RAB
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.route('/:id/items')
  .post(allowActionRoles, validate(createRabItemSchema), addRabItem)
  .put(allowActionRoles, validate(bulkRabItemsSchema), bulkUpdateRabItems);

/**
 * @route   PATCH /api/research-rabs/:id/items/reorder
 * @desc    Reorder RAB items
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.patch('/:id/items/reorder', allowActionRoles, validate(reorderRabItemsSchema), reorderRabItems);

/**
 * @route   PATCH /api/research-rabs/:id/items/:itemId
 * @desc    Update single item in RAB
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   DELETE /api/research-rabs/:id/items/:itemId
 * @desc    Delete single item from RAB
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.route('/:id/items/:itemId')
  .patch(allowActionRoles, validate(updateRabItemSchema), updateRabItem)
  .delete(allowActionRoles, deleteRabItem);

/**
 * @route   POST /api/research-rabs/:id/submit
 * @desc    Submit RAB for review
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/submit', allowActionRoles, submitRab);

/**
 * @route   POST /api/research-rabs/:id/return
 * @desc    Return RAB for revision
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/return', allowActionRoles, validate(returnRabSchema), returnRab);

/**
 * @route   POST /api/research-rabs/:id/finalize
 * @desc    Finalize RAB
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/finalize', allowActionRoles, finalizeRab);

/**
 * @route   POST /api/research-rabs/:id/cancel
 * @desc    Cancel RAB draft
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/cancel', allowActionRoles, validate(cancelRabSchema), cancelRab);

module.exports = router;
