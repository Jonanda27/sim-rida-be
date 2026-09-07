const { z } = require('zod');

const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'STRATEGIC', 'RENDAH', 'SEDANG', 'TINGGI']).default('MEDIUM');
const StatusEnum = z.enum(['DRAFT', 'AI_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).default('DRAFT');

const findingItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Finding title must be at least 3 characters').optional(),
  description: z.string().min(3, 'Finding description must be at least 3 characters').optional(),
  evidence: z.string().optional().default(''),
  confidence: z.number().min(0).max(1).optional().default(0.8),
  sourceReference: z.string().optional().default(''),
});

const relatedOpdItemSchema = z.object({
  opdId: z.string().optional(),
  relevanceScore: z.number().min(0).max(1).optional().default(0.8),
  reason: z.string().optional().default(''),
});

const createProblemIdentificationSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    opdId: z.string().optional().nullable(),
    opd: z.string().optional().nullable(),
    opdName: z.string().optional().nullable(),
    title: z.string({ required_error: 'Judul identifikasi kebutuhan wajib diisi' }).min(3, 'Judul identifikasi minimal 3 karakter'),
    year: z.union([z.number(), z.string()]).optional().default(2026),
    field: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    bridaFindings: z.string().optional().nullable(),
    currentCondition: z.string().optional().nullable(),
    problemStatement: z.string().optional().nullable(),
    impact: z.string().optional().nullable(),
    potentialNeed: z.string().optional().nullable(),
    priority: PriorityEnum.optional(),
    status: StatusEnum.optional(),
    description: z.string().optional().nullable(),
    sourceVersionId: z.string().optional().nullable(),
    sourceId: z.string().optional().nullable(),
    baselineRelationship: z.string().optional().nullable(),
    analysisNotes: z.string().optional().nullable(),
    findings: z.array(findingItemSchema).optional(),
    relatedOpds: z.array(relatedOpdItemSchema).optional(),
  }),
});

const updateProblemIdentificationSchema = z.object({
  body: z.object({
    opdId: z.string().optional().nullable(),
    opd: z.string().optional().nullable(),
    opdName: z.string().optional().nullable(),
    title: z.string().min(3).optional(),
    year: z.union([z.number(), z.string()]).optional(),
    field: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    bridaFindings: z.string().optional().nullable(),
    currentCondition: z.string().optional().nullable(),
    problemStatement: z.string().optional().nullable(),
    impact: z.string().optional().nullable(),
    potentialNeed: z.string().optional().nullable(),
    priority: PriorityEnum.optional(),
    status: StatusEnum.optional(),
    description: z.string().optional().nullable(),
    sourceVersionId: z.string().optional().nullable(),
    sourceId: z.string().optional().nullable(),
    baselineRelationship: z.string().optional().nullable(),
    analysisNotes: z.string().optional().nullable(),
    findings: z.array(findingItemSchema).optional(),
    relatedOpds: z.array(relatedOpdItemSchema).optional(),
  }),
});

const rejectProblemIdentificationSchema = z.object({
  body: z.object({
    reviewNote: z.string({
      required_error: 'Catatan alasan penolakan (reviewNote) wajib diisi.',
    }).min(3, 'Review note minimal 3 karakter'),
  }),
});

module.exports = {
  createProblemIdentificationSchema,
  updateProblemIdentificationSchema,
  rejectProblemIdentificationSchema,
};
