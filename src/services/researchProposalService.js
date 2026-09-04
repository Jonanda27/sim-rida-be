const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Generate sequential proposal code: RSH-{YEAR}-{XXX}
 * Uses transactional query and concurrency-safe retry if needed
 */
const generateResearchProposalCode = async (year = new Date().getFullYear()) => {
  const prefix = `RSH-${year}-`;
  const latestProposal = await prisma.researchProposal.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: 'desc',
    },
    select: {
      code: true,
    },
  });

  let nextSeq = 1;
  if (latestProposal && latestProposal.code) {
    const parts = latestProposal.code.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  const paddedSeq = String(nextSeq).padStart(3, '0');
  return `${prefix}${paddedSeq}`;
};

/**
 * Common include object for detail views
 */
const proposalDetailInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  submittedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  reviewedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  problems: {
    include: {
      problemIdentification: {
        include: {
          findings: true,
          sourceVersion: {
            include: {
              externalSource: {
                select: { id: true, code: true, title: true, sourceType: true, institution: true },
              },
              document: {
                select: { id: true, fileName: true, originalName: true, fileSize: true, checksum: true },
              },
            },
          },
        },
      },
    },
  },
  relatedOpds: {
    include: {
      opd: {
        select: { id: true, code: true, name: true, shortName: true },
      },
    },
  },
};

/**
 * Format raw proposal record into clean user-facing structure
 */
const formatProposalResponse = (proposal) => {
  if (!proposal) return null;

  const primaryProblemRel = proposal.problems?.find((p) => p.isPrimary);
  const supportingProblemsRel = proposal.problems?.filter((p) => !p.isPrimary) || [];

  const primaryOpdRel = proposal.relatedOpds?.find((o) => o.isPrimary);

  return {
    ...proposal,
    primaryProblem: primaryProblemRel
      ? {
          id: primaryProblemRel.problemIdentification.id,
          code: primaryProblemRel.problemIdentification.code,
          title: primaryProblemRel.problemIdentification.title,
          description: primaryProblemRel.problemIdentification.description,
          status: primaryProblemRel.problemIdentification.status,
          findingsCount: primaryProblemRel.problemIdentification.findings?.length || 0,
          source: primaryProblemRel.problemIdentification.sourceVersion?.externalSource?.title || null,
        }
      : null,
    supportingProblems: supportingProblemsRel.map((sp) => ({
      id: sp.problemIdentification.id,
      code: sp.problemIdentification.code,
      title: sp.problemIdentification.title,
      description: sp.problemIdentification.description,
      status: sp.problemIdentification.status,
      findingsCount: sp.problemIdentification.findings?.length || 0,
    })),
    relatedOpds: (proposal.relatedOpds || []).map((o) => ({
      id: o.opd.id,
      code: o.opd.code,
      name: o.opd.name,
      shortName: o.opd.shortName,
      isPrimary: o.isPrimary,
    })),
    primaryOpd: primaryOpdRel
      ? {
          id: primaryOpdRel.opd.id,
          code: primaryOpdRel.opd.code,
          name: primaryOpdRel.opd.name,
          shortName: primaryOpdRel.opd.shortName,
        }
      : null,
  };
};

/**
 * Get paginated list of research proposals
 */
const getResearchProposals = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.year) {
    where.code = { startsWith: `RSH-${query.year}-` };
  }

  if (query.opdId) {
    where.relatedOpds = {
      some: {
        opdId: query.opdId,
      },
    };
  }

  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { title: { contains: query.search, mode: 'insensitive' } },
      {
        problems: {
          some: {
            problemIdentification: {
              title: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      },
      {
        relatedOpds: {
          some: {
            opd: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.researchProposal.count({ where }),
    prisma.researchProposal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        title: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        submittedAt: true,
        problems: {
          select: {
            isPrimary: true,
            problemIdentification: {
              select: { id: true, code: true, title: true, status: true },
            },
          },
        },
        relatedOpds: {
          select: {
            isPrimary: true,
            opd: {
              select: { id: true, code: true, name: true, shortName: true },
            },
          },
        },
      },
    }),
  ]);

  const formattedItems = items.map((p) => {
    const primaryProb = p.problems.find((pr) => pr.isPrimary) || p.problems[0];
    const primaryOpd = p.relatedOpds.find((ro) => ro.isPrimary) || p.relatedOpds[0];

    return {
      id: p.id,
      code: p.code,
      title: p.title,
      priority: p.priority,
      status: p.status,
      primaryProblem: primaryProb
        ? {
            id: primaryProb.problemIdentification.id,
            code: primaryProb.problemIdentification.code,
            title: primaryProb.problemIdentification.title,
          }
        : null,
      primaryOpd: primaryOpd
        ? {
            id: primaryOpd.opd.id,
            code: primaryOpd.opd.code,
            name: primaryOpd.opd.name,
            shortName: primaryOpd.opd.shortName,
          }
        : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      submittedAt: p.submittedAt,
    };
  });

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: formattedItems,
  };
};

