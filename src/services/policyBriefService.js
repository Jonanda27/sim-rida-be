const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

/**
 * Create a new Policy Brief from an approved research report
 */
const createPolicyBrief = async (reportId, data, userId) => {
  const report = await prisma.researchReport.findUnique({
    where: { id: reportId },
    include: { implementation: true },
  });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  // Report must be APPROVED
  if (report.status !== 'APPROVED') {
    const error = new Error(
      `Policy brief hanya dapat dibuat apabila laporan akhir telah disetujui (status "APPROVED"). Status laporan saat ini: "${report.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'REPORT_NOT_APPROVED';
    throw error;
  }

  const existingCount = await prisma.policyBrief.count({
    where: { reportId },
  });

  const version = `v${existingCount + 1}`;

  const policyBrief = await prisma.policyBrief.create({
    data: {
      reportId,
      title: data.title,
      version,
      status: 'DRAFT',
      executiveSummary: data.executiveSummary || null,
      problemStatement: data.problemStatement || null,
      researchFindings: data.researchFindings || null,
      policyOptions: data.policyOptions || null,
      recommendedPolicy: data.recommendedPolicy || null,
      conclusion: data.conclusion || null,
      createdById: userId,
    },
    include: {
      report: {
        select: {
          id: true,
          title: true,
          status: true,
          implementation: {
            select: { id: true, code: true },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  await logAudit(
    userId,
    'POLICY_BRIEF_CREATED',
    'PolicyBrief',
    policyBrief.id,
    { title: policyBrief.title, reportId, version }
  );

  return policyBrief;
};

/**
 * Get policy briefs with filters and pagination
 */
const getPolicyBriefs = async ({
  search,
  status,
  reportId,
  page = 1,
  limit = 10,
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (status) where.status = status;
  if (reportId) where.reportId = reportId;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { executiveSummary: { contains: search, mode: 'insensitive' } },
      { problemStatement: { contains: search, mode: 'insensitive' } },
      { report: { title: { contains: search, mode: 'insensitive' } } },
      {
        report: {
          implementation: {
            code: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.policyBrief.count({ where }),
    prisma.policyBrief.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        report: {
          select: {
            id: true,
            title: true,
            status: true,
            implementation: {
              select: {
                id: true,
                code: true,
                researchProposal: {
                  select: { id: true, code: true, title: true },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            documents: true,
            recommendations: true,
            reviews: true,
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
 * Get policy brief detail by ID
 */
const getPolicyBriefById = async (id) => {
  const policyBrief = await prisma.policyBrief.findUnique({
    where: { id },
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
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      updatedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, name: true, role: true } },
        },
      },
      recommendations: {
        orderBy: { createdAt: 'desc' },
        include: {
          targetOpd: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  return policyBrief;
};

/**
 * Update policy brief
 */
const updatePolicyBrief = async (id, data, userId) => {
  const policyBrief = await prisma.policyBrief.findUnique({ where: { id } });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  if (policyBrief.status === 'APPROVED') {
    const error = new Error('Policy brief yang telah disetujui (APPROVED) terkunci dan tidak dapat diubah.');
    error.statusCode = 409;
    error.errorCode = 'POLICY_BRIEF_NOT_EDITABLE';
    throw error;
  }

  const updated = await prisma.policyBrief.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : policyBrief.title,
      executiveSummary: data.executiveSummary !== undefined ? data.executiveSummary : policyBrief.executiveSummary,
      problemStatement: data.problemStatement !== undefined ? data.problemStatement : policyBrief.problemStatement,
      researchFindings: data.researchFindings !== undefined ? data.researchFindings : policyBrief.researchFindings,
      policyOptions: data.policyOptions !== undefined ? data.policyOptions : policyBrief.policyOptions,
      recommendedPolicy: data.recommendedPolicy !== undefined ? data.recommendedPolicy : policyBrief.recommendedPolicy,
      conclusion: data.conclusion !== undefined ? data.conclusion : policyBrief.conclusion,
      updatedById: userId,
    },
  });

  await logAudit(userId, 'POLICY_BRIEF_UPDATED', 'PolicyBrief', id, {
    title: updated.title,
  });

  return updated;
};

/**
 * Submit policy brief
 */
const submitPolicyBrief = async (id, userId) => {
  const policyBrief = await prisma.policyBrief.findUnique({ where: { id } });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(policyBrief.status)) {
    const error = new Error(
      `Hanya policy brief berstatus "DRAFT" atau "REVISION_REQUIRED" yang dapat disubmit. Status saat ini: "${policyBrief.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'POLICY_BRIEF_CANNOT_BE_SUBMITTED';
    throw error;
  }

  const submitted = await prisma.policyBrief.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      updatedById: userId,
    },
  });

  await logAudit(userId, 'POLICY_BRIEF_SUBMITTED', 'PolicyBrief', id, {
    title: submitted.title,
    submittedAt: submitted.submittedAt,
  });

  return submitted;
};

/**
 * Review policy brief
 */
