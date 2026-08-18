const express = require('express');
const { create, getAll, getById } = require('../controllers/researchController');
const kakController = require('../controllers/kakController');
const validate = require('../middlewares/validate');
const { createResearchSchema } = require('../validations/researchValidation');
const { createKakSchema } = require('../validations/kakValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/researches/:researchId/kak
 * @desc    OPD menyimpan draf KAK lengkap beserta tabel RAB
 * @access  Private (OPD)
 */
router.post(
  '/:researchId/kak',
  protect,
  authorize('OPD'),
  validate(createKakSchema),
  kakController.createKak
);

/**
 * @route   GET /api/v1/researches/:researchId/kak
 * @desc    Melihat detail KAK dan RAB untuk suatu usulan penelitian
 * @access  Private
 */
router.get('/:researchId/kak', protect, kakController.getKak);

/**
 * @route   GET /api/v1/researches
 * @desc    Mendapatkan daftar usulan perencanaan (OPD melihat miliknya, BRIDA melihat semua)
 * @access  Private (OPD, BRIDA)
 * 
 * @route   POST /api/v1/researches
 * @desc    Mengajukan usulan perencanaan/solusi baru yang terhubung ke suatu masalah (Problem ID)
 * @access  Private (OPD)
 */
router.route('/')
  .post(protect, authorize('OPD'), validate(createResearchSchema), create)
  .get(protect, authorize('OPD', 'BRIDA'), getAll);

/**
 * @route   GET /api/v1/researches/:id
 * @desc    Mendapatkan detail satu usulan perencanaan berdasarkan ID
 * @access  Private (OPD, BRIDA)
 */
router.route('/:id')
  .get(protect, authorize('OPD', 'BRIDA'), getById);

module.exports = router;
