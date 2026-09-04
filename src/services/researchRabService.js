const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { Prisma } = require('@prisma/client');

/**
 * Generate sequential RAB code: RAB-{YEAR}-{XXX}
 */
const generateRabCode = async (year = new Date().getFullYear()) => {
  const prefix = `RAB-${year}-`;
  const latest = await prisma.researchRab.findFirst({
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

const rabDetailInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  submittedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  finalizedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  researchKak: {
    select: {
      id: true,
      code: true,
      status: true,
      version: true,
      researchProposal: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
        },
      },
    },
  },
  items: {
    orderBy: { order: 'asc' },
  },
};

/**
 * Format raw RAB record and compute category summary
 */
const formatRabResponse = (rab) => {
  if (!rab) return null;

  const items = (rab.items || []).map((item) => ({
    id: item.id,
    category: item.category,
    description: item.description,
    unit: item.unit,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
    order: item.order,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  // Group by category
  const categoryMap = {};
  for (const it of items) {
    if (!categoryMap[it.category]) {
      categoryMap[it.category] = { category: it.category, totalAmount: 0, itemsCount: 0 };
    }
    categoryMap[it.category].totalAmount += it.subtotal;
    categoryMap[it.category].itemsCount += 1;
  }

  const categorySummary = Object.values(categoryMap);

  return {
    id: rab.id,
    code: rab.code,
    version: rab.version,
    status: rab.status,
    totalAmount: Number(rab.totalAmount || 0),
    totalItems: items.length,
    notes: rab.notes,
    reviewNote: rab.reviewNote,
    cancelReason: rab.cancelReason,
    createdAt: rab.createdAt,
    updatedAt: rab.updatedAt,
    submittedAt: rab.submittedAt,
    finalizedAt: rab.finalizedAt,
    createdBy: rab.createdBy,
    submittedBy: rab.submittedBy,
    finalizedBy: rab.finalizedBy,
    researchKak: rab.researchKak
      ? {
          id: rab.researchKak.id,
          code: rab.researchKak.code,
          status: rab.researchKak.status,
          version: rab.researchKak.version,
          researchProposal: rab.researchKak.researchProposal || null,
        }
      : null,
    items,
    categorySummary,
  };
};

/**
 * Helper to recalculate and update totalAmount from items
 */
const recalculateRabTotal = async (rabId, tx = prisma) => {
  const items = await tx.researchRabItem.findMany({
    where: { researchRabId: rabId },
    select: { subtotal: true },
  });

  let sum = new Prisma.Decimal(0);
  for (const it of items) {
    sum = sum.plus(it.subtotal);
  }

  await tx.researchRab.update({
    where: { id: rabId },
    data: { totalAmount: sum },
  });

  return sum;
};

/**
 * Get paginated list of RABs
 */
const getRabs = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.researchKakId) {
    where.researchKakId = query.researchKakId;
  }

  if (query.year) {
    where.code = { startsWith: `RAB-${query.year}-` };
  }

  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      {
        researchKak: {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            {
              researchProposal: {
                title: { contains: query.search, mode: 'insensitive' },
              },
            },
          ],
        },
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.researchRab.count({ where }),
    prisma.researchRab.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: rabDetailInclude,
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: items.map(formatRabResponse),
  };
};

/**
 * Get detailed RAB by ID
 */
const getRabById = async (id) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id },
    include: rabDetailInclude,
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  return formatRabResponse(rab);
};

/**
 * Create a new RAB for an active KAK
 */
