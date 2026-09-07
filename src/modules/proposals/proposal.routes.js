const { Router } = require('express');
const proposalController = require('./proposal.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createProposalSchema,
  updateProposalSchema,
  verifyProposalSchema,
} = require('./proposal.validation');

const router = Router();

// Seluruh route usulan membutuhkan autentikasi
router.use(authenticate);

// Khusus Admin BRIDA (Gatekeeper Verification)
router.get(
  '/verification/inbox',
  authorize(['ADMIN_BRIDA']),
  proposalController.getVerificationInbox
);

router.post(
  '/:id/verify',
  authorize(['ADMIN_BRIDA']),
  validate(verifyProposalSchema),
  proposalController.verifyProposal
);

// Route CRUD Usulan Umum (OPD & Admin BRIDA)
router.get('/', proposalController.getAllProposals);
router.get('/:id', proposalController.getProposalById);
router.post('/', validate(createProposalSchema), proposalController.createProposal);
router.put('/:id', validate(updateProposalSchema), proposalController.updateProposal);
router.post('/:id/submit', proposalController.submitProposal);
router.delete('/:id', proposalController.deleteProposal);

module.exports = router;
