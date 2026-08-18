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

// @desc    Review a problem
// @route   PATCH /api/v1/problems/:id/review
// @access  Private (BRIDA)
const reviewProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    
    const result = await problemService.reviewProblem(id, status, reviewNotes);
    
    res.status(200).json({
      success: true,
      message: 'Status usulan masalah berhasil diperbarui',
      data: result,
    });
  } catch (error) {
    if (error.message === 'Masalah tidak ditemukan') {
      res.status(404);
    }
    next(error);
  }
};

// @desc    Assign a Mitra to a Problem
// @route   PATCH /api/v1/problems/:id/assign-mitra
// @access  Private (BRIDA/KEPALA_BRIDA)
const assignMitra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mitraId } = req.body;
    
    if (!mitraId) {
      return res.status(400).json({ success: false, message: 'mitraId diperlukan' });
    }

    const result = await problemService.assignMitra(id, mitraId);
    
    res.status(200).json({
      success: true,
      message: 'Mitra berhasil ditugaskan',
      data: result,
    });
  } catch (error) {
    if (error.message === 'Masalah tidak ditemukan') {
      res.status(404);
    }
    if (error.message.includes('Mitra tidak valid') || error.message.includes('belum disetujui')) {
      res.status(400);
    }
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
  reviewProblem,
  assignMitra,
  getById,
  update,
};
