const researchPartnerSelectionService = require('../services/researchPartnerSelectionService');
const researchPartnerDocumentService = require('../services/researchPartnerDocumentService');

// @desc    Get paginated partner selections list
// @route   GET /api/research-partner-selections
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerSelections = async (req, res, next) => {
  try {
    const result = await researchPartnerSelectionService.getPartnerSelections(req.query);
    res.status(200).json({
      success: true,
      message: 'Research partner selections retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get proposals available for partner assignment (status READY_FOR_PARTNER)
// @route   GET /api/research-partner-selections/available-proposals
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getAvailableProposals = async (req, res, next) => {
  try {
    const proposals = await researchPartnerSelectionService.getAvailableProposals();
    res.status(200).json({
      success: true,
      message: 'Available proposals for partner assignment retrieved successfully',
      data: proposals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get partner selection statistics
// @route   GET /api/research-partner-selections/statistics
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerSelectionStatistics = async (req, res, next) => {
  try {
    const stats = await researchPartnerSelectionService.getPartnerSelectionStatistics(req.query);
    res.status(200).json({
      success: true,
      message: 'Partner selection statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed partner selection by ID
// @route   GET /api/research-partner-selections/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerSelectionById = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.getPartnerSelectionById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research partner selection retrieved successfully',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get partner selection summary
// @route   GET /api/research-partner-selections/:id/summary
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerSelectionSummary = async (req, res, next) => {
  try {
    const summary = await researchPartnerSelectionService.getPartnerSelectionSummary(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research partner selection summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new partner selection for proposal
// @route   POST /api/research-partner-selections
// @access  Private (BRIDA)
const createPartnerSelection = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.createPartnerSelection(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Research partner selection created successfully as DRAFT',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update partner selection draft or revision
// @route   PATCH /api/research-partner-selections/:id
// @access  Private (BRIDA)
const updatePartnerSelection = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.updatePartnerSelection(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research partner selection updated successfully',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit partner selection for review
// @route   POST /api/research-partner-selections/:id/submit
// @access  Private (BRIDA)
const submitPartnerSelection = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.submitPartnerSelection(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research partner selection submitted successfully (status: SUBMITTED)',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return partner selection for revision
// @route   POST /api/research-partner-selections/:id/return
// @access  Private (BRIDA)
const returnPartnerSelection = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.returnPartnerSelection(
      req.params.id,
      req.body.reviewNote,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research partner selection returned for revision (status: REVISION_REQUIRED)',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize partner selection (sets selection to SELECTED and proposal to READY_FOR_IMPLEMENTATION)
// @route   POST /api/research-partner-selections/:id/finalize
// @access  Private (BRIDA)
const finalizePartnerSelection = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.finalizePartnerSelection(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research partner selection finalized successfully. Proposal status is now READY_FOR_IMPLEMENTATION.',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel partner selection draft
// @route   POST /api/research-partner-selections/:id/cancel
// @access  Private (BRIDA)
const cancelPartnerSelection = async (req, res, next) => {
  try {
    const selection = await researchPartnerSelectionService.cancelPartnerSelection(
      req.params.id,
      req.body.reason,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Research partner selection cancelled',
      data: selection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supporting documents of partner selection
// @route   GET /api/research-partner-selections/:id/documents
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getPartnerDocuments = async (req, res, next) => {
  try {
    const docs = await researchPartnerDocumentService.getPartnerDocuments(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Partner selection documents retrieved successfully',
      data: docs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload supporting document for partner selection
// @route   POST /api/research-partner-selections/:id/documents
// @access  Private (BRIDA)
const uploadPartnerDocument = async (req, res, next) => {
  try {
    const doc = await researchPartnerDocumentService.uploadPartnerDocument(
      req.params.id,
      req.file,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supporting document
// @route   DELETE /api/research-partner-selections/:id/documents/:documentId
// @access  Private (BRIDA)
const deletePartnerDocument = async (req, res, next) => {
  try {
    const result = await researchPartnerDocumentService.deletePartnerDocument(
      req.params.id,
      req.params.documentId,
      req.user.id
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPartnerSelections,
  getAvailableProposals,
  getPartnerSelectionStatistics,
  getPartnerSelectionById,
  getPartnerSelectionSummary,
  createPartnerSelection,
  updatePartnerSelection,
  submitPartnerSelection,
  returnPartnerSelection,
  finalizePartnerSelection,
  cancelPartnerSelection,
  getPartnerDocuments,
  uploadPartnerDocument,
  deletePartnerDocument,
};
