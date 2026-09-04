const express = require('express');
const router = express.Router();
const policyBriefController = require('../controllers/policyBriefController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');
const {
  updatePolicyBriefSchema,
  reviewPolicyBriefSchema,
} = require('../validations/policyBriefValidation');

// All routes require authentication and forbid OPD
router.use(requireAuth);
router.use(requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA'));

// Read endpoints (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
router.get('/', policyBriefController.getPolicyBriefs);
router.get('/statistics', policyBriefController.getPolicyBriefStatistics);
router.get('/:id', policyBriefController.getPolicyBriefById);
router.get('/:id/documents', policyBriefController.getPolicyBriefDocuments);

// Mutation endpoints (BRIDA)
router.patch(
  '/:id',
  requireRole('BRIDA'),
  validate(updatePolicyBriefSchema),
  policyBriefController.updatePolicyBrief
);

router.post(
  '/:id/submit',
  requireRole('BRIDA'),
  policyBriefController.submitPolicyBrief
);

router.post(
  '/:id/review',
  requireRole('BRIDA', 'KEPALA_BRIDA'),
  validate(reviewPolicyBriefSchema),
  policyBriefController.reviewPolicyBrief
);

// Document endpoints
router.post(
  '/:id/documents',
  requireRole('BRIDA'),
  upload.single('file'),
  policyBriefController.uploadPolicyBriefDocument
);

router.delete(
  '/:id/documents/:documentId',
  requireRole('BRIDA'),
  policyBriefController.deletePolicyBriefDocument
);

// Recommendations for this policy brief
const researchRecommendationController = require('../controllers/researchRecommendationController');
const { createRecommendationSchema } = require('../validations/researchRecommendationValidation');
router.post(
  '/:id/recommendations',
  requireRole('BRIDA'),
  validate(createRecommendationSchema),
  researchRecommendationController.createRecommendation
);

module.exports = router;
