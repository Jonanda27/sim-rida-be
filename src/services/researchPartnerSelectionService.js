const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { Prisma } = require('@prisma/client');

/**
 * Generate sequential selection code: MTR-{YEAR}-{XXX}
 */
const generateSelectionCode = async (year = new Date().getFullYear()) => {
  const prefix = `MTR-${year}-`;
  const latest = await prisma.researchPartnerSelection.findFirst({
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

const selectionDetailInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  submittedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  finalizedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  partner: {
    select: {
      id: true,
      name: true,
      type: true,
      institutionName: true,
      contactPerson: true,
      email: true,
      phone: true,
      taxIdentifier: true,
      registrationNumber: true,
      isActive: true,
    },
  },
  researchProposal: {
    select: {
      id: true,
      code: true,
      title: true,
      priority: true,
      status: true,
      kak: {
        select: {
          id: true,
          code: true,
          status: true,
          version: true,
          estimatedStartDate: true,
          estimatedEndDate: true,
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
    },
  },
  documents: {
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  },
};

const formatSelectionResponse = (selection) => {
  if (!selection) return null;

  const rabTotal = Number(selection.researchProposal?.kak?.rab?.totalAmount || 0);
  const finalVal = selection.finalValue !== null ? Number(selection.finalValue) : null;
  const estimatedVal = selection.estimatedValue !== null ? Number(selection.estimatedValue) : null;

  const compareVal = finalVal !== null ? finalVal : estimatedVal;
  const budgetWarning = compareVal !== null && compareVal > rabTotal && rabTotal > 0;

  return {
    id: selection.id,
    code: selection.code,
    method: selection.method,
    status: selection.status,
    justification: selection.justification,
    externalSystem: selection.externalSystem,
    externalReference: selection.externalReference,
    externalUrl: selection.externalUrl,
    selfManagementType: selection.selfManagementType,
    responsiblePerson: selection.responsiblePerson,
    implementationTeam: selection.implementationTeam,
    eCatalogProvider: selection.eCatalogProvider,
    eCatalogProductId: selection.eCatalogProductId,
    eCatalogTransactionReference: selection.eCatalogTransactionReference,
    eCatalogUrl: selection.eCatalogUrl,
    tenderNumber: selection.tenderNumber,
    tenderSystem: selection.tenderSystem,
    tenderUrl: selection.tenderUrl,
    winnerReference: selection.winnerReference,
    estimatedValue: estimatedVal,
    finalValue: finalVal,
    rabAmount: rabTotal,
    budgetWarning,
    budgetWarningMessage: budgetWarning ? 'Nilai mitra melebihi nilai pagu RAB penelitian.' : null,
    selectionDate: selection.selectionDate,
    startDate: selection.startDate,
    endDate: selection.endDate,
    notes: selection.notes,
    reviewNote: selection.reviewNote,
    cancelReason: selection.cancelReason,
    createdAt: selection.createdAt,
    updatedAt: selection.updatedAt,
    submittedAt: selection.submittedAt,
    finalizedAt: selection.finalizedAt,
    createdBy: selection.createdBy,
    submittedBy: selection.submittedBy,
    finalizedBy: selection.finalizedBy,
    partnerId: selection.partnerId,
    researchProposalId: selection.researchProposalId,
    partner: selection.partner,
    researchProposal: selection.researchProposal,
    proposal: selection.researchProposal
      ? {
          id: selection.researchProposal.id,
          code: selection.researchProposal.code,
          title: selection.researchProposal.title,
          priority: selection.researchProposal.priority,
          status: selection.researchProposal.status,
          kak: selection.researchProposal.kak
            ? {
                id: selection.researchProposal.kak.id,
                code: selection.researchProposal.kak.code,
                status: selection.researchProposal.kak.status,
                version: selection.researchProposal.kak.version,
                estimatedStartDate: selection.researchProposal.kak.estimatedStartDate,
                estimatedEndDate: selection.researchProposal.kak.estimatedEndDate,
                rab: selection.researchProposal.kak.rab
                  ? {
                      id: selection.researchProposal.kak.rab.id,
                      code: selection.researchProposal.kak.rab.code,
                      status: selection.researchProposal.kak.rab.status,
                      totalAmount: rabTotal,
                    }
                  : null,
              }
            : null,
        }
      : null,
    documents: (selection.documents || []).map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      description: doc.description,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt,
    })),
  };
};

/**
 * Get available proposals ready for partner assignment (status READY_FOR_PARTNER without active selection)
 */
const getAvailableProposals = async () => {
  const proposals = await prisma.researchProposal.findMany({
    where: {
      status: 'READY_FOR_PARTNER',
      OR: [
        { partnerSelection: null },
        { partnerSelection: { status: 'CANCELLED' } },
      ],
    },
    include: {
      kak: {
        select: {
          id: true,
          code: true,
          status: true,
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
    },
    orderBy: { createdAt: 'desc' },
  });

  return proposals.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    priority: p.priority,
    status: p.status,
    kakCode: p.kak?.code || null,
    kakStatus: p.kak?.status || null,
    rabCode: p.kak?.rab?.code || null,
    rabTotalAmount: Number(p.kak?.rab?.totalAmount || 0),
  }));
};

