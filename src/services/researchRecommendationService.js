const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

/**
 * Create a new recommendation from an approved policy brief
 */
const createRecommendation = async (policyBriefId, data, userId) => {
  const policyBrief = await prisma.policyBrief.findUnique({
    where: { id: policyBriefId },
  });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  // Policy Brief must be APPROVED
  if (policyBrief.status !== 'APPROVED') {
    const error = new Error(
      `Rekomendasi hanya dapat dibuat apabila policy brief telah disetujui (status "APPROVED"). Status policy brief saat ini: "${policyBrief.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'POLICY_BRIEF_NOT_APPROVED';
    throw error;
  }

  // Target OPD must exist
  const opd = await prisma.oPD.findUnique({
    where: { id: data.targetOpdId },
  });

  if (!opd) {
    const error = new Error('Target OPD tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'OPD_NOT_FOUND';
    throw error;
  }

  const recommendation = await prisma.researchRecommendation.create({
    data: {
      policyBriefId,
      title: data.title,
      recommendationType: data.recommendationType || 'POLICY',
      targetOpdId: data.targetOpdId,
      problem: data.problem,
      basis: data.basis,
      recommendation: data.recommendation,
      expectedImpact: data.expectedImpact || null,
      priority: data.priority || 'MEDIUM',
      status: 'DRAFT',
      createdById: userId,
    },
    include: {
      targetOpd: { select: { id: true, code: true, name: true, shortName: true } },
      policyBrief: { select: { id: true, title: true, status: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await logAudit(
    userId,
    'RECOMMENDATION_CREATED',
    'ResearchRecommendation',
    recommendation.id,
    {
      title: recommendation.title,
      policyBriefId,
      targetOpdId: data.targetOpdId,
      priority: recommendation.priority,
    }
  );

  return recommendation;
};

/**
 * Get recommendations with filters and pagination
 */
const getRecommendations = async ({
  search,
  status,
  priority,
  recommendationType,
  targetOpdId,
  year,
  page = 1,
  limit = 10,
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (recommendationType) where.recommendationType = recommendationType;
  if (targetOpdId) where.targetOpdId = targetOpdId;

  if (year) {
    const startYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endYear = new Date(`${year}-12-31T23:59:59.999Z`);
    where.createdAt = { gte: startYear, lte: endYear };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { problem: { contains: search, mode: 'insensitive' } },
      { basis: { contains: search, mode: 'insensitive' } },
      { recommendation: { contains: search, mode: 'insensitive' } },
      { targetOpd: { name: { contains: search, mode: 'insensitive' } } },
      { targetOpd: { shortName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.researchRecommendation.count({ where }),
    prisma.researchRecommendation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        targetOpd: { select: { id: true, code: true, name: true, shortName: true } },
        policyBrief: {
          select: {
            id: true,
            title: true,
            status: true,
            report: {
              select: {
                id: true,
                title: true,
                implementation: {
                  select: { id: true, code: true },
                },
              },
            },
          },
        },
        createdBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
        _count: { select: { documents: true, reviews: true } },
      },
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take) || 1,
    },
  };
};

/**
 * Get recommendation detail by ID
 */
const getRecommendationById = async (id) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
    include: {
      targetOpd: true,
      policyBrief: {
        include: {
          report: {
            include: {
              implementation: {
                include: {
                  researchProposal: true,
                  partnerSelection: { include: { partner: true } },
                },
              },
            },
          },
        },
      },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      updatedBy: { select: { id: true, name: true, email: true, role: true } },
      approvedBy: { select: { id: true, name: true, email: true, role: true } },
      documents: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true } } },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  return recommendation;
};

/**
 * Update recommendation
 */
const updateRecommendation = async (id, data, userId) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (['APPROVED', 'PUBLISHED'].includes(recommendation.status)) {
    const error = new Error(
      `Rekomendasi dengan status "${recommendation.status}" terkunci dan tidak dapat diubah.`
    );
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_NOT_EDITABLE';
    throw error;
  }

  if (data.targetOpdId) {
    const opd = await prisma.oPD.findUnique({ where: { id: data.targetOpdId } });
    if (!opd) {
      const error = new Error('Target OPD tidak ditemukan');
      error.statusCode = 404;
      error.errorCode = 'OPD_NOT_FOUND';
      throw error;
    }
  }

  const updated = await prisma.researchRecommendation.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : recommendation.title,
      recommendationType: data.recommendationType !== undefined ? data.recommendationType : recommendation.recommendationType,
      targetOpdId: data.targetOpdId !== undefined ? data.targetOpdId : recommendation.targetOpdId,
      problem: data.problem !== undefined ? data.problem : recommendation.problem,
      basis: data.basis !== undefined ? data.basis : recommendation.basis,
      recommendation: data.recommendation !== undefined ? data.recommendation : recommendation.recommendation,
      expectedImpact: data.expectedImpact !== undefined ? data.expectedImpact : recommendation.expectedImpact,
      priority: data.priority !== undefined ? data.priority : recommendation.priority,
      updatedById: userId,
    },
  });

  await logAudit(userId, 'RECOMMENDATION_UPDATED', 'ResearchRecommendation', id, {
    title: updated.title,
    priority: updated.priority,
  });

  return updated;
};

/**
 * Submit recommendation
 */
const submitRecommendation = async (id, userId) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(recommendation.status)) {
    const error = new Error(
      `Hanya rekomendasi berstatus "DRAFT" atau "REVISION_REQUIRED" yang dapat disubmit. Status saat ini: "${recommendation.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_CANNOT_BE_SUBMITTED';
    throw error;
  }

  const submitted = await prisma.researchRecommendation.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      updatedById: userId,
    },
  });

  await logAudit(userId, 'RECOMMENDATION_SUBMITTED', 'ResearchRecommendation', id, {
    title: submitted.title,
    submittedAt: submitted.submittedAt,
  });

  return submitted;
};

