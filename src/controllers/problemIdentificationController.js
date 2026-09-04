const problemIdentificationService = require('../services/problemIdentificationService');

// @desc    Trigger AI analysis on an external source
// @route   POST /api/external-sources/:id/analyze
// @access  Private (BRIDA)
const analyzeSource = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.analyzeSource(
      req.params.id,
      req.user.id,
      { force: req.body?.force === true }
    );

    res.status(200).json({
      success: true,
      message: result.isExisting
        ? 'Existing AI analysis retrieved.'
        : 'AI analysis completed successfully.',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new problem identification
// @route   POST /api/problem-identifications
// @access  Private (BRIDA)
const createProblemIdentification = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.createProblemIdentification(
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Problem identification created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all problem identifications (with filters & pagination)
// @route   GET /api/problem-identifications
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getProblemIdentifications = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.getProblemIdentifications(req.query);
    res.status(200).json({
      success: true,
      message: 'Problem identifications retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get problem identification by ID
// @route   GET /api/problem-identifications/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getProblemIdentificationById = async (req, res, next) => {
  try {
    const record = await problemIdentificationService.getProblemIdentificationById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Problem identification retrieved successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update problem identification (Edit findings or details)
// @route   PATCH /api/problem-identifications/:id
// @access  Private (BRIDA)
const updateProblemIdentification = async (req, res, next) => {
  try {
    const updated = await problemIdentificationService.updateProblemIdentification(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Problem identification updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve problem identification by BRIDA
// @route   POST /api/problem-identifications/:id/approve
// @access  Private (BRIDA)
const approveProblemIdentification = async (req, res, next) => {
  try {
    const approved = await problemIdentificationService.approveProblemIdentification(
      req.params.id,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Problem identification successfully approved by BRIDA.',
      data: approved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject problem identification by BRIDA
// @route   POST /api/problem-identifications/:id/reject
// @access  Private (BRIDA)
const rejectProblemIdentification = async (req, res, next) => {
  try {
    const rejected = await problemIdentificationService.rejectProblemIdentification(
      req.params.id,
      req.body.reviewNote,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Problem identification rejected.',
      data: rejected,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate / Decide problem identification (Approve or Reject)
// @route   POST /api/problem-identifications/:id/validate
// @access  Private (BRIDA)
const validateProblemIdentification = async (req, res, next) => {
  try {
    const { decision, notes, reviewNote } = req.body;
    const note = notes || reviewNote;
    let result;
    if (decision === 'REJECT') {
      result = await problemIdentificationService.rejectProblemIdentification(
        req.params.id,
        note || 'Ditolak oleh verifikator BRIDA',
        req.user.id
      );
    } else {
      result = await problemIdentificationService.approveProblemIdentification(
        req.params.id,
        req.user.id
      );
    }
    res.status(200).json({
      success: true,
      message: decision === 'REJECT' ? 'Problem identification rejected.' : 'Problem identification successfully approved/validated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeSource,
  createProblemIdentification,
  getProblemIdentifications,
  getProblemIdentificationById,
  updateProblemIdentification,
  approveProblemIdentification,
  rejectProblemIdentification,
  validateProblemIdentification,
};
