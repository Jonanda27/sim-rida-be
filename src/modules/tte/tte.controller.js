const tteService = require('./tte.service');
const { successResponse } = require('../../utils/response.util');

class TteController {
  async getTteInbox(req, res, next) {
    try {
      const inbox = await tteService.getTteInbox();
      return successResponse(
        res,
        'Antrean dokumen menunggu tanda tangan elektronik berhasil diambil.',
        inbox.items,
        200,
        { total: inbox.total }
      );
    } catch (err) {
      next(err);
    }
  }

  async getTteHistory(req, res, next) {
    try {
      const result = await tteService.getTteHistory(req.query);
      return successResponse(
        res,
        'Riwayat arsip tanda tangan elektronik berhasil diambil.',
        result.logs,
        200,
        result.pagination
      );
    } catch (err) {
      next(err);
    }
  }

  async getDocumentDetail(req, res, next) {
    try {
      const detail = await tteService.getDocumentDetail(
        req.params.documentType,
        req.params.id
      );
      return successResponse(res, 'Detail preview dokumen berhasil diambil.', detail);
    } catch (err) {
      next(err);
    }
  }

  async signDocument(req, res, next) {
    try {
      const signatureLog = await tteService.signDocument(req.user, req.body);
      return successResponse(
        res,
        'Dokumen berhasil disahkan dan ditandatangani secara elektronik (TTE).',
        signatureLog,
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async verifyCertificate(req, res, next) {
    try {
      const certificate = await tteService.verifyCertificate(
        req.params.certificateNumber
      );
      return successResponse(
        res,
        'Keabsahan sertifikat Tanda Tangan Elektronik berhasil diverifikasi.',
        certificate
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TteController();
