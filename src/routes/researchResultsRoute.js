const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const researchResultsDashboardService = require('../services/researchResultsDashboardService');

// Require authentication and internal roles
router.use(requireAuth);
router.use(requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await researchResultsDashboardService.getResultsDashboard();
    res.status(200).json({
      success: true,
      message: 'Dashboard hasil penelitian berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
