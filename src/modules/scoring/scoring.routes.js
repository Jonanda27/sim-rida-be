const { Router } = require('express');
const scoringController = require('./scoring.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { submitScoringSchema } = require('./scoring.validation');

const router = Router();

// Seluruh endpoint scoring membutuhkan autentikasi
router.use(authenticate);

// Antrean & Detail Scoring dapat dilihat oleh ADMIN_BRIDA dan KEPALA_BRIDA
router.get(
  '/queue',
  authorize(['ADMIN_BRIDA', 'KEPALA_BRIDA']),
  scoringController.getScoringQueue
);

router.get(
  '/:proposalId',
  authorize(['ADMIN_BRIDA', 'KEPALA_BRIDA']),
  scoringController.getScoringDetail
);

// Formulasi & Submit Scoring digital khusus ADMIN_BRIDA
router.post(
  '/:proposalId',
  authorize(['ADMIN_BRIDA']),
  validate(submitScoringSchema),
  scoringController.submitScoring
);

module.exports = router;
