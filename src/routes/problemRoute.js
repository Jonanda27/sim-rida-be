const express = require('express');
const { create, getAll, validateStatus, getById, update } = require('../controllers/problemController');
const validate = require('../middlewares/validate');
const { createProblemSchema, validateProblemSchema, updateProblemSchema } = require('../validations/problemValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/problems
 * @desc    Mendapatkan daftar masalah (OPD hanya melihat miliknya, BRIDA melihat semua)
 * @access  Private (OPD, BRIDA)
 * 
 * @route   POST /api/v1/problems
 * @desc    Mengajukan usulan masalah baru beserta lampiran file maksimal 5 file
 * @access  Private (OPD)
 */
router.route('/')
  .post(protect, authorize('OPD'), upload.array('attachments', 5), validate(createProblemSchema), create)
  .get(protect, authorize('OPD', 'BRIDA'), getAll);

/**
 * @route   GET /api/v1/problems/:id
 * @desc    Mendapatkan detail satu masalah berdasarkan ID
 * @access  Private (OPD, BRIDA)
 * 
 * @route   PATCH /api/v1/problems/:id
 * @desc    Mengubah/mengedit draf masalah yang sudah dibuat
 * @access  Private (OPD)
 */
router.route('/:id')
  .get(protect, authorize('OPD', 'BRIDA'), getById)
  .patch(protect, authorize('OPD'), upload.array('attachments', 5), validate(updateProblemSchema), update);

/**
 * @route   PATCH /api/v1/problems/:id/validate
 * @desc    Validasi masalah oleh BRIDA (Ubah status menjadi Valid, Perlu Revisi, Ditolak)
 * @access  Private (BRIDA)
 */
router.route('/:id/validate')
  .patch(protect, authorize('BRIDA'), validate(validateProblemSchema), validateStatus);

module.exports = router;
