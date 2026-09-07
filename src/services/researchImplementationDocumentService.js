const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Upload implementation document
 */
const uploadDocument = async (implementationId, file, data, userId) => {
  let implementation = await prisma.researchImplementation.findFirst({
    where: {
      OR: [
        { id: implementationId },
        { code: implementationId },
        { researchProposalId: implementationId },
        { researchProposal: { code: implementationId } },
      ],
    },
    include: {
      researchProposal: true,
    },
  });

  if (!implementation) {
    // If not found, check if identifier matches a ResearchProposal that needs implementation initialized
    const proposal = await prisma.researchProposal.findFirst({
      where: {
        OR: [
          { id: implementationId },
          { code: implementationId },
        ],
      },
      include: {
        partnerSelection: true,
      },
    });

    if (proposal) {
      const year = new Date().getFullYear();
      const prefix = `IMP-${year}-`;
      const latest = await prisma.researchImplementation.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });
      const seq = latest ? parseInt(latest.code.replace(prefix, ''), 10) + 1 : 1;
      const code = `${prefix}${String(seq).padStart(3, '0')}`;

      let partnerSelectionId = proposal.partnerSelection?.id;
      if (!partnerSelectionId) {
        const ps = await prisma.researchPartnerSelection.findFirst({
          where: { researchProposalId: proposal.id },
        });
        partnerSelectionId = ps?.id;
      }

      if (!partnerSelectionId) {
        const psCode = `SEL-${year}-${String(seq).padStart(3, '0')}`;
        const newPs = await prisma.researchPartnerSelection.create({
          data: {
            code: psCode,
            researchProposalId: proposal.id,
            method: 'SWAKELOLA',
            status: 'APPROVED',
            createdById: userId,
          },
        });
        partnerSelectionId = newPs.id;
      }

      implementation = await prisma.researchImplementation.create({
        data: {
          code,
          researchProposalId: proposal.id,
          partnerSelectionId,
          responsibleUserId: userId,
          createdById: userId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: 'ONGOING',
          description: proposal.title,
        },
      });
    }
  }

  if (!implementation) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  if (['COMPLETED', 'CANCELLED'].includes(implementation.status)) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const error = new Error(
      `Tidak dapat mengunggah dokumen baru pada pelaksanaan dengan status "${implementation.status}".`
    );
    error.statusCode = 409;
    error.code = 'IMPLEMENTATION_NOT_EDITABLE';
    throw error;
  }

  if (!file) {
    const error = new Error('Berkas dokumen wajib diunggah.');
    error.statusCode = 400;
    error.code = 'FILE_REQUIRED';
    throw error;
  }

  const documentType = data.documentType || 'OTHER';

  // If uploading TIMELINE document, delete previous timeline file(s) and database record(s) to avoid accumulation
  if (documentType === 'TIMELINE') {
    const existingTimelines = await prisma.researchImplementationDocument.findMany({
      where: {
        implementationId: implementation.id,
        documentType: 'TIMELINE',
      },
    });

    for (const oldDoc of existingTimelines) {
      if (oldDoc.filePath && fs.existsSync(oldDoc.filePath)) {
        try {
          fs.unlinkSync(oldDoc.filePath);
        } catch (err) {
          console.error('Failed to unlink old timeline file:', err.message);
        }
      }
    }

    if (existingTimelines.length > 0) {
      await prisma.researchImplementationDocument.deleteMany({
        where: {
          implementationId: implementation.id,
          documentType: 'TIMELINE',
        },
      });
    }
  }

  const document = await prisma.researchImplementationDocument.create({
    data: {
      implementationId: implementation.id,
      documentType,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
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
    'RESEARCH_IMPLEMENTATION_DOCUMENT_UPLOADED',
    'ResearchImplementationDocument',
    document.id,
    { implementationId: implementation.id, fileName: document.fileName, documentType: document.documentType }
  );

  return document;
};

/**
 * Get implementation documents
 */
const getDocuments = async (implementationId) => {
  const implementation = await prisma.researchImplementation.findFirst({
    where: {
      OR: [
        { id: implementationId },
        { code: implementationId },
        { researchProposalId: implementationId },
        { researchProposal: { code: implementationId } },
      ],
    },
  });

  if (!implementation) {
    return [];
  }

  const documents = await prisma.researchImplementationDocument.findMany({
    where: { implementationId: implementation.id },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return documents;
};

/**
 * Delete implementation document
 */
const deleteDocument = async (implementationId, documentId, userId) => {
  const document = await prisma.researchImplementationDocument.findUnique({
    where: { id: documentId },
    include: { implementation: true },
  });

  if (!document || document.implementationId !== implementationId) {
    const error = new Error('Dokumen pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  if (document.implementation.status === 'COMPLETED') {
    const error = new Error(
      'Dokumen pada pelaksanaan penelitian yang sudah selesai (COMPLETED) tidak dapat dihapus.'
    );
    error.statusCode = 409;
    error.code = 'DOCUMENT_CANNOT_BE_DELETED';
    throw error;
  }

  if (document.filePath && fs.existsSync(document.filePath)) {
    try {
      fs.unlinkSync(document.filePath);
    } catch (e) {
      console.error('Failed to unlink file:', e.message);
    }
  }

  await prisma.researchImplementationDocument.delete({
    where: { id: documentId },
  });

  await logAudit(
    userId,
    'RESEARCH_IMPLEMENTATION_DOCUMENT_DELETED',
    'ResearchImplementationDocument',
    documentId,
    { implementationId, fileName: document.fileName }
  );

  return { message: 'Dokumen berhasil dihapus.' };
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument,
};
