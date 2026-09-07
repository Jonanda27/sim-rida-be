const { Router } = require('express');
const dashboardController = require('./dashboard.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');

const router = Router();

// Seluruh endpoint dashboard membutuhkan login
router.use(authenticate);

// Dynamic Summary Dashboard sesuai role user yang login
router.get('/summary', dashboardController.getSummary);

// Executive Dashboard (Kepala BRIDA & Admin BRIDA)
router.get(
  '/kepala',
  authorize(['KEPALA_BRIDA', 'ADMIN_BRIDA']),
  dashboardController.getKepalaDashboard
);

// Operational Dashboard (Khusus Admin BRIDA)
router.get(
  '/admin',
  authorize(['ADMIN_BRIDA']),
  dashboardController.getAdminDashboard
);

// OPD Dashboard (Khusus OPD)
router.get(
  '/opd',
  authorize(['OPD']),
  dashboardController.getOpdDashboard
);

module.exports = router;
