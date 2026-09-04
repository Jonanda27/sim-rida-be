const policyBriefService = require('../services/policyBriefService');

const createPolicyBrief = async (req, res, next) => {
  try {
    const policyBrief = await policyBriefService.createPolicyBrief(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Policy brief berhasil disusun.',
      data: policyBrief,
    });
  } catch (error) {
    next(error);
  }
};

const getPolicyBriefs = async (req, res, next) => {
  try {
    const result = await policyBriefService.getPolicyBriefs(req.query);
    res.status(200).json({
      success: true,
      message: 'Daftar policy brief berhasil diambil.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getPolicyBriefById = async (req, res, next) => {
  try {
    const policyBrief = await policyBriefService.getPolicyBriefById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Detail policy brief berhasil diambil.',
      data: policyBrief,
    });
  } catch (error) {
    next(error);
  }
};

const updatePolicyBrief = async (req, res, next) => {
  try {
    const policyBrief = await policyBriefService.updatePolicyBrief(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Policy brief berhasil diperbarui.',
      data: policyBrief,
    });
  } catch (error) {
    next(error);
  }
};

const submitPolicyBrief = async (req, res, next) => {
  try {
    const policyBrief = await policyBriefService.submitPolicyBrief(
      req.params.id,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Policy brief berhasil disubmit untuk review.',
      data: policyBrief,
    });
  } catch (error) {
    next(error);
  }
};

const reviewPolicyBrief = async (req, res, next) => {
  try {
    const result = await policyBriefService.reviewPolicyBrief(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: `Review policy brief berhasil diproses (${result.policyBrief.status}).`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPolicyBriefStatistics = async (req, res, next) => {
  try {
    const statistics = await policyBriefService.getPolicyBriefStatistics();
    res.status(200).json({
      success: true,
      message: 'Statistik policy brief berhasil diambil.',
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

const uploadPolicyBriefDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File dokumen policy brief wajib diunggah',
        error: { code: 'FILE_REQUIRED' },
      });
    }

    const document = await policyBriefService.uploadPolicyBriefDocument(
      req.params.id,
      req.file,
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Dokumen policy brief berhasil diunggah.',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const getPolicyBriefDocuments = async (req, res, next) => {
  try {
    const documents = await policyBriefService.getPolicyBriefDocuments(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Daftar dokumen policy brief berhasil diambil.',
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

const deletePolicyBriefDocument = async (req, res, next) => {
  try {
    const result = await policyBriefService.deletePolicyBriefDocument(
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
  createPolicyBrief,
  getPolicyBriefs,
  getPolicyBriefById,
  updatePolicyBrief,
  submitPolicyBrief,
  reviewPolicyBrief,
  getPolicyBriefStatistics,
  uploadPolicyBriefDocument,
  getPolicyBriefDocuments,
  deletePolicyBriefDocument,
};
