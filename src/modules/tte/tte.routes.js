const { Router } = require('express');
const tteController = require('./tte.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  signDocumentSchema,
  getDocumentDetailSchema,
} = require('./tte.validation');

const router = Router();

// Endpoint publik untuk memverifikasi keabsahan dokumen ber-TTE via Scan QR Code (Tanpa Autentikasi)
router.get('/verify/:certificateNumber', tteController.verifyCertificate);

// Seluruh endpoint operasional TTE membutuhkan autentikasi
router.use(authenticate);

// Antrean dokumen menunggu TTE (Khusus Kepala BRIDA)
router.get(
  '/inbox',
  authorize(['KEPALA_BRIDA']),
  tteController.getTteInbox
);

// Riwayat dokumen yang telah ditandatangani secara digital (Kepala BRIDA & Admin BRIDA)
router.get(
  '/history',
  authorize(['KEPALA_BRIDA', 'ADMIN_BRIDA']),
  tteController.getTteHistory
);

// Preview detail dokumen sebelum TTE (Khusus Kepala BRIDA)
router.get(
  '/detail/:documentType/:id',
  authorize(['KEPALA_BRIDA']),
  validate(getDocumentDetailSchema),
  tteController.getDocumentDetail
);

// Eksekusi Tanda Tangan Elektronik (Khusus Kepala BRIDA)
router.post(
  '/sign',
  authorize(['KEPALA_BRIDA']),
  validate(signDocumentSchema),
  tteController.signDocument
);

module.exports = router;