const createRab = async (data, userId) => {
  const kak = await prisma.researchKak.findUnique({
    where: { id: data.researchKakId },
  });

  if (!kak) {
    const error = new Error(`Research KAK with ID ${data.researchKakId} not found.`);
    error.statusCode = 404;
    error.code = 'KAK_NOT_FOUND';
    throw error;
  }

  if (kak.status === 'CANCELLED') {
    const error = new Error('Cannot create RAB for a CANCELLED KAK.');
    error.statusCode = 400;
    error.code = 'KAK_CANCELLED';
    throw error;
  }

  // Check duplicate RAB
  const existingRab = await prisma.researchRab.findUnique({
    where: { researchKakId: data.researchKakId },
  });

  if (existingRab) {
    return getRabById(existingRab.id);
  }

  const code = await generateRabCode();

  const rab = await prisma.researchRab.create({
    data: {
      code,
      researchKakId: data.researchKakId,
      version: 1,
      status: 'DRAFT',
      totalAmount: new Prisma.Decimal(0),
      notes: data.notes || null,
      createdById: userId,
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_CREATED',
    entity: 'ResearchRab',
    entityId: rab.id,
    metadata: {
      code: rab.code,
      kakId: data.researchKakId,
    },
  });

  return getRabById(rab.id);
};

/**
 * Add item to RAB
 */
const addRabItem = async (rabId, data, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id: rabId },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${rabId} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(rab.status)) {
    const error = new Error(`RAB with status "${rab.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_EDITABLE';
    throw error;
  }

  const rawQty = (typeof data.quantity !== 'undefined' && data.quantity !== null)
    ? data.quantity
    : ((typeof data.volume !== 'undefined' && data.volume !== null) ? data.volume : 1);
  const rawPrice = (typeof data.unitPrice !== 'undefined' && data.unitPrice !== null) ? data.unitPrice : 0;
  const rawDesc = data.description || [data.itemName || data.component, data.specification].filter(Boolean).join(' - ') || 'Item Belanja';
  const rawUnit = data.unit || 'Unit';

  const quantity = new Prisma.Decimal(rawQty);
  const unitPrice = new Prisma.Decimal(rawPrice);

  if (quantity.lte(0)) {
    const error = new Error('Volume/Quantity harus lebih besar dari 0.');
    error.statusCode = 422;
    error.code = 'INVALID_QUANTITY';
    throw error;
  }

  if (unitPrice.lt(0)) {
    const error = new Error('Harga satuan tidak boleh bernilai negatif.');
    error.statusCode = 422;
    error.code = 'INVALID_UNIT_PRICE';
    throw error;
  }

  // Backend calculates subtotal (ignores frontend subtotal)
  const subtotal = quantity.mul(unitPrice);

  await prisma.$transaction(async (tx) => {
    let order = data.order;
    if (typeof order !== 'number') {
      const lastItem = await tx.researchRabItem.findFirst({
        where: { researchRabId: rabId },
        orderBy: { order: 'desc' },
      });
      order = (lastItem?.order || 0) + 1;
    }

    await tx.researchRabItem.create({
      data: {
        researchRabId: rabId,
        category: data.category || 'OTHER',
        description: rawDesc,
        unit: rawUnit,
        quantity,
        unitPrice,
        subtotal,
        order,
        notes: data.notes || data.specification || null,
      },
    });

    await recalculateRabTotal(rabId, tx);
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_ITEM_CREATED',
    entity: 'ResearchRab',
    entityId: rabId,
    metadata: { description: data.description, subtotal: Number(subtotal) },
  });

  return getRabById(rabId);
};

/**
 * Update item in RAB
 */
const updateRabItem = async (rabId, itemId, data, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id: rabId },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${rabId} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(rab.status)) {
    const error = new Error(`RAB with status "${rab.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_EDITABLE';
    throw error;
  }

  const existingItem = await prisma.researchRabItem.findFirst({
    where: { id: itemId, researchRabId: rabId },
  });

  if (!existingItem) {
    const error = new Error(`RAB item with ID ${itemId} not found in this RAB.`);
    error.statusCode = 404;
    error.code = 'RAB_ITEM_NOT_FOUND';
    throw error;
  }

  const qtyVal = typeof data.quantity !== 'undefined' ? new Prisma.Decimal(data.quantity) : existingItem.quantity;
  const priceVal = typeof data.unitPrice !== 'undefined' ? new Prisma.Decimal(data.unitPrice) : existingItem.unitPrice;

  if (qtyVal.lte(0)) {
    const error = new Error('Volume/Quantity harus lebih besar dari 0.');
    error.statusCode = 422;
    error.code = 'INVALID_QUANTITY';
    throw error;
  }

  if (priceVal.lt(0)) {
    const error = new Error('Harga satuan tidak boleh bernilai negatif.');
    error.statusCode = 422;
    error.code = 'INVALID_UNIT_PRICE';
    throw error;
  }

  const subtotal = qtyVal.mul(priceVal);

  await prisma.$transaction(async (tx) => {
    await tx.researchRabItem.update({
      where: { id: itemId },
      data: {
        category: data.category || existingItem.category,
        description: data.description || existingItem.description,
        unit: data.unit || existingItem.unit,
        quantity: qtyVal,
        unitPrice: priceVal,
        subtotal,
        order: typeof data.order === 'number' ? data.order : existingItem.order,
        notes: typeof data.notes !== 'undefined' ? data.notes : existingItem.notes,
      },
    });

    await recalculateRabTotal(rabId, tx);
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_ITEM_UPDATED',
    entity: 'ResearchRab',
    entityId: rabId,
    metadata: { itemId, subtotal: Number(subtotal) },
  });

  return getRabById(rabId);
};

