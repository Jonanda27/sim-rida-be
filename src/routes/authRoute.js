const express = require('express');
const { login, getMe } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validations/authValidation');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

module.exports = router;
