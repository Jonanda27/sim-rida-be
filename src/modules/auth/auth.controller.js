const authService = require('./auth.service');
const { successResponse } = require('../../utils/response.util');

class AuthController {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, 'Login berhasil.', result);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return successResponse(res, 'Data profil berhasil diambil.', user);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const result = await authService.changePassword(req.user.id, req.body);
      return successResponse(res, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
