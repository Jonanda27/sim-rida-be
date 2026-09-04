const researchKakService = require('../services/researchKakService');

// @desc    Get paginated KAK list
// @route   GET /api/research-kaks
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getKaks = async (req, res, next) => {
  try {
    const result = await researchKakService.getKaks(req.query);
    res.status(200).json({
      success: true,
      message: 'Research KAKs retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed KAK by ID
// @route   GET /api/research-kaks/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getKakById = async (req, res, next) => {
  try {
    const kak = await researchKakService.getKakById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK retrieved successfully',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new KAK for SELECTED proposal
// @route   POST /api/research-kaks
// @access  Private (BRIDA)
const createKak = async (req, res, next) => {
  try {
    const kak = await researchKakService.createKak(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Research KAK created successfully as DRAFT',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update KAK draft / revision
// @route   PATCH /api/research-kaks/:id
// @access  Private (BRIDA)
const updateKak = async (req, res, next) => {
  try {
    const kak = await researchKakService.updateKak(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK updated successfully',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit KAK for internal review
// @route   POST /api/research-kaks/:id/submit
// @access  Private (BRIDA)
const submitKak = async (req, res, next) => {
  try {
    const kak = await researchKakService.submitKak(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK submitted successfully (status: SUBMITTED)',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return KAK for revision
// @route   POST /api/research-kaks/:id/return
// @access  Private (BRIDA)
const returnKak = async (req, res, next) => {
  try {
    const kak = await researchKakService.returnKak(req.params.id, req.body.reviewNote, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK returned for revision (status: REVISION_REQUIRED)',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize KAK
// @route   POST /api/research-kaks/:id/finalize
// @access  Private (BRIDA)
const finalizeKak = async (req, res, next) => {
  try {
    const kak = await researchKakService.finalizeKak(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK finalized successfully (status: FINALIZED)',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel KAK draft
// @route   POST /api/research-kaks/:id/cancel
// @access  Private (BRIDA)
const cancelKak = async (req, res, next) => {
  try {
    const kak = await researchKakService.cancelKak(req.params.id, req.body.reason, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK cancelled',
      data: kak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get KAK review and history notes
// @route   GET /api/research-kaks/:id/review
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getKakReview = async (req, res, next) => {
  try {
    const kak = await researchKakService.getKakById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research KAK review notes retrieved successfully',
      data: {
        id: kak.id,
        code: kak.code,
        status: kak.status,
        version: kak.version,
        reviewNote: kak.reviewNote,
        cancelReason: kak.cancelReason,
        submittedAt: kak.submittedAt,
        finalizedAt: kak.finalizedAt,
        submittedBy: kak.submittedBy,
        finalizedBy: kak.finalizedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKaks,
  getKakById,
  createKak,
  updateKak,
  submitKak,
  returnKak,
  finalizeKak,
  cancelKak,
  getKakReview,
};