/**
 * Get paginated list of partner selections
 */
const getPartnerSelections = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.method) {
    where.method = query.method;
  }

  if (query.partnerId) {
    where.partnerId = query.partnerId;
  }

  if (query.year) {
    where.code = { startsWith: `MTR-${query.year}-` };
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
      {
        partner: {
          name: { contains: query.search, mode: 'insensitive' },
        },
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.researchPartnerSelection.count({ where }),
    prisma.researchPartnerSelection.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: selectionDetailInclude,
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: items.map(formatSelectionResponse),
  };
};

/**
 * Get partner selection by ID
 */
const getPartnerSelectionById = async (id) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id },
    include: selectionDetailInclude,
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  return formatSelectionResponse(selection);
};

/**
 * Get selection summary
 */
const getPartnerSelectionSummary = async (id) => {
  const sel = await getPartnerSelectionById(id);
  return {
    selectionId: sel.id,
    code: sel.code,
    method: sel.method,
    status: sel.status,
    proposal: sel.proposal,
    partner: sel.partner,
    rabAmount: sel.rabAmount,
    estimatedValue: sel.estimatedValue,
    finalValue: sel.finalValue,
    budgetWarning: sel.budgetWarning,
    budgetWarningMessage: sel.budgetWarningMessage,
  };
};

/**
 * Create a new partner selection for proposal
 */
