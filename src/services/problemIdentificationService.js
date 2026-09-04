const prisma = require('../config/db');
const { analyzeExternalSource } = require('./ai/openai.service');
const { logAudit } = require('../utils/auditLogger');

/**
 * Common select pattern for problem identification
 */
const problemIdentificationInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  reviewedBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  sourceVersion: {
    include: {
      externalSource: {
        select: {
          id: true,
          code: true,
          title: true,
          sourceType: true,
          institution: true,
          status: true,
        },
      },
      document: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          fileSize: true,
          checksum: true,
          extractionStatus: true,
          pageCount: true,
        },
      },
    },
  },
  findings: true,
  relatedOpds: {
    include: {
      opd: {
        select: {
          id: true,
          code: true,
          name: true,
          shortName: true,
        },
      },
    },
  },
};

/**
 * Trigger AI analysis on current version of an external source
 */
const analyzeSource = async (sourceId, userId, options = {}) => {
  const source = await prisma.externalSource.findUnique({
    where: { id: sourceId },
    include: {
      currentVersion: {
        include: {
          document: true,
        },
      },
    },
  });

  if (!source) {
    const error = new Error(`External source with ID ${sourceId} not found.`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (source.status !== 'ACTIVE') {
    const error = new Error(`Source is ${source.status}. AI analysis can only be performed on ACTIVE sources.`);
    error.statusCode = 400;
    error.code = 'SOURCE_NOT_ACTIVE';
    throw error;
  }

  if (!source.currentVersion) {
    const error = new Error('External source does not have any active version yet. Please upload a document version first.');
    error.statusCode = 400;
    error.code = 'NO_ACTIVE_VERSION';
    throw error;
  }

  const { currentVersion } = source;
  const { document } = currentVersion;

  if (!document) {
    const error = new Error('Current version has no associated document file.');
    error.statusCode = 400;
    error.code = 'NO_DOCUMENT';
    throw error;
  }

  if (document.extractionStatus !== 'COMPLETED' || !document.extractedText) {
    const error = new Error(
      `Cannot perform AI analysis because document text extraction is ${document.extractionStatus}. ` +
      (document.extractionError ? `Reason: ${document.extractionError}` : 'Document has no readable text.')
    );
    error.statusCode = 400;
    error.code = 'TEXT_NOT_EXTRACTED';
    throw error;
  }

  // 1. Prevent duplicate analysis: Return existing analysis if already performed
  if (!options.force) {
    const existingAnalysis = await prisma.problemIdentification.findFirst({
      where: {
        sourceVersionId: currentVersion.id,
        status: { in: ['AI_GENERATED', 'UNDER_REVIEW', 'APPROVED'] },
      },
      include: problemIdentificationInclude,
      orderBy: { createdAt: 'desc' },
    });

    if (existingAnalysis) {
      return {
        isExisting: true,
        data: existingAnalysis,
      };
    }
  }

  // 2. Audit: AI Analysis Started
  logAudit({
    userId,
    action: 'AI_ANALYSIS_STARTED',
    entity: 'ExternalSourceVersion',
    entityId: currentVersion.id,
    metadata: { sourceId, versionNumber: currentVersion.versionNumber },
  });

  // 3. Invoke AI Service
  let aiResult;
  try {
    aiResult = await analyzeExternalSource(document.extractedText, {
      code: source.code,
      title: source.title,
      sourceType: source.sourceType,
      institution: source.institution,
      versionNumber: currentVersion.versionNumber,
    });
  } catch (aiErr) {
    logAudit({
      userId,
      action: 'AI_ANALYSIS_FAILED',
      entity: 'ExternalSourceVersion',
      entityId: currentVersion.id,
      metadata: { error: aiErr.message, code: aiErr.code },
    });
    throw aiErr;
  }

  // 4. Fetch all master OPDs to map suggested OPD codes
  const allOpds = await prisma.oPD.findMany();
  const opdMapByCode = new Map(allOpds.map((o) => [o.code, o]));
  const opdMapByShortName = new Map(allOpds.map((o) => [o.shortName.toLowerCase(), o]));

  // 5. Transactionally save ProblemIdentification, Findings, and Related OPDs
  const generatedCode = `PID-${source.code}-V${currentVersion.versionNumber}-${Date.now().toString().slice(-6)}`;

  const createdIdentification = await prisma.$transaction(async (tx) => {
    // a. Create parent problem identification
    const identification = await tx.problemIdentification.create({
      data: {
        code: generatedCode,
        title: aiResult.title || `Identifikasi Permasalahan: ${source.title}`,
        description: aiResult.description || `Hasil identifikasi otomatis berbasis dokumen ${source.title}`,
        status: 'AI_GENERATED',
        sourceVersionId: currentVersion.id,
        createdById: userId,
        aiMetadata: aiResult.aiMetadata,
      },
    });

    // b. Create findings and map related OPDs
    const uniqueOpdIds = new Set();

    for (const p of aiResult.problems) {
      await tx.problemIdentificationFinding.create({
        data: {
          problemIdentificationId: identification.id,
          title: p.title,
          description: p.description,
          evidence: p.evidence || null,
          confidence: typeof p.confidence === 'number' ? p.confidence : 0.85,
          sourceReference: p.sourceReference || null,
        },
      });

      // Map suggested OPDs
      if (Array.isArray(p.suggestedOpds)) {
        for (const sugg of p.suggestedOpds) {
          const matchedOpd = opdMapByCode.get(sugg.opdCode) || opdMapByShortName.get((sugg.opdCode || '').toLowerCase());
          if (matchedOpd && !uniqueOpdIds.has(matchedOpd.id)) {
            uniqueOpdIds.add(matchedOpd.id);
            await tx.problemIdentificationOpd.create({
              data: {
                problemIdentificationId: identification.id,
                opdId: matchedOpd.id,
                relevanceScore: typeof sugg.relevanceScore === 'number' ? sugg.relevanceScore : 0.85,
                reason: sugg.reason || null,
              },
            });
          }
        }
      }
    }

    return identification;
  });

  logAudit({
    userId,
    action: 'AI_ANALYSIS_COMPLETED',
    entity: 'ProblemIdentification',
    entityId: createdIdentification.id,
    metadata: {
      sourceId,
      sourceVersionId: currentVersion.id,
      findingsCount: aiResult.problems.length,
    },
  });

  const fullRecord = await prisma.problemIdentification.findUnique({
    where: { id: createdIdentification.id },
    include: problemIdentificationInclude,
  });

  return {
    isExisting: false,
    data: fullRecord,
  };
};

/**
 * Create a new problem identification manually or from frontend wizard
 */
const createProblemIdentification = async (data, userId) => {
  const code = data.code || `PID-${Date.now().toString().slice(-8)}`;

  let sourceVersionId = data.sourceVersionId || null;
  if (!sourceVersionId && data.sourceId) {
    const src = await prisma.externalSource.findUnique({
      where: { id: data.sourceId },
      select: { currentVersionId: true },
    });
    sourceVersionId = src?.currentVersionId || null;
  }
  if (!sourceVersionId) {
    const firstActiveVersion = await prisma.externalSourceVersion.findFirst({
      where: { externalSource: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    sourceVersionId = firstActiveVersion?.id || null;
  }

  const createdRecord = await prisma.$transaction(async (tx) => {
    const item = await tx.problemIdentification.create({
      data: {
        code,
        title: data.title || 'Identifikasi Kebutuhan Riset OPD',
        description: data.description || 'Hasil analisis kebutuhan riset daerah berbasis baseline dokumen.',
        status: data.status || 'AI_GENERATED',
        sourceVersionId,
        createdById: userId,
      },
    });

    // Create findings if provided
    if (Array.isArray(data.findings) && data.findings.length > 0) {
      for (const finding of data.findings) {
        await tx.problemIdentificationFinding.create({
          data: {
            problemIdentificationId: item.id,
            title: finding.title || finding.primaryIssue || 'Temuan Permasalahan Riset',
            description: finding.description || finding.problemDescription || '',
            evidence: finding.evidence || finding.potentialNeed || null,
            confidence: typeof finding.confidence === 'number' ? finding.confidence : 0.88,
            sourceReference: finding.sourceReference || null,
          },
        });
      }
    } else if (data.primaryIssue || data.problemDescription || data.potentialNeed) {
      await tx.problemIdentificationFinding.create({
        data: {
          problemIdentificationId: item.id,
          title: data.primaryIssue || data.title,
          description: data.problemDescription || data.description,
          evidence: data.potentialNeed || null,
          confidence: 0.9,
          sourceReference: 'Dokumen Baseline SIM-RIDA',
        },
      });
    }

    // Connect related OPD if provided
    if (Array.isArray(data.relatedOpds) && data.relatedOpds.length > 0) {
      for (const ro of data.relatedOpds) {
        if (ro.opdId) {
          await tx.problemIdentificationOpd.create({
            data: {
              problemIdentificationId: item.id,
              opdId: ro.opdId,
              relevanceScore: typeof ro.relevanceScore === 'number' ? ro.relevanceScore : 0.9,
              reason: ro.reason || null,
            },
          });
        }
      }
    } else if (data.opdId) {
      await tx.problemIdentificationOpd.create({
        data: {
          problemIdentificationId: item.id,
          opdId: data.opdId,
          relevanceScore: 0.95,
          reason: `Target instansi: ${data.opdName || 'OPD'}`,
        },
      });
    } else if (data.opdName || data.opd) {
      const targetName = data.opdName || data.opd;
      const opd = await tx.oPD.findFirst({
        where: {
          OR: [
            { name: { contains: targetName, mode: 'insensitive' } },
            { shortName: { contains: targetName, mode: 'insensitive' } },
          ],
        },
      });
      if (opd) {
        await tx.problemIdentificationOpd.create({
          data: {
            problemIdentificationId: item.id,
            opdId: opd.id,
            relevanceScore: 0.95,
            reason: `Target instansi: ${opd.name}`,
          },
        });
      }
    }

    return tx.problemIdentification.findUnique({
      where: { id: item.id },
      include: problemIdentificationInclude,
    });
  });

  logAudit({
    userId,
    action: 'PROBLEM_IDENTIFICATION_CREATED',
    entity: 'ProblemIdentification',
    entityId: createdRecord.id,
    metadata: { code, title: createdRecord.title },
  });

  return createdRecord;
};

/**
 * Get paginated list of problem identifications
 */
const getProblemIdentifications = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.sourceId) {
    where.sourceVersion = {
      externalSourceId: query.sourceId,
    };
  }

  if (query.opdId) {
    where.relatedOpds = {
      some: {
        opdId: query.opdId,
      },
    };
  }

  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      {
        sourceVersion: {
          externalSource: {
            title: { contains: query.search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.problemIdentification.count({ where }),
    prisma.problemIdentification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: problemIdentificationInclude,
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
 * Get problem identification by ID
 */
const getProblemIdentificationById = async (id) => {
  const record = await prisma.problemIdentification.findUnique({
    where: { id },
    include: problemIdentificationInclude,
  });

  if (!record) {
    const error = new Error(`Problem identification with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return record;
};

/**
 * Update problem identification (Edit by BRIDA)
 */
const updateProblemIdentification = async (id, data, userId) => {
  await getProblemIdentificationById(id);

  const updatedRecord = await prisma.$transaction(async (tx) => {
    // 1. Update basic fields
    const updateData = {};
    if (typeof data.title !== 'undefined') updateData.title = data.title;
    if (typeof data.description !== 'undefined') updateData.description = data.description;
    if (updateData.title || updateData.description) {
      await tx.problemIdentification.update({
        where: { id },
        data: updateData,
      });
    }

    // 2. Replace findings if array provided
    if (Array.isArray(data.findings)) {
      await tx.problemIdentificationFinding.deleteMany({
        where: { problemIdentificationId: id },
      });

      for (const finding of data.findings) {
        await tx.problemIdentificationFinding.create({
          data: {
            problemIdentificationId: id,
            title: finding.title,
            description: finding.description,
            evidence: finding.evidence || null,
            confidence: typeof finding.confidence === 'number' ? finding.confidence : 0.85,
            sourceReference: finding.sourceReference || null,
          },
        });
      }
    }

    // 3. Replace related OPDs if array provided
    if (Array.isArray(data.relatedOpds)) {
      await tx.problemIdentificationOpd.deleteMany({
        where: { problemIdentificationId: id },
      });

      for (const item of data.relatedOpds) {
        await tx.problemIdentificationOpd.create({
          data: {
            problemIdentificationId: id,
            opdId: item.opdId,
            relevanceScore: typeof item.relevanceScore === 'number' ? item.relevanceScore : 0.85,
            reason: item.reason || null,
          },
        });
      }
    }

    return tx.problemIdentification.findUnique({
      where: { id },
      include: problemIdentificationInclude,
    });
  });

  logAudit({
    userId,
    action: 'PROBLEM_IDENTIFICATION_UPDATED',
    entity: 'ProblemIdentification',
    entityId: id,
    metadata: { updatedBy: userId },
  });

  return updatedRecord;
};

/**
 * Approve problem identification by BRIDA
 */
const approveProblemIdentification = async (id, userId) => {
  const record = await getProblemIdentificationById(id);

  const updated = await prisma.problemIdentification.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedById: userId,
      reviewedAt: new Date(),
    },
    include: problemIdentificationInclude,
  });

  logAudit({
    userId,
    action: 'PROBLEM_IDENTIFICATION_APPROVED',
    entity: 'ProblemIdentification',
    entityId: id,
    metadata: { previousStatus: record.status, newStatus: 'APPROVED' },
  });

  return updated;
};

/**
 * Reject problem identification by BRIDA (requires reviewNote)
 */
const rejectProblemIdentification = async (id, reviewNote, userId) => {
  const record = await getProblemIdentificationById(id);

  if (!reviewNote || reviewNote.trim().length === 0) {
    const error = new Error('Catatan alasan penolakan (reviewNote) wajib diisi.');
    error.statusCode = 400;
    error.code = 'REVIEW_NOTE_REQUIRED';
    throw error;
  }

  const updated = await prisma.problemIdentification.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewNote,
    },
    include: problemIdentificationInclude,
  });

  logAudit({
    userId,
    action: 'PROBLEM_IDENTIFICATION_REJECTED',
    entity: 'ProblemIdentification',
    entityId: id,
    metadata: { previousStatus: record.status, newStatus: 'REJECTED', reviewNote },
  });

  return updated;
};

module.exports = {
  analyzeSource,
  createProblemIdentification,
  getProblemIdentifications,
  getProblemIdentificationById,
  updateProblemIdentification,
  approveProblemIdentification,
  rejectProblemIdentification,
};
