const express = require('express');
const {
  getPartners,
  getPartnerStatistics,
  getPartnerById,
  createPartner,
  updatePartner,
  deactivatePartner,
  reactivatePartner,
  deletePartner,
} = require('../controllers/researchPartnerController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createPartnerSchema,
  updatePartnerSchema,
} = require('../validations/researchPartnerValidation');

const router = express.Router();

// Require login for all partner routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowActionRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');

/**
 * @route   GET /api/research-partners/statistics
 * @desc    Get aggregated partner statistics
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/statistics', allowReadRoles, getPartnerStatistics);

/**
 * @route   GET /api/research-partners
 * @desc    Get paginated partners list
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/research-partners
 * @desc    Create new partner
 * @access  Private (BRIDA, ADMIN_BRIDA, KEPALA_BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getPartners)
  .post(allowActionRoles, validate(createPartnerSchema), createPartner);

/**
 * @route   GET /api/research-partners/:id
 * @desc    Get detailed partner by ID
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   PATCH /api/research-partners/:id
 * @desc    Update partner master data
 * @access  Private (BRIDA, ADMIN_BRIDA, KEPALA_BRIDA)
 * 
 * @route   DELETE /api/research-partners/:id
 * @desc    Delete partner (only if never used)
 * @access  Private (BRIDA, ADMIN_BRIDA, KEPALA_BRIDA)
 */
router.route('/:id')
  .get(allowReadRoles, getPartnerById)
  .patch(allowActionRoles, validate(updatePartnerSchema), updatePartner)
  .delete(allowActionRoles, deletePartner);

/**
 * @route   POST /api/research-partners/:id/deactivate
 * @desc    Soft-deactivate partner
 * @access  Private (BRIDA)
 */
router.post('/:id/deactivate', allowActionRoles, deactivatePartner);

/**
 * @route   POST /api/research-partners/:id/reactivate
 * @desc    Reactivate partner
 * @access  Private (BRIDA, ADMIN_BRIDA, KEPALA_BRIDA)
 */
router.post('/:id/reactivate', allowActionRoles, reactivatePartner);

module.exports = router;
