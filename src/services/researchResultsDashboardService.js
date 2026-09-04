const prisma = require('../config/db');

/**
 * Get integrated dashboard statistics for research results, policy briefs, and recommendations
 */
const getResultsDashboard = async () => {
  const [
    completedResearch,
    reportDraft,
    reportSubmitted,
    reportApproved,
    pbDraft,
    pbSubmitted,
    pbApproved,
    recDraft,
    recSubmitted,
    recApproved,
    recPublished,
  ] = await Promise.all([
    prisma.researchImplementation.count({ where: { status: 'COMPLETED' } }),
    prisma.researchReport.count({ where: { status: 'DRAFT' } }),
    prisma.researchReport.count({ where: { status: 'SUBMITTED' } }),
    prisma.researchReport.count({ where: { status: 'APPROVED' } }),
    prisma.policyBrief.count({ where: { status: 'DRAFT' } }),
    prisma.policyBrief.count({ where: { status: 'SUBMITTED' } }),
    prisma.policyBrief.count({ where: { status: 'APPROVED' } }),
    prisma.researchRecommendation.count({ where: { status: 'DRAFT' } }),
    prisma.researchRecommendation.count({ where: { status: 'SUBMITTED' } }),
    prisma.researchRecommendation.count({ where: { status: 'APPROVED' } }),
    prisma.researchRecommendation.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return {
    completedResearch,
    reports: {
      draft: reportDraft,
      submitted: reportSubmitted,
      approved: reportApproved,
    },
    policyBriefs: {
      draft: pbDraft,
      submitted: pbSubmitted,
      approved: pbApproved,
    },
    recommendations: {
      draft: recDraft,
      submitted: recSubmitted,
      approved: recApproved,
      published: recPublished,
    },
  };
};

module.exports = {
  getResultsDashboard,
};
