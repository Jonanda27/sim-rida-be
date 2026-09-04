const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { Prisma } = require('@prisma/client');
const { getKakById } = require('./researchKakService');
const { getRabById, recalculateRabTotal } = require('./researchRabService');

/**
 * Derived planning status calculation
 */
const derivePlanningStatus = (kak, rab) => {
  if (!kak) return 'NOT_STARTED';
  if (kak.status === 'CANCELLED' && (!rab || rab.status === 'CANCELLED')) return 'CANCELLED';

  if (kak.status === 'FINALIZED' && rab && rab.status === 'FINALIZED') {
    return 'FINALIZED';
  }

  if (kak.status === 'REVISION_REQUIRED' || (rab && rab.status === 'REVISION_REQUIRED')) {
    return 'REVISION_REQUIRED';
  }

  if (kak.status === 'SUBMITTED' && rab && rab.status === 'SUBMITTED') {
    return 'SUBMITTED';
  }

  return 'DRAFT';
};

/**
 * Get unified research planning package (Proposal, KAK, RAB)
 */
const getResearchPlanning = async (proposalId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      kak: {
        select: { id: true },
      },
    },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${proposalId} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  let kakData = null;
  let rabData = null;

  if (proposal.kak) {
    kakData = await getKakById(proposal.kak.id);
    if (kakData.rabSummary?.id) {
      rabData = await getRabById(kakData.rabSummary.id);
    }
  }

  const planningStatus = derivePlanningStatus(kakData, rabData);

  return {
    proposal: {
      id: proposal.id,
      code: proposal.code,
      title: proposal.title,
      status: proposal.status,
      priority: proposal.priority,
      createdAt: proposal.createdAt,
    },
    kak: kakData,
    rab: rabData,
    planningStatus,
  };
};

/**
 * Submit planning package (Submits both KAK and RAB atomically)
 */
