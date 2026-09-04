const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Upload implementation document
 */
const uploadDocument = async (implementationId, file, data, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

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

  const document = await prisma.researchImplementationDocument.create({
    data: {
      implementationId,
      documentType: data.documentType || 'OTHER',
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
    { implementationId, fileName: document.fileName, documentType: document.documentType }
  );

  return document;
};

/**
 * Get implementation documents
 */
const getDocuments = async (implementationId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const documents = await prisma.researchImplementationDocument.findMany({
    where: { implementationId },
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