const createPartnerSelection = async (data, userId) => {
  const proposal = await prisma.researchProposal.findFirst({
    where: {
      OR: [
        { id: data.researchProposalId },
        { code: data.researchProposalId },
      ],
    },
    include: {
      kak: {
        include: { rab: true },
      },
      partnerSelection: true,
    },
  });

  if (!proposal) {
    const error = new Error(`Research proposal with ID ${data.researchProposalId} not found.`);
    error.statusCode = 404;
    error.code = 'RESEARCH_PROPOSAL_NOT_FOUND';
    throw error;
  }

  // 1. Proposal must be READY_FOR_PARTNER, SELECTED, or MITRA_SELECTED
  if (!['READY_FOR_PARTNER', 'SELECTED', 'MITRA_SELECTED', 'READY_FOR_IMPLEMENTATION'].includes(proposal.status)) {
    const error = new Error(
      `Proposal dengan status "${proposal.status}" belum siap untuk pemilihan mitra. KAK dan RAB harus difinalisasi terlebih dahulu.`
    );
    error.statusCode = 400;
    error.code = 'PROPOSAL_NOT_READY_FOR_PARTNER';
    throw error;
  }

  // 2. Concurrency / duplicate active selection check: if exists, update smoothly
  if (proposal.partnerSelection && proposal.partnerSelection.status !== 'CANCELLED') {
    return updatePartnerSelection(proposal.partnerSelection.id, data, userId);
  }

  // 3. Partner validation (if provided)
  if (data.partnerId) {
    const partner = await prisma.researchPartner.findUnique({ where: { id: data.partnerId } });
    if (!partner) {
      const error = new Error(`Mitra dengan ID ${data.partnerId} tidak ditemukan.`);
      error.statusCode = 404;
      error.code = 'PARTNER_NOT_FOUND';
      throw error;
    }
  }

  const code = await generateSelectionCode();

  const selection = await prisma.researchPartnerSelection.create({
    data: {
      code,
      researchProposalId: proposal.id,
      method: data.method,
      status: 'DRAFT',
      partnerId: data.partnerId || null,
      justification: data.justification || null,
      externalSystem: data.externalSystem || null,
      externalReference: data.externalReference || null,
      externalUrl: data.externalUrl || null,
      selfManagementType: data.selfManagementType || null,
      responsiblePerson: data.responsiblePerson || null,
      implementationTeam: data.implementationTeam || null,
      eCatalogProvider: data.eCatalogProvider || null,
      eCatalogProductId: data.eCatalogProductId || null,
      eCatalogTransactionReference: data.eCatalogTransactionReference || null,
      eCatalogUrl: data.eCatalogUrl || null,
      tenderNumber: data.tenderNumber || null,
      tenderSystem: data.tenderSystem || null,
      tenderUrl: data.tenderUrl || null,
      winnerReference: data.winnerReference || null,
      estimatedValue: typeof data.estimatedValue === 'number' ? new Prisma.Decimal(data.estimatedValue) : null,
      finalValue: typeof data.finalValue === 'number' ? new Prisma.Decimal(data.finalValue) : null,
      selectionDate: data.selectionDate ? new Date(data.selectionDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes || null,
      createdById: userId,
    },
  });

  logAudit({
    userId,
    action: 'PARTNER_SELECTION_CREATED',
    entity: 'ResearchPartnerSelection',
    entityId: selection.id,
    metadata: { code: selection.code, proposalId: proposal.id, method: data.method },
  });

  return getPartnerSelectionById(selection.id);
};

/**
 * Update partner selection draft or revision
 */
const updatePartnerSelection = async (id, data, userId) => {
  const selection = await prisma.researchPartnerSelection.findFirst({
    where: {
      OR: [
        { id },
        { researchProposalId: id },
        { code: id },
        { researchProposal: { code: id } },
      ],
    },
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  if (['SELECTED', 'CANCELLED'].includes(selection.status)) {
    const error = new Error(`Proses pemilihan mitra dengan status "${selection.status}" terkunci dan tidak dapat diubah.`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  if (data.partnerId) {
    const partner = await prisma.researchPartner.findUnique({ where: { id: data.partnerId } });
    if (!partner) {
      const error = new Error(`Mitra dengan ID ${data.partnerId} tidak ditemukan.`);
      error.statusCode = 404;
      error.code = 'PARTNER_NOT_FOUND';
      throw error;
    }
  }

  const updatePayload = {};
  const fields = [
    'method',
    'partnerId',
    'justification',
    'externalSystem',
    'externalReference',
    'externalUrl',
    'selfManagementType',
    'responsiblePerson',
    'implementationTeam',
    'eCatalogProvider',
    'eCatalogProductId',
    'eCatalogTransactionReference',
    'eCatalogUrl',
    'tenderNumber',
    'tenderSystem',
    'tenderUrl',
    'winnerReference',
    'notes',
  ];

  for (const f of fields) {
    if (typeof data[f] !== 'undefined') {
      updatePayload[f] = data[f];
    }
  }

  if (typeof data.estimatedValue !== 'undefined') {
    updatePayload.estimatedValue = data.estimatedValue !== null ? new Prisma.Decimal(data.estimatedValue) : null;
  }
  if (typeof data.finalValue !== 'undefined') {
    updatePayload.finalValue = data.finalValue !== null ? new Prisma.Decimal(data.finalValue) : null;
  }
  if (typeof data.selectionDate !== 'undefined') {
    updatePayload.selectionDate = data.selectionDate ? new Date(data.selectionDate) : null;
  }
  if (typeof data.startDate !== 'undefined') {
    updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (typeof data.endDate !== 'undefined') {
    updatePayload.endDate = data.endDate ? new Date(data.endDate) : null;
  }

  const updated = await prisma.researchPartnerSelection.update({
    where: { id },
    data: updatePayload,
  });

  logAudit({
    userId,
    action: 'PARTNER_SELECTION_UPDATED',
    entity: 'ResearchPartnerSelection',
    entityId: id,
    metadata: { updatedFields: Object.keys(updatePayload) },
  });

  return getPartnerSelectionById(updated.id);
};

/**
 * Submit partner selection for review
 */
const submitPartnerSelection = async (id, userId) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id },
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(selection.status)) {
    const error = new Error(`Proses pemilihan mitra dengan status "${selection.status}" tidak dapat diajukan.`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  // Validate method partner requirement
  if (['PENUNJUKAN_LANGSUNG', 'E_KATALOG'].includes(selection.method) && !selection.partnerId) {
    const error = new Error(`Mitra peneliti wajib dipilih sebelum pengajuan untuk metode ${selection.method}.`);
    error.statusCode = 422;
    error.code = 'PARTNER_REQUIRED_FOR_METHOD';
    throw error;
  }

  const updated = await prisma.researchPartnerSelection.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedById: userId,
      submittedAt: new Date(),
    },
  });

  logAudit({
    userId,
    action: 'PARTNER_SELECTION_SUBMITTED',
    entity: 'ResearchPartnerSelection',
    entityId: id,
    metadata: { status: 'SUBMITTED' },
  });

  return getPartnerSelectionById(updated.id);
};

/**
 * Return partner selection for revision
 */
const returnPartnerSelection = async (id, reviewNote, userId) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id },
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  if (selection.status !== 'SUBMITTED') {
    const error = new Error(
      `Hanya proses pemilihan mitra dengan status "SUBMITTED" yang dapat dikembalikan untuk revisi. Status saat ini: "${selection.status}".`
    );
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_SUBMITTED';
    throw error;
  }

  if (!reviewNote || reviewNote.trim().length < 5) {
    const error = new Error('Catatan telaah pemilihan mitra (reviewNote) wajib diisi minimal 5 karakter.');
    error.statusCode = 422;
    error.code = 'REVIEW_NOTE_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchPartnerSelection.update({
    where: { id },
    data: {
      status: 'REVISION_REQUIRED',
      reviewNote: reviewNote.trim(),
    },
  });

  logAudit({
    userId,
    action: 'PARTNER_SELECTION_RETURNED',
    entity: 'ResearchPartnerSelection',
    entityId: id,
    metadata: { reviewNote },
  });

  return getPartnerSelectionById(updated.id);
};

