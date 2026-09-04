const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

/**
 * Create a new research report for an implementation
 */
const createReport = async (implementationId, data, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
    include: { researchProposal: true },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  // Implementation must be COMPLETED
  if (implementation.status !== 'COMPLETED') {
    const error = new Error(
      `Laporan akhir hanya dapat dibuat apabila pelaksanaan penelitian telah selesai (status "COMPLETED"). Status saat ini: "${implementation.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'IMPLEMENTATION_NOT_COMPLETED';
    throw error;
  }

  const reportType = data.reportType || 'FINAL_REPORT';

  // One active final report per implementation
  if (reportType === 'FINAL_REPORT') {
    const existingFinalReport = await prisma.researchReport.findFirst({
      where: {
        implementationId,
        reportType: 'FINAL_REPORT',
        status: { not: 'REJECTED' },
      },
    });

    if (existingFinalReport) {
      const error = new Error(
        `Pelaksanaan penelitian ini sudah memiliki laporan akhir aktif (${existingFinalReport.title}).`
      );
      error.statusCode = 409;
      error.errorCode = 'ACTIVE_FINAL_REPORT_EXISTS';
      throw error;
    }
  }

  const report = await prisma.researchReport.create({
    data: {
      implementationId,
      title: data.title,
      reportType,
      version: 'v1',
      status: 'DRAFT',
      summary: data.summary || null,
      createdById: userId,
    },
    include: {
      implementation: {
        select: { id: true, code: true, status: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_REPORT_CREATED',
    'ResearchReport',
    report.id,
    { title: report.title, implementationId, reportType }
  );

  return report;
};

/**
 * Get research reports with filters and pagination
 */
const getReports = async ({
  search,
  status,
  reportType,
  year,
  implementationId,
  page = 1,
  limit = 10,
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (status) where.status = status;
  if (reportType) where.reportType = reportType;
  if (implementationId) where.implementationId = implementationId;

  if (year) {
    const startYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endYear = new Date(`${year}-12-31T23:59:59.999Z`);
    where.createdAt = { gte: startYear, lte: endYear };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { implementation: { code: { contains: search, mode: 'insensitive' } } },
      {
        implementation: {
          researchProposal: {
            title: { contains: search, mode: 'insensitive' },
          },
        },
      },
      {
        implementation: {
          researchProposal: {
            code: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.researchReport.count({ where }),
    prisma.researchReport.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        implementation: {
          select: {
            id: true,
            code: true,
            status: true,
            researchProposal: {
              select: { id: true, code: true, title: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            documents: true,
            policyBriefs: true,
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
 * Get research report detail by ID
 */
const getReportById = async (id) => {
  const report = await prisma.researchReport.findUnique({
    where: { id },
    include: {
      implementation: {
        include: {
          researchProposal: {
            include: {
              kak: true,
              relatedOpds: { include: { opd: true } },
            },
          },
          partnerSelection: {
            include: { partner: true },
          },
          responsibleUser: {
            select: { id: true, name: true, email: true, role: true },
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
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      policyBriefs: {
        orderBy: { createdAt: 'desc' },
        include: {
          recommendations: {
            include: {
              targetOpd: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  return report;
};

/**
 * Update research report
 */
const updateReport = async (id, data, userId) => {
  const report = await prisma.researchReport.findUnique({ where: { id } });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  if (['APPROVED', 'REJECTED'].includes(report.status)) {
    const error = new Error(
      `Laporan dengan status "${report.status}" terkunci dan tidak dapat diubah.`
    );
    error.statusCode = 409;
    error.errorCode = 'REPORT_NOT_EDITABLE';
    throw error;
  }

  const updated = await prisma.researchReport.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : report.title,
      reportType: data.reportType !== undefined ? data.reportType : report.reportType,
      summary: data.summary !== undefined ? data.summary : report.summary,
      updatedById: userId,
    },
  });

  await logAudit(userId, 'RESEARCH_REPORT_UPDATED', 'ResearchReport', id, {
    title: updated.title,
    reportType: updated.reportType,
  });

  return updated;
};

/**
 * Submit research report
 */
const submitReport = async (id, userId) => {
  const report = await prisma.researchReport.findUnique({ where: { id } });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  if (!['DRAFT', 'REVISION_REQUIRED'].includes(report.status)) {
    const error = new Error(
      `Hanya laporan berstatus "DRAFT" atau "REVISION_REQUIRED" yang dapat disubmit. Status saat ini: "${report.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'REPORT_CANNOT_BE_SUBMITTED';
    throw error;
  }

  const submitted = await prisma.researchReport.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      updatedById: userId,
    },
  });

  await logAudit(userId, 'RESEARCH_REPORT_SUBMITTED', 'ResearchReport', id, {
    title: submitted.title,
    submittedAt: submitted.submittedAt,
  });

  return submitted;
};

/**
 * Review research report
 */
