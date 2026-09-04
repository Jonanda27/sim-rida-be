const express = require('express');
const router = express.Router();
const researchExecutionController = require('../controllers/researchExecutionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { updateTimelineSchema } = require('../validations/researchExecutionValidation');

router.use(requireAuth);
router.use(requireRole(['ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA']));

router.patch(
  '/:id',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(updateTimelineSchema),
  researchExecutionController.updateTimeline
);

router.delete(
  '/:id',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchExecutionController.deleteTimeline
);

module.exports = router;
