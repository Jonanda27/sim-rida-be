const researchPartnerService = require('../services/researchPartnerService');

// @desc    Get paginated partners list
// @route   GET /api/research-partners
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartners = async (req, res, next) => {
  try {
    const result = await researchPartnerService.getPartners(req.query);
    res.status(200).json({
      success: true,
      message: 'Research partners retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get partner statistics
// @route   GET /api/research-partners/statistics
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerStatistics = async (req, res, next) => {
  try {
    const stats = await researchPartnerService.getPartnerStatistics();
    res.status(200).json({
      success: true,
      message: 'Research partner statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed partner by ID
// @route   GET /api/research-partners/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerById = async (req, res, next) => {
  try {
    const partner = await researchPartnerService.getPartnerById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research partner retrieved successfully',
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new research partner
// @route   POST /api/research-partners
// @access  Private (BRIDA)
const createPartner = async (req, res, next) => {
  try {
    const partner = await researchPartnerService.createPartner(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Research partner created successfully',
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update partner master data
// @route   PATCH /api/research-partners/:id
// @access  Private (BRIDA)
const updatePartner = async (req, res, next) => {
  try {
    const partner = await researchPartnerService.updatePartner(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research partner updated successfully',
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate partner (soft deactivation)
// @route   POST /api/research-partners/:id/deactivate
// @access  Private (BRIDA)
const deactivatePartner = async (req, res, next) => {
  try {
    const partner = await researchPartnerService.deactivatePartner(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research partner deactivated successfully',
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reactivate partner
// @route   POST /api/research-partners/:id/reactivate
// @access  Private (BRIDA)
const reactivatePartner = async (req, res, next) => {
  try {
    const partner = await researchPartnerService.reactivatePartner(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research partner reactivated successfully',
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete partner (only if never used)
// @route   DELETE /api/research-partners/:id
// @access  Private (BRIDA)
const deletePartner = async (req, res, next) => {
  try {
    const result = await researchPartnerService.deletePartner(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPartners,
  getPartnerStatistics,
  getPartnerById,
  createPartner,
  updatePartner,
  deactivatePartner,
  reactivatePartner,
  deletePartner,
};