/**
 * Finalize partner selection
 * - selection.status: SELECTED
 * - proposal.status: READY_FOR_IMPLEMENTATION
 */
const finalizePartnerSelection = async (id, userId) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id },
    include: {
      researchProposal: {
        include: {
          kak: {
            include: { rab: true },
          },
        },
      },
    },
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  if (selection.status === 'SELECTED') {
    const error = new Error('Pemilihan mitra sudah berstatus SELECTED.');
    error.statusCode = 409;
    error.code = 'SELECTION_ALREADY_FINALIZED';
    throw error;
  }

  if (selection.status !== 'SUBMITTED') {
    const error = new Error(
      `Hanya proses pemilihan dengan status SUBMITTED yang dapat difinalisasi. Status saat ini: "${selection.status}".`
    );
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_SUBMITTED';
    throw error;
  }

  const proposal = selection.researchProposal;
  if (!proposal || proposal.status !== 'READY_FOR_PARTNER') {
    const error = new Error(
      `Proposal penelitian harus berstatus READY_FOR_PARTNER untuk dapat difinalisasi mitranya.`
    );
    error.statusCode = 400;
    error.code = 'PROPOSAL_NOT_READY_FOR_PARTNER';
    throw error;
  }

  if (proposal.kak?.status !== 'FINALIZED' || proposal.kak?.rab?.status !== 'FINALIZED') {
    const error = new Error('KAK dan RAB proposal harus telah difinalisasi.');
    error.statusCode = 400;
    error.code = 'PLANNING_NOT_FINALIZED';
    throw error;
  }

  // Method partner requirement check upon finalization
  if (selection.method !== 'SWAKELOLA' && !selection.partnerId) {
    const error = new Error(`Mitra peneliti wajib ditetapkan sebelum finalisasi untuk metode ${selection.method}.`);
    error.statusCode = 422;
    error.code = 'PARTNER_REQUIRED_FOR_FINALIZATION';
    throw error;
  }

  // Atomic database transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update selection to SELECTED
    await tx.researchPartnerSelection.update({
      where: { id },
      data: {
        status: 'SELECTED',
        finalizedById: userId,
        finalizedAt: new Date(),
      },
    });

    // 2. Update proposal to READY_FOR_IMPLEMENTATION
    await tx.researchProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'READY_FOR_IMPLEMENTATION',
      },
    });
  });

  logAudit({
    userId,
    action: 'PARTNER_SELECTION_SELECTED',
    entity: 'ResearchPartnerSelection',
    entityId: id,
    metadata: {
      proposalId: proposal.id,
      method: selection.method,
      partnerId: selection.partnerId,
      newProposalStatus: 'READY_FOR_IMPLEMENTATION',
    },
  });

  return getPartnerSelectionById(id);
};

