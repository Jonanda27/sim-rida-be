const { Router } = require('express');
const recommendationController = require('./recommendation.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createRecommendationSchema,
  updateRecommendationSchema,
  finalizeRecommendationSchema,
} = require('./recommendation.validation');

const router = Router();

// Seluruh endpoint rekomendasi membutuhkan autentikasi
router.use(authenticate);

// List semua rekomendasi (dapat dilihat oleh Admin BRIDA, Kepala BRIDA, OPD)
router.get('/', recommendationController.getAllRecommendations);

// List kajian riset yang siap dirumuskan rekomendasinya (khusus Admin BRIDA)
router.get(
  '/available-studies',
  authorize(['ADMIN_BRIDA']),
  recommendationController.getAvailableStudies
);

// Detail naskah rekomendasi kebijakan
router.get('/:id', recommendationController.getRecommendationById);

// Buat draf rekomendasi kebijakan baru (khusus Admin BRIDA)
router.post(
  '/',
  authorize(['ADMIN_BRIDA']),
  validate(createRecommendationSchema),
  recommendationController.createRecommendation
);

// Edit draf rekomendasi kebijakan (khusus Admin BRIDA)
router.put(
  '/:id',
  authorize(['ADMIN_BRIDA']),
  validate(updateRecommendationSchema),
  recommendationController.updateRecommendation
);

// Ajukan draf ke Kepala BRIDA (khusus Admin BRIDA)
router.post(
  '/:id/submit',
  authorize(['ADMIN_BRIDA']),
  recommendationController.submitRecommendation
);

// Pengesahan resmi rekomendasi kebijakan KHUSUS KEPALA BRIDA
router.post(
  '/:id/finalize',
  authorize(['KEPALA_BRIDA']),
  validate(finalizeRecommendationSchema),
  recommendationController.finalizeRecommendation
);

// Generate Policy Brief & Rekomendasi Kebijakan menggunakan AI (khusus Admin BRIDA)
router.post(
  '/generate-ai/:studyId',
  authorize(['ADMIN_BRIDA']),
  recommendationController.generateAiPolicyBrief
);

// Hapus draf rekomendasi (khusus Admin BRIDA)
router.delete(
  '/:id',
  authorize(['ADMIN_BRIDA']),
  recommendationController.deleteRecommendation
);

module.exports = router;
