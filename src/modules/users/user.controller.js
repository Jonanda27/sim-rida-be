const userService = require('./user.service');
const { successResponse } = require('../../utils/response.util');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      return successResponse(res, 'Daftar pengguna berhasil diambil.', result.users, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return successResponse(res, 'Detail pengguna berhasil diambil.', user);
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return successResponse(res, 'Akun pengguna baru berhasil dibuat.', user, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return successResponse(res, 'Data akun pengguna berhasil diperbarui.', user);
    } catch (err) {
      next(err);
    }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const user = await userService.toggleUserStatus(req.params.id, req.body.isActive);
      const statusText = user.isActive ? 'diaktifkan' : 'dinonaktifkan';
      return successResponse(res, `Akun pengguna berhasil ${statusText}.`, user);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return successResponse(res, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
