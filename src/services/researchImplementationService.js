const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Generate sequential implementation code: IMP-YYYY-XXX
 */
const generateImplementationCode = async (year) => {
  const prefix = `IMP-${year}-`;
  const latest = await prisma.researchImplementation.findFirst({
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
 * Get available proposals ready for implementation (status = READY_FOR_IMPLEMENTATION)
 * and without active implementation.
 */
const getAvailableProposals = async () => {
  const proposals = await prisma.researchProposal.findMany({
    where: {
      status: 'READY_FOR_IMPLEMENTATION',
      implementation: null,
    },
    include: {
      kak: {
        select: {
          id: true,
          code: true,
          rab: {
            select: { id: true, code: true, totalAmount: true },
          },
        },
      },
      partnerSelection: {
        include: {
          partner: {
            select: { id: true, name: true, type: true, institutionName: true },
          },
        },
      },
      relatedOpds: {
        include: { opd: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return proposals;
};

/**
 * Get implementations list with search, filter, and pagination
 */
const getImplementations = async (query = {}) => {
  const {
    search,
    status,
    year,
    partnerId,
    responsibleUserId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (year) {
    const startYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endYear = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);
    where.startDate = { gte: startYear, lt: endYear };
  }

  if (partnerId) {
    where.partnerSelection = { partnerId };
  }

  if (responsibleUserId) {
    where.responsibleUserId = responsibleUserId;
  }

  if (startDate) {
    where.startDate = { ...where.startDate, gte: new Date(startDate) };
  }

  if (endDate) {
    where.endDate = { ...where.endDate, lte: new Date(endDate) };
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { researchProposal: { code: { contains: search, mode: 'insensitive' } } },
      { researchProposal: { title: { contains: search, mode: 'insensitive' } } },
      {
        partnerSelection: {
          partner: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.researchImplementation.count({ where }),
    prisma.researchImplementation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        researchProposal: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
          },
        },
        partnerSelection: {
          select: {
            id: true,
            code: true,
            method: true,
            status: true,
            finalValue: true,
            partner: {
              select: { id: true, name: true, type: true },
            },
          },
        },
        responsibleUser: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            timelines: true,
            milestones: true,
            activities: true,
            documents: true,
          },
        },
      },
    }),
  ]);

  const now = new Date();
  const formattedData = data.map((item) => {
    const isOverdue =
      now > new Date(item.endDate) &&
      !['COMPLETED', 'CANCELLED'].includes(item.status);

    return {
      ...item,
      isOverdue,
    };
  });

  return {
    data: formattedData,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take) || 1,
    },
  };
};

/**
 * Get implementation detail by ID
 */
