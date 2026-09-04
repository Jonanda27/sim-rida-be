const express = require('express');
const router = express.Router();
const researchImplementationController = require('../controllers/researchImplementationController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');
const {
  createImplementationSchema,
  updateImplementationSchema,
  updateProgressSchema,
  cancelImplementationSchema,
} = require('../validations/researchImplementationValidation');
const {
  createTimelineSchema,
  createMilestoneSchema,
  createActivitySchema,
} = require('../validations/researchExecutionValidation');

// All routes require authentication and forbid OPD
router.use(requireAuth);
router.use(requireRole(['ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA']));

// Read endpoints (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
router.get('/', researchImplementationController.getImplementations);
router.get('/available-proposals', researchImplementationController.getAvailableProposals);
router.get('/statistics', researchImplementationController.getImplementationStatistics);
router.get('/:id', researchImplementationController.getImplementationById);
router.get('/:id/summary', researchImplementationController.getImplementationSummary);
router.get('/:id/progress-history', researchImplementationController.getProgressHistory);

// Sub-resource lists (Read)
router.get('/:id/timelines', researchImplementationController.getTimelines);
router.get('/:id/milestones', researchImplementationController.getMilestones);
router.get('/:id/activities', researchImplementationController.getActivities);
router.get('/:id/documents', researchImplementationController.getDocuments);

// Mutation endpoints (ADMIN_BRIDA, BRIDA)
router.post(
  '/',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(createImplementationSchema),
  researchImplementationController.createImplementation
);

router.patch(
  '/:id',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(updateImplementationSchema),
  researchImplementationController.updateImplementation
);

router.post(
  '/:id/start',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchImplementationController.startImplementation
);

router.post(
  '/:id/complete',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchImplementationController.completeImplementation
);

router.post(
  '/:id/cancel',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(cancelImplementationSchema),
  researchImplementationController.cancelImplementation
);

router.patch(
  '/:id/progress',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(updateProgressSchema),
  researchImplementationController.updateProgress
);

// Sub-resource creation (ADMIN_BRIDA, BRIDA)
router.post(
  '/:id/timelines',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(createTimelineSchema),
  researchImplementationController.createTimeline
);

router.post(
  '/:id/milestones',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(createMilestoneSchema),
  researchImplementationController.createMilestone
);

router.post(
  '/:id/activities',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(createActivitySchema),
  researchImplementationController.createActivity
);

router.post(
  '/:id/documents',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  upload.single('file'),
  researchImplementationController.uploadDocument
);

router.delete(
  '/:id/documents/:documentId',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  researchImplementationController.deleteDocument
);

// Reports for this implementation
const researchReportController = require('../controllers/researchReportController');
const { createReportSchema } = require('../validations/researchReportValidation');
router.post(
  '/:id/reports',
  requireRole(['ADMIN_BRIDA', 'BRIDA']),
  validate(createReportSchema),
  researchReportController.createReport
);

module.exports = router;
