const express = require('express');
const router = express.Router();

// Import route modules here
const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const problemRoute = require('./problemRoute');
const researchRoute = require('./researchRoute');
const masterRoute = require('./masterRoute');
const reportRoute = require('./reportRoute');
const policyBriefRoute = require('./policyBriefRoute');
const recommendationRoute = require('./recommendationRoute');
const followUpRoute = require('./followUpRoute');
const externalSourceRoute = require('./externalSourceRoute');
const problemIdentificationRoute = require('./problemIdentificationRoute');
const researchProposalRoute = require('./researchProposalRoute');
const researchSelectionRoute = require('./researchSelectionRoute');
const researchKakRoute = require('./researchKakRoute');
const researchRabRoute = require('./researchRabRoute');
const researchPlanningRoute = require('./researchPlanningRoute');
const researchPartnerRoute = require('./researchPartnerRoute');
const researchPartnerSelectionRoute = require('./researchPartnerSelectionRoute');
const researchImplementationRoute = require('./researchImplementationRoute');
const researchTimelineRoute = require('./researchTimelineRoute');
const researchMilestoneRoute = require('./researchMilestoneRoute');
const researchActivityRoute = require('./researchActivityRoute');
const researchReportRoute = require('./researchReportRoute');
const opdRecommendationRoute = require('./opdRecommendationRoute');
const researchResultsRoute = require('./researchResultsRoute');

// Define routes
router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/external-sources', externalSourceRoute);
router.use('/problem-identifications', problemIdentificationRoute);
router.use('/research-proposals', researchProposalRoute);
router.use('/research-selections', researchSelectionRoute);
router.use('/research-kaks', researchKakRoute);
router.use('/research-rabs', researchRabRoute);
router.use('/research-planning', researchPlanningRoute);
router.use('/research-partners', researchPartnerRoute);
router.use('/research-partner-selections', researchPartnerSelectionRoute);
router.use('/research-implementations', researchImplementationRoute);
router.use('/research-timelines', researchTimelineRoute);
router.use('/research-milestones', researchMilestoneRoute);
router.use('/research-activities', researchActivityRoute);
router.use('/research-reports', researchReportRoute);
router.use('/reports', researchReportRoute);
router.use('/policy-briefs', policyBriefRoute);
router.use('/recommendations', recommendationRoute);
router.use('/opd/recommendations', opdRecommendationRoute);
router.use('/research-results', researchResultsRoute);
router.use('/problems', problemRoute);
router.use('/researches', researchRoute);
router.use('/master', masterRoute);
router.use('/opds', masterRoute);
router.use('/follow-ups', followUpRoute);

const prisma = require('../config/db');

// Health check route with database connectivity verification
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      data: {
        service: 'sim-rida-be',
        status: 'healthy',
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        service: 'sim-rida-be',
        status: 'degraded',
        database: 'disconnected',
      },
      error: {
        code: 'DATABASE_DISCONNECTED',
        message: error.message,
      },
    });
  }
});

module.exports = router;