/**
 * Delete item from RAB
 */
const deleteRabItem = async (rabId, itemId, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id: rabId },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${rabId} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(rab.status)) {
    const error = new Error(`RAB with status "${rab.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_EDITABLE';
    throw error;
  }

  const existingItem = await prisma.researchRabItem.findFirst({
    where: { id: itemId, researchRabId: rabId },
  });

  if (!existingItem) {
    const error = new Error(`RAB item with ID ${itemId} not found in this RAB.`);
    error.statusCode = 404;
    error.code = 'RAB_ITEM_NOT_FOUND';
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.researchRabItem.delete({
      where: { id: itemId },
    });

    await recalculateRabTotal(rabId, tx);
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_ITEM_DELETED',
    entity: 'ResearchRab',
    entityId: rabId,
    metadata: { itemId },
  });

  return getRabById(rabId);
};

/**
 * Bulk set/update items in RAB (replaces all items)
 */
const bulkUpdateRabItems = async (rabId, itemsArray, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id: rabId },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${rabId} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(rab.status)) {
    const error = new Error(`RAB with status "${rab.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_EDITABLE';
    throw error;
  }

  // Pre-validate all items
  for (const it of itemsArray) {
    const q = new Prisma.Decimal(it.quantity);
    const p = new Prisma.Decimal(it.unitPrice);
    if (q.lte(0)) {
      const err = new Error(`Quantity untuk "${it.description}" harus lebih besar dari 0.`);
      err.statusCode = 422;
      err.code = 'INVALID_QUANTITY';
      throw err;
    }
    if (p.lt(0)) {
      const err = new Error(`Harga satuan untuk "${it.description}" tidak boleh bernilai negatif.`);
      err.statusCode = 422;
      err.code = 'INVALID_UNIT_PRICE';
      throw err;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.researchRabItem.deleteMany({
      where: { researchRabId: rabId },
    });

    let orderSeq = 1;
    for (const it of itemsArray) {
      const q = new Prisma.Decimal(it.quantity);
      const p = new Prisma.Decimal(it.unitPrice);
      const subtotal = q.mul(p);

      await tx.researchRabItem.create({
        data: {
          researchRabId: rabId,
          category: it.category || 'OTHER',
          description: it.description,
          unit: it.unit,
          quantity: q,
          unitPrice: p,
          subtotal,
          order: typeof it.order === 'number' ? it.order : orderSeq++,
          notes: it.notes || null,
        },
      });
    }

    await recalculateRabTotal(rabId, tx);
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_UPDATED',
    entity: 'ResearchRab',
    entityId: rabId,
    metadata: { itemsCount: itemsArray.length },
  });

  return getRabById(rabId);
};

/**
 * Reorder RAB items
 */
const reorderRabItems = async (rabId, orderItems, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id: rabId },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${rabId} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (['FINALIZED', 'CANCELLED'].includes(rab.status)) {
    const error = new Error(`RAB with status "${rab.status}" is locked and cannot be modified.`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_EDITABLE';
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    for (const it of orderItems) {
      await tx.researchRabItem.updateMany({
        where: { id: it.id, researchRabId: rabId },
        data: { order: it.order },
      });
    }
  });

  return getRabById(rabId);
};

/**
 * Get category summary of RAB
 */
const getRabSummary = async (id) => {
  const rab = await getRabById(id);
  return {
    rabId: rab.id,
    code: rab.code,
    totalAmount: rab.totalAmount,
    totalItems: rab.totalItems,
    categorySummary: rab.categorySummary,
  };
};

/**
 * Submit RAB for review
 */
const submitRab = async (id, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(rab.status)) {
    const error = new Error(`RAB with status "${rab.status}" cannot be submitted.`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_EDITABLE';
    throw error;
  }

  if (rab.items.length === 0) {
    const error = new Error('RAB tidak dapat diajukan karena belum memiliki item komponen biaya.');
    error.statusCode = 422;
    error.code = 'RAB_EMPTY';
    throw error;
  }

  if (new Prisma.Decimal(rab.totalAmount).lte(0)) {
    const error = new Error('RAB tidak dapat diajukan karena total anggaran harus lebih besar dari 0.');
    error.statusCode = 422;
    error.code = 'RAB_TOTAL_INVALID';
    throw error;
  }

  const updated = await prisma.researchRab.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedById: userId,
      submittedAt: new Date(),
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_SUBMITTED',
    entity: 'ResearchRab',
    entityId: id,
    metadata: { status: 'SUBMITTED', totalAmount: Number(rab.totalAmount) },
  });

  return getRabById(updated.id);
};

