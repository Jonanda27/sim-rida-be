const researchSelectionService = require('../services/researchSelectionService');

// @desc    Get paginated research selections with filters
// @route   GET /api/research-selections
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getSelections = async (req, res, next) => {
  try {
    const result = await researchSelectionService.getSelections(req.query);
    res.status(200).json({
      success: true,
      message: 'Research selections retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get selection statistics dashboard data
// @route   GET /api/research-selections/statistics
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getSelectionStatistics = async (req, res, next) => {
  try {
    const stats = await researchSelectionService.getSelectionStatistics(req.query);
    res.status(200).json({
      success: true,
      message: 'Research selection statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed selection by ID
// @route   GET /api/research-selections/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getSelectionById = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.getSelectionById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research selection retrieved successfully',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new research selection for an approved proposal
// @route   POST /api/research-selections
// @access  Private (BRIDA)
const createSelection = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.createSelection(
      req.body.researchProposalId,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Research selection created successfully as DRAFT',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start assessment (DRAFT -> IN_ASSESSMENT)
// @route   POST /api/research-selections/:id/start
// @access  Private (BRIDA)
const startAssessment = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.startAssessment(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Assessment started (status: IN_ASSESSMENT)',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single score entry
// @route   PATCH /api/research-selections/:id/scores/:scoreId
// @access  Private (BRIDA)
const updateScore = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.updateScore(
      req.params.id,
      req.params.scoreId,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update criteria scores
// @route   PATCH /api/research-selections/:id/scores
// @access  Private (BRIDA)
const bulkUpdateScores = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.bulkUpdateScores(
      req.params.id,
      req.body.scores,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Scores updated successfully',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize selection and set proposal status (SELECTED / NOT_SELECTED)
// @route   POST /api/research-selections/:id/finalize
// @access  Private (BRIDA)
const finalizeSelection = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.finalizeSelection(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: `Research selection finalized successfully with result: ${selection.result}`,
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel draft selection
// @route   POST /api/research-selections/:id/cancel
// @access  Private (BRIDA)
const cancelSelection = async (req, res, next) => {
  try {
    const selection = await researchSelectionService.cancelSelection(
      req.params.id,
      req.body.reason,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research selection cancelled',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

const getCriteria = async (req, res, next) => {
  try {
    const prisma = require('../config/db');
    const criteria = await prisma.researchSelectionCriteria.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    res.status(200).json({
      success: true,
      message: 'Selection criteria retrieved',
      data: criteria,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSelections,
  getSelectionStatistics,
  getCriteria,
  getSelectionById,
  createSelection,
  startAssessment,
  updateScore,
  bulkUpdateScores,
  finalizeSelection,
  cancelSelection,
};
