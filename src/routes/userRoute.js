const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
} = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
} = require('../validations/userValidation');

const router = express.Router();

// All user management routes require ADMIN_BRIDA role
router.use(requireAuth);
router.use(requireRole('ADMIN_BRIDA'));

/**
 * @route   GET /api/users
 * @desc    Get all users (filters: role, isActive, search)
 * @access  Private (ADMIN_BRIDA)
 * 
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (ADMIN_BRIDA)
 */
router.route('/')
  .get(getUsers)
  .post(validate(createUserSchema), createUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN_BRIDA)
 * 
 * @route   PATCH /api/users/:id
 * @desc    Update user details
 * @access  Private (ADMIN_BRIDA)
 */
router.route('/:id')
  .get(getUserById)
  .patch(validate(updateUserSchema), updateUser);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user active/inactive status
 * @access  Private (ADMIN_BRIDA)
 */
router.patch('/:id/status', validate(updateUserStatusSchema), updateUserStatus);

module.exports = router;
