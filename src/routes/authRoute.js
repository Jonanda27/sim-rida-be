const express = require('express');
const { login, getMe, logout } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validations/authValidation');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', requireAuth, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user session
 * @access  Public / Private
 */
router.post('/logout', logout);

module.exports = router;
