const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Common include pattern for problem identification
 */
const problemIdentificationInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  reviewedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  opd: {
    select: { id: true, code: true, name: true, shortName: true },
  },
  sourceVersion: {
    include: {
      externalSource: {
        select: {
          id: true,
          code: true,
          title: true,
          sourceType: true,
          institution: true,
          status: true,
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
  findings: true,
  relatedOpds: {
    include: {
      opd: {
        select: {
          id: true,
          code: true,
          name: true,
          shortName: true,
        },
      },
    },
  },
  researchProposalProblems: {
    include: {
      researchProposal: {
        select: { id: true, code: true, title: true, status: true },
      },
    },
  },
};

/**
 * Generate sequential problem identification code: PRI-YYYY-XXX
 */
const generateProblemIdentificationCode = async (year = new Date().getFullYear()) => {
  const prefix = `PRI-${year}-`;
  const latest = await prisma.problemIdentification.findFirst({
    where: {
      code: { startsWith: prefix },
    },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  if (!latest) {
    return `${prefix}001`;
  }

  const sequence = parseInt(latest.code.replace(prefix, ''), 10) + 1;
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

/**
 * Normalize priority string to ProposalPriority enum
 */
const normalizePriority = (val) => {
  if (!val) return 'MEDIUM';
  const u = String(val).toUpperCase();
  if (u === 'TINGGI' || u === 'HIGH') return 'HIGH';
  if (u === 'RENDAH' || u === 'LOW') return 'LOW';
  if (u === 'STRATEGIS' || u === 'STRATEGIC') return 'STRATEGIC';
  return 'MEDIUM';
};

/**
 * Normalize status string to ProblemIdentificationStatus enum
 */
const normalizeStatus = (val) => {
  if (!val) return 'DRAFT';
  const u = String(val).toUpperCase();
  if (u === 'DITETAPKAN' || u === 'APPROVED' || u === 'VALIDATED') return 'APPROVED';
  if (u === 'DITOLAK' || u === 'REJECTED') return 'REJECTED';
  if (u === 'DIANALISIS' || u === 'UNDER_REVIEW' || u === 'IN_REVIEW') return 'UNDER_REVIEW';
  return 'DRAFT';
};

/**
 * Create a new Problem Identification manually by BRIDA (MVP Tanpa AI)
 */
const createProblemIdentification = async (data, userId) => {
  const year = data.year ? parseInt(data.year, 10) : new Date().getFullYear();
  const code = data.code || (await generateProblemIdentificationCode(year));

  // Resolve OPD
  let resolvedOpdId = data.opdId || null;
  if (!resolvedOpdId && (data.opd || data.opdName)) {
    const targetName = data.opd || data.opdName;
    const foundOpd = await prisma.oPD.findFirst({
      where: {
        OR: [
          { id: targetName },
          { code: targetName },
          { name: { contains: targetName, mode: 'insensitive' } },
          { shortName: { contains: targetName, mode: 'insensitive' } },
        ],
      },
    });
    if (foundOpd) {
      resolvedOpdId = foundOpd.id;
    }
  }

  // If still no OPD, default to first active OPD in database
  if (!resolvedOpdId) {
    const firstOpd = await prisma.oPD.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    resolvedOpdId = firstOpd?.id || null;
  }

  // Resolve baseline source version if provided
  let resolvedSourceVersionId = data.sourceVersionId || data.baselineId || data.sourceId || null;
  if (resolvedSourceVersionId) {
    const src = await prisma.externalSource.findFirst({
      where: {
        OR: [{ id: resolvedSourceVersionId }, { code: resolvedSourceVersionId }],
      },
      select: { currentVersionId: true },
    });
    if (src && src.currentVersionId) {
      resolvedSourceVersionId = src.currentVersionId;
    }
  }

  const priority = normalizePriority(data.priority);
  const status = normalizeStatus(data.status);
  const field = data.field || data.category || 'Tata Kelola';
  const bridaFindings = data.bridaFindings || data.findingsText || null;
  const currentCondition = data.currentCondition || null;
  const problemStatement = data.problemStatement || data.description || null;
  const impact = data.impact || null;
  const potentialNeed = data.potentialNeed || null;
  const baselineRelationship = data.baselineRelationship || null;
  const analysisNotes = data.analysisNotes || data.bridaNotes || null;

  const createdRecord = await prisma.$transaction(async (tx) => {
    const item = await tx.problemIdentification.create({
      data: {
        code,
        title: data.title,
        year,
        field,
        bridaFindings,
        currentCondition,
        problemStatement,
        impact,
        potentialNeed,
        priority,
        status,
        description: problemStatement || data.description || data.title,
        sourceVersionId: resolvedSourceVersionId,
        baselineRelationship,
        analysisNotes,
        opdId: resolvedOpdId,
        createdById: userId,
      },
    });

    // Link related OPD in pivot table
    if (resolvedOpdId) {
      await tx.problemIdentificationOpd.create({
        data: {
          problemIdentificationId: item.id,
          opdId: resolvedOpdId,
          relevanceScore: 0.95,
          reason: 'OPD Pengusul / Target Identifikasi Kebutuhan',
        },
      });
    }

    // Save findings structured item
    if (bridaFindings || problemStatement || potentialNeed) {
      await tx.problemIdentificationFinding.create({
        data: {
          problemIdentificationId: item.id,
          title: data.title,
          description: bridaFindings || problemStatement || '',
          evidence: potentialNeed || baselineRelationship || null,
          confidence: 1.0,
          sourceReference: 'Analisis Pemantauan BRIDA',
        },
      });
    }

    return tx.problemIdentification.findUnique({
      where: { id: item.id },
      include: problemIdentificationInclude,
    });
  });

  await logAudit(
    userId,
    'PROBLEM_IDENTIFICATION_CREATED',
    'ProblemIdentification',
    createdRecord.id,
    { code, title: createdRecord.title }
  );

  return createdRecord;
};

/**
 * Get paginated & filtered list of problem identifications
 */
const getProblemIdentifications = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status && query.status !== 'ALL') {
    where.status = normalizeStatus(query.status);
  }

  if (query.year) {
    where.year = parseInt(query.year, 10);
  }

  if (query.priority && query.priority !== 'ALL') {
    where.priority = normalizePriority(query.priority);
  }

  if (query.field && query.field !== 'ALL') {
    where.field = query.field;
  }

  if (query.opdId) {
    where.OR = [
      { opdId: query.opdId },
      { relatedOpds: { some: { opdId: query.opdId } } },
    ];
  }

  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { title: { contains: query.search, mode: 'insensitive' } },
      { bridaFindings: { contains: query.search, mode: 'insensitive' } },
      { problemStatement: { contains: query.search, mode: 'insensitive' } },
      { potentialNeed: { contains: query.search, mode: 'insensitive' } },
      { field: { contains: query.search, mode: 'insensitive' } },
      { opd: { name: { contains: query.search, mode: 'insensitive' } } },
      { relatedOpds: { some: { opd: { name: { contains: query.search, mode: 'insensitive' } } } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.problemIdentification.count({ where }),
    prisma.problemIdentification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: problemIdentificationInclude,
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
 * Get problem identification by ID or Code
 */
const getProblemIdentificationById = async (id) => {
  const record = await prisma.problemIdentification.findFirst({
    where: {
      OR: [
        { id },
        { code: id },
      ],
    },
    include: problemIdentificationInclude,
  });

  if (!record) {
    const error = new Error(`Identifikasi kebutuhan dengan ID ${id} tidak ditemukan.`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return record;
};

/**
 * Update problem identification (Edit by BRIDA)
 */
const updateProblemIdentification = async (id, data, userId) => {
  const existing = await prisma.problemIdentification.findFirst({
    where: {
      OR: [{ id }, { code: id }],
    },
  });

  if (!existing) {
    const error = new Error(`Identifikasi kebutuhan dengan ID ${id} tidak ditemukan.`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.year !== undefined) updateData.year = parseInt(data.year, 10);
  if (data.field !== undefined) updateData.field = data.field || data.category;
  if (data.category !== undefined && !updateData.field) updateData.field = data.category;
  if (data.bridaFindings !== undefined) updateData.bridaFindings = data.bridaFindings;
  if (data.currentCondition !== undefined) updateData.currentCondition = data.currentCondition;
  if (data.problemStatement !== undefined) {
    updateData.problemStatement = data.problemStatement;
    updateData.description = data.problemStatement;
  }
  if (data.impact !== undefined) updateData.impact = data.impact;
  if (data.potentialNeed !== undefined) updateData.potentialNeed = data.potentialNeed;
  if (data.priority !== undefined) updateData.priority = normalizePriority(data.priority);
  if (data.status !== undefined) updateData.status = normalizeStatus(data.status);
  if (data.baselineRelationship !== undefined) updateData.baselineRelationship = data.baselineRelationship;
  if (data.analysisNotes !== undefined) updateData.analysisNotes = data.analysisNotes;
  if (data.reviewNote !== undefined) updateData.reviewNote = data.reviewNote;

  if (data.opdId !== undefined) {
    updateData.opdId = data.opdId;
  } else if (data.opd || data.opdName) {
    const targetName = data.opd || data.opdName;
    const foundOpd = await prisma.oPD.findFirst({
      where: {
        OR: [
          { id: targetName },
          { code: targetName },
          { name: { contains: targetName, mode: 'insensitive' } },
          { shortName: { contains: targetName, mode: 'insensitive' } },
        ],
      },
    });
    if (foundOpd) {
      updateData.opdId = foundOpd.id;
    }
  }

  if (data.sourceVersionId !== undefined) {
    updateData.sourceVersionId = data.sourceVersionId;
  }

  const updatedRecord = await prisma.$transaction(async (tx) => {
    const updated = await tx.problemIdentification.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (updateData.opdId) {
      await tx.problemIdentificationOpd.deleteMany({
        where: { problemIdentificationId: existing.id },
      });
      await tx.problemIdentificationOpd.create({
        data: {
          problemIdentificationId: existing.id,
          opdId: updateData.opdId,
          relevanceScore: 0.95,
          reason: 'OPD Pengusul / Target Identifikasi Kebutuhan',
        },
      });
    }

    return tx.problemIdentification.findUnique({
      where: { id: existing.id },
      include: problemIdentificationInclude,
    });
  });

  await logAudit(
    userId,
    'PROBLEM_IDENTIFICATION_UPDATED',
    'ProblemIdentification',
    updatedRecord.id,
    { code: updatedRecord.code, changes: Object.keys(updateData) }
  );

  return updatedRecord;
};

/**
 * Approve identification (Status -> APPROVED)
 */
const approveIdentification = async (id, userId, reviewNote) => {
  const existing = await getProblemIdentificationById(id);

  const updated = await prisma.problemIdentification.update({
    where: { id: existing.id },
    data: {
      status: 'APPROVED',
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewNote: reviewNote || existing.reviewNote || 'Identifikasi kebutuhan disetujui dan ditetapkan.',
    },
    include: problemIdentificationInclude,
  });

  await logAudit(
    userId,
    'PROBLEM_IDENTIFICATION_APPROVED',
    'ProblemIdentification',
    updated.id,
    { code: updated.code, reviewNote }
  );

  return updated;
};

/**
 * Reject identification (Status -> REJECTED)
 */
const rejectIdentification = async (id, userId, reviewNote) => {
  const existing = await getProblemIdentificationById(id);

  const updated = await prisma.problemIdentification.update({
    where: { id: existing.id },
    data: {
      status: 'REJECTED',
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewNote: reviewNote || 'Identifikasi kebutuhan ditolak.',
    },
    include: problemIdentificationInclude,
  });

  await logAudit(
    userId,
    'PROBLEM_IDENTIFICATION_REJECTED',
    'ProblemIdentification',
    updated.id,
    { code: updated.code, reviewNote }
  );

  return updated;
};

/**
 * Delete identification
 */
const deleteProblemIdentification = async (id, userId) => {
  const existing = await getProblemIdentificationById(id);

  // Check if already linked to proposals
  const linkedProposals = await prisma.researchProposalProblem.count({
    where: { problemIdentificationId: existing.id },
  });

  if (linkedProposals > 0) {
    const error = new Error('Identifikasi kebutuhan tidak dapat dihapus karena sudah ditindaklanjuti ke usulan penelitian.');
    error.statusCode = 400;
    error.code = 'LINKED_TO_PROPOSAL';
    throw error;
  }

  await prisma.problemIdentification.delete({
    where: { id: existing.id },
  });

  await logAudit(
    userId,
    'PROBLEM_IDENTIFICATION_DELETED',
    'ProblemIdentification',
    existing.id,
    { code: existing.code }
  );

  return { success: true, message: 'Identifikasi kebutuhan berhasil dihapus.' };
};

module.exports = {
  createProblemIdentification,
  getProblemIdentifications,
  getProblemIdentificationById,
  updateProblemIdentification,
  approveIdentification,
  rejectIdentification,
  deleteProblemIdentification,
};