/**
 * Cancel partner selection draft
 */
const cancelPartnerSelection = async (id, reason, userId) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id },
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  if (selection.status === 'SELECTED') {
    const error = new Error('Pemilihan mitra yang sudah SELECTED tidak dapat dibatalkan.');
    error.statusCode = 409;
    error.code = 'SELECTION_CANNOT_BE_CANCELLED';
    throw error;
  }

  if (selection.status === 'CANCELLED') {
    const error = new Error('Pemilihan mitra sudah berstatus CANCELLED.');
    error.statusCode = 409;
    error.code = 'SELECTION_ALREADY_CANCELLED';
    throw error;
  }

  if (!reason || reason.trim().length < 5) {
    const error = new Error('Alasan pembatalan (reason) wajib diisi minimal 5 karakter.');
    error.statusCode = 400;
    error.code = 'CANCEL_REASON_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchPartnerSelection.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelReason: reason.trim(),
    },
  });

  logAudit({
    userId,
    action: 'PARTNER_SELECTION_CANCELLED',
    entity: 'ResearchPartnerSelection',
    entityId: id,
    metadata: { reason },
  });

  return getPartnerSelectionById(updated.id);
};

/**
 * Aggregated statistics for partner selection dashboard
 */
const getPartnerSelectionStatistics = async (query = {}) => {
  const [totalReady, selections] = await Promise.all([
    prisma.researchProposal.count({ where: { status: 'READY_FOR_PARTNER' } }),
    prisma.researchPartnerSelection.findMany({
      select: { id: true, status: true, method: true },
    }),
  ]);

  const stats = {
    totalReadyForPartner: totalReady,
    draft: 0,
    submitted: 0,
    revisionRequired: 0,
    selected: 0,
    cancelled: 0,
    byMethod: {
      SWAKELOLA: 0,
      PENUNJUKAN_LANGSUNG: 0,
      E_KATALOG: 0,
      TENDER: 0,
    },
  };

  for (const s of selections) {
    if (s.status === 'DRAFT') stats.draft++;
    else if (s.status === 'SUBMITTED') stats.submitted++;
    else if (s.status === 'REVISION_REQUIRED') stats.revisionRequired++;
    else if (s.status === 'SELECTED') stats.selected++;
    else if (s.status === 'CANCELLED') stats.cancelled++;

    if (stats.byMethod[s.method] !== undefined) {
      stats.byMethod[s.method]++;
    }
  }

  return stats;
};

module.exports = {
  generateSelectionCode,
  getAvailableProposals,
  getPartnerSelections,
  getPartnerSelectionById,
  getPartnerSelectionSummary,
  createPartnerSelection,
  updatePartnerSelection,
  submitPartnerSelection,
  returnPartnerSelection,
  finalizePartnerSelection,
  cancelPartnerSelection,
  getPartnerSelectionStatistics,
};
