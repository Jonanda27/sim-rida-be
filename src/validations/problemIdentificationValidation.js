const { z } = require('zod');

const findingItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Finding title must be at least 3 characters'),
  description: z.string().min(5, 'Finding description must be at least 5 characters'),
  evidence: z.string().optional().default(''),
  confidence: z.number().min(0).max(1).optional().default(0.8),
  sourceReference: z.string().optional().default(''),
});

const relatedOpdItemSchema = z.object({
  opdId: z.string().uuid('Invalid OPD ID format'),
  relevanceScore: z.number().min(0).max(1).optional().default(0.8),
  reason: z.string().optional().default(''),
});

const updateProblemIdentificationSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    findings: z.array(findingItemSchema).optional(),
    relatedOpds: z.array(relatedOpdItemSchema).optional(),
  }),
});

const createProblemIdentificationSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    title: z.string().min(3, 'Judul identifikasi masalah minimal 3 karakter'),
    description: z.string().optional(),
    sourceVersionId: z.string().uuid().optional().nullable(),
    sourceId: z.string().uuid().optional().nullable(),
    opdId: z.string().uuid().optional().nullable(),
    opdName: z.string().optional(),
    opd: z.string().optional(),
    status: z.enum(['AI_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
    primaryIssue: z.string().optional(),
    problemDescription: z.string().optional(),
    potentialNeed: z.string().optional(),
    priority: z.string().optional(),
    findings: z.array(findingItemSchema).optional(),
    relatedOpds: z.array(relatedOpdItemSchema).optional(),
  }),
});

const rejectProblemIdentificationSchema = z.object({
  body: z.object({
    reviewNote: z.string({
      required_error: 'Catatan alasan penolakan (reviewNote) wajib diisi.',
    }).min(5, 'Review note must be at least 5 characters'),
  }),
});

module.exports = {
  createProblemIdentificationSchema,
  updateProblemIdentificationSchema,
  rejectProblemIdentificationSchema,
};
