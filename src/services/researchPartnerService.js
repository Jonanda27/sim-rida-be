const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

const formatPartnerResponse = (partner) => {
  if (!partner) return null;

  return {
    id: partner.id,
    name: partner.name,
    type: partner.type,
    institutionName: partner.institutionName,
    contactPerson: partner.contactPerson,
    email: partner.email,
    phone: partner.phone,
    address: partner.address,
    taxIdentifier: partner.taxIdentifier,
    registrationNumber: partner.registrationNumber,
    website: partner.website,
    description: partner.description,
    isActive: partner.isActive,
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
    createdBy: partner.createdBy || null,
    selectionsCount: partner._count?.selections ?? (partner.selections?.length || 0),
    activeSelections: partner.selections
      ? partner.selections.map((sel) => ({
          id: sel.id,
          code: sel.code,
          method: sel.method,
          status: sel.status,
          finalValue: Number(sel.finalValue || 0),
          proposal: sel.researchProposal
            ? {
                id: sel.researchProposal.id,
                code: sel.researchProposal.code,
                title: sel.researchProposal.title,
                status: sel.researchProposal.status,
              }
            : null,
        }))
      : undefined,
  };
};

/**
 * Get paginated list of partners with search and filter
 */
const getPartners = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (typeof query.isActive !== 'undefined') {
    where.isActive = String(query.isActive).toLowerCase() === 'true';
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { institutionName: { contains: query.search, mode: 'insensitive' } },
      { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      { contactPerson: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.researchPartner.count({ where }),
    prisma.researchPartner.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { selections: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: items.map(formatPartnerResponse),
  };
};

/**
 * Get partner details by ID
 */
const getPartnerById = async (id) => {
  const partner = await prisma.researchPartner.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      selections: {
        orderBy: { createdAt: 'desc' },
        include: {
          researchProposal: {
            select: { id: true, code: true, title: true, status: true },
          },
        },
      },
    },
  });

  if (!partner) {
    const error = new Error(`Research Partner with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_NOT_FOUND';
    throw error;
  }

  return formatPartnerResponse(partner);
};

/**
 * Create a new partner (checks reasonable duplicates)
 */
const createPartner = async (data, userId) => {
  // Check duplicate by name or registrationNumber
  if (data.registrationNumber && data.registrationNumber.trim()) {
    const regCheck = await prisma.researchPartner.findFirst({
      where: {
        registrationNumber: { equals: data.registrationNumber.trim(), mode: 'insensitive' },
      },
    });
    if (regCheck) {
      const error = new Error(`Mitra dengan Nomor Registrasi / Izin "${data.registrationNumber}" sudah terdaftar.`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_PARTNER_REGISTRATION';
      throw error;
    }
  }

  const nameCheck = await prisma.researchPartner.findFirst({
    where: {
      name: { equals: data.name.trim(), mode: 'insensitive' },
      institutionName: data.institutionName ? { equals: data.institutionName.trim(), mode: 'insensitive' } : undefined,
    },
  });

  if (nameCheck) {
    return updatePartner(nameCheck.id, data, userId);
  }

  const partner = await prisma.researchPartner.create({
    data: {
      name: data.name.trim(),
      type: data.type || 'OTHER',
      institutionName: data.institutionName ? data.institutionName.trim() : null,
      contactPerson: data.contactPerson ? data.contactPerson.trim() : null,
      email: data.email ? data.email.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      address: data.address ? data.address.trim() : null,
      taxIdentifier: data.taxIdentifier ? data.taxIdentifier.trim() : null,
      registrationNumber: data.registrationNumber ? data.registrationNumber.trim() : null,
      website: data.website ? data.website.trim() : null,
      description: data.description ? data.description.trim() : null,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
      createdById: userId,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_PARTNER_CREATED',
    entity: 'ResearchPartner',
    entityId: partner.id,
    metadata: { name: partner.name, type: partner.type },
  });

  return formatPartnerResponse(partner);
};

/**
 * Update partner master data
 */
const updatePartner = async (id, data, userId) => {
  const existing = await prisma.researchPartner.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error(`Research Partner with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_NOT_FOUND';
    throw error;
  }

  const updateData = {};
  const allowedFields = [
    'name',
    'type',
    'institutionName',
    'contactPerson',
    'email',
    'phone',
    'address',
    'taxIdentifier',
    'registrationNumber',
    'website',
    'description',
    'isActive',
  ];

  for (const field of allowedFields) {
    if (typeof data[field] !== 'undefined') {
      updateData[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
    }
  }

  const updated = await prisma.researchPartner.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { selections: true } },
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_PARTNER_UPDATED',
    entity: 'ResearchPartner',
    entityId: id,
    metadata: { updatedFields: Object.keys(updateData) },
  });

  return formatPartnerResponse(updated);
};

/**
 * Deactivate partner (soft deactivation to preserve research history)
 */
const deactivatePartner = async (id, userId) => {
  const existing = await prisma.researchPartner.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error(`Research Partner with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_NOT_FOUND';
    throw error;
  }

  const updated = await prisma.researchPartner.update({
    where: { id },
    data: { isActive: false },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { selections: true } },
    },
  });

  logAudit({
    userId,
    action: 'RESEARCH_PARTNER_DEACTIVATED',
    entity: 'ResearchPartner',
    entityId: id,
    metadata: { name: updated.name },
  });

  return formatPartnerResponse(updated);
};

/**
 * Reactivate partner
 */
const reactivatePartner = async (id, userId) => {
  const existing = await prisma.researchPartner.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error(`Research Partner with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_NOT_FOUND';
    throw error;
  }

  const updated = await prisma.researchPartner.update({
    where: { id },
    data: { isActive: true },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { selections: true } },
    },
  });

  return formatPartnerResponse(updated);
};

/**
 * Hard delete partner only if never used
 */
const deletePartner = async (id, userId) => {
  const existing = await prisma.researchPartner.findUnique({
    where: { id },
    include: {
      _count: { select: { selections: true } },
    },
  });

  if (!existing) {
    const error = new Error(`Research Partner with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_NOT_FOUND';
    throw error;
  }

  if (existing._count.selections > 0) {
    const error = new Error(
      'Mitra tidak dapat dihapus karena telah tercatat dalam usulan/seleksi penelitian. Gunakan fitur nonaktifkan (deactivate).'
    );
    error.statusCode = 400;
    error.code = 'PARTNER_IN_USE';
    throw error;
  }

  await prisma.researchPartner.delete({ where: { id } });

  return { message: 'Mitra berhasil dihapus dari sistem.' };
};

/**
 * Get partner statistics
 */
const getPartnerStatistics = async () => {
  const [total, active, inactive, typesAgg] = await Promise.all([
    prisma.researchPartner.count(),
    prisma.researchPartner.count({ where: { isActive: true } }),
    prisma.researchPartner.count({ where: { isActive: false } }),
    prisma.researchPartner.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
  ]);

  const byType = {
    UNIVERSITY: 0,
    RESEARCH_INSTITUTION: 0,
    CONSULTANT: 0,
    COMPANY: 0,
    INDIVIDUAL: 0,
    INTERNAL_BRIDA: 0,
    OTHER: 0,
  };

  for (const item of typesAgg) {
    if (byType[item.type] !== undefined) {
      byType[item.type] = item._count.id;
    }
  }

  return {
    totalPartners: total,
    activePartners: active,
    inactivePartners: inactive,
    byType,
  };
};

module.exports = {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deactivatePartner,
  reactivatePartner,
  deletePartner,
  getPartnerStatistics,
};
