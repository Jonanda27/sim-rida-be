const researchImplementationService = require('../services/researchImplementationService');
const researchTimelineService = require('../services/researchTimelineService');
const researchMilestoneService = require('../services/researchMilestoneService');
const researchActivityService = require('../services/researchActivityService');
const researchImplementationDocumentService = require('../services/researchImplementationDocumentService');

const getImplementations = async (req, res, next) => {
  try {
    const result = await researchImplementationService.getImplementations(req.query);
    res.json({
      success: true,
      message: 'Daftar pelaksanaan penelitian berhasil diambil.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableProposals = async (req, res, next) => {
  try {
    const data = await researchImplementationService.getAvailableProposals();
    res.json({
      success: true,
      message: 'Daftar proposal siap pelaksanaan berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getImplementationStatistics = async (req, res, next) => {
  try {
    const data = await researchImplementationService.getImplementationStatistics(req.query);
    res.json({
      success: true,
      message: 'Statistik pelaksanaan penelitian berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getImplementationById = async (req, res, next) => {
  try {
    const data = await researchImplementationService.getImplementationById(req.params.id);
    res.json({
      success: true,
      message: 'Detail pelaksanaan penelitian berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getImplementationSummary = async (req, res, next) => {
  try {
    const data = await researchImplementationService.getImplementationSummary(req.params.id);
    res.json({
      success: true,
      message: 'Ringkasan pelaksanaan penelitian berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getProgressHistory = async (req, res, next) => {
  try {
    const data = await researchImplementationService.getProgressHistory(req.params.id);
    res.json({
      success: true,
      message: 'Riwayat progress pelaksanaan penelitian berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createImplementation = async (req, res, next) => {
  try {
    const data = await researchImplementationService.createImplementation(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Pelaksanaan penelitian berhasil dibuat.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateImplementation = async (req, res, next) => {
  try {
    const data = await researchImplementationService.updateImplementation(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Data pelaksanaan penelitian berhasil diperbarui.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const startImplementation = async (req, res, next) => {
  try {
    const data = await researchImplementationService.startImplementation(
      req.params.id,
      req.user.id,
      req.body.actualStartDate
    );
    res.json({
      success: true,
      message: 'Pelaksanaan penelitian berhasil dimulai (status: ONGOING).',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const completeImplementation = async (req, res, next) => {
  try {
    const data = await researchImplementationService.completeImplementation(
      req.params.id,
      req.user.id,
      req.body.actualEndDate,
      req.body.notes
    );
    res.json({
      success: true,
      message: 'Pelaksanaan penelitian berhasil diselesaikan (status: COMPLETED, progress: 100%).',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const cancelImplementation = async (req, res, next) => {
  try {
    const data = await researchImplementationService.cancelImplementation(req.params.id, req.body.reason, req.user.id);
    res.json({
      success: true,
      message: 'Pelaksanaan penelitian berhasil dibatalkan.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const data = await researchImplementationService.updateProgress(
      req.params.id,
      req.body.progress,
      req.body.notes,
      req.user.id
    );
    res.json({
      success: true,
      message: 'Progress pelaksanaan penelitian berhasil diperbarui.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Timelines under implementation
const getTimelines = async (req, res, next) => {
  try {
    const data = await researchTimelineService.getTimelines(req.params.id);
    res.json({
      success: true,
      message: 'Daftar tahapan timeline berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createTimeline = async (req, res, next) => {
  try {
    const data = await researchTimelineService.createTimeline(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Tahapan timeline berhasil dibuat.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Milestones under implementation
const getMilestones = async (req, res, next) => {
  try {
    const data = await researchMilestoneService.getMilestones(req.params.id, req.query);
    res.json({
      success: true,
      message: 'Daftar capaian milestone berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createMilestone = async (req, res, next) => {
  try {
    const data = await researchMilestoneService.createMilestone(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Capaian milestone berhasil dibuat.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Activities under implementation
const getActivities = async (req, res, next) => {
  try {
    const result = await researchActivityService.getActivities(req.params.id, req.query);
    res.json({
      success: true,
      message: 'Daftar aktivitas pelaksanaan berhasil diambil.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const createActivity = async (req, res, next) => {
  try {
    const data = await researchActivityService.createActivity(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Aktivitas pelaksanaan berhasil dicatat.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Documents under implementation
const getDocuments = async (req, res, next) => {
  try {
    const data = await researchImplementationDocumentService.getDocuments(req.params.id);
    res.json({
      success: true,
      message: 'Daftar dokumen pelaksanaan berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const data = await researchImplementationDocumentService.uploadDocument(
      req.params.id,
      req.file,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Dokumen pelaksanaan berhasil diunggah.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const result = await researchImplementationDocumentService.deleteDocument(
      req.params.id,
      req.params.documentId,
      req.user.id
    );
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getImplementations,
  getAvailableProposals,
  getImplementationStatistics,
  getImplementationById,
  getImplementationSummary,
  getProgressHistory,
  createImplementation,
  updateImplementation,
  startImplementation,
  completeImplementation,
  cancelImplementation,
  updateProgress,
  getTimelines,
  createTimeline,
  getMilestones,
  createMilestone,
  getActivities,
  createActivity,
  getDocuments,
  uploadDocument,
  deleteDocument,
};
