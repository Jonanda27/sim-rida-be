const studyService = require('./study.service');
const { successResponse } = require('../../utils/response.util');

class StudyController {
  async getAllStudies(req, res, next) {
    try {
      const result = await studyService.getAllStudies(req.query);
      return successResponse(
        res,
        'Daftar kajian riset berhasil diambil.',
        result.studies,
        200,
        result.pagination
      );
    } catch (err) {
      next(err);
    }
  }

  async getApprovedProposals(req, res, next) {
    try {
      const proposals = await studyService.getApprovedProposals(req.query);
      return successResponse(
        res,
        'Daftar usulan yang siap diinisiasi menjadi kajian berhasil diambil.',
        proposals
      );
    } catch (err) {
      next(err);
    }
  }

  async initializeStudy(req, res, next) {
    try {
      const study = await studyService.initializeStudy(
        req.params.proposalId,
        req.user,
        req.body
      );
      return successResponse(
        res,
        'Kajian riset aktif berhasil diinisiasi dari usulan yang disetujui.',
        study,
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async getStudyById(req, res, next) {
    try {
      const study = await studyService.getStudyById(req.params.id);
      return successResponse(res, 'Detail lengkap kajian riset berhasil diambil.', study);
    } catch (err) {
      next(err);
    }
  }

  async saveKak(req, res, next) {
    try {
      const kak = await studyService.saveKak(req.params.id, req.body);
      const message =
        req.body.status === 'FINAL'
          ? 'Dokumen Kerangka Acuan Kerja (KAK) berhasil difinalisasi.'
          : 'Draf Kerangka Acuan Kerja (KAK) berhasil disimpan.';
      return successResponse(res, message, kak);
    } catch (err) {
      next(err);
    }
  }

  async saveRka(req, res, next) {
    try {
      const result = await studyService.saveRka(req.params.id, req.body);
      return successResponse(
        res,
        'Rencana Kerja & Anggaran (RKA) kajian berhasil disimpan.',
        result
      );
    } catch (err) {
      next(err);
    }
  }

  async saveTeam(req, res, next) {
    try {
      const team = await studyService.saveTeam(req.params.id, req.body);
      return successResponse(
        res,
        'Susunan tim peneliti kajian berhasil disimpan.',
        team
      );
    } catch (err) {
      next(err);
    }
  }

  async updateStudyStatus(req, res, next) {
    try {
      const study = await studyService.updateStudyStatus(req.params.id, req.body);
      return successResponse(
        res,
        `Status pelaksanaan kajian berhasil diperbarui menjadi ${req.body.status}.`,
        study
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudyController();
