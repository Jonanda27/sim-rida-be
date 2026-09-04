const { z } = require('zod');

const createSelectionSchema = z.object({
  body: z.object({
    researchProposalId: z.string({
      required_error: 'researchProposalId is required',
    }).uuid('Invalid researchProposalId format'),
  }),
});

const updateScoreSchema = z.object({
  body: z.object({
    score: z.number({
      required_error: 'Score is required',
    }).min(0, 'Nilai skor tidak boleh kurang dari 0').max(100, 'Nilai skor tidak boleh lebih dari 100'),
    note: z.string().optional(),
  }),
});

const bulkUpdateScoresSchema = z.object({
  body: z.object({
    scores: z.array(
      z.object({
        criteriaId: z.string().uuid('Invalid criteriaId format'),
        score: z.number().min(0, 'Nilai skor tidak boleh kurang dari 0').max(100, 'Nilai skor tidak boleh lebih dari 100'),
        note: z.string().optional(),
      })
    ).min(1, 'At least one score entry is required'),
  }),
});

const finalizeSelectionSchema = z.object({
  body: z.object({
    result: z.enum(['SELECTED', 'NOT_SELECTED', 'SELECT', 'REJECT']).optional(),
    decision: z.enum(['SELECTED', 'NOT_SELECTED', 'SELECT', 'REJECT']).optional(),
    selectionNote: z.string().optional(),
    notes: z.string().optional(),
    summary: z.string().optional(),
  }).refine((data) => data.result || data.decision, {
    message: 'Result or decision is required (SELECTED or NOT_SELECTED)',
    path: ['result'],
  }),
});

const cancelSelectionSchema = z.object({
  body: z.object({
    reason: z.string({
      required_error: 'Alasan pembatalan (reason) wajib diisi.',
    }).min(5, 'Alasan pembatalan harus minimal 5 karakter'),
  }),
});

module.exports = {
  createSelectionSchema,
  updateScoreSchema,
  bulkUpdateScoresSchema,
  finalizeSelectionSchema,
  cancelSelectionSchema,
};
