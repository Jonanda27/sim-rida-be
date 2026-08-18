const express = require('express');
const { getSectors, getAreas } = require('../controllers/masterController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/sectors', protect, getSectors);
router.get('/areas', protect, getAreas);

module.exports = router;
