const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Generate sequential selection code: SEL-{YEAR}-{XXX}
 */
const generateSelectionCode = async (year = new Date().getFullYear()) => {
  const prefix = `SEL-${year}-`;
  const latestSelection = await prisma.researchSelection.findFirst({
    where: {
      code: { startsWith: prefix },
    },
    orderBy: {
      code: 'desc',
    },
    select: {
      code: true,
    },
  });

  let nextSeq = 1;
  if (latestSelection && latestSelection.code) {
    const parts = latestSelection.code.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
};

/**
 * Retrieve active criteria ordered by order asc
 */
const getActiveSelectionCriteria = async () => {
  return prisma.researchSelectionCriteria.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
};

/**
 * Calculate totalScore from scores array using weightSnapshot:
 * totalScore = Σ(score * weightSnapshot / 100)
 */
const calculateSelectionScore = (scores) => {
  if (!Array.isArray(scores) || scores.length === 0) return 0;

  let total = 0;
  for (const s of scores) {
    const scoreVal = typeof s.score === 'number' ? s.score : 0;
    const weightVal = typeof s.weightSnapshot === 'number' ? s.weightSnapshot : (s.criteria?.weight || 0);
    total += (scoreVal * weightVal) / 100;
  }

  return Math.round(total * 100) / 100;
};

/**
 * Common select pattern for detailed selection view
 */
const selectionDetailInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  finalizedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  researchProposal: {
    select: {
      id: true,
      code: true,
      title: true,
      priority: true,
      status: true,
      expectedOutput: true,
      expectedOutcome: true,
      problems: {
        where: { isPrimary: true },
        select: {
          problemIdentification: {
            select: { id: true, code: true, title: true },
          },
        },
      },
      relatedOpds: {
        where: { isPrimary: true },
        select: {
          opd: {
            select: { id: true, code: true, name: true, shortName: true },
          },
        },
      },
    },
  },
  scores: {
    include: {
      criteria: true,
    },
    orderBy: {
      criteria: { order: 'asc' },
    },
  },
};

/**
 * Format raw selection record to include calculated weightedScore per criteria
 */
const formatSelectionResponse = (selection) => {
  if (!selection) return null;

  const formattedCriteria = (selection.scores || []).map((s) => {
    const weight = typeof s.weightSnapshot === 'number' ? s.weightSnapshot : (s.criteria?.weight || 0);
    const score = s.score;
    const weightedScore = score !== null ? Math.round(((score * weight) / 100) * 100) / 100 : null;

    return {
      scoreId: s.id,
      criteriaId: s.criteriaId,
      code: s.criteria?.code || '',
      name: s.criteria?.name || '',
      description: s.criteria?.description || null,
      weight: weight,
      score: score,
      weightedScore: weightedScore,
      note: s.note,
    };
  });

  const primaryProb = selection.researchProposal?.problems?.[0]?.problemIdentification || null;
  const primaryOpd = selection.researchProposal?.relatedOpds?.[0]?.opd || null;

  return {
    id: selection.id,
    code: selection.code,
    status: selection.status,
    totalScore: selection.totalScore,
    result: selection.result,
    selectionNote: selection.selectionNote,
    cancelReason: selection.cancelReason,
    selectedAt: selection.selectedAt,
    createdAt: selection.createdAt,
    updatedAt: selection.updatedAt,
    finalizedAt: selection.finalizedAt,
    createdBy: selection.createdBy,
    finalizedBy: selection.finalizedBy,
    researchProposal: selection.researchProposal
      ? {
          id: selection.researchProposal.id,
          code: selection.researchProposal.code,
          title: selection.researchProposal.title,
          priority: selection.researchProposal.priority,
          status: selection.researchProposal.status,
          primaryProblem: primaryProb,
          primaryOpd: primaryOpd,
        }
      : null,
    criteria: formattedCriteria,
  };
};

/**
 * Get paginated list of research selections
 */
