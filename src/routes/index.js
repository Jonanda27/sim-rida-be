const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const opdRoutes = require('../modules/opds/opd.routes');
const proposalRoutes = require('../modules/proposals/proposal.routes');
const scoringRoutes = require('../modules/scoring/scoring.routes');
const approvalRoutes = require('../modules/approvals/approval.routes');
const studyRoutes = require('../modules/studies/study.routes');
const recommendationRoutes = require('../modules/recommendations/recommendation.routes');
const tteRoutes = require('../modules/tte/tte.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SIM-RIDA API is healthy and operational.',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Register Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/opds', opdRoutes);
router.use('/proposals', proposalRoutes);
router.use('/scoring', scoringRoutes);
router.use('/approvals', approvalRoutes);
router.use('/studies', studyRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/tte', tteRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
