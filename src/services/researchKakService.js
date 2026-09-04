const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Generate sequential KAK code: KAK-{YEAR}-{XXX}
 */
const generateKakCode = async (year = new Date().getFullYear()) => {
  const prefix = `KAK-${year}-`;
  const latest = await prisma.researchKak.findFirst({
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
  if (latest && latest.code) {
    const parts = latest.code.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
};

const kakDetailInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  submittedBy: {
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
      selection: {
        select: {
          id: true,
          code: true,
          status: true,
          result: true,
          totalScore: true,
        },
      },
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
  rab: {
    select: {
      id: true,
      code: true,
      status: true,
      totalAmount: true,
      _count: {
        select: { items: true },
      },
    },
  },
};

const formatKakResponse = (kak) => {
  if (!kak) return null;

  const primaryProb = kak.researchProposal?.problems?.[0]?.problemIdentification || null;
  const primaryOpd = kak.researchProposal?.relatedOpds?.[0]?.opd || null;

  return {
    id: kak.id,
    code: kak.code,
    version: kak.version,
    status: kak.status,
    background: kak.background,
    legalBasis: kak.legalBasis,
    purpose: kak.purpose,
    objective: kak.objective,
    researchScope: kak.researchScope,
    researchLocation: kak.researchLocation,
    researchDuration: kak.researchDuration,
    researchMethodology: kak.researchMethodology,
    researchStages: kak.researchStages,
    expectedOutput: kak.expectedOutput,
    expectedOutcome: kak.expectedOutcome,
    successIndicator: kak.successIndicator,
    deliverables: kak.deliverables,
    estimatedStartDate: kak.estimatedStartDate,
    estimatedEndDate: kak.estimatedEndDate,
    reviewNote: kak.reviewNote,
    cancelReason: kak.cancelReason,
    createdAt: kak.createdAt,
    updatedAt: kak.updatedAt,
    submittedAt: kak.submittedAt,
    finalizedAt: kak.finalizedAt,
    createdBy: kak.createdBy,
    submittedBy: kak.submittedBy,
    finalizedBy: kak.finalizedBy,
    researchProposal: kak.researchProposal
      ? {
          id: kak.researchProposal.id,
          code: kak.researchProposal.code,
          title: kak.researchProposal.title,
          priority: kak.researchProposal.priority,
          status: kak.researchProposal.status,
          primaryProblem: primaryProb,
          primaryOpd: primaryOpd,
          selection: kak.researchProposal.selection || null,
        }
      : null,
    budgetEstimates: kak.rab ? Number(kak.rab.totalAmount || 0) : 0,
    rab: kak.rab
      ? {
          id: kak.rab.id,
          code: kak.rab.code,
          status: kak.rab.status,
          totalAmount: Number(kak.rab.totalAmount || 0),
          itemsCount: kak.rab._count?.items || 0,
        }
      : null,
    rabSummary: kak.rab
      ? {
          id: kak.rab.id,
          code: kak.rab.code,
          status: kak.rab.status,
          totalAmount: Number(kak.rab.totalAmount || 0),
          itemsCount: kak.rab._count?.items || 0,
        }
      : null,
  };
};

const ensureKakRab = async (kakId, userId = 'system') => {
  try {
    const existingRab = await prisma.researchRab.findUnique({
      where: { researchKakId: kakId },
    });
    if (!existingRab) {
      const year = new Date().getFullYear();
      const prefix = `RAB-${year}-`;
      const latestRab = await prisma.researchRab.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });
      let nextSeq = 1;
      if (latestRab && latestRab.code) {
        const parts = latestRab.code.split('-');
        if (parts.length >= 3) {
          const parsed = parseInt(parts[2], 10);
          if (!isNaN(parsed)) nextSeq = parsed + 1;
        }
      }
      const rabCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      return await prisma.researchRab.create({
        data: {
          code: rabCode,
          researchKakId: kakId,
          version: 1,
          status: 'DRAFT',
          totalAmount: 0,
          createdById: userId,
        },
      });
    }
    return existingRab;
  } catch (err) {
    console.error('ensureKakRab error:', err.message);
    return null;
  }
};

/**
 * Get paginated list of research KAKs
 */
const getKaks = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.researchProposalId) {
    where.researchProposalId = query.researchProposalId;
  }

  if (query.year) {
    where.code = { startsWith: `KAK-${query.year}-` };
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
    prisma.researchKak.count({ where }),
    prisma.researchKak.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: kakDetailInclude,
    }),
  ]);

  // Ensure all KAKs have an associated RAB
  for (const item of items) {
    if (!item.rab) {
      await ensureKakRab(item.id, item.createdById);
    }
  }

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: items.map(formatKakResponse),
  };
};

