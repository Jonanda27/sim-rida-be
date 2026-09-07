const problemIdentificationService = require('../services/problemIdentificationService');

// @desc    Create a new problem identification (BRIDA analysis)
// @route   POST /api/problem-identifications
// @access  Private (ADMIN_BRIDA, BRIDA)
const createProblemIdentification = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.createProblemIdentification(
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Identifikasi kebutuhan OPD berhasil dibuat.',
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
      message: 'Daftar identifikasi kebutuhan OPD berhasil dimuat.',
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
      message: 'Detail identifikasi kebutuhan OPD berhasil dimuat.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update problem identification (Edit by BRIDA)
// @route   PATCH /api/problem-identifications/:id
// @access  Private (ADMIN_BRIDA, BRIDA)
const updateProblemIdentification = async (req, res, next) => {
  try {
    const updated = await problemIdentificationService.updateProblemIdentification(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Identifikasi kebutuhan OPD berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Validate problem identification
// @route   POST /api/problem-identifications/:id/approve
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const approveProblemIdentification = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.approveIdentification(
      req.params.id,
      req.user.id,
      req.body?.reviewNote
    );
    res.status(200).json({
      success: true,
      message: 'Identifikasi kebutuhan OPD berhasil disetujui dan ditetapkan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject problem identification
// @route   POST /api/problem-identifications/:id/reject
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const rejectProblemIdentification = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.rejectIdentification(
      req.params.id,
      req.user.id,
      req.body?.reviewNote
    );
    res.status(200).json({
      success: true,
      message: 'Identifikasi kebutuhan OPD berhasil ditolak.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete problem identification
// @route   DELETE /api/problem-identifications/:id
// @access  Private (ADMIN_BRIDA, BRIDA)
const deleteProblemIdentification = async (req, res, next) => {
  try {
    const result = await problemIdentificationService.deleteProblemIdentification(
      req.params.id,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate (Approve or Reject) problem identification
// @route   POST /api/problem-identifications/:id/validate
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const validateProblemIdentification = async (req, res, next) => {
  try {
    const { decision, notes, reviewNote } = req.body;
    const finalNote = notes || reviewNote;
    let result;

    if (decision === 'APPROVE' || decision === 'APPROVED') {
      result = await problemIdentificationService.approveIdentification(
        req.params.id,
        req.user.id,
        finalNote
      );
    } else if (decision === 'REJECT' || decision === 'REJECTED') {
      result = await problemIdentificationService.rejectIdentification(
        req.params.id,
        req.user.id,
        finalNote
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Keputusan validasi harus APPROVE atau REJECT.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Identifikasi kebutuhan OPD berhasil di-${decision.toLowerCase()}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProblemIdentification,
  getProblemIdentifications,
  getProblemIdentificationById,
  updateProblemIdentification,
  approveProblemIdentification,
  rejectProblemIdentification,
  validateProblemIdentification,
  deleteProblemIdentification,
};

