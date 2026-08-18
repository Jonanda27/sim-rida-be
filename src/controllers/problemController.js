const problemService = require('../services/problemService');

// @desc    Create a new problem
// @route   POST /api/v1/problems
// @access  Private (OPD)
const create = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Process files if they exist
    if (req.files && req.files.length > 0) {
      // Map files to their URLs (e.g., /uploads/filename.pdf)
      data.attachments = req.files.map(file => `/uploads/${file.filename}`);
    }

    const result = await problemService.createProblem(data, req.user.id);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all problems
// @route   GET /api/v1/problems
// @access  Private (OPD & BRIDA)
const getAll = async (req, res, next) => {
  try {
    const result = await problemService.getProblems(req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate a problem
// @route   PATCH /api/v1/problems/:id/validate
// @access  Private (BRIDA)
const validateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    const result = await problemService.validateProblem(id, status, rejectionReason);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single problem
// @route   GET /api/v1/problems/:id
// @access  Private (OPD & BRIDA)
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await problemService.getProblemById(id, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a problem
// @route   PATCH /api/v1/problems/:id
// @access  Private (OPD)
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Process files if they exist
    if (req.files && req.files.length > 0) {
      data.attachments = req.files.map(file => `/uploads/${file.filename}`);
    }

    const result = await problemService.updateProblem(id, data, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  validateStatus,
  getById,
  update,
};