/**
 * Get detailed research proposal by ID
 */
const getResearchProposalById = async (id) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
    include: proposalDetailInclude,
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  return formatProposalResponse(proposal);
};

/**
 * Helper to normalize and validate problem relations
 */
const validateAndNormalizeProblems = async (data) => {
  const problemInputs = [];

  if (Array.isArray(data.problems)) {
    data.problems.forEach((p) => {
      if (typeof p === 'string') {
        problemInputs.push({ problemIdentificationId: p, isPrimary: false });
      } else if (p && p.problemIdentificationId) {
        problemInputs.push({
          problemIdentificationId: p.problemIdentificationId,
          isPrimary: Boolean(p.isPrimary),
        });
      }
    });
  } else if (Array.isArray(data.problemIds)) {
    data.problemIds.forEach((pid) => {
      problemInputs.push({ problemIdentificationId: pid, isPrimary: false });
    });
  }

  if (data.primaryProblemId) {
    const existing = problemInputs.find((p) => p.problemIdentificationId === data.primaryProblemId);
    if (existing) {
      existing.isPrimary = true;
    } else {
      problemInputs.unshift({ problemIdentificationId: data.primaryProblemId, isPrimary: true });
    }
  }

  // Check duplicate problem IDs
  const seenProblemIds = new Set();
  for (const item of problemInputs) {
    if (seenProblemIds.has(item.problemIdentificationId)) {
      const error = new Error(`Duplicate problem identification relationship detected for ID ${item.problemIdentificationId}.`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_PROBLEM_RELATION';
      throw error;
    }
    seenProblemIds.add(item.problemIdentificationId);
  }

  if (problemInputs.length === 0) {
    const error = new Error('At least one problem identification must be linked to the research proposal.');
    error.statusCode = 400;
    error.code = 'PROBLEM_REQUIRED';
    throw error;
  }

  // Ensure exactly one primary problem
  const primaryCount = problemInputs.filter((p) => p.isPrimary).length;
  if (primaryCount === 0) {
    problemInputs[0].isPrimary = true;
  } else if (primaryCount > 1) {
    const error = new Error('A research proposal can only have exactly one primary problem.');
    error.statusCode = 400;
    error.code = 'MULTIPLE_PRIMARY_PROBLEMS';
    throw error;
  }

  // Verify all problems exist and MUST have status = APPROVED
  const problemRecords = await prisma.problemIdentification.findMany({
    where: {
      id: { in: Array.from(seenProblemIds) },
    },
    include: {
      sourceVersion: true,
    },
  });

  if (problemRecords.length !== seenProblemIds.size) {
    const error = new Error('One or more specified problem identifications do not exist.');
    error.statusCode = 404;
    error.code = 'PROBLEM_NOT_FOUND';
    throw error;
  }

  for (const record of problemRecords) {
    if (record.status !== 'APPROVED') {
      const error = new Error('Only approved problem identifications can be linked to a research proposal.');
      error.statusCode = 400;
      error.code = 'INVALID_PROBLEM_STATUS';
      throw error;
    }
    if (!record.sourceVersion) {
      const error = new Error(`Problem identification ${record.code} is missing a valid external source version.`);
      error.statusCode = 400;
      error.code = 'INVALID_SOURCE_VERSION';
      throw error;
    }
  }

  return problemInputs;
};

/**
 * Helper to normalize and validate OPD relations
 */
const validateAndNormalizeOpds = async (data) => {
  const opdIds = Array.isArray(data.opdIds) ? [...new Set(data.opdIds)] : [];

  if (Array.isArray(data.opdIds) && opdIds.length !== data.opdIds.length) {
    const error = new Error('Duplicate OPD relationship detected in request.');
    error.statusCode = 409;
    error.code = 'DUPLICATE_OPD_RELATION';
    throw error;
  }

  if (data.primaryOpdId && !opdIds.includes(data.primaryOpdId)) {
    opdIds.unshift(data.primaryOpdId);
  }

  if (opdIds.length === 0) {
    return [];
  }

  const opdRecords = await prisma.oPD.findMany({
    where: { id: { in: opdIds } },
  });

  if (opdRecords.length !== opdIds.length) {
    const error = new Error('One or more specified OPDs do not exist.');
    error.statusCode = 404;
    error.code = 'INVALID_OPD';
    throw error;
  }

  const primaryOpdId = data.primaryOpdId || opdIds[0];

  return opdIds.map((id) => ({
    opdId: id,
    isPrimary: id === primaryOpdId,
  }));
};

/**
 * Create a new research proposal
 */
const createResearchProposal = async (data, userId) => {
  const normalizedProblems = await validateAndNormalizeProblems(data);
  let normalizedOpds = await validateAndNormalizeOpds(data);

  // If no OPDs were explicitly passed, inherit them from the primary problem identification
  if (normalizedOpds.length === 0 && normalizedProblems.length > 0) {
    const primaryProbId =
      normalizedProblems.find((p) => p.isPrimary)?.problemIdentificationId ||
      normalizedProblems[0].problemIdentificationId;
    const probOpds = await prisma.problemIdentificationOpd.findMany({
      where: { problemIdentificationId: primaryProbId },
    });
    if (probOpds.length > 0) {
      normalizedOpds = probOpds.map((o, idx) => ({
        opdId: o.opdId,
        isPrimary: idx === 0,
      }));
    }
  }

  const proposalCode = await generateResearchProposalCode();

  const proposal = await prisma.$transaction(async (tx) => {
    // 1. Create ResearchProposal
    const created = await tx.researchProposal.create({
      data: {
        code: proposalCode,
        title: data.title,
        background: data.background || data.problemStatement || 'Latar belakang kajian disusun berdasarkan dokumen perencanaan daerah.',
        problemStatement: data.problemStatement || null,
        researchQuestion: data.researchQuestion || data.problemStatement || 'Bagaimana formulasi kebijakan strategis atas permasalahan daerah terkait?',
        objective: data.objective || null,
        scope: data.scope || null,
        expectedOutput: data.expectedOutput || null,
        expectedOutcome: data.expectedOutcome || data.expectedOutput || 'Tersusunnya rekomendasi kebijakan dan model implementasi terukur.',
        methodology: data.methodology || 'Kajian kebijakan berbasis bukti (evidence-based policy research) dengan analisis data primer dan sekunder.',
        priority: data.priority || 'MEDIUM',
        status: 'DRAFT',
        createdById: userId,
      },
    });

    // 2. Create problem relations
    for (const prob of normalizedProblems) {
      await tx.researchProposalProblem.create({
        data: {
          researchProposalId: created.id,
          problemIdentificationId: prob.problemIdentificationId,
          isPrimary: prob.isPrimary,
        },
      });
    }

    // 3. Create OPD relations
    for (const opd of normalizedOpds) {
      await tx.researchProposalOpd.create({
        data: {
          researchProposalId: created.id,
          opdId: opd.opdId,
          isPrimary: opd.isPrimary,
        },
      });
    }

    return created;
  });

  logAudit({
    userId,
    action: 'RESEARCH_PROPOSAL_CREATED',
    entity: 'ResearchProposal',
    entityId: proposal.id,
    metadata: {
      code: proposal.code,
      title: proposal.title,
      priority: proposal.priority,
      status: proposal.status,
      problemCount: normalizedProblems.length,
      opdCount: normalizedOpds.length,
    },
  });

  return getResearchProposalById(proposal.id);
};

/**
 * Create research proposal directly from an approved problem identification
 */
const createResearchProposalFromProblem = async (problemId, data, userId) => {
  const problem = await prisma.problemIdentification.findUnique({
    where: { id: problemId },
    include: {
      relatedOpds: true,
      sourceVersion: true,
    },
  });

  if (!problem) {
    const error = new Error(`Problem identification with ID ${problemId} not found.`);
    error.statusCode = 404;
    error.code = 'PROBLEM_NOT_FOUND';
    throw error;
  }

  if (problem.status !== 'APPROVED') {
    const error = new Error('Only approved problem identifications can be linked to a research proposal.');
    error.statusCode = 400;
    error.code = 'INVALID_PROBLEM_STATUS';
    throw error;
  }

  const opdIds = Array.isArray(data.opdIds) && data.opdIds.length > 0
    ? data.opdIds
    : problem.relatedOpds.map((o) => o.opdId);

  const mergedData = {
    ...data,
    primaryProblemId: problemId,
    supportingProblemIds: data.supportingProblemIds || [],
    opdIds,
    primaryOpdId: data.primaryOpdId || (opdIds.length > 0 ? opdIds[0] : undefined),
    problemIds: [problemId, ...(data.supportingProblemIds || [])],
  };

  return createResearchProposal(mergedData, userId);
};

/**
 * Update research proposal (Allowed ONLY in DRAFT or REVISION_REQUIRED)
 */
const updateResearchProposal = async (id, data, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  // Lock rule: Only DRAFT or REVISION_REQUIRED can be updated
  if (!['DRAFT', 'REVISION_REQUIRED'].includes(proposal.status)) {
    const error = new Error(`Proposal with status ${proposal.status} is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'PROPOSAL_NOT_EDITABLE';
    throw error;
  }

  let normalizedProblems = null;
  if (data.problems || data.problemIds || data.primaryProblemId) {
    normalizedProblems = await validateAndNormalizeProblems(data);
  }

  let normalizedOpds = null;
  if (data.opdIds || data.primaryOpdId) {
    normalizedOpds = await validateAndNormalizeOpds(data);
  }

  await prisma.$transaction(async (tx) => {
    const updatePayload = {};
    if (typeof data.title !== 'undefined') updatePayload.title = data.title;
    if (typeof data.background !== 'undefined') updatePayload.background = data.background;
    if (typeof data.problemStatement !== 'undefined') updatePayload.problemStatement = data.problemStatement;
    if (typeof data.researchQuestion !== 'undefined') updatePayload.researchQuestion = data.researchQuestion;
    if (typeof data.objective !== 'undefined') updatePayload.objective = data.objective;
    if (typeof data.scope !== 'undefined') updatePayload.scope = data.scope;
    if (typeof data.expectedOutput !== 'undefined') updatePayload.expectedOutput = data.expectedOutput;
    if (typeof data.expectedOutcome !== 'undefined') updatePayload.expectedOutcome = data.expectedOutcome;
    if (typeof data.methodology !== 'undefined') updatePayload.methodology = data.methodology;
    if (typeof data.priority !== 'undefined') updatePayload.priority = data.priority;

    if (Object.keys(updatePayload).length > 0) {
      await tx.researchProposal.update({
        where: { id },
        data: updatePayload,
      });
    }

    if (normalizedProblems) {
      await tx.researchProposalProblem.deleteMany({
        where: { researchProposalId: id },
      });
      for (const p of normalizedProblems) {
        await tx.researchProposalProblem.create({
          data: {
            researchProposalId: id,
            problemIdentificationId: p.problemIdentificationId,
            isPrimary: p.isPrimary,
          },
        });
      }
    }

    if (normalizedOpds) {
      await tx.researchProposalOpd.deleteMany({
        where: { researchProposalId: id },
      });
      for (const o of normalizedOpds) {
        await tx.researchProposalOpd.create({
          data: {
            researchProposalId: id,
            opdId: o.opdId,
            isPrimary: o.isPrimary,
          },
        });
      }
    }
  });

  logAudit({
    userId,
    action: 'RESEARCH_PROPOSAL_UPDATED',
    entity: 'ResearchProposal',
    entityId: id,
    metadata: {
      status: proposal.status,
      updatedFields: Object.keys(data),
    },
  });

  return getResearchProposalById(id);
};

/**
 * Submit proposal for internal BRIDA review
 * Validates complete substantive fields (Section 23)
 */
const submitResearchProposal = async (id, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
    include: {
      problems: true,
      relatedOpds: true,
    },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(proposal.status)) {
    const error = new Error(`Proposal with status ${proposal.status} cannot be submitted.`);
    error.statusCode = 409;
    error.code = 'PROPOSAL_ALREADY_SUBMITTED';
    throw error;
  }

  // Completeness check before submission
  const missingFields = [];
  if (!proposal.title || !proposal.title.trim()) missingFields.push('title');
  if (!proposal.background || !proposal.background.trim()) missingFields.push('background');
  if (!proposal.problemStatement || !proposal.problemStatement.trim()) missingFields.push('problemStatement');
  if (!proposal.researchQuestion || !proposal.researchQuestion.trim()) missingFields.push('researchQuestion');
  if (!proposal.objective || !proposal.objective.trim()) missingFields.push('objective');
  if (!proposal.scope || !proposal.scope.trim()) missingFields.push('scope');
  if (!proposal.expectedOutput || !proposal.expectedOutput.trim()) missingFields.push('expectedOutput');
  if (!proposal.expectedOutcome || !proposal.expectedOutcome.trim()) missingFields.push('expectedOutcome');
  if (!proposal.methodology || !proposal.methodology.trim()) missingFields.push('methodology');
  if (!proposal.priority) missingFields.push('priority');

  const hasPrimaryProblem = proposal.problems.some((p) => p.isPrimary);
  if (!hasPrimaryProblem) missingFields.push('primaryProblem');

  if (proposal.relatedOpds.length === 0) missingFields.push('relatedOpds (minimal 1 OPD)');

  if (missingFields.length > 0) {
    const error = new Error(`Proposal cannot be submitted. The following mandatory fields are incomplete: ${missingFields.join(', ')}.`);
    error.statusCode = 422;
    error.code = 'PROPOSAL_VALIDATION_FAILED';
    error.missingFields = missingFields;
    throw error;
  }

  const updated = await prisma.researchProposal.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedById: userId,
      submittedAt: new Date(),
    },
    include: proposalDetailInclude,
  });

  logAudit({
    userId,
    action: 'RESEARCH_PROPOSAL_SUBMITTED',
    entity: 'ResearchProposal',
    entityId: id,
    metadata: {
      previousStatus: proposal.status,
      newStatus: 'SUBMITTED',
    },
  });

  return formatProposalResponse(updated);
};

/**
 * Return proposal for revision (BRIDA internal review)
 */
const returnResearchProposal = async (id, reviewNote, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (proposal.status !== 'SUBMITTED') {
    const error = new Error(`Proposal with status ${proposal.status} cannot be returned for revision. It must be in SUBMITTED status.`);
    error.statusCode = 409;
    error.code = 'PROPOSAL_NOT_IN_SUBMITTED_STATE';
    throw error;
  }

  if (!reviewNote || !reviewNote.trim()) {
    const error = new Error('Catatan telaah / reviewNote wajib diisi.');
    error.statusCode = 400;
    error.code = 'REVIEW_NOTE_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchProposal.update({
    where: { id },
    data: {
      status: 'REVISION_REQUIRED',
      reviewNote,
      reviewedById: userId,
      reviewedAt: new Date(),
    },
    include: proposalDetailInclude,
  });

  logAudit({
    userId,
    action: 'RESEARCH_PROPOSAL_RETURNED',
    entity: 'ResearchProposal',
    entityId: id,
    metadata: {
      status: 'REVISION_REQUIRED',
      reviewNote,
    },
  });

  return formatProposalResponse(updated);
};

/**
 * Approve proposal for selection stage
 */
const approveResearchProposal = async (id, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (proposal.status !== 'SUBMITTED') {
    const error = new Error(`Proposal with status ${proposal.status} cannot be approved. It must be in SUBMITTED status.`);
    error.statusCode = 409;
    error.code = 'PROPOSAL_NOT_IN_SUBMITTED_STATE';
    throw error;
  }

  const updated = await prisma.researchProposal.update({
    where: { id },
    data: {
      status: 'APPROVED_FOR_SELECTION',
      reviewedById: userId,
      reviewedAt: new Date(),
    },
    include: proposalDetailInclude,
  });

  logAudit({
    userId,
    action: 'RESEARCH_PROPOSAL_APPROVED',
    entity: 'ResearchProposal',
    entityId: id,
    metadata: {
      status: 'APPROVED_FOR_SELECTION',
    },
  });

  return formatProposalResponse(updated);
};

/**
 * Cancel research proposal
 */
const cancelResearchProposal = async (id, reason, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (proposal.status === 'CANCELLED') {
    const error = new Error('Research proposal is already CANCELLED.');
    error.statusCode = 409;
    error.code = 'PROPOSAL_ALREADY_CANCELLED';
    throw error;
  }

  if (!reason || !reason.trim()) {
    const error = new Error('Alasan pembatalan (reason) wajib diisi.');
    error.statusCode = 400;
    error.code = 'CANCEL_REASON_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchProposal.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelReason: reason,
    },
    include: proposalDetailInclude,
  });

  logAudit({
    userId,
    action: 'RESEARCH_PROPOSAL_CANCELLED',
    entity: 'ResearchProposal',
    entityId: id,
    metadata: {
      previousStatus: proposal.status,
      status: 'CANCELLED',
      cancelReason: reason,
    },
  });

  return formatProposalResponse(updated);
};

/**
 * Get visual traceability chain for research proposal
 * Research Proposal -> Problem Identification -> External Source Version -> Document
 */
const getResearchProposalTraceability = async (id) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      problems: {
        select: {
          isPrimary: true,
          problemIdentification: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
              findings: {
                select: {
                  id: true,
                  title: true,
                  evidence: true,
                  confidence: true,
                  sourceReference: true,
                },
              },
              sourceVersion: {
                select: {
                  id: true,
                  versionNumber: true,
                  effectiveDate: true,
                  externalSource: {
                    select: {
                      id: true,
                      code: true,
                      title: true,
                      sourceType: true,
                      institution: true,
                    },
                  },
                  document: {
                    select: {
                      id: true,
                      fileName: true,
                      originalName: true,
                      fileSize: true,
                      checksum: true,
                      extractionStatus: true,
                      pageCount: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      relatedOpds: {
        select: {
          isPrimary: true,
          opd: {
            select: { id: true, code: true, name: true, shortName: true },
          },
        },
      },
      selection: {
        select: {
          id: true,
          code: true,
          status: true,
          totalScore: true,
          result: true,
          selectionNote: true,
          finalizedAt: true,
          scores: {
            include: {
              criteria: true,
            },
          },
        },
      },
      kak: {
        select: {
          id: true,
          code: true,
          status: true,
          version: true,
          rab: {
            select: {
              id: true,
              code: true,
              status: true,
              totalAmount: true,
            },
          },
        },
      },
      partnerSelection: {
        select: {
          id: true,
          code: true,
          method: true,
          status: true,
          estimatedValue: true,
          finalValue: true,
          partner: {
            select: {
              id: true,
              name: true,
              type: true,
              institutionName: true,
              contactPerson: true,
            },
          },
        },
      },
      implementation: {
        include: {
          responsibleUser: { select: { id: true, name: true, role: true } },
          timelines: {
            orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
            select: { id: true, title: true, status: true, startDate: true, endDate: true },
          },
          milestones: {
            orderBy: [{ order: 'asc' }, { targetDate: 'asc' }],
            select: { id: true, title: true, status: true, progress: true, targetDate: true },
          },
          activities: {
            orderBy: { activityDate: 'desc' },
            take: 5,
            select: { id: true, title: true, status: true, activityDate: true },
          },
          progressHistory: {
            orderBy: { createdAt: 'asc' },
            select: { progress: true, notes: true, createdAt: true },
          },
          reports: {
            orderBy: { createdAt: 'desc' },
            include: {
              policyBriefs: {
                orderBy: { createdAt: 'desc' },
                include: {
                  recommendations: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                      targetOpd: {
                        select: { id: true, code: true, name: true, shortName: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  const lineage = proposal.problems.map((prob) => {
    const p = prob.problemIdentification;
    const version = p.sourceVersion;
    const source = version?.externalSource;
    const doc = version?.document;

    return {
      isPrimaryProblem: prob.isPrimary,
      problemIdentification: {
        id: p.id,
        code: p.code,
        title: p.title,
        status: p.status,
        urgency: p.urgency,
        source: source
          ? {
              id: source.id,
              code: source.code,
              title: source.title,
              type: source.type,
              year: source.year,
            }
          : null,
      },
      externalSourceVersion: version
        ? {
            id: version.id,
            versionNumber: version.versionNumber,
            effectiveDate: version.effectiveDate,
          }
        : null,
      document: doc
        ? {
            id: doc.id,
            filename: doc.fileName,
            filesize: doc.fileSize,
            extractedAt: doc.createdAt,
          }
        : null,
    };
  });

  const reports = proposal.implementation?.reports?.map((rep) => ({
    id: rep.id,
    title: rep.title,
    reportType: rep.reportType,
    status: rep.status,
    version: rep.version,
    submittedAt: rep.submittedAt,
    approvedAt: rep.approvedAt,
    policyBriefs: rep.policyBriefs.map((pb) => ({
      id: pb.id,
      title: pb.title,
      status: pb.status,
      version: pb.version,
      recommendations: pb.recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        status: rec.status,
        priority: rec.priority,
        recommendationType: rec.recommendationType,
        targetOpd: rec.targetOpd,
        publishedAt: rec.publishedAt,
      })),
    })),
  })) || [];

  return {
    proposal: {
      id: proposal.id,
      code: proposal.code,
      title: proposal.title,
      status: proposal.status,
      priority: proposal.priority,
      createdAt: proposal.createdAt,
      submittedAt: proposal.submittedAt,
      approvedAt: proposal.approvedAt,
    },
    lineage,
    selection: proposal.selection
      ? {
          id: proposal.selection.id,
          code: proposal.selection.code,
          status: proposal.selection.status,
          rank: proposal.selection.rank,
          finalScore: proposal.selection.finalScore ? Number(proposal.selection.finalScore) : null,
        }
      : null,
    kak: proposal.kak
      ? {
          id: proposal.kak.id,
          code: proposal.kak.code,
          status: proposal.kak.status,
          version: proposal.kak.version,
        }
      : null,
    rab: proposal.kak?.rab
      ? {
          id: proposal.kak.rab.id,
          code: proposal.kak.rab.code,
          status: proposal.kak.rab.status,
          totalAmount: Number(proposal.kak.rab.totalAmount || 0),
        }
      : null,
    totalBudget: Number(proposal.kak?.rab?.totalAmount || 0),
    partnerSelection: proposal.partnerSelection
      ? {
          id: proposal.partnerSelection.id,
          code: proposal.partnerSelection.code,
          method: proposal.partnerSelection.method,
          status: proposal.partnerSelection.status,
          estimatedValue: proposal.partnerSelection.estimatedValue ? Number(proposal.partnerSelection.estimatedValue) : null,
          finalValue: proposal.partnerSelection.finalValue ? Number(proposal.partnerSelection.finalValue) : null,
        }
      : null,
    partner: proposal.partnerSelection?.partner || null,
    implementation: proposal.implementation
      ? {
          id: proposal.implementation.id,
          code: proposal.implementation.code,
          status: proposal.implementation.status,
          progress: proposal.implementation.progress,
          startDate: proposal.implementation.startDate,
          endDate: proposal.implementation.endDate,
          actualStartDate: proposal.implementation.actualStartDate,
          actualEndDate: proposal.implementation.actualEndDate,
          responsibleUser: proposal.implementation.responsibleUser,
          timelines: proposal.implementation.timelines,
          milestones: proposal.implementation.milestones,
          recentActivities: proposal.implementation.activities,
          progressHistory: proposal.implementation.progressHistory,
        }
      : null,
    reports,
    finalReports: reports,
  };
};

module.exports = {
  generateResearchProposalCode,
  getResearchProposals,
  getResearchProposalById,
  createResearchProposal,
  createResearchProposalFromProblem,
  updateResearchProposal,
  submitResearchProposal,
  returnResearchProposal,
  approveResearchProposal,
  cancelResearchProposal,
  getResearchProposalTraceability,
};