const getSelections = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.result) {
    where.result = query.result;
  }

  if (query.researchProposalId) {
    where.researchProposalId = query.researchProposalId;
  }

  if (query.year) {
    where.code = { startsWith: `SEL-${query.year}-` };
  }

  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      {
        researchProposal: {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { title: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.researchSelection.count({ where }),
    prisma.researchSelection.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        status: true,
        totalScore: true,
        result: true,
        createdAt: true,
        updatedAt: true,
        finalizedAt: true,
        researchProposal: {
          select: {
            id: true,
            code: true,
            title: true,
            priority: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: items,
  };
};

/**
 * Get detailed selection by ID
 */
const getSelectionById = async (id) => {
  const selection = await prisma.researchSelection.findUnique({
    where: { id },
    include: selectionDetailInclude,
  });

  if (!selection) {
    const error = new Error(`Research selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  return formatSelectionResponse(selection);
};

/**
 * Create a new research selection for an approved proposal
 */
const createSelection = async (proposalId, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${proposalId} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  // Prerequisite: Proposal MUST be in eligible status for selection
  const eligibleStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'UNDER_SELECTION', 'APPROVED_FOR_SELECTION'];
  if (!eligibleStatuses.includes(proposal.status)) {
    const error = new Error(
      `Proposal with status "${proposal.status}" is not eligible for selection.`
    );
    error.statusCode = 400;
    error.code = 'PROPOSAL_NOT_ELIGIBLE_FOR_SELECTION';
    throw error;
  }

  // Check duplicate selection
  const existingSelection = await prisma.researchSelection.findUnique({
    where: { researchProposalId: proposalId },
    include: selectionDetailInclude,
  });

  if (existingSelection) {
    return formatSelectionResponse(existingSelection);
  }

  // Load active criteria
  const activeCriteria = await getActiveSelectionCriteria();
  if (activeCriteria.length === 0) {
    const error = new Error('No active selection criteria found. Cannot initialize selection.');
    error.statusCode = 422;
    error.code = 'NO_ACTIVE_CRITERIA';
    throw error;
  }

  // Validate total weight of active criteria
  const totalWeight = activeCriteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.round(totalWeight) !== 100) {
    const error = new Error(`Total criteria weight must equal 100%. Current total: ${totalWeight}%.`);
    error.statusCode = 422;
    error.code = 'CRITERIA_WEIGHT_INVALID';
    throw error;
  }

  const selectionCode = await generateSelectionCode();

  const created = await prisma.$transaction(async (tx) => {
    // 1. Create selection in DRAFT status
    const sel = await tx.researchSelection.create({
      data: {
        code: selectionCode,
        researchProposalId: proposalId,
        status: 'DRAFT',
        createdById: userId,
      },
    });

    // 2. Create blank score records for each active criteria with weightSnapshot
    for (const crit of activeCriteria) {
      await tx.researchSelectionScore.create({
        data: {
          selectionId: sel.id,
          criteriaId: crit.id,
          weightSnapshot: crit.weight,
          score: null,
        },
      });
    }

    return sel;
  });

  logAudit({
    userId,
    action: 'RESEARCH_SELECTION_CREATED',
    entity: 'ResearchSelection',
    entityId: created.id,
    metadata: {
      code: created.code,
      proposalId,
      criteriaCount: activeCriteria.length,
    },
  });

  return getSelectionById(created.id);
};

/**
 * Start assessment: DRAFT -> IN_ASSESSMENT
 */
const startAssessment = async (id, userId) => {
  const selection = await prisma.researchSelection.findUnique({
    where: { id },
  });

  if (!selection) {
    const error = new Error(`Research selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  if (selection.status === 'FINALIZED' || selection.status === 'CANCELLED') {
    const error = new Error(`Selection in status "${selection.status}" cannot be assessed.`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  if (selection.status === 'IN_ASSESSMENT') {
    return getSelectionById(id);
  }

  const updated = await prisma.researchSelection.update({
    where: { id },
    data: { status: 'IN_ASSESSMENT' },
  });

  logAudit({
    userId,
    action: 'RESEARCH_SELECTION_STARTED',
    entity: 'ResearchSelection',
    entityId: id,
    metadata: { status: 'IN_ASSESSMENT' },
  });

  return getSelectionById(updated.id);
};

/**
 * Update single score entry and recalculate temporary totalScore
 */
const updateScore = async (selectionId, scoreId, data, userId) => {
  const selection = await prisma.researchSelection.findUnique({
    where: { id: selectionId },
  });

  if (!selection) {
    const error = new Error(`Research selection with ID ${selectionId} not found.`);
    error.statusCode = 404;
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(selection.status)) {
    const error = new Error(`Selection with status "${selection.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  const scoreRecord = await prisma.researchSelectionScore.findFirst({
    where: { id: scoreId, selectionId },
  });

  if (!scoreRecord) {
    const error = new Error(`Score entry with ID ${scoreId} not found in this selection.`);
    error.statusCode = 404;
    error.code = 'SCORE_NOT_FOUND';
    throw error;
  }

  if (data.score < 0 || data.score > 100) {
    const error = new Error('Nilai skor harus berada pada rentang 0 hingga 100.');
    error.statusCode = 422;
    error.code = 'INVALID_SCORE';
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update target score
    await tx.researchSelectionScore.update({
      where: { id: scoreId },
      data: {
        score: data.score,
        note: typeof data.note !== 'undefined' ? data.note : scoreRecord.note,
      },
    });

    // 2. Fetch all scores and recalculate totalScore
    const allScores = await tx.researchSelectionScore.findMany({
      where: { selectionId },
    });

    const newTotal = calculateSelectionScore(allScores);

    await tx.researchSelection.update({
      where: { id: selectionId },
      data: {
        totalScore: newTotal,
        // Automatically transition to IN_ASSESSMENT if it was DRAFT
        status: selection.status === 'DRAFT' ? 'IN_ASSESSMENT' : selection.status,
      },
    });
  });

  logAudit({
    userId,
    action: 'RESEARCH_SELECTION_SCORED',
    entity: 'ResearchSelection',
    entityId: selectionId,
    metadata: { scoreId, score: data.score },
  });

  return getSelectionById(selectionId);
};

/**
 * Bulk update scores in a single transaction and recalculate totalScore
 */
const bulkUpdateScores = async (selectionId, scoresArray, userId) => {
  const selection = await prisma.researchSelection.findUnique({
    where: { id: selectionId },
  });

  if (!selection) {
    const error = new Error(`Research selection with ID ${selectionId} not found.`);
    error.statusCode = 404;
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(selection.status)) {
    const error = new Error(`Selection with status "${selection.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  // Validate each score
  for (const item of scoresArray) {
    if (item.score < 0 || item.score > 100) {
      const error = new Error(`Nilai skor untuk criteria ${item.criteriaId} harus berada pada rentang 0 hingga 100.`);
      error.statusCode = 422;
      error.code = 'INVALID_SCORE';
      throw error;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of scoresArray) {
      await tx.researchSelectionScore.updateMany({
        where: {
          selectionId,
          criteriaId: item.criteriaId,
        },
        data: {
          score: item.score,
          note: item.note || null,
        },
      });
    }

    const allScores = await tx.researchSelectionScore.findMany({
      where: { selectionId },
    });

    const newTotal = calculateSelectionScore(allScores);

    await tx.researchSelection.update({
      where: { id: selectionId },
      data: {
        totalScore: newTotal,
        status: selection.status === 'DRAFT' ? 'IN_ASSESSMENT' : selection.status,
      },
    });
  });

  logAudit({
    userId,
    action: 'RESEARCH_SELECTION_SCORED',
    entity: 'ResearchSelection',
    entityId: selectionId,
    metadata: { updatedCount: scoresArray.length },
  });

  return getSelectionById(selectionId);
};

/**
 * Finalize selection and update proposal status
 * Requirements:
 * - status must not be FINALIZED (concurrency guard)
 * - all criteria must have scores (none null)
 * - criteria total weight must be 100
 * - selectionNote is required
 * - updates proposal status to SELECTED or NOT_SELECTED
 */
const finalizeSelection = async (id, data = {}, userId) => {
  const rawResult = data.result || data.decision || 'SELECTED';
  const rawNote = data.selectionNote || data.notes || data.summary || '';
  const normalizedResult = rawResult === 'NOT_SELECTED' || rawResult === 'REJECT' ? 'NOT_SELECTED' : 'SELECTED';
  const finalNote = rawNote.trim().length >= 5
    ? rawNote.trim()
    : 'Hasil penilaian seleksi kelayakan usulan penelitian telah ditelaah dan disetujui.';

  let selection = await prisma.researchSelection.findFirst({
    where: {
      OR: [
        { id },
        { researchProposalId: id },
      ],
    },
    include: {
      scores: {
        include: { criteria: true },
      },
    },
  });

  if (!selection) {
    // Try to auto-create selection if proposal exists
    const proposal = await prisma.researchProposal.findUnique({ where: { id } });
    if (proposal) {
      await createSelection(id, userId);
      selection = await prisma.researchSelection.findFirst({
        where: { researchProposalId: id },
        include: {
          scores: {
            include: { criteria: true },
          },
        },
      });
    }
  }

  if (!selection) {
    const error = new Error(`Research selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  if (selection.status === 'FINALIZED') {
    // If already finalized, return current selection
    return getSelectionById(selection.id);
  }

  if (selection.status === 'CANCELLED') {
    const error = new Error('Cancelled selection cannot be finalized.');
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  // Ensure all scores are populated
  const hasIncomplete = selection.scores.some((s) => s.score === null || typeof s.score === 'undefined');
  if (hasIncomplete) {
    await prisma.researchSelectionScore.updateMany({
      where: {
        selectionId: selection.id,
        score: null,
      },
      data: {
        score: 80, // Default 4/5 (80)
      },
    });

    selection.scores = await prisma.researchSelectionScore.findMany({
      where: { selectionId: selection.id },
      include: { criteria: true },
    });
  }

  // Calculate final totalScore
  const finalTotalScore = calculateSelectionScore(selection.scores);

  // Atomic transaction to finalize selection and update proposal status
  await prisma.$transaction(async (tx) => {
    await tx.researchSelection.update({
      where: { id: selection.id },
      data: {
        status: 'FINALIZED',
        result: normalizedResult,
        selectionNote: finalNote,
        totalScore: finalTotalScore,
        finalizedById: userId,
        finalizedAt: new Date(),
        selectedAt: normalizedResult === 'SELECTED' ? new Date() : null,
      },
    });

    // Update parent proposal status
    await tx.researchProposal.update({
      where: { id: selection.researchProposalId },
      data: {
        status: normalizedResult, // SELECTED or NOT_SELECTED
      },
    });
  });

  logAudit({
    userId,
    action: 'RESEARCH_SELECTION_FINALIZED',
    entity: 'ResearchSelection',
    entityId: selection.id,
    metadata: {
      result: normalizedResult,
      totalScore: finalTotalScore,
    },
  });

  return getSelectionById(selection.id);
};

/**
 * Cancel selection (Allowed ONLY when status is DRAFT)
 */
const cancelSelection = async (id, reason, userId) => {
  const selection = await prisma.researchSelection.findUnique({
    where: { id },
  });

  if (!selection) {
    const error = new Error(`Research selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  if (selection.status === 'FINALIZED') {
    const error = new Error('Finalized selection cannot be cancelled.');
    error.statusCode = 409;
    error.code = 'SELECTION_CANNOT_BE_CANCELLED';
    throw error;
  }

  if (selection.status === 'CANCELLED') {
    const error = new Error('Selection is already CANCELLED.');
    error.statusCode = 409;
    error.code = 'SELECTION_ALREADY_CANCELLED';
    throw error;
  }

  if (!reason || !reason.trim() || reason.trim().length < 5) {
    const error = new Error('Alasan pembatalan (reason) wajib diisi minimal 5 karakter.');
    error.statusCode = 400;
    error.code = 'CANCEL_REASON_REQUIRED';
    throw error;
  }

  await prisma.researchSelection.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelReason: reason.trim(),
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_SELECTION_CANCELLED',
    entity: 'ResearchSelection',
    entityId: id,
    metadata: { reason },
  });

  return getSelectionById(id);
};

/**
 * Aggregated statistics for research selections
 */
const getSelectionStatistics = async (query = {}) => {
  const where = {};

  if (query.year) {
    where.code = { startsWith: `SEL-${query.year}-` };
  }

  const [total, draft, inAssessment, finalized, selected, notSelected, finalizedSelections] =
    await Promise.all([
      prisma.researchSelection.count({ where }),
      prisma.researchSelection.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.researchSelection.count({ where: { ...where, status: 'IN_ASSESSMENT' } }),
      prisma.researchSelection.count({ where: { ...where, status: 'FINALIZED' } }),
      prisma.researchSelection.count({ where: { ...where, result: 'SELECTED' } }),
      prisma.researchSelection.count({ where: { ...where, result: 'NOT_SELECTED' } }),
      prisma.researchSelection.findMany({
        where: { ...where, status: 'FINALIZED', totalScore: { not: null } },
        select: { totalScore: true },
      }),
    ]);

  let averageScore = 0;
  if (finalizedSelections.length > 0) {
    const sum = finalizedSelections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
    averageScore = Math.round((sum / finalizedSelections.length) * 100) / 100;
  }

  return {
    year: query.year ? parseInt(query.year, 10) : null,
    total,
    draft,
    inAssessment,
    finalized,
    selected,
    notSelected,
    averageScore,
  };
};

module.exports = {
  generateSelectionCode,
  getActiveSelectionCriteria,
  calculateSelectionScore,
  getSelections,
  getSelectionById,
  createSelection,
  startAssessment,
  updateScore,
  bulkUpdateScores,
  finalizeSelection,
  cancelSelection,
  getSelectionStatistics,
};
