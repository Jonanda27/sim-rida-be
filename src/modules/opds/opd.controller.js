const opdService = require('./opd.service');
const { successResponse } = require('../../utils/response.util');

class OpdController {
  async getAllOpds(req, res, next) {
    try {
      const opds = await opdService.getAllOpds(req.query);
      return successResponse(res, 'Daftar master OPD berhasil diambil.', opds);
    } catch (err) {
      next(err);
    }
  }

  async getOpdById(req, res, next) {
    try {
      const opd = await opdService.getOpdById(req.params.id);
      return successResponse(res, 'Detail OPD berhasil diambil.', opd);
    } catch (err) {
      next(err);
    }
  }

  async createOpd(req, res, next) {
    try {
      const opd = await opdService.createOpd(req.body);
      return successResponse(res, 'Master OPD berhasil ditambahkan.', opd, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateOpd(req, res, next) {
    try {
      const opd = await opdService.updateOpd(req.params.id, req.body);
      return successResponse(res, 'Master OPD berhasil diperbarui.', opd);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OpdController();
