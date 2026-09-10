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

// Daftar usulan APPROVED yang siap diinisiasi / disusun KAK (khusus Admin BRIDA)
router.get(
  '/approved-proposals',
  authorize(['ADMIN_BRIDA']),
  studyController.getApprovedProposals
);

// AI Assistant: Generate draf KAK & RKA
router.post(
  '/generate-kak-ai/:proposalId',
  authorize(['ADMIN_BRIDA']),
  studyController.generateKakAi
);

// In-System Live Editor: Simpan / Finalisasi KAK & RKA
router.post(
  '/kak-editor/:proposalId',
  authorize(['ADMIN_BRIDA']),
  studyController.initOrUpdateKakStudy
);

// Inisiasi usulan APPROVED menjadi Kajian Riset (khusus Admin BRIDA)
router.post(
  '/initialize/:proposalId',
  authorize(['ADMIN_BRIDA']),
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

// Tahap 4: Pelaksanaan Riset - Dokumen Kerja Sama / SK Tim Peneliti
router.post(
  '/:id/cooperation-doc',
  authorize(['ADMIN_BRIDA']),
  studyController.saveCooperationDoc
);

// Tahap 4: Pelaksanaan Riset - Berkas Kerja / Data Lapangan
router.post(
  '/:id/working-docs',
  authorize(['ADMIN_BRIDA']),
  studyController.addWorkingDocument
);

router.delete(
  '/:id/working-docs/:docId',
  authorize(['ADMIN_BRIDA']),
  studyController.deleteWorkingDocument
);

// Tahap 4: Pelaksanaan Riset - Laporan Akhir Riset & Penyelesaian Riset
router.post(
  '/:id/final-report',
  authorize(['ADMIN_BRIDA']),
  studyController.submitFinalReport
);

module.exports = router;
