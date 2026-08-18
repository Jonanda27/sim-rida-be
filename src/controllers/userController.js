const prisma = require('../config/db');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
    
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user
// @route   POST /api/v1/users
// @access  Public
const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
};
