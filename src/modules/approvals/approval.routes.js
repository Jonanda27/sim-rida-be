const { Router } = require('express');
const approvalController = require('./approval.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { submitApprovalSchema } = require('./approval.validation');

const router = Router();

// Seluruh endpoint persetujuan membutuhkan autentikasi
router.use(authenticate);

// Inbox dan detail persetujuan dapat dilihat oleh KEPALA_BRIDA dan ADMIN_BRIDA
router.get(
  '/inbox',
  authorize(['KEPALA_BRIDA', 'ADMIN_BRIDA']),
  approvalController.getApprovalInbox
);

router.get(
  '/:proposalId',
  authorize(['KEPALA_BRIDA', 'ADMIN_BRIDA']),
  approvalController.getApprovalDetail
);

// Form keputusan persetujuan final KHUSUS KEPALA_BRIDA
router.post(
  '/:proposalId',
  authorize(['KEPALA_BRIDA']),
  validate(submitApprovalSchema),
  approvalController.submitApproval
);

module.exports = router;
