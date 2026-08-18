const express = require('express');
const { getSectors, getAreas, getResearchTypes } = require('../controllers/masterController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/master/sectors
 * @desc    Mendapatkan seluruh daftar Master Sektor untuk pilihan dropdown
 * @access  Private
 */
router.get('/sectors', protect, getSectors);

/**
 * @route   GET /api/v1/master/research-types
 * @desc    Mendapatkan seluruh daftar Master Jenis Penelitian untuk pilihan dropdown
 * @access  Private
 */
router.get('/research-types', protect, getResearchTypes);

module.exports = router;