const getImplementationById = async (id) => {
  const implementation = await prisma.researchImplementation.findFirst({
    where: {
      OR: [
        { id },
        { code: id },
        { researchProposalId: id },
        { researchProposal: { code: id } },
      ],
    },
    include: {
      researchProposal: {
        include: {
          kak: {
            include: {
              rab: {
                include: { items: { orderBy: { order: 'asc' } } },
              },
            },
          },
          selection: true,
          relatedOpds: { include: { opd: true } },
          problems: { include: { problemIdentification: true } },
        },
      },
      partnerSelection: {
        include: {
          partner: true,
          documents: true,
        },
      },
      responsibleUser: {
        select: { id: true, name: true, email: true, role: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      timelines: {
        orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
        include: {
          milestones: { orderBy: [{ order: 'asc' }, { targetDate: 'asc' }] },
          activities: { orderBy: { activityDate: 'asc' } },
        },
      },
      milestones: {
        orderBy: [{ order: 'asc' }, { targetDate: 'asc' }],
      },
      activities: {
        orderBy: { activityDate: 'asc' },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
      progressHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          updatedBy: { select: { id: true, name: true, role: true } },
        },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const now = new Date();
  const isOverdue =
    now > new Date(implementation.endDate) &&
    !['COMPLETED', 'CANCELLED'].includes(implementation.status);

  // Add isOverdue to timelines
  const enrichedTimelines = implementation.timelines.map((tl) => ({
    ...tl,
    isOverdue: now > new Date(tl.endDate) && tl.status !== 'COMPLETED',
  }));

  return {
    ...implementation,
    timelines: enrichedTimelines,
    isOverdue,
  };
};

/**
 * Get implementation dashboard summary
 */
const getImplementationSummary = async (id) => {
  const implementation = await getImplementationById(id);

  const totalMilestones = implementation.milestones.length;
  const completedMilestones = implementation.milestones.filter(
    (m) => m.status === 'COMPLETED'
  ).length;

  return {
    implementation: {
      id: implementation.id,
      code: implementation.code,
      status: implementation.status,
      progress: implementation.progress,
      startDate: implementation.startDate,
      endDate: implementation.endDate,
      actualStartDate: implementation.actualStartDate,
      actualEndDate: implementation.actualEndDate,
    },
    proposal: {
      id: implementation.researchProposal.id,
      code: implementation.researchProposal.code,
      title: implementation.researchProposal.title,
      status: implementation.researchProposal.status,
    },
    partner: implementation.partnerSelection.partner,
    responsibleUser: implementation.responsibleUser,
    period: {
      start: implementation.startDate,
      end: implementation.endDate,
    },
    status: implementation.status,
    progress: implementation.progress,
    isOverdue: implementation.isOverdue,
    timelineCount: implementation.timelines.length,
    completedMilestones,
    totalMilestones,
    activityCount: implementation.activities.length,
  };
};

/**
 * Get implementation dashboard statistics
 */
const getImplementationStatistics = async (query = {}) => {
  const where = {};
  if (query.year) {
    const startYear = new Date(`${query.year}-01-01T00:00:00.000Z`);
    const endYear = new Date(`${Number(query.year) + 1}-01-01T00:00:00.000Z`);
    where.startDate = { gte: startYear, lt: endYear };
  }

  const implementations = await prisma.researchImplementation.findMany({
    where,
    select: { status: true, progress: true, endDate: true },
  });

  const total = implementations.length;
  let planned = 0;
  let ongoing = 0;
  let completed = 0;
  let cancelled = 0;
  let totalProgress = 0;
  let overdueCount = 0;
  const now = new Date();

  implementations.forEach((item) => {
    if (item.status === 'PLANNED') planned++;
    else if (item.status === 'ONGOING') ongoing++;
    else if (item.status === 'COMPLETED') completed++;
    else if (item.status === 'CANCELLED') cancelled++;

    totalProgress += item.progress;

    if (
      now > new Date(item.endDate) &&
      !['COMPLETED', 'CANCELLED'].includes(item.status)
    ) {
      overdueCount++;
    }
  });

  const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

  return {
    total,
    planned,
    ongoing,
    completed,
    cancelled,
    averageProgress,
    overdueCount,
  };
};

/**
 * Create research implementation
 */
const createImplementation = async (data, userId) => {
  const {
    researchProposalId,
    partnerSelectionId,
    responsibleUserId,
    startDate,
    endDate,
    description,
    notes,
  } = data;

  // 1. Verify proposal exists by ID or code
  const proposal = await prisma.researchProposal.findFirst({
    where: {
      OR: [
        { id: researchProposalId },
        { code: researchProposalId },
      ],
    },
    include: {
      partnerSelection: {
        include: { partner: true },
      },
      implementation: true,
      kak: { include: { rab: true } },
    },
  });

  if (!proposal) {
    const error = new Error('Proposal penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'PROPOSAL_NOT_FOUND';
    throw error;
  }

  // If implementation already exists, return it smoothly
  if (proposal.implementation) {
    return getImplementationById(proposal.implementation.id);
  }

  if (!['READY_FOR_IMPLEMENTATION', 'SELECTED', 'MITRA_SELECTED', 'ONGOING'].includes(proposal.status)) {
    const error = new Error(
      `Proposal dengan status "${proposal.status}" belum siap untuk pelaksanaan penelitian. KAK, RAB, dan Mitra harus disetujui terlebih dahulu.`
    );
    error.statusCode = 400;
    error.code = 'PROPOSAL_NOT_READY_FOR_IMPLEMENTATION';
    throw error;
  }

  // 2. Resolve partner selection ID
  let selectedPartnerSelectionId = partnerSelectionId;
  if (!selectedPartnerSelectionId && proposal.partnerSelection) {
    selectedPartnerSelectionId = proposal.partnerSelection.id;
  }

  if (!selectedPartnerSelectionId) {
    const error = new Error('Mitra pelaksana penelitian belum ditetapkan.');
    error.statusCode = 400;
    error.code = 'PARTNER_SELECTION_REQUIRED';
    throw error;
  }

  // 3. Resolve PIC / responsible user
  let picId = responsibleUserId;
  if (!picId) {
    picId = userId;
  }

  // 4. Resolve dates
  const start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : null;
  if (!end) {
    if (proposal.kak?.estimatedEndDate) {
      end = new Date(proposal.kak.estimatedEndDate);
    } else {
      end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    }
  }

  if (end < start) {
    const error = new Error('Tanggal akhir pelaksanaan tidak boleh mendahului tanggal mulai.');
    error.statusCode = 400;
    error.code = 'INVALID_DATE_RANGE';
    throw error;
  }

  // 5. Generate implementation code
  const currentYear = start.getFullYear();
  const code = await generateImplementationCode(currentYear);

  // 6. Execute atomic transaction
  const implementation = await prisma.$transaction(async (tx) => {
    const newImpl = await tx.researchImplementation.create({
      data: {
        code,
        researchProposalId: proposal.id,
        partnerSelectionId: selectedPartnerSelectionId,
        responsibleUserId: picId,
        startDate: start,
        endDate: end,
        status: 'PLANNED',
        progress: 0,
        description: description || null,
        notes: notes || null,
        createdById: userId,
      },
      include: {
        researchProposal: {
          select: { id: true, code: true, title: true, status: true },
        },
        partnerSelection: {
          select: {
            id: true,
            code: true,
            method: true,
            partner: { select: { id: true, name: true, type: true } },
          },
        },
        responsibleUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Initial progress record (0%)
    await tx.researchProgressUpdate.create({
      data: {
        implementationId: newImpl.id,
        progress: 0,
        notes: 'Pelaksanaan penelitian dibuat (status: PLANNED).',
        updatedById: userId,
      },
    });

    return newImpl;
  });

  await logAudit(
    userId,
    'RESEARCH_IMPLEMENTATION_CREATED',
    'ResearchImplementation',
    implementation.id,
    { code: implementation.code, proposalId: proposal.id }
  );

  return implementation;
};

/**
 * Update implementation metadata
 */
const updateImplementation = async (id, data, userId) => {
  const implementation = await prisma.researchImplementation.findFirst({
    where: {
      OR: [
        { id },
        { code: id },
        { researchProposalId: id },
        { researchProposal: { code: id } },
      ],
    },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  if (['COMPLETED', 'CANCELLED'].includes(implementation.status)) {
    const error = new Error(
      `Pelaksanaan penelitian dengan status "${implementation.status}" terkunci dan tidak dapat diubah.`
    );
    error.statusCode = 409;
    error.code = 'IMPLEMENTATION_NOT_EDITABLE';
    throw error;
  }

  const updateData = {};
  if (data.description !== undefined) updateData.description = data.description;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  if (data.responsibleUserId) {
    const picUser = await prisma.user.findUnique({
      where: { id: data.responsibleUserId },
    });
    if (!picUser || picUser.role === 'OPD') {
      const error = new Error(
        'Penanggung jawab (PIC) internal BRIDA tidak valid atau berasal dari OPD.'
      );
      error.statusCode = 400;
      error.code = 'INVALID_RESPONSIBLE_USER';
      throw error;
    }
    updateData.responsibleUserId = data.responsibleUserId;
  }

  const updated = await prisma.researchImplementation.update({
    where: { id: implementation.id },
    data: updateData,
    include: {
      researchProposal: { select: { id: true, code: true, title: true } },
      responsibleUser: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_IMPLEMENTATION_UPDATED',
    'ResearchImplementation',
    updated.id,
    { code: updated.code, updateData }
  );

  return updated;
};

/**
 * Start implementation: PLANNED -> ONGOING
 */
const startImplementation = async (id, userId, customStartDate) => {
  let implementation = await prisma.researchImplementation.findFirst({
    where: {
      OR: [
        { id },
        { code: id },
        { researchProposalId: id },
        { researchProposal: { code: id } },
      ],
    },
  });

  if (!implementation) {
    // If not created yet, create from proposal on the fly
    const proposal = await prisma.researchProposal.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: { partnerSelection: true },
    });

    if (!proposal) {
      const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
      error.statusCode = 404;
      error.code = 'IMPLEMENTATION_NOT_FOUND';
      throw error;
    }

    implementation = await createImplementation({
      researchProposalId: proposal.id,
      partnerSelectionId: proposal.partnerSelection?.id,
      responsibleUserId: userId,
      startDate: customStartDate || new Date(),
    }, userId);
  }

  if (implementation.status === 'ONGOING') {
    return implementation;
  }

  const startVal = customStartDate ? new Date(customStartDate) : new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.researchImplementation.update({
      where: { id: implementation.id },
      data: {
        status: 'ONGOING',
        actualStartDate: startVal,
      },
      include: {
        researchProposal: { select: { id: true, code: true, title: true } },
      },
    });

    return res;
  });

  await logAudit(
    userId,
    'RESEARCH_IMPLEMENTATION_STARTED',
    'ResearchImplementation',
    updated.id,
    { code: updated.code, actualStartDate: startVal }
  );

  return updated;
};

/**
 * Complete implementation: ONGOING -> COMPLETED
 */
const completeImplementation = async (id, userId, customEndDate, notes) => {
  let implementation = await prisma.researchImplementation.findFirst({
    where: {
      OR: [
        { id },
        { code: id },
        { researchProposalId: id },
        { researchProposal: { code: id } },
      ],
    },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  if (implementation.status === 'COMPLETED') {
    return implementation;
  }

  const endVal = customEndDate ? new Date(customEndDate) : new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.researchImplementation.update({
      where: { id: implementation.id },
      data: {
        status: 'COMPLETED',
        actualEndDate: endVal,
        progress: 100,
        notes: notes || implementation.notes,
      },
      include: {
        researchProposal: { select: { id: true, code: true, title: true } },
      },
    });

    await tx.researchProgressUpdate.create({
      data: {
        implementationId: implementation.id,
        progress: 100,
        notes: notes || 'Pelaksanaan penelitian selesai secara penuh (100%).',
        updatedById: userId,
      },
    });

    return res;
  });

  await logAudit(
    userId,
    'RESEARCH_IMPLEMENTATION_COMPLETED',
    'ResearchImplementation',
    updated.id,
    { code: updated.code, actualEndDate: endVal, progress: 100 }
  );

  return updated;
};

/**
 * Cancel implementation: PLANNED / ONGOING -> CANCELLED
 */
const cancelImplementation = async (id, reason, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  if (implementation.status === 'COMPLETED') {
    const error = new Error(
      'Pelaksanaan penelitian yang sudah COMPLETED tidak dapat dibatalkan.'
    );
    error.statusCode = 409;
    error.code = 'CANNOT_CANCEL_COMPLETED_IMPLEMENTATION';
    throw error;
  }

  if (implementation.status === 'CANCELLED') {
    const error = new Error('Pelaksanaan penelitian sudah dibatalkan sebelumnya.');
    error.statusCode = 409;
    error.code = 'ALREADY_CANCELLED';
    throw error;
  }

  const updated = await prisma.researchImplementation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelReason: reason,
      // Progress remains intact, do not overwrite to 0
    },
    include: {
      researchProposal: { select: { id: true, code: true, title: true } },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_IMPLEMENTATION_CANCELLED',
    'ResearchImplementation',
    updated.id,
    { code: updated.code, reason }
  );

  return updated;
};

/**
 * Update implementation progress (non-decreasing integer 0 - 100)
 */
const updateProgress = async (id, progress, notes, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  if (['COMPLETED', 'CANCELLED'].includes(implementation.status)) {
    const error = new Error(
      `Pelaksanaan penelitian dengan status "${implementation.status}" terkunci dan progress tidak dapat diubah.`
    );
    error.statusCode = 409;
    error.code = 'IMPLEMENTATION_NOT_EDITABLE';
    throw error;
  }

  // Progress rule: Progress cannot decrease normally
  if (progress < implementation.progress) {
    const error = new Error(
      `Nilai progress tidak boleh lebih kecil dari nilai saat ini (${implementation.progress}%). Progress baru: ${progress}%.`
    );
    error.statusCode = 409;
    error.code = 'PROGRESS_CANNOT_DECREASE';
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.researchImplementation.update({
      where: { id },
      data: { progress },
      include: {
        researchProposal: { select: { id: true, code: true, title: true } },
      },
    });

    await tx.researchProgressUpdate.create({
      data: {
        implementationId: id,
        progress,
        notes: notes || `Pembaruan progress pelaksanaan penelitian menjadi ${progress}%.`,
        updatedById: userId,
      },
    });

    return res;
  });

  await logAudit(
    userId,
    'RESEARCH_PROGRESS_UPDATED',
    'ResearchImplementation',
    updated.id,
    { code: updated.code, previousProgress: implementation.progress, progress, notes }
  );

  return updated;
};

/**
 * Get progress history
 */
const getProgressHistory = async (id) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id },
    select: { id: true, code: true },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const history = await prisma.researchProgressUpdate.findMany({
    where: { implementationId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      updatedBy: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return history;
};

module.exports = {
  generateImplementationCode,
  getAvailableProposals,
  getImplementations,
  getImplementationById,
  getImplementationSummary,
  getImplementationStatistics,
  createImplementation,
  updateImplementation,
  startImplementation,
  completeImplementation,
  cancelImplementation,
  updateProgress,
  getProgressHistory,
};
