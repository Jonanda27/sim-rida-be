const express = require('express');
const { create, getAll, getById, update, reviewProblem, assignMitra } = require('../controllers/problemController');
const validate = require('../middlewares/validate');
const { createProblemSchema, updateProblemSchema } = require('../validations/problemValidation');
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
 * @route   PATCH /api/v1/problems/:id/review
 * @desc    BRIDA memvalidasi atau menolak usulan masalah
 * @access  Private (BRIDA)
 */
router.patch('/:id/review', protect, authorize('BRIDA'), reviewProblem);

/**
 * @route   PATCH /api/v1/problems/:id/assign-mitra
 * @desc    BRIDA atau Kepala BRIDA menugaskan Mitra untuk mengerjakan riset yang sudah disetujui
 * @access  Private (BRIDA, KEPALA_BRIDA)
 */
router.patch('/:id/assign-mitra', protect, authorize('BRIDA', 'KEPALA_BRIDA'), assignMitra);

/**
 * @route   GET /api/v1/problems/:id
 * @desc    Mendapatkan detail draf masalah berdasarkan ID
 * @access  Private (OPD, BRIDA)
 * 
 * @route   PATCH /api/v1/problems/:id
 * @desc    Mengubah/mengedit draf masalah yang sudah dibuat
 * @access  Private (OPD)
 */
router.route('/:id')
  .get(protect, authorize('OPD', 'BRIDA'), getById)
  .patch(protect, authorize('OPD'), upload.array('attachments', 5), validate(updateProblemSchema), update);

module.exports = router;
