const express = require('express');
const router = express.Router();
const researchRecommendationController = require('../controllers/researchRecommendationController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');
const {
  updateRecommendationSchema,
  reviewRecommendationSchema,
} = require('../validations/researchRecommendationValidation');

// All routes require authentication and forbid OPD
router.use(requireAuth);
router.use(requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA'));

// Read endpoints (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
router.get('/', researchRecommendationController.getRecommendations);
router.get('/statistics', researchRecommendationController.getRecommendationStatistics);
router.get('/:id', researchRecommendationController.getRecommendationById);
router.get('/:id/documents', researchRecommendationController.getRecommendationDocuments);

// Mutation endpoints (BRIDA)
router.patch(
  '/:id',
  requireRole('BRIDA'),
  validate(updateRecommendationSchema),
  researchRecommendationController.updateRecommendation
);

router.post(
  '/:id/submit',
  requireRole('BRIDA'),
  researchRecommendationController.submitRecommendation
);

// Approval & Publication endpoints (KEPALA_BRIDA ONLY)
router.post(
  '/:id/approve',
  requireRole('KEPALA_BRIDA'),
  validate(reviewRecommendationSchema),
  researchRecommendationController.approveRecommendation
);

router.post(
  '/:id/revision',
  requireRole('KEPALA_BRIDA'),
  validate(reviewRecommendationSchema),
  researchRecommendationController.requestRecommendationRevision
);

router.post(
  '/:id/publish',
  requireRole('KEPALA_BRIDA'),
  researchRecommendationController.publishRecommendation
);

// Document endpoints
router.post(
  '/:id/documents',
  requireRole('BRIDA', 'KEPALA_BRIDA'),
  upload.single('file'),
  researchRecommendationController.uploadRecommendationDocument
);

router.delete(
  '/:id/documents/:documentId',
  requireRole('BRIDA', 'KEPALA_BRIDA'),
  researchRecommendationController.deleteRecommendationDocument
);

module.exports = router;
