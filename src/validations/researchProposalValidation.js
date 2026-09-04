const { z } = require('zod');

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'STRATEGIC'], {
  errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH, STRATEGIC' }),
});

const problemInputSchema = z.union([
  z.string().uuid(),
  z.object({
    problemIdentificationId: z.string().uuid(),
    isPrimary: z.boolean().optional(),
  }),
]);

const createProposalSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title is required and must be at least 5 characters'),
    background: z.string().optional(),
    problemStatement: z.string().optional(),
    researchQuestion: z.string().optional(),
    objective: z.string().optional(),
    scope: z.string().optional(),
    expectedOutput: z.string().optional(),
    expectedOutcome: z.string().optional(),
    methodology: z.string().optional(),
    priority: priorityEnum.default('MEDIUM'),
    problemIds: z.array(z.string().uuid()).optional(),
    problems: z.array(problemInputSchema).optional(),
    primaryProblemId: z.string().uuid().optional(),
    opdIds: z.array(z.string().uuid()).optional().default([]),
    primaryOpdId: z.string().uuid().optional(),
  }),
});

const createFromProblemSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title is required and must be at least 5 characters'),
    background: z.string().optional(),
    problemStatement: z.string().optional(),
    researchQuestion: z.string().optional(),
    objective: z.string().optional(),
    scope: z.string().optional(),
    expectedOutput: z.string().optional(),
    expectedOutcome: z.string().optional(),
    methodology: z.string().optional(),
    priority: priorityEnum.default('MEDIUM'),
    supportingProblemIds: z.array(z.string().uuid()).optional().default([]),
    opdIds: z.array(z.string().uuid()).optional().default([]),
    primaryOpdId: z.string().uuid().optional(),
  }),
});

const updateProposalSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    background: z.string().optional(),
    problemStatement: z.string().optional(),
    researchQuestion: z.string().optional(),
    objective: z.string().optional(),
    scope: z.string().optional(),
    expectedOutput: z.string().optional(),
    expectedOutcome: z.string().optional(),
    methodology: z.string().optional(),
    priority: priorityEnum.optional(),
    problemIds: z.array(z.string().uuid()).optional(),
    problems: z.array(problemInputSchema).optional(),
    primaryProblemId: z.string().uuid().optional(),
    opdIds: z.array(z.string().uuid()).optional(),
    primaryOpdId: z.string().uuid().optional(),
  }),
});

const returnProposalSchema = z.object({
  body: z.object({
    reviewNote: z.string({
      required_error: 'Catatan telaah / reviewNote wajib diisi.',
    }).min(5, 'Catatan telaah harus minimal 5 karakter'),
  }),
});

const cancelProposalSchema = z.object({
  body: z.object({
    reason: z.string({
      required_error: 'Alasan pembatalan (reason) wajib diisi.',
    }).min(5, 'Alasan pembatalan harus minimal 5 karakter'),
  }),
});

module.exports = {
  createProposalSchema,
  createFromProblemSchema,
  updateProposalSchema,
  returnProposalSchema,
  cancelProposalSchema,
};
