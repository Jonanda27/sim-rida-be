const express = require('express');
const router = express.Router();
const researchExecutionController = require('../controllers/researchExecutionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { updateActivitySchema } = require('../validations/researchExecutionValidation');

router.use(requireAuth);
router.use(requireRole(['ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA']));

router.patch(
  '/:id',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(updateActivitySchema),
  researchExecutionController.updateActivity
);

router.post(
  '/:id/start',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchExecutionController.startActivity
);

router.post(
  '/:id/complete',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchExecutionController.completeActivity
);

router.post(
  '/:id/cancel',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchExecutionController.cancelActivity
);

module.exports = router;
