const express = require('express');
const router = express.Router();
const researchExecutionController = require('../controllers/researchExecutionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  updateMilestoneSchema,
  updateMilestoneProgressSchema,
} = require('../validations/researchExecutionValidation');

router.use(requireAuth);
router.use(requireRole(['ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA']));

router.patch(
  '/:id',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(updateMilestoneSchema),
  researchExecutionController.updateMilestone
);

router.post(
  '/:id/complete',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchExecutionController.completeMilestone
);

router.patch(
  '/:id/progress',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(updateMilestoneProgressSchema),
  researchExecutionController.updateMilestoneProgress
);

module.exports = router;
