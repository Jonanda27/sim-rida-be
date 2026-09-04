const { z } = require('zod');

const createPolicyBriefSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Judul policy brief wajib diisi' }).min(3, 'Judul policy brief minimal 3 karakter').max(255),
    executiveSummary: z.string().optional().nullable(),
    problemStatement: z.string().optional().nullable(),
    researchFindings: z.string().optional().nullable(),
    policyOptions: z.string().optional().nullable(),
    recommendedPolicy: z.string().optional().nullable(),
    conclusion: z.string().optional().nullable(),
  }),
});

const updatePolicyBriefSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul policy brief minimal 3 karakter').max(255).optional(),
    executiveSummary: z.string().optional().nullable(),
    problemStatement: z.string().optional().nullable(),
    researchFindings: z.string().optional().nullable(),
    policyOptions: z.string().optional().nullable(),
    recommendedPolicy: z.string().optional().nullable(),
    conclusion: z.string().optional().nullable(),
  }),
});

const reviewPolicyBriefSchema = z.object({
  body: z.object({
    decision: z.enum(['APPROVE', 'REVISION'], {
      required_error: 'Keputusan review wajib diisi',
      invalid_type_error: 'Keputusan review harus APPROVE atau REVISION',
    }),
    notes: z.string().optional().nullable(),
  }),
});

module.exports = {
  createPolicyBriefSchema,
  updatePolicyBriefSchema,
  reviewPolicyBriefSchema,
};
