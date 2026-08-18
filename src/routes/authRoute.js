const express = require('express');
const { login, getMe } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validations/authValidation');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Autentikasi user dan mendapatkan JWT Token
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Mendapatkan profil user yang sedang login berdasarkan token
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;