const reviewReport = async (id, { decision, notes }, userId) => {
  const report = await prisma.researchReport.findUnique({ where: { id } });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  if (report.status !== 'SUBMITTED') {
    const error = new Error(
      `Review hanya dapat dilakukan pada laporan berstatus "SUBMITTED". Status saat ini: "${report.status}".`
    );
    error.statusCode = 409;
    error.errorCode = 'REPORT_NOT_IN_SUBMITTED_STATUS';
    throw error;
  }

  let newStatus = 'SUBMITTED';
  let auditAction = 'RESEARCH_REPORT_REVIEWED';

  if (decision === 'APPROVE') {
    newStatus = 'APPROVED';
    auditAction = 'RESEARCH_REPORT_APPROVED';
  } else if (decision === 'REVISION') {
    newStatus = 'REVISION_REQUIRED';
    auditAction = 'RESEARCH_REPORT_REVISION_REQUIRED';
  } else if (decision === 'REJECT') {
    newStatus = 'REJECTED';
    auditAction = 'RESEARCH_REPORT_REJECTED';
  }

  const now = new Date();

  const [updatedReport, reviewRecord] = await prisma.$transaction([
    prisma.researchReport.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: now,
        approvedAt: decision === 'APPROVE' ? now : report.approvedAt,
        updatedById: userId,
      },
    }),
    prisma.researchReportReview.create({
      data: {
        reportId: id,
        reviewerId: userId,
        decision,
        notes: notes || null,
      },
    }),
  ]);

  await logAudit(userId, auditAction, 'ResearchReport', id, {
    decision,
    notes,
    newStatus,
  });

  return { report: updatedReport, review: reviewRecord };
};

/**
 * Get research report statistics
 */
const getReportStatistics = async () => {
  const [total, draft, submitted, revisionRequired, approved, rejected] =
    await Promise.all([
      prisma.researchReport.count(),
      prisma.researchReport.count({ where: { status: 'DRAFT' } }),
      prisma.researchReport.count({ where: { status: 'SUBMITTED' } }),
      prisma.researchReport.count({ where: { status: 'REVISION_REQUIRED' } }),
      prisma.researchReport.count({ where: { status: 'APPROVED' } }),
      prisma.researchReport.count({ where: { status: 'REJECTED' } }),
    ]);

  return {
    total,
    draft,
    submitted,
    revisionRequired,
    approved,
    rejected,
  };
};

/**
 * Upload research report document
 */
const uploadReportDocument = async (reportId, file, data, userId) => {
  const report = await prisma.researchReport.findUnique({ where: { id: reportId } });

  if (!report) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  if (report.status === 'APPROVED') {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Tidak dapat mengunggah dokumen baru pada laporan yang telah disetujui (APPROVED).');
    error.statusCode = 409;
    error.errorCode = 'REPORT_NOT_EDITABLE';
    throw error;
  }

  const existingCount = await prisma.researchReportDocument.count({
    where: { reportId },
  });

  const version = data.version || `v${existingCount + 1}`;

  const doc = await prisma.researchReportDocument.create({
    data: {
      reportId,
      documentType: data.documentType || 'FINAL_REPORT',
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      version,
      description: data.description || null,
      uploadedById: userId,
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_REPORT_DOCUMENT_UPLOADED',
    'ResearchReportDocument',
    doc.id,
    { reportId, fileName: doc.fileName, version }
  );

  return doc;
};

/**
 * Get documents for a research report
 */
const getReportDocuments = async (reportId) => {
  const report = await prisma.researchReport.findUnique({ where: { id: reportId } });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  const documents = await prisma.researchReportDocument.findMany({
    where: { reportId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
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
 * Delete research report document
 */
const deleteReportDocument = async (reportId, documentId, userId) => {
  const report = await prisma.researchReport.findUnique({ where: { id: reportId } });

  if (!report) {
    const error = new Error('Laporan penelitian tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'REPORT_NOT_FOUND';
    throw error;
  }

  if (report.status === 'APPROVED') {
    const error = new Error('Dokumen tidak dapat dihapus pada laporan yang telah disetujui (APPROVED).');
    error.statusCode = 409;
    error.errorCode = 'REPORT_NOT_EDITABLE';
    throw error;
  }

  const doc = await prisma.researchReportDocument.findFirst({
    where: { id: documentId, reportId },
  });

  if (!doc) {
    const error = new Error('Dokumen laporan tidak ditemukan');
    error.statusCode = 404;
    error.errorCode = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  if (fs.existsSync(doc.filePath)) {
    try {
      fs.unlinkSync(doc.filePath);
    } catch (e) {
      console.warn('Gagal menghapus berkas fisik dokumen laporan:', e.message);
    }
  }

  await prisma.researchReportDocument.delete({ where: { id: documentId } });

  await logAudit(
    userId,
    'RESEARCH_REPORT_DOCUMENT_DELETED',
    'ResearchReportDocument',
    documentId,
    { reportId, fileName: doc.fileName }
  );

  return { message: 'Dokumen laporan berhasil dihapus.' };
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  submitReport,
  reviewReport,
  getReportStatistics,
  uploadReportDocument,
  getReportDocuments,
  deleteReportDocument,
};
