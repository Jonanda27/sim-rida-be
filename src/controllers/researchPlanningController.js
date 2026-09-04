const researchPlanningService = require('../services/researchPlanningService');

// @desc    Get unified research planning package (Proposal, KAK, RAB)
// @route   GET /api/research-planning/:proposalId
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getResearchPlanning = async (req, res, next) => {
  try {
    const planning = await researchPlanningService.getResearchPlanning(req.params.proposalId);
    res.status(200).json({
      success: true,
      message: 'Research planning package retrieved successfully',
      data: planning,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit research planning package atomically (KAK & RAB -> SUBMITTED)
// @route   POST /api/research-planning/:proposalId/submit
// @access  Private (BRIDA)
const submitResearchPlanning = async (req, res, next) => {
  try {
    const planning = await researchPlanningService.submitResearchPlanning(
      req.params.proposalId,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research planning package submitted successfully',
      data: planning,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize research planning package (KAK & RAB -> FINALIZED, Proposal -> READY_FOR_PARTNER)
// @route   POST /api/research-planning/:proposalId/finalize
// @access  Private (BRIDA)
const finalizeResearchPlanning = async (req, res, next) => {
  try {
    const planning = await researchPlanningService.finalizeResearchPlanning(
      req.params.proposalId,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research planning finalized successfully. Proposal status is now READY_FOR_PARTNER.',
      data: planning,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get planning dashboard statistics
// @route   GET /api/research-planning/statistics
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPlanningStatistics = async (req, res, next) => {
  try {
    const stats = await researchPlanningService.getPlanningStatistics(req.query);
    res.status(200).json({
      success: true,
      message: 'Research planning statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResearchPlanning,
  submitResearchPlanning,
  finalizeResearchPlanning,
  getPlanningStatistics,
};
