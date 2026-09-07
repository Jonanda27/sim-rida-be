const { Router } = require('express');
const studyController = require('./study.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  initializeStudySchema,
  saveKakSchema,
  saveRkaSchema,
  saveTeamSchema,
  updateStudyStatusSchema,
} = require('./study.validation');

const router = Router();

// Seluruh endpoint manajemen kajian membutuhkan autentikasi
router.use(authenticate);

// Daftar kajian aktif (dapat dilihat oleh Admin BRIDA dan Kepala BRIDA)
router.get('/', authorize(['ADMIN_BRIDA', 'KEPALA_BRIDA']), studyController.getAllStudies);

// Daftar usulan APPROVED yang siap diinisiasi (khusus Admin BRIDA)
router.get(
  '/approved-proposals',
  authorize(['ADMIN_BRIDA']),
  studyController.getApprovedProposals
);

// Inisiasi usulan APPROVED menjadi Kajian Riset (khusus Admin BRIDA)
router.post(
  '/initialize/:proposalId',
  authorize(['ADMIN_BRIDA']),
  validate(initializeStudySchema),
  studyController.initializeStudy
);

// Detail kajian riset
router.get('/:id', studyController.getStudyById);

// Penyusunan KAK digital (khusus Admin BRIDA)
router.put(
  '/:id/kak',
  authorize(['ADMIN_BRIDA']),
  validate(saveKakSchema),
  studyController.saveKak
);

// Penyusunan RKA belanja anggaran kajian (khusus Admin BRIDA)
router.post(
  '/:id/rka',
  authorize(['ADMIN_BRIDA']),
  validate(saveRkaSchema),
  studyController.saveRka
);

// Penugasan tim peneliti (khusus Admin BRIDA)
router.post(
  '/:id/team',
  authorize(['ADMIN_BRIDA']),
  validate(saveTeamSchema),
  studyController.saveTeam
);

// Update status pelaksanaan kajian (khusus Admin BRIDA)
router.patch(
  '/:id/status',
  authorize(['ADMIN_BRIDA']),
  validate(updateStudyStatusSchema),
  studyController.updateStudyStatus
);

module.exports = router;