/**
 * Approve recommendation (KEPALA_BRIDA only)
 */
const approveRecommendation = async (id, { notes }, userId, userRole) => {
  if (userRole !== 'KEPALA_BRIDA') {
    const error = new Error('Hanya Kepala BRIDA yang memiliki kewenangan menyetujui rekomendasi.');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN_APPROVAL_AUTHORITY';
    throw error;
  }

  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (recommendation.status !== 'SUBMITTED') {
    const error = new Error(
      `Hanya rekomendasi dengan status "SUBMITTED" yang dapat disetujui. Status saat ini: "${recommendation.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_NOT_SUBMITTED';
    throw error;
  }

  const now = new Date();

  const [approvedRec, reviewRecord] = await prisma.$transaction([
    prisma.researchRecommendation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: now,
        updatedById: userId,
      },
    }),
    prisma.recommendationReview.create({
      data: {
        recommendationId: id,
        reviewerId: userId,
        decision: 'APPROVE',
        notes: notes || null,
      },
    }),
  ]);

  await logAudit(userId, 'RECOMMENDATION_APPROVED', 'ResearchRecommendation', id, {
    title: approvedRec.title,
    notes,
    approvedAt: now,
  });

  return { recommendation: approvedRec, review: reviewRecord };
};

/**
 * Request recommendation revision (KEPALA_BRIDA only)
 */
const requestRecommendationRevision = async (id, { notes }, userId, userRole) => {
  if (userRole !== 'KEPALA_BRIDA') {
    const error = new Error('Hanya Kepala BRIDA yang memiliki kewenangan meminta revisi rekomendasi.');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN_APPROVAL_AUTHORITY';
    throw error;
  }

  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (recommendation.status !== 'SUBMITTED') {
    const error = new Error(
      `Permintaan revisi hanya dapat dilakukan pada rekomendasi berstatus "SUBMITTED". Status saat ini: "${recommendation.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_NOT_SUBMITTED';
    throw error;
  }

  const [revisionRec, reviewRecord] = await prisma.$transaction([
    prisma.researchRecommendation.update({
      where: { id },
      data: {
        status: 'REVISION_REQUIRED',
        updatedById: userId,
      },
    }),
    prisma.recommendationReview.create({
      data: {
        recommendationId: id,
        reviewerId: userId,
        decision: 'REVISION',
        notes: notes || null,
      },
    }),
  ]);

  await logAudit(userId, 'RECOMMENDATION_REVISION_REQUIRED', 'ResearchRecommendation', id, {
    title: revisionRec.title,
    notes,
  });

  return { recommendation: revisionRec, review: reviewRecord };
};

/**
 * Publish recommendation to target OPD (KEPALA_BRIDA only)
 */
const publishRecommendation = async (id, userId, userRole) => {
  if (userRole !== 'KEPALA_BRIDA') {
    const error = new Error('Hanya Kepala BRIDA yang memiliki kewenangan menerbitkan rekomendasi ke OPD.');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN_PUBLISH_AUTHORITY';
    throw error;
  }

  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (recommendation.status !== 'APPROVED') {
    const error = new Error(
      `Hanya rekomendasi dengan status "APPROVED" yang dapat diterbitkan. Status saat ini: "${recommendation.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_NOT_APPROVED';
    throw error;
  }

  const now = new Date();

  const publishedRec = await prisma.researchRecommendation.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: now,
      updatedById: userId,
    },
    include: {
      targetOpd: { select: { id: true, code: true, name: true } },
    },
  });

  await logAudit(userId, 'RECOMMENDATION_PUBLISHED', 'ResearchRecommendation', id, {
    title: publishedRec.title,
    targetOpdId: publishedRec.targetOpdId,
    publishedAt: now,
  });

  return publishedRec;
};

/**
 * Get published recommendations for target OPD
 */
const getOpdRecommendations = async (opdId, { search, priority, recommendationType, page = 1, limit = 10 }) => {
  if (!opdId) {
    const error = new Error('Pengguna tidak terafiliasi dengan OPD manapun');
    error.statusCode = 403;
    error.errorCode = 'USER_HAS_NO_OPD';
    throw error;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {
    targetOpdId: opdId,
    status: 'PUBLISHED',
  };

  if (priority) where.priority = priority;
  if (recommendationType) where.recommendationType = recommendationType;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { problem: { contains: search, mode: 'insensitive' } },
      { basis: { contains: search, mode: 'insensitive' } },
      { recommendation: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.researchRecommendation.count({ where }),
    prisma.researchRecommendation.findMany({
      where,
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        policyBrief: {
          select: {
            id: true,
            title: true,
            executiveSummary: true,
            report: {
              select: {
                id: true,
                title: true,
                implementation: {
                  select: {
                    id: true,
                    code: true,
                    researchProposal: { select: { id: true, code: true, title: true } },
                  },
                },
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            documentType: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take) || 1,
    },
  };
};

/**
 * Get published recommendation detail for OPD
 */
const getOpdRecommendationById = async (id, opdId, userId) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id },
    include: {
      targetOpd: true,
      policyBrief: {
        include: {
          report: {
            include: {
              implementation: {
                include: {
                  researchProposal: true,
                },
              },
            },
          },
        },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  // OPD can only view if targetOpdId === opdId AND status === 'PUBLISHED'
  if (recommendation.targetOpdId !== opdId || recommendation.status !== 'PUBLISHED') {
    const error = new Error('Anda tidak memiliki akses ke rekomendasi ini');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN_OPD_ACCESS';
    throw error;
  }

  // Record audit log for OPD viewing
  await logAudit(
    userId,
    'RECOMMENDATION_VIEWED_BY_OPD',
    'ResearchRecommendation',
    id,
    { opdId, title: recommendation.title }
  );

  return {
    recommendation: {
      id: recommendation.id,
      title: recommendation.title,
      recommendationType: recommendation.recommendationType,
      problem: recommendation.problem,
      basis: recommendation.basis,
      recommendation: recommendation.recommendation,
      expectedImpact: recommendation.expectedImpact,
      priority: recommendation.priority,
      status: recommendation.status,
      publishedAt: recommendation.publishedAt,
    },
    targetOpd: recommendation.targetOpd,
    policyBrief: {
      id: recommendation.policyBrief.id,
      title: recommendation.policyBrief.title,
      executiveSummary: recommendation.policyBrief.executiveSummary,
      problemStatement: recommendation.policyBrief.problemStatement,
      researchFindings: recommendation.policyBrief.researchFindings,
      policyOptions: recommendation.policyBrief.policyOptions,
      recommendedPolicy: recommendation.policyBrief.recommendedPolicy,
      conclusion: recommendation.policyBrief.conclusion,
    },
    researchReport: {
      id: recommendation.policyBrief.report.id,
      title: recommendation.policyBrief.report.title,
      summary: recommendation.policyBrief.report.summary,
    },
    research: {
      proposalId: recommendation.policyBrief.report.implementation.researchProposal.id,
      proposalCode: recommendation.policyBrief.report.implementation.researchProposal.code,
      proposalTitle: recommendation.policyBrief.report.implementation.researchProposal.title,
      implementationCode: recommendation.policyBrief.report.implementation.code,
    },
    basis: recommendation.basis,
    expectedImpact: recommendation.expectedImpact,
    publishedAt: recommendation.publishedAt,
    documents: recommendation.documents.map((d) => ({
      id: d.id,
      filename: d.fileName,
      type: d.documentType,
      size: d.fileSize,
      mimeType: d.mimeType,
      createdAt: d.createdAt,
      downloadUrl: `/uploads/${path.basename(d.filePath)}`,
    })),
  };
};

/**
 * Get recommendation statistics
 */
const getRecommendationStatistics = async () => {
  const [total, draft, submitted, revisionRequired, approved, published] =
    await Promise.all([
      prisma.researchRecommendation.count(),
      prisma.researchRecommendation.count({ where: { status: 'DRAFT' } }),
      prisma.researchRecommendation.count({ where: { status: 'SUBMITTED' } }),
      prisma.researchRecommendation.count({ where: { status: 'REVISION_REQUIRED' } }),
      prisma.researchRecommendation.count({ where: { status: 'APPROVED' } }),
      prisma.researchRecommendation.count({ where: { status: 'PUBLISHED' } }),
    ]);

  return {
    total,
    draft,
    submitted,
    revisionRequired,
    approved,
    published,
  };
};

/**
 * Upload recommendation document
 */
const uploadRecommendationDocument = async (recommendationId, file, data, userId) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!recommendation) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (recommendation.status === 'PUBLISHED') {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Tidak dapat mengunggah dokumen pada rekomendasi yang telah diterbitkan (PUBLISHED).');
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_NOT_EDITABLE';
    throw error;
  }

  const existingCount = await prisma.recommendationDocument.count({
    where: { recommendationId },
  });

  const version = data.version || `v${existingCount + 1}`;

  const doc = await prisma.recommendationDocument.create({
    data: {
      recommendationId,
      documentType: data.documentType || 'RECOMMENDATION_LETTER',
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      version,
      description: data.description || null,
      uploadedById: userId,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit(
    userId,
    'RECOMMENDATION_DOCUMENT_UPLOADED',
    'RecommendationDocument',
    doc.id,
    { recommendationId, fileName: doc.fileName, version }
  );

  return doc;
};

/**
 * Get recommendation documents
 */
const getRecommendationDocuments = async (recommendationId) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  const documents = await prisma.recommendationDocument.findMany({
    where: { recommendationId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  return documents.map((doc) => ({
    id: doc.id,
    filename: doc.fileName,
    type: doc.documentType,
    version: doc.version,
    size: doc.fileSize,
    mimeType: doc.mimeType,
    description: doc.description,
    uploadedBy: doc.uploadedBy,
    createdAt: doc.createdAt,
    downloadUrl: `/uploads/${path.basename(doc.filePath)}`,
  }));
};

/**
 * Delete recommendation document
 */
const deleteRecommendationDocument = async (recommendationId, documentId, userId) => {
  const recommendation = await prisma.researchRecommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!recommendation) {
    const error = new Error('Rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'RECOMMENDATION_NOT_FOUND';
    throw error;
  }

  if (['APPROVED', 'PUBLISHED'].includes(recommendation.status)) {
    const error = new Error(
      `Dokumen rekomendasi tidak dapat dihapus saat berstatus "${recommendation.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'RECOMMENDATION_NOT_EDITABLE';
    throw error;
  }

  const doc = await prisma.recommendationDocument.findFirst({
    where: { id: documentId, recommendationId },
  });

  if (!doc) {
    const error = new Error('Dokumen rekomendasi tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  if (fs.existsSync(doc.filePath)) {
    try {
      fs.unlinkSync(doc.filePath);
    } catch (e) {
      console.warn('Gagal menghapus berkas fisik dokumen rekomendasi:', e.message);
    }
  }

  await prisma.recommendationDocument.delete({ where: { id: documentId } });

  await logAudit(
    userId,
    'RECOMMENDATION_DOCUMENT_DELETED',
    'RecommendationDocument',
    documentId,
    { recommendationId, fileName: doc.fileName }
  );

  return { message: 'Dokumen rekomendasi berhasil dihapus.' };
};

module.exports = {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  updateRecommendation,
  submitRecommendation,
  approveRecommendation,
  requestRecommendationRevision,
  publishRecommendation,
  getOpdRecommendations,
  getOpdRecommendationById,
  getRecommendationStatistics,
  uploadRecommendationDocument,
  getRecommendationDocuments,
  deleteRecommendationDocument,
};