const reviewPolicyBrief = async (id, { decision, notes }, userId) => {
  const policyBrief = await prisma.policyBrief.findUnique({ where: { id } });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  if (policyBrief.status !== 'SUBMITTED') {
    const error = new Error(
      `Review hanya dapat dilakukan pada policy brief berstatus "SUBMITTED". Status saat ini: "${policyBrief.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'POLICY_BRIEF_NOT_IN_SUBMITTED_STATUS';
    throw error;
  }

  let newStatus = 'SUBMITTED';
  let auditAction = 'POLICY_BRIEF_REVIEWED';

  if (decision === 'APPROVE') {
    newStatus = 'APPROVED';
    auditAction = 'POLICY_BRIEF_APPROVED';
  } else if (decision === 'REVISION') {
    newStatus = 'REVISION_REQUIRED';
    auditAction = 'POLICY_BRIEF_REVISION_REQUIRED';
  }

  const now = new Date();

  const [updatedPolicyBrief, reviewRecord] = await prisma.$transaction([
    prisma.policyBrief.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: now,
        approvedAt: decision === 'APPROVE' ? now : policyBrief.approvedAt,
        updatedById: userId,
      },
    }),
    prisma.policyBriefReview.create({
      data: {
        policyBriefId: id,
        reviewerId: userId,
        decision,
        notes: notes || null,
      },
    }),
  ]);

  await logAudit(userId, auditAction, 'PolicyBrief', id, {
    decision,
    notes,
    newStatus,
  });

  return { policyBrief: updatedPolicyBrief, review: reviewRecord };
};

/**
 * Get policy brief statistics
 */
const getPolicyBriefStatistics = async () => {
  const [total, draft, submitted, revisionRequired, approved] =
    await Promise.all([
      prisma.policyBrief.count(),
      prisma.policyBrief.count({ where: { status: 'DRAFT' } }),
      prisma.policyBrief.count({ where: { status: 'SUBMITTED' } }),
      prisma.policyBrief.count({ where: { status: 'REVISION_REQUIRED' } }),
      prisma.policyBrief.count({ where: { status: 'APPROVED' } }),
    ]);

  return {
    total,
    draft,
    submitted,
    revisionRequired,
    approved,
  };
};

/**
 * Upload policy brief document
 */
const uploadPolicyBriefDocument = async (policyBriefId, file, data, userId) => {
  const policyBrief = await prisma.policyBrief.findUnique({ where: { id: policyBriefId } });

  if (!policyBrief) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  if (policyBrief.status === 'APPROVED') {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Tidak dapat mengunggah dokumen baru pada policy brief yang telah disetujui (APPROVED).');
    error.statusCode = 409;
    error.errorCode = 'POLICY_BRIEF_NOT_EDITABLE';
    throw error;
  }

  const existingCount = await prisma.policyBriefDocument.count({
    where: { policyBriefId },
  });

  const version = data.version || `v${existingCount + 1}`;

  const doc = await prisma.policyBriefDocument.create({
    data: {
      policyBriefId,
      documentType: data.documentType || 'POLICY_BRIEF',
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
    'POLICY_BRIEF_DOCUMENT_UPLOADED',
    'PolicyBriefDocument',
    doc.id,
    { policyBriefId, fileName: doc.fileName, version }
  );

  return doc;
};

/**
 * Get policy brief documents
 */
const getPolicyBriefDocuments = async (policyBriefId) => {
  const policyBrief = await prisma.policyBrief.findUnique({ where: { id: policyBriefId } });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  const documents = await prisma.policyBriefDocument.findMany({
    where: { policyBriefId },
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
 * Delete policy brief document
 */
const deletePolicyBriefDocument = async (policyBriefId, documentId, userId) => {
  const policyBrief = await prisma.policyBrief.findUnique({ where: { id: policyBriefId } });

  if (!policyBrief) {
    const error = new Error('Policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'POLICY_BRIEF_NOT_FOUND';
    throw error;
  }

  if (policyBrief.status === 'APPROVED') {
    const error = new Error('Dokumen tidak dapat dihapus pada policy brief yang telah disetujui (APPROVED).');
    error.statusCode = 409;
    error.errorCode = 'POLICY_BRIEF_NOT_EDITABLE';
    throw error;
  }

  const doc = await prisma.policyBriefDocument.findFirst({
    where: { id: documentId, policyBriefId },
  });

  if (!doc) {
    const error = new Error('Dokumen policy brief tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  if (fs.existsSync(doc.filePath)) {
    try {
      fs.unlinkSync(doc.filePath);
    } catch (e) {
      console.warn('Gagal menghapus berkas fisik dokumen policy brief:', e.message);
    }
  }

  await prisma.policyBriefDocument.delete({ where: { id: documentId } });

  await logAudit(
    userId,
    'POLICY_BRIEF_DOCUMENT_DELETED',
    'PolicyBriefDocument',
    documentId,
    { policyBriefId, fileName: doc.fileName }
  );

  return { message: 'Dokumen policy brief berhasil dihapus.' };
};

module.exports = {
  createPolicyBrief,
  getPolicyBriefs,
  getPolicyBriefById,
  updatePolicyBrief,
  submitPolicyBrief,
  reviewPolicyBrief,
  getPolicyBriefStatistics,
  uploadPolicyBriefDocument,
  getPolicyBriefDocuments,
  deletePolicyBriefDocument,
};
