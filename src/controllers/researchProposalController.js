const researchProposalService = require('../services/researchProposalService');

// @desc    Get paginated research proposals with filters
// @route   GET /api/research-proposals
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getResearchProposals = async (req, res, next) => {
  try {
    const result = await researchProposalService.getResearchProposals(req.query);
    res.status(200).json({
      success: true,
      message: 'Research proposals retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed research proposal by ID
// @route   GET /api/research-proposals/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getResearchProposalById = async (req, res, next) => {
  try {
    const proposal = await researchProposalService.getResearchProposalById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research proposal retrieved successfully',
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new research proposal
// @route   POST /api/research-proposals
// @access  Private (BRIDA)
const createResearchProposal = async (req, res, next) => {
  try {
    const proposal = await researchProposalService.createResearchProposal(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Research proposal created successfully as DRAFT',
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create research proposal directly from an approved problem identification
// @route   POST /api/problem-identifications/:id/research-proposals
// @access  Private (BRIDA)
const createResearchProposalFromProblem = async (req, res, next) => {
  try {
    const proposal = await researchProposalService.createResearchProposalFromProblem(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Research proposal created successfully from problem identification',
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update research proposal (DRAFT or REVISION_REQUIRED only)
// @route   PATCH /api/research-proposals/:id
// @access  Private (BRIDA)
const updateResearchProposal = async (req, res, next) => {
  try {
    const updated = await researchProposalService.updateResearchProposal(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research proposal updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit research proposal for internal BRIDA review
// @route   POST /api/research-proposals/:id/submit
// @access  Private (BRIDA)
const submitResearchProposal = async (req, res, next) => {
  try {
    const submitted = await researchProposalService.submitResearchProposal(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research proposal successfully submitted for internal review',
      data: submitted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return research proposal for revision
// @route   POST /api/research-proposals/:id/return
// @access  Private (BRIDA)
const returnResearchProposal = async (req, res, next) => {
  try {
    const returned = await researchProposalService.returnResearchProposal(
      req.params.id,
      req.body.reviewNote,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research proposal returned for revision',
      data: returned,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve research proposal for selection stage
// @route   POST /api/research-proposals/:id/approve
// @access  Private (BRIDA)
const approveResearchProposal = async (req, res, next) => {
  try {
    const approved = await researchProposalService.approveResearchProposal(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research proposal approved for selection stage (APPROVED_FOR_SELECTION)',
      data: approved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel research proposal
// @route   POST /api/research-proposals/:id/cancel
// @access  Private (BRIDA)
const cancelResearchProposal = async (req, res, next) => {
  try {
    const cancelled = await researchProposalService.cancelResearchProposal(
      req.params.id,
      req.body.reason,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research proposal cancelled',
      data: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get proposal internal review details
// @route   GET /api/research-proposals/:id/review
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getResearchProposalReview = async (req, res, next) => {
  try {
    const proposal = await researchProposalService.getResearchProposalById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research proposal review details retrieved',
      data: {
        id: proposal.id,
        code: proposal.code,
        title: proposal.title,
        status: proposal.status,
        priority: proposal.priority,
        reviewNote: proposal.reviewNote,
        cancelReason: proposal.cancelReason,
        submittedBy: proposal.submittedBy,
        submittedAt: proposal.submittedAt,
        reviewedBy: proposal.reviewedBy,
        reviewedAt: proposal.reviewedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get proposal visual traceability
// @route   GET /api/research-proposals/:id/traceability
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getResearchProposalTraceability = async (req, res, next) => {
  try {
    const traceability = await researchProposalService.getResearchProposalTraceability(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research proposal traceability lineage retrieved successfully',
      data: traceability,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResearchProposals,
  getResearchProposalById,
  createResearchProposal,
  createResearchProposalFromProblem,
  updateResearchProposal,
  submitResearchProposal,
  returnResearchProposal,
  approveResearchProposal,
  cancelResearchProposal,
  getResearchProposalReview,
  getResearchProposalTraceability,
};