const submitResearchPlanning = async (proposalId, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id: proposalId },
    include: {
      kak: {
        include: {
          rab: {
            include: { items: true },
          },
        },
      },
    },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${proposalId} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (!proposal.kak) {
    const error = new Error('Cannot submit planning package. KAK has not been created yet.');
    error.statusCode = 422;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (!proposal.kak.rab) {
    const error = new Error('Cannot submit planning package. RAB has not been created yet.');
    error.statusCode = 422;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  const kak = proposal.kak;
  const rab = proposal.kak.rab;

  // 1. Validate KAK completeness
  const missingFields = [];
  if (!kak.background || !kak.background.trim()) missingFields.push('background');
  if (!kak.purpose || !kak.purpose.trim()) missingFields.push('purpose');
  if (!kak.objective || !kak.objective.trim()) missingFields.push('objective');
  if (!kak.researchScope || !kak.researchScope.trim()) missingFields.push('researchScope');
  if (!kak.researchMethodology || !kak.researchMethodology.trim()) missingFields.push('researchMethodology');
  if (!kak.expectedOutput || !kak.expectedOutput.trim()) missingFields.push('expectedOutput');
  if (!kak.expectedOutcome || !kak.expectedOutcome.trim()) missingFields.push('expectedOutcome');
  if (!kak.successIndicator || !kak.successIndicator.trim()) missingFields.push('successIndicator');
  if (!kak.deliverables || !kak.deliverables.trim()) missingFields.push('deliverables');
  if (!kak.estimatedStartDate) missingFields.push('estimatedStartDate');
  if (!kak.estimatedEndDate) missingFields.push('estimatedEndDate');

  if (missingFields.length > 0) {
    const error = new Error(`Planning submission failed. The following KAK fields are incomplete: ${missingFields.join(', ')}.`);
    error.statusCode = 422;
    error.code = 'KAK_VALIDATION_FAILED';
    error.missingFields = missingFields;
    throw error;
  }

  if (kak.estimatedEndDate < kak.estimatedStartDate) {
    const error = new Error('Tanggal akhir estimasi tidak boleh mendahului tanggal mulai.');
    error.statusCode = 422;
    error.code = 'INVALID_DATE_RANGE';
    throw error;
  }

  // 2. Validate RAB items
  if (rab.items.length === 0) {
    const error = new Error('Planning submission failed. RAB must have at least one budget item.');
    error.statusCode = 422;
    error.code = 'RAB_EMPTY';
    throw error;
  }

  if (new Prisma.Decimal(rab.totalAmount).lte(0)) {
    const error = new Error('Planning submission failed. Total budget must be greater than 0.');
    error.statusCode = 422;
    error.code = 'RAB_TOTAL_INVALID';
    throw error;
  }

  // 3. Atomic transaction
  await prisma.$transaction(async (tx) => {
    await tx.researchKak.update({
      where: { id: kak.id },
      data: {
        status: 'SUBMITTED',
        submittedById: userId,
        submittedAt: new Date(),
      },
    });

    await tx.researchRab.update({
      where: { id: rab.id },
      data: {
        status: 'SUBMITTED',
        submittedById: userId,
        submittedAt: new Date(),
      },
    });
  });

  logAudit({
    userId,
    action: 'RESEARCH_KAK_SUBMITTED',
    entity: 'ResearchKak',
    entityId: kak.id,
    metadata: { proposalId },
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_SUBMITTED',
    entity: 'ResearchRab',
    entityId: rab.id,
    metadata: { proposalId, totalAmount: Number(rab.totalAmount) },
  });

  return getResearchPlanning(proposalId);
};

/**
 * Finalize planning package:
 * - KAK -> FINALIZED
 * - RAB -> FINALIZED
 * - ResearchProposal -> READY_FOR_PARTNER
 */
const finalizeResearchPlanning = async (proposalId, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id: proposalId },
    include: {
      kak: {
        include: {
          rab: {
            include: { items: true },
          },
        },
      },
    },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${proposalId} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (!proposal.kak) {
    const error = new Error('Cannot finalize planning package. KAK not found.');
    error.statusCode = 422;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (!proposal.kak.rab) {
    const error = new Error('Cannot finalize planning package. RAB not found.');
    error.statusCode = 422;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  const kak = proposal.kak;
  const rab = proposal.kak.rab;

  if (kak.status === 'FINALIZED' && rab.status === 'FINALIZED') {
    const error = new Error('Planning package is already FINALIZED.');
    error.statusCode = 409;
    error.code = 'PLANNING_ALREADY_FINALIZED';
    throw error;
  }

  if (rab.items.length === 0) {
    const error = new Error('Planning cannot be finalized. RAB has no budget items.');
    error.statusCode = 422;
    error.code = 'RAB_EMPTY';
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Recalculate RAB total
    const finalTotal = await recalculateRabTotal(rab.id, tx);

    if (finalTotal.lte(0)) {
      const error = new Error('Planning cannot be finalized. Total budget must be greater than 0.');
      error.statusCode = 422;
      error.code = 'RAB_TOTAL_INVALID';
      throw error;
    }

    // 2. Finalize KAK
    await tx.researchKak.update({
      where: { id: kak.id },
      data: {
        status: 'FINALIZED',
        finalizedById: userId,
        finalizedAt: new Date(),
      },
    });

    // 3. Finalize RAB
    await tx.researchRab.update({
      where: { id: rab.id },
      data: {
        status: 'FINALIZED',
        finalizedById: userId,
        finalizedAt: new Date(),
      },
    });

    // 4. Update Proposal to READY_FOR_PARTNER
    await tx.researchProposal.update({
      where: { id: proposalId },
      data: {
        status: 'READY_FOR_PARTNER',
      },
    });
  });

  logAudit({
    userId,
    action: 'RESEARCH_PLANNING_FINALIZED',
    entity: 'ResearchProposal',
    entityId: proposalId,
    metadata: {
      kakId: kak.id,
      rabId: rab.id,
      status: 'READY_FOR_PARTNER',
    },
  });

  return getResearchPlanning(proposalId);
};

/**
 * Aggregated statistics for planning dashboard
 */
const getPlanningStatistics = async (query = {}) => {
  const proposalWhere = {
    status: { in: ['SELECTED', 'READY_FOR_PARTNER'] },
  };

  if (query.year) {
    proposalWhere.code = { contains: query.year };
  }

  const [totalSelectedProposals, kaks, rabs] = await Promise.all([
    prisma.researchProposal.count({ where: proposalWhere }),
    prisma.researchKak.findMany({
      select: { id: true, status: true },
    }),
    prisma.researchRab.findMany({
      select: { id: true, status: true, totalAmount: true },
    }),
  ]);

  const kakStatusCounts = {
    DRAFT: 0,
    SUBMITTED: 0,
    REVISION_REQUIRED: 0,
    FINALIZED: 0,
    CANCELLED: 0,
  };

  for (const k of kaks) {
    if (kakStatusCounts[k.status] !== undefined) {
      kakStatusCounts[k.status]++;
    }
  }

  let totalBudget = 0;
  for (const r of rabs) {
    if (r.status === 'FINALIZED') {
      totalBudget += Number(r.totalAmount || 0);
    }
  }

  const withoutKak = Math.max(0, totalSelectedProposals - kaks.length);

  return {
    totalSelectedProposals,
    withoutKak,
    draft: kakStatusCounts.DRAFT,
    submitted: kakStatusCounts.SUBMITTED,
    revisionRequired: kakStatusCounts.REVISION_REQUIRED,
    finalized: kakStatusCounts.FINALIZED,
    totalBudget: Math.round(totalBudget * 100) / 100,
  };
};

module.exports = {
  getResearchPlanning,
  submitResearchPlanning,
  finalizeResearchPlanning,
  getPlanningStatistics,
};
