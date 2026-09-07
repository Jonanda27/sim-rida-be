const dashboardService = require('./dashboard.service');
const { successResponse } = require('../../utils/response.util');

class DashboardController {
  async getKepalaDashboard(req, res, next) {
    try {
      const data = await dashboardService.getKepalaDashboard();
      return successResponse(
        res,
        'Data Executive Dashboard Kepala BRIDA berhasil dimuat.',
        data
      );
    } catch (err) {
      next(err);
    }
  }

  async getAdminDashboard(req, res, next) {
    try {
      const data = await dashboardService.getAdminDashboard();
      return successResponse(
        res,
        'Data Operational Dashboard Admin BRIDA berhasil dimuat.',
        data
      );
    } catch (err) {
      next(err);
    }
  }

  async getOpdDashboard(req, res, next) {
    try {
      const data = await dashboardService.getOpdDashboard(req.user);
      return successResponse(
        res,
        'Data Dashboard Usulan & Hasil Riset OPD berhasil dimuat.',
        data
      );
    } catch (err) {
      next(err);
    }
  }

  async getSummary(req, res, next) {
    try {
      let data;
      if (req.user.role === 'KEPALA_BRIDA') {
        data = await dashboardService.getKepalaDashboard();
      } else if (req.user.role === 'ADMIN_BRIDA') {
        data = await dashboardService.getAdminDashboard();
      } else {
        data = await dashboardService.getOpdDashboard(req.user);
      }
      return successResponse(
        res,
        `Data Dashboard (${req.user.role}) berhasil dimuat.`,
        data
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
