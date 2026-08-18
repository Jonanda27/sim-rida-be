const researchService = require('../services/researchService');

// @desc    Create a new research
// @route   POST /api/v1/researches
// @access  Private (OPD)
const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // We are deliberately using userId instead of req.user.opdId 
    // to keep it consistent with our established database schema
    const result = await researchService.createResearch(req.body, userId);
    
    return res.status(201).json({
      success: true,
      message: 'Usulan perencanaan berhasil dikirim',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all researches
// @route   GET /api/v1/researches
// @access  Private (OPD & BRIDA)
const getAll = async (req, res, next) => {
  try {
    const result = await researchService.getResearches(req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single research
// @route   GET /api/v1/researches/:id
// @access  Private (OPD & BRIDA)
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await researchService.getResearchById(id, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    
    const result = await researchService.updateResearch(id, userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Usulan penelitian berhasil diperbarui',
      data: result,
    });
  } catch (error) {
    if (error.message === 'Usulan penelitian tidak ditemukan') {
      res.status(404);
    }
    if (error.message.includes('Akses ditolak')) {
      res.status(403);
    }
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
};
