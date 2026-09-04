const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../config/db');
const env = require('../config/env');
const { extractDocumentText } = require('./documentTextExtractor');
const { logAudit } = require('../utils/auditLogger');

/**
 * Get paginated list of external sources
 */
const getExternalSources = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.sourceType) {
    where.sourceType = query.sourceType;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.institution) {
    where.institution = { contains: query.institution, mode: 'insensitive' };
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { institution: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.externalSource.count({ where }),
    prisma.externalSource.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        sourceType: true,
        institution: true,
        status: true,
        currentVersionId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        currentVersion: {
          select: {
            id: true,
            versionNumber: true,
            effectiveDate: true,
            createdAt: true,
            document: {
              select: {
                id: true,
                fileName: true,
                originalName: true,
                filePath: true,
                mimeType: true,
                fileSize: true,
                checksum: true,
                extractionStatus: true,
                pageCount: true,
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          select: {
            id: true,
            versionNumber: true,
            effectiveDate: true,
            description: true,
            createdAt: true,
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
            document: {
              select: {
                id: true,
                fileName: true,
                originalName: true,
                filePath: true,
                mimeType: true,
                fileSize: true,
                checksum: true,
                extractionStatus: true,
                pageCount: true,
              },
            },
          },
        },
        _count: {
          select: { versions: true },
        },
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: items,
  };
};

/**
 * Get detailed external source by ID
 */
const getExternalSourceById = async (id) => {
  const source = await prisma.externalSource.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      currentVersion: {
        include: {
          document: true,
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
          document: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              filePath: true,
              mimeType: true,
              fileSize: true,
              checksum: true,
              extractionStatus: true,
              extractionError: true,
              pageCount: true,
              createdAt: true,
            },
          },
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!source) {
    const error = new Error(`External source with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return source;
};

/**
 * Create a new external source
 */
const createExternalSource = async (data, userId) => {
  const existing = await prisma.externalSource.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    const error = new Error(`External source code "${data.code}" already exists.`);
    error.statusCode = 409;
    error.code = 'CODE_ALREADY_EXISTS';
    throw error;
  }

  const source = await prisma.externalSource.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description || null,
      sourceType: data.sourceType || 'PLANNING_DOCUMENT',
      institution: data.institution || null,
      status: 'ACTIVE',
      createdById: userId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  logAudit({
    userId,
    action: 'EXTERNAL_SOURCE_CREATED',
    entity: 'ExternalSource',
    entityId: source.id,
    metadata: { code: source.code, title: source.title, sourceType: source.sourceType },
  });

  return source;
};

/**
 * Update an external source metadata
 */
const updateExternalSource = async (id, data, userId) => {
  await getExternalSourceById(id);

  const updateData = {};
  if (typeof data.title !== 'undefined') updateData.title = data.title;
  if (typeof data.description !== 'undefined') updateData.description = data.description;
  if (typeof data.sourceType !== 'undefined') updateData.sourceType = data.sourceType;
  if (typeof data.institution !== 'undefined') updateData.institution = data.institution;

  const updated = await prisma.externalSource.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      currentVersion: true,
    },
  });

  logAudit({
    userId,
    action: 'EXTERNAL_SOURCE_UPDATED',
    entity: 'ExternalSource',
    entityId: updated.id,
    metadata: { updatedFields: Object.keys(updateData) },
  });

  return updated;
};

/**
 * Update external source status (ACTIVE <-> ARCHIVED)
 */
const updateExternalSourceStatus = async (id, status, userId) => {
  const source = await getExternalSourceById(id);

  if (source.status === status) {
    return source;
  }

  const updated = await prisma.externalSource.update({
    where: { id },
    data: { status },
  });

  logAudit({
    userId,
    action: 'EXTERNAL_SOURCE_STATUS_CHANGED',
    entity: 'ExternalSource',
    entityId: updated.id,
    metadata: { previousStatus: source.status, newStatus: status },
  });

  return updated;
};

/**
 * Get all versions of an external source
 */
const getSourceVersions = async (sourceId) => {
  await getExternalSourceById(sourceId);

  return prisma.externalSourceVersion.findMany({
    where: { externalSourceId: sourceId },
    orderBy: { versionNumber: 'desc' },
    include: {
      document: true,
      uploadedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

/**
 * Create a new version and upload document (Transactional)
 */
const createSourceVersion = async (sourceId, data, file, userId) => {
  const source = await getExternalSourceById(sourceId);

  if (source.status === 'ARCHIVED') {
    const error = new Error('Cannot upload a new version to an ARCHIVED external source.');
    error.statusCode = 400;
    error.code = 'SOURCE_ARCHIVED';
    throw error;
  }

  if (!file) {
    const error = new Error('Document file is required.');
    error.statusCode = 400;
    error.code = 'FILE_REQUIRED';
    throw error;
  }

  // 1. Determine version number
  let versionNumber = data.versionNumber ? parseInt(data.versionNumber, 10) : null;
  if (!versionNumber) {
    const latestVersion = await prisma.externalSourceVersion.findFirst({
      where: { externalSourceId: sourceId },
      orderBy: { versionNumber: 'desc' },
    });
    versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
  } else {
    // Check if versionNumber already exists
    const existingVer = await prisma.externalSourceVersion.findUnique({
      where: {
        externalSourceId_versionNumber: {
          externalSourceId: sourceId,
          versionNumber,
        },
      },
    });
    if (existingVer) {
      const error = new Error(`Version number ${versionNumber} already exists for this source.`);
      error.statusCode = 409;
      error.code = 'VERSION_ALREADY_EXISTS';
      throw error;
    }
  }

  // 2. Perform text extraction and checksum calculation from temp file
  const tempPath = file.path;
  const extractionResult = await extractDocumentText(tempPath, file.mimetype, file.originalname);

  // 3. Prepare target destination: uploads/external-sources/{sourceId}/{versionNumber}/
  const versionFolder = path.resolve(env.UPLOAD_DIR, 'external-sources', sourceId, `v${versionNumber}`);
  if (!fs.existsSync(versionFolder)) {
    fs.mkdirSync(versionFolder, { recursive: true });
  }

  const cleanOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetFilePath = path.join(versionFolder, `${Date.now()}-${cleanOriginalName}`);

  // Move file from temp to final destination
  fs.copyFileSync(tempPath, targetFilePath);
  fs.unlinkSync(tempPath); // remove temp

  const relativeFilePath = path.relative(process.cwd(), targetFilePath).replace(/\\/g, '/');

  // 4. Execute Prisma transaction
  let versionRecord;
  try {
    versionRecord = await prisma.$transaction(async (tx) => {
      // a. Create version
      const version = await tx.externalSourceVersion.create({
        data: {
          externalSourceId: sourceId,
          versionNumber,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
          description: data.description || null,
          uploadedById: userId,
        },
      });

      // b. Create document
      const document = await tx.externalSourceDocument.create({
        data: {
          sourceVersionId: version.id,
          fileName: path.basename(targetFilePath),
          originalName: file.originalname,
          filePath: relativeFilePath,
          mimeType: file.mimetype,
          fileSize: file.size,
          checksum: extractionResult.checksum,
          extractedText: extractionResult.extractedText,
          extractionStatus: extractionResult.extractionStatus,
          extractionError: extractionResult.extractionError,
          pageCount: extractionResult.pageCount,
        },
      });

      // c. Update external source currentVersionId
      await tx.externalSource.update({
        where: { id: sourceId },
        data: { currentVersionId: version.id },
      });

      return {
        ...version,
        document,
      };
    });
  } catch (txError) {
    // Orphan file cleanup if transaction fails
    if (fs.existsSync(targetFilePath)) {
      try {
        fs.unlinkSync(targetFilePath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup orphan file:', cleanupErr.message);
      }
    }
    throw txError;
  }

  logAudit({
    userId,
    action: 'SOURCE_VERSION_UPLOADED',
    entity: 'ExternalSourceVersion',
    entityId: versionRecord.id,
    metadata: {
      sourceId,
      versionNumber,
      fileName: file.originalname,
      extractionStatus: extractionResult.extractionStatus,
    },
  });

  return versionRecord;
};

module.exports = {
  getExternalSources,
  getExternalSourceById,
  createExternalSource,
  updateExternalSource,
  updateExternalSourceStatus,
  getSourceVersions,
  createSourceVersion,
};
