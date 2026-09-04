const researchReportService = require('../services/researchReportService');

const createReport = async (req, res, next) => {
  try {
    const report = await researchReportService.createReport(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Laporan penelitian berhasil dibuat.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const result = await researchReportService.getReports(req.query);
    res.status(200).json({
      success: true,
      message: 'Daftar laporan penelitian berhasil diambil.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await researchReportService.getReportById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Detail laporan penelitian berhasil diambil.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await researchReportService.updateReport(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Laporan penelitian berhasil diperbarui.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const submitReport = async (req, res, next) => {
  try {
    const report = await researchReportService.submitReport(
      req.params.id,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Laporan penelitian berhasil disubmit untuk review.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const reviewReport = async (req, res, next) => {
  try {
    const result = await researchReportService.reviewReport(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: `Review laporan berhasil diproses (${result.report.status}).`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReportStatistics = async (req, res, next) => {
  try {
    const statistics = await researchReportService.getReportStatistics();
    res.status(200).json({
      success: true,
      message: 'Statistik laporan penelitian berhasil diambil.',
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

const uploadReportDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File dokumen laporan wajib diunggah',
        error: { code: 'FILE_REQUIRED' },
      });
    }

    const document = await researchReportService.uploadReportDocument(
      req.params.id,
      req.file,
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Dokumen laporan penelitian berhasil diunggah.',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const getReportDocuments = async (req, res, next) => {
  try {
    const documents = await researchReportService.getReportDocuments(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Daftar dokumen laporan berhasil diambil.',
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReportDocument = async (req, res, next) => {
  try {
    const result = await researchReportService.deleteReportDocument(
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
  createReport,
  getReports,
  getReportById,
  updateReport,
  submitReport,
  reviewReport,
  getReportStatistics,
  uploadReportDocument,
  getReportDocuments,
  deleteReportDocument,
};
