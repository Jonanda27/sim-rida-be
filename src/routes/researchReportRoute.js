const express = require('express');
const router = express.Router();
const researchReportController = require('../controllers/researchReportController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');
const {
  updateReportSchema,
  reviewReportSchema,
} = require('../validations/researchReportValidation');

// All routes require authentication and forbid OPD
router.use(requireAuth);
router.use(requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA'));

// Read endpoints (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
router.get('/', researchReportController.getReports);
router.get('/statistics', researchReportController.getReportStatistics);
router.get('/:id', researchReportController.getReportById);
router.get('/:id/documents', researchReportController.getReportDocuments);

// Mutation endpoints (BRIDA)
router.patch(
  '/:id',
  requireRole('BRIDA'),
  validate(updateReportSchema),
  researchReportController.updateReport
);

router.post(
  '/:id/submit',
  requireRole('BRIDA'),
  researchReportController.submitReport
);

router.post(
  '/:id/review',
  requireRole('BRIDA'),
  validate(reviewReportSchema),
  researchReportController.reviewReport
);

// Document endpoints
router.post(
  '/:id/documents',
  requireRole('BRIDA'),
  upload.single('file'),
  researchReportController.uploadReportDocument
);

router.delete(
  '/:id/documents/:documentId',
  requireRole('BRIDA'),
  researchReportController.deleteReportDocument
);

// Policy Briefs for this research report
const policyBriefController = require('../controllers/policyBriefController');
const { createPolicyBriefSchema } = require('../validations/policyBriefValidation');
router.post(
  '/:id/policy-briefs',
  requireRole('BRIDA'),
  validate(createPolicyBriefSchema),
  policyBriefController.createPolicyBrief
);

module.exports = router;