/**
 * Return RAB for revision
 */
const returnRab = async (id, reviewNote, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (rab.status !== 'SUBMITTED') {
    const error = new Error(`Only SUBMITTED RAB can be returned for revision. Current status: "${rab.status}".`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_SUBMITTED';
    throw error;
  }

  if (!reviewNote || reviewNote.trim().length < 5) {
    const error = new Error('Catatan telaah RAB (reviewNote) wajib diisi minimal 5 karakter.');
    error.statusCode = 422;
    error.code = 'REVIEW_NOTE_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchRab.update({
    where: { id },
    data: {
      status: 'REVISION_REQUIRED',
      version: rab.version + 1,
      reviewNote: reviewNote.trim(),
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_RETURNED',
    entity: 'ResearchRab',
    entityId: id,
    metadata: { reviewNote, version: updated.version },
  });

  return getRabById(updated.id);
};

/**
 * Finalize RAB individually
 */
const finalizeRab = async (id, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (rab.status === 'FINALIZED') {
    const error = new Error('RAB is already FINALIZED.');
    error.statusCode = 409;
    error.code = 'RAB_ALREADY_FINALIZED';
    throw error;
  }

  if (rab.status !== 'SUBMITTED') {
    const error = new Error(`Only SUBMITTED RAB can be finalized. Current status: "${rab.status}".`);
    error.statusCode = 409;
    error.code = 'RAB_NOT_SUBMITTED';
    throw error;
  }

  if (rab.items.length === 0) {
    const error = new Error('RAB cannot be finalized without budget items.');
    error.statusCode = 422;
    error.code = 'RAB_EMPTY';
    throw error;
  }

  const updated = await prisma.researchRab.update({
    where: { id },
    data: {
      status: 'FINALIZED',
      finalizedById: userId,
      finalizedAt: new Date(),
    },
    include: {
      researchKak: true,
    },
  });

  if (updated.researchKak?.researchProposalId) {
    if (updated.researchKak.status === 'FINALIZED') {
      await prisma.researchProposal.update({
        where: { id: updated.researchKak.researchProposalId },
        data: { status: 'READY_FOR_PARTNER' },
      });
    }
  }

  logAudit({
    userId,
    action: 'RESEARCH_RAB_FINALIZED',
    entity: 'ResearchRab',
    entityId: id,
    metadata: { status: 'FINALIZED', totalAmount: Number(rab.totalAmount) },
  });

  return getRabById(updated.id);
};

/**
 * Cancel RAB draft
 */
const cancelRab = async (id, reason, userId) => {
  const rab = await prisma.researchRab.findUnique({
    where: { id },
  });

  if (!rab) {
    const error = new Error(`Research RAB with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'RAB_NOT_FOUND';
    throw error;
  }

  if (rab.status === 'FINALIZED') {
    const error = new Error('Finalized RAB cannot be cancelled.');
    error.statusCode = 409;
    error.code = 'RAB_CANNOT_BE_CANCELLED';
    throw error;
  }

  if (rab.status === 'CANCELLED') {
    const error = new Error('RAB is already CANCELLED.');
    error.statusCode = 409;
    error.code = 'RAB_ALREADY_CANCELLED';
    throw error;
  }

  if (!reason || reason.trim().length < 5) {
    const error = new Error('Alasan pembatalan (reason) wajib diisi minimal 5 karakter.');
    error.statusCode = 400;
    error.code = 'CANCEL_REASON_REQUIRED';
    throw error;
  }

  const updated = await prisma.researchRab.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelReason: reason.trim(),
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_RAB_CANCELLED',
    entity: 'ResearchRab',
    entityId: id,
    metadata: { reason },
  });

  return getRabById(updated.id);
};

module.exports = {
  generateRabCode,
  getRabs,
  getRabById,
  createRab,
  addRabItem,
  updateRabItem,
  deleteRabItem,
  bulkUpdateRabItems,
  reorderRabItems,
  getRabSummary,
  submitRab,
  returnRab,
  finalizeRab,
  cancelRab,
  recalculateRabTotal,
};