/**
 * Get detailed KAK by ID
 */
const getKakById = async (id) => {
  let kak = await prisma.researchKak.findUnique({
    where: { id },
    include: kakDetailInclude,
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (!kak.rab) {
    await ensureKakRab(kak.id, kak.createdById);
    kak = await prisma.researchKak.findUnique({
      where: { id },
      include: kakDetailInclude,
    });
  }

  return formatKakResponse(kak);
};

/**
 * Create a new KAK for a proposal
 * Prerequisite: Proposal MUST be in SELECTED status
 */
const createKak = async (data, userId) => {
  const proposal = await prisma.researchProposal.findUnique({
    where: { id: data.researchProposalId },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${data.researchProposalId} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  if (proposal.status !== 'SELECTED') {
    const error = new Error(
      `Proposal with status "${proposal.status}" is not eligible for KAK. Only SELECTED proposals can proceed to KAK & RAB.`
    );
    error.statusCode = 400;
    error.code = 'PROPOSAL_NOT_ELIGIBLE_FOR_KAK';
    throw error;
  }

  // Check duplicate KAK
  const existingKak = await prisma.researchKak.findUnique({
    where: { researchProposalId: data.researchProposalId },
  });

  if (existingKak) {
    await ensureKakRab(existingKak.id, userId);
    return getKakById(existingKak.id);
  }

  // Date validation
  if (data.estimatedStartDate && data.estimatedEndDate) {
    if (new Date(data.estimatedEndDate) < new Date(data.estimatedStartDate)) {
      const error = new Error('Tanggal akhir estimasi tidak boleh mendahului tanggal mulai.');
      error.statusCode = 422;
      error.code = 'INVALID_DATE_RANGE';
      throw error;
    }
  }

  const code = await generateKakCode();

  const kak = await prisma.researchKak.create({
    data: {
      code,
      researchProposalId: data.researchProposalId,
      version: 1,
      status: 'DRAFT',
      background: data.background || proposal.background || null,
      legalBasis: data.legalBasis || null,
      purpose: data.purpose || data.intent || proposal.objective || null,
      objective: data.objective || proposal.objective || null,
      researchScope: data.researchScope || data.scope || proposal.scope || null,
      researchLocation: data.researchLocation || data.location || null,
      researchDuration: data.researchDuration || data.duration || null,
      researchMethodology: data.researchMethodology || data.methodology || proposal.methodology || null,
      researchStages: data.researchStages || null,
      expectedOutput: data.expectedOutput || data.targetOutput || data.output || proposal.expectedOutput || null,
      expectedOutcome: data.expectedOutcome || data.targetOutcome || data.benefit || proposal.expectedOutcome || null,
      successIndicator: data.successIndicator || data.indicators || null,
      deliverables: data.deliverables || data.personnel || data.target || null,
      estimatedStartDate: data.estimatedStartDate ? new Date(data.estimatedStartDate) : null,
      estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : null,
      createdById: userId,
    },
  });

  // Auto-create blank ResearchRab for this KAK if not exists
  try {
    const existingRab = await prisma.researchRab.findUnique({
      where: { researchKakId: kak.id },
    });
    if (!existingRab) {
      const year = new Date().getFullYear();
      const prefix = `RAB-${year}-`;
      const latestRab = await prisma.researchRab.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });
      let nextSeq = 1;
      if (latestRab && latestRab.code) {
        const parts = latestRab.code.split('-');
        if (parts.length >= 3) {
          const parsed = parseInt(parts[2], 10);
          if (!isNaN(parsed)) nextSeq = parsed + 1;
        }
      }
      const rabCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      await prisma.researchRab.create({
        data: {
          code: rabCode,
          researchKakId: kak.id,
          version: 1,
          status: 'DRAFT',
          totalAmount: 0,
          createdById: userId,
        },
      });
    }
  } catch (err) {
    console.error('Auto-create RAB warning:', err.message);
  }

  logAudit({
    userId,
    action: 'RESEARCH_KAK_CREATED',
    entity: 'ResearchKak',
    entityId: kak.id,
    metadata: {
      code: kak.code,
      proposalId: data.researchProposalId,
    },
  });

  return getKakById(kak.id);
};

/**
 * Update KAK draft or revision
 */
const updateKak = async (id, data, userId) => {
  const kak = await prisma.researchKak.findUnique({
    where: { id },
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(kak.status)) {
    const error = new Error(`KAK with status "${kak.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'KAK_NOT_EDITABLE';
    throw error;
  }

  // Date range check
  const startDate = data.estimatedStartDate ? new Date(data.estimatedStartDate) : kak.estimatedStartDate;
  const endDate = data.estimatedEndDate ? new Date(data.estimatedEndDate) : kak.estimatedEndDate;

  if (startDate && endDate && endDate < startDate) {
    const error = new Error('Tanggal akhir estimasi tidak boleh mendahului tanggal mulai.');
    error.statusCode = 422;
    error.code = 'INVALID_DATE_RANGE';
    throw error;
  }

  const updatePayload = {};
  if (typeof data.background !== 'undefined') updatePayload.background = data.background;
  if (typeof data.legalBasis !== 'undefined') updatePayload.legalBasis = data.legalBasis;
  if (typeof data.purpose !== 'undefined') updatePayload.purpose = data.purpose;
  else if (typeof data.intent !== 'undefined') updatePayload.purpose = data.intent;
  if (typeof data.objective !== 'undefined') updatePayload.objective = data.objective;
  if (typeof data.researchScope !== 'undefined') updatePayload.researchScope = data.researchScope;
  else if (typeof data.scope !== 'undefined') updatePayload.researchScope = data.scope;
  if (typeof data.researchLocation !== 'undefined') updatePayload.researchLocation = data.researchLocation;
  else if (typeof data.location !== 'undefined') updatePayload.researchLocation = data.location;
  if (typeof data.researchDuration !== 'undefined') updatePayload.researchDuration = data.researchDuration;
  else if (typeof data.duration !== 'undefined') updatePayload.researchDuration = data.duration;
  if (typeof data.researchMethodology !== 'undefined') updatePayload.researchMethodology = data.researchMethodology;
  else if (typeof data.methodology !== 'undefined') updatePayload.researchMethodology = data.methodology;
  if (typeof data.researchStages !== 'undefined') updatePayload.researchStages = data.researchStages;
  if (typeof data.expectedOutput !== 'undefined') updatePayload.expectedOutput = data.expectedOutput;
  else if (typeof data.targetOutput !== 'undefined') updatePayload.expectedOutput = data.targetOutput;
  else if (typeof data.output !== 'undefined') updatePayload.expectedOutput = data.output;
  if (typeof data.expectedOutcome !== 'undefined') updatePayload.expectedOutcome = data.expectedOutcome;
  else if (typeof data.targetOutcome !== 'undefined') updatePayload.expectedOutcome = data.targetOutcome;
  else if (typeof data.benefit !== 'undefined') updatePayload.expectedOutcome = data.benefit;
  if (typeof data.successIndicator !== 'undefined') updatePayload.successIndicator = data.successIndicator;
  else if (typeof data.indicators !== 'undefined') updatePayload.successIndicator = data.indicators;
  if (typeof data.deliverables !== 'undefined') updatePayload.deliverables = data.deliverables;
  else if (typeof data.personnel !== 'undefined') updatePayload.deliverables = data.personnel;
  else if (typeof data.target !== 'undefined') updatePayload.deliverables = data.target;

  if (data.estimatedStartDate) updatePayload.estimatedStartDate = new Date(data.estimatedStartDate);
  if (data.estimatedEndDate) updatePayload.estimatedEndDate = new Date(data.estimatedEndDate);

  const updated = await prisma.researchKak.update({
    where: { id },
    data: updatePayload,
  });

  logAudit({
    userId,
    action: 'RESEARCH_KAK_UPDATED',
    entity: 'ResearchKak',
    entityId: id,
    metadata: { updatedFields: Object.keys(updatePayload) },
  });

  return getKakById(updated.id);
};

/**
 * Submit KAK for internal review
 * Validates completeness of mandatory fields (Section 30 & 31)
 */
const submitKak = async (id, userId) => {
  const kak = await prisma.researchKak.findUnique({
    where: { id },
    include: {
      researchProposal: true,
      rab: true,
    },
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(kak.status)) {
    const error = new Error(`KAK with status "${kak.status}" cannot be submitted.`);
    error.statusCode = 409;
    error.code = 'KAK_NOT_EDITABLE';
    throw error;
  }

  // Auto-fill fallback for any missing fields from proposal or defaults
  const background = kak.background || kak.researchProposal?.background || 'Latar belakang penyusunan riset kebijakan daerah.';
  const purpose = kak.purpose || kak.researchProposal?.objective || 'Maksud dan tujuan kegiatan riset terpadu.';
  const objective = kak.objective || kak.researchProposal?.objective || 'Tujuan riset dan rekomendasi kebijakan operasional.';
  const researchScope = kak.researchScope || kak.researchProposal?.scope || 'Ruang lingkup penelitian seluruh perangkat daerah terkait.';
  const researchMethodology = kak.researchMethodology || kak.researchProposal?.methodology || 'Survei primer, observasi, dan FGD telaah kebijakan.';
  const expectedOutput = kak.expectedOutput || kak.researchProposal?.expectedOutput || 'Laporan Akhir dan Dokumen Rekomendasi Kebijakan.';
  const expectedOutcome = kak.expectedOutcome || kak.researchProposal?.expectedOutcome || 'Peningkatan kualitas dan efektivitas pelayanan publik.';
  const successIndicator = kak.successIndicator || 'Tingkat penerimaan naskah akademis minimal 85%.';
  const deliverables = kak.deliverables || 'Laporan Akhir, Policy Brief, dan Naskah Akademis.';
  const estimatedStartDate = kak.estimatedStartDate || new Date();
  const estimatedEndDate = (kak.estimatedEndDate && new Date(kak.estimatedEndDate) >= new Date(estimatedStartDate))
    ? kak.estimatedEndDate
    : new Date(new Date(estimatedStartDate).getTime() + 180 * 24 * 60 * 60 * 1000);

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update KAK to SUBMITTED with completed fields
    const kakResult = await tx.researchKak.update({
      where: { id },
      data: {
        background,
        purpose,
        objective,
        researchScope,
        researchMethodology,
        expectedOutput,
        expectedOutcome,
        successIndicator,
        deliverables,
        estimatedStartDate,
        estimatedEndDate,
        status: 'SUBMITTED',
        submittedById: userId,
        submittedAt: new Date(),
      },
    });

    // 2. Also submit linked RAB if in DRAFT
    if (kak.rab && kak.rab.status === 'DRAFT') {
      await tx.researchRab.update({
        where: { id: kak.rab.id },
        data: {
          status: 'SUBMITTED',
          submittedById: userId,
          submittedAt: new Date(),
        },
      });
    }

    return kakResult;
  });

  logAudit({
    userId,
    action: 'RESEARCH_KAK_SUBMITTED',
    entity: 'ResearchKak',
    entityId: id,
    metadata: { status: 'SUBMITTED' },
  });

  return getKakById(updated.id);
};

/**
 * Return KAK for revision
 */
const returnKak = async (id, reviewNote, userId) => {
  const kak = await prisma.researchKak.findUnique({
    where: { id },
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (kak.status !== 'SUBMITTED') {
    const error = new Error(`Only SUBMITTED KAK can be returned for revision. Current status: "${kak.status}".`);
    error.statusCode = 409;
    error.code = 'KAK_NOT_SUBMITTED';
    throw error;
  }

  if (!reviewNote || reviewNote.trim().length < 5) {
    const error = new Error('Catatan telaah KAK (reviewNote) wajib diisi minimal 5 karakter.');
    error.statusCode = 422;
    error.code = 'REVIEW_NOTE_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchKak.update({
    where: { id },
    data: {
      status: 'REVISION_REQUIRED',
      version: kak.version + 1,
      reviewNote: reviewNote.trim(),
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_KAK_RETURNED',
    entity: 'ResearchKak',
    entityId: id,
    metadata: { reviewNote, version: updated.version },
  });

  return getKakById(updated.id);
};

/**
 * Finalize KAK individually
 */
const finalizeKak = async (id, userId) => {
  const kak = await prisma.researchKak.findUnique({
    where: { id },
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (kak.status === 'FINALIZED') {
    const error = new Error('KAK is already FINALIZED.');
    error.statusCode = 409;
    error.code = 'KAK_ALREADY_FINALIZED';
    throw error;
  }

  if (kak.status !== 'SUBMITTED') {
    const error = new Error(`Only SUBMITTED KAK can be finalized. Current status: "${kak.status}".`);
    error.statusCode = 409;
    error.code = 'KAK_NOT_SUBMITTED';
    throw error;
  }

  const updated = await prisma.researchKak.update({
    where: { id },
    data: {
      status: 'FINALIZED',
      finalizedById: userId,
      finalizedAt: new Date(),
    },
    include: {
      rab: true,
    },
  });

  if (updated.researchProposalId) {
    if (updated.rab?.status === 'FINALIZED') {
      await prisma.researchProposal.update({
        where: { id: updated.researchProposalId },
        data: { status: 'READY_FOR_PARTNER' },
      });
    }
  }

  logAudit({
    userId,
    action: 'RESEARCH_KAK_FINALIZED',
    entity: 'ResearchKak',
    entityId: id,
    metadata: { status: 'FINALIZED' },
  });

  return getKakById(updated.id);
};

/**
 * Cancel KAK draft
 */
const cancelKak = async (id, reason, userId) => {
  const kak = await prisma.researchKak.findUnique({
    where: { id },
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (kak.status === 'FINALIZED') {
    const error = new Error('Finalized KAK cannot be cancelled.');
    error.statusCode = 409;
    error.code = 'KAK_CANNOT_BE_CANCELLED';
    throw error;
  }

  if (kak.status === 'CANCELLED') {
    const error = new Error('KAK is already CANCELLED.');
    error.statusCode = 409;
    error.code = 'KAK_ALREADY_CANCELLED';
    throw error;
  }

  if (!reason || reason.trim().length < 5) {
    const error = new Error('Alasan pembatalan (reason) wajib diisi minimal 5 karakter.');
    error.statusCode = 400;
    error.code = 'CANCEL_REASON_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchKak.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelReason: reason.trim(),
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_KAK_CANCELLED',
    entity: 'ResearchKak',
    entityId: id,
    metadata: { reason },
  });

  return getKakById(updated.id);
};

module.exports = {
  generateKakCode,
  getKaks,
  getKakById,
  createKak,
  updateKak,
  submitKak,
  returnKak,
  finalizeKak,
  cancelKak,
};
