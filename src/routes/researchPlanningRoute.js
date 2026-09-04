const express = require('express');
const {
  getResearchPlanning,
  submitResearchPlanning,
  finalizeResearchPlanning,
  getPlanningStatistics,
} = require('../controllers/researchPlanningController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Require login for all planning routes
router.use(requireAuth);

const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
const allowActionRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');

/**
 * @route   GET /api/research-planning/statistics
 * @desc    Get aggregated planning statistics
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/statistics', allowReadRoles, getPlanningStatistics);

/**
 * @route   GET /api/research-planning/:proposalId
 * @desc    Get unified research planning package (Proposal, KAK, RAB)
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.get('/:proposalId', allowReadRoles, getResearchPlanning);

/**
 * @route   POST /api/research-planning/:proposalId/submit
 * @desc    Submit research planning package atomically (KAK & RAB -> SUBMITTED)
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:proposalId/submit', allowActionRoles, submitResearchPlanning);

/**
 * @route   POST /api/research-planning/:proposalId/finalize
 * @desc    Finalize research planning package (KAK & RAB -> FINALIZED, Proposal -> READY_FOR_PARTNER)
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 */
router.post('/:proposalId/finalize', allowActionRoles, finalizeResearchPlanning);

module.exports = router;
