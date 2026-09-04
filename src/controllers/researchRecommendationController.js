const researchRecommendationService = require('../services/researchRecommendationService');

const createRecommendation = async (req, res, next) => {
  try {
    const recommendation = await researchRecommendationService.createRecommendation(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Rekomendasi kebijakan berhasil dirumuskan.',
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const result = await researchRecommendationService.getRecommendations(req.query);
    res.status(200).json({
      success: true,
      message: 'Daftar rekomendasi berhasil diambil.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendationById = async (req, res, next) => {
  try {
    const recommendation = await researchRecommendationService.getRecommendationById(
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: 'Detail rekomendasi berhasil diambil.',
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

const updateRecommendation = async (req, res, next) => {
  try {
    const recommendation = await researchRecommendationService.updateRecommendation(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Rekomendasi berhasil diperbarui.',
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

const submitRecommendation = async (req, res, next) => {
  try {
    const recommendation = await researchRecommendationService.submitRecommendation(
      req.params.id,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Rekomendasi berhasil disubmit ke Kepala BRIDA.',
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

const approveRecommendation = async (req, res, next) => {
  try {
    const result = await researchRecommendationService.approveRecommendation(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      message: 'Rekomendasi berhasil disetujui oleh Kepala BRIDA.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const requestRecommendationRevision = async (req, res, next) => {
  try {
    const result = await researchRecommendationService.requestRecommendationRevision(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      message: 'Permintaan revisi rekomendasi berhasil diajukan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishRecommendation = async (req, res, next) => {
  try {
    const result = await researchRecommendationService.publishRecommendation(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      message: 'Rekomendasi berhasil diterbitkan ke OPD.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOpdRecommendations = async (req, res, next) => {
  try {
    const result = await researchRecommendationService.getOpdRecommendations(
      req.user.opdId,
      req.query
    );
    res.status(200).json({
      success: true,
      message: 'Daftar rekomendasi untuk OPD berhasil diambil.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getOpdRecommendationById = async (req, res, next) => {
  try {
    const data = await researchRecommendationService.getOpdRecommendationById(
      req.params.id,
      req.user.opdId,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Detail rekomendasi untuk OPD berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendationStatistics = async (req, res, next) => {
  try {
    const statistics = await researchRecommendationService.getRecommendationStatistics();
    res.status(200).json({
      success: true,
      message: 'Statistik rekomendasi berhasil diambil.',
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

const uploadRecommendationDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File dokumen rekomendasi wajib diunggah',
        error: { code: 'FILE_REQUIRED' },
      });
    }

    const document = await researchRecommendationService.uploadRecommendationDocument(
      req.params.id,
      req.file,
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Dokumen rekomendasi berhasil diunggah.',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendationDocuments = async (req, res, next) => {
  try {
    const documents = await researchRecommendationService.getRecommendationDocuments(
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: 'Daftar dokumen rekomendasi berhasil diambil.',
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRecommendationDocument = async (req, res, next) => {
  try {
    const result = await researchRecommendationService.deleteRecommendationDocument(
      req.params.id,
      req.params.documentId,
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

module.exports = {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  updateRecommendation,
  submitRecommendation,
  approveRecommendation,
  requestRecommendationRevision,
  publishRecommendation,
  getOpdRecommendations,
  getOpdRecommendationById,
  getRecommendationStatistics,
  uploadRecommendationDocument,
  getRecommendationDocuments,
  deleteRecommendationDocument,
};
