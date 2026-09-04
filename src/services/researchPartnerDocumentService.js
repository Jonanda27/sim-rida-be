const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');

/**
 * Get documents for partner selection
 */
const getPartnerDocuments = async (selectionId) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id: selectionId },
  });

  if (!selection) {
    const error = new Error(`Research Partner Selection with ID ${selectionId} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  const docs = await prisma.researchPartnerDocument.findMany({
    where: { researchPartnerSelectionId: selectionId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return docs;
};

/**
 * Upload supporting document for partner selection
 */
const uploadPartnerDocument = async (selectionId, file, data, userId) => {
  const selection = await prisma.researchPartnerSelection.findUnique({
    where: { id: selectionId },
  });

  if (!selection) {
    // Delete uploaded file if orphaned
    if (file?.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    const error = new Error(`Research Partner Selection with ID ${selectionId} not found.`);
    error.statusCode = 404;
    error.code = 'PARTNER_SELECTION_NOT_FOUND';
    throw error;
  }

  if (['SELECTED', 'CANCELLED'].includes(selection.status)) {
    if (file?.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    const error = new Error(`Tidak dapat mengunggah dokumen pada proses seleksi dengan status "${selection.status}".`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  if (!file) {
    const error = new Error('File dokumen wajib diunggah.');
    error.statusCode = 400;
    error.code = 'FILE_REQUIRED';
    throw error;
  }

  const doc = await prisma.researchPartnerDocument.create({
    data: {
      researchPartnerSelectionId: selectionId,
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
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  logAudit({
    userId,
    action: 'PARTNER_DOCUMENT_UPLOADED',
    entity: 'ResearchPartnerDocument',
    entityId: doc.id,
    metadata: {
      selectionId,
      documentType: doc.documentType,
      fileName: doc.fileName,
    },
  });

  return doc;
};

/**
 * Delete partner document
 */
const deletePartnerDocument = async (selectionId, documentId, userId) => {
  const doc = await prisma.researchPartnerDocument.findFirst({
    where: {
      id: documentId,
      researchPartnerSelectionId: selectionId,
    },
    include: {
      researchPartnerSelection: true,
    },
  });

  if (!doc) {
    const error = new Error(`Dokumen dengan ID ${documentId} tidak ditemukan pada seleksi ini.`);
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  if (['SELECTED', 'CANCELLED'].includes(doc.researchPartnerSelection.status)) {
    const error = new Error(`Tidak dapat menghapus dokumen pada seleksi yang sudah berstatus "${doc.researchPartnerSelection.status}".`);
    error.statusCode = 409;
    error.code = 'SELECTION_NOT_EDITABLE';
    throw error;
  }

  await prisma.researchPartnerDocument.delete({ where: { id: documentId } });

  // Try unlinking physical file if exists
  if (doc.filePath && fs.existsSync(doc.filePath)) {
    try {
      fs.unlinkSync(doc.filePath);
    } catch (err) {
      console.warn(`Could not remove file ${doc.filePath}:`, err.message);
    }
  }

  logAudit({
    userId,
    action: 'PARTNER_DOCUMENT_DELETED',
    entity: 'ResearchPartnerDocument',
    entityId: documentId,
    metadata: { selectionId, fileName: doc.fileName },
  });

  return { message: 'Dokumen berhasil dihapus.' };
};

module.exports = {
  getPartnerDocuments,
  uploadPartnerDocument,
  deletePartnerDocument,
};
