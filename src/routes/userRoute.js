const express = require('express');
const { getUsers, createUser } = require('../controllers/userController');

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    Mendapatkan daftar seluruh pengguna
 * @access  Public (Untuk sementara)
 * 
 * @route   POST /api/v1/users
 * @desc    Membuat pengguna baru
 * @access  Public
 */
router.route('/')
  .get(getUsers)
  .post(createUser);

module.exports = router;
