const userService = require('../services/userService');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (ADMIN_BRIDA)
const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (ADMIN_BRIDA)
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private (ADMIN_BRIDA)
const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user?.id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PATCH /api/users/:id
// @access  Private (ADMIN_BRIDA)
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user?.id);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user active status
// @route   PATCH /api/users/:id/status
// @access  Private (ADMIN_BRIDA)
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.isActive, req.user?.id);

    res.status(200).json({
      success: true,
      message: `User status successfully updated to ${req.body.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
};
