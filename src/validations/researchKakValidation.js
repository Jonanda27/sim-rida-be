const { z } = require('zod');

const dateRangeRefinement = (data, ctx) => {
  if (data.estimatedStartDate && data.estimatedEndDate) {
    const start = new Date(data.estimatedStartDate);
    const end = new Date(data.estimatedEndDate);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal akhir estimasi (estimatedEndDate) tidak boleh mendahului tanggal mulai (estimatedStartDate)',
        path: ['estimatedEndDate'],
      });
    }
  }
};

const createKakSchema = z.object({
  body: z
    .object({
      researchProposalId: z.string({
        required_error: 'researchProposalId is required',
      }).uuid('Invalid researchProposalId format'),
      background: z.string().optional(),
      legalBasis: z.string().optional(),
      purpose: z.string().optional(),
      intent: z.string().optional(),
      objective: z.string().optional(),
      researchScope: z.string().optional(),
      scope: z.string().optional(),
      researchLocation: z.string().optional(),
      location: z.string().optional(),
      researchDuration: z.string().optional(),
      duration: z.string().optional(),
      researchMethodology: z.string().optional(),
      methodology: z.string().optional(),
      researchStages: z.string().optional(),
      expectedOutput: z.string().optional(),
      targetOutput: z.string().optional(),
      output: z.string().optional(),
      expectedOutcome: z.string().optional(),
      targetOutcome: z.string().optional(),
      benefit: z.string().optional(),
      successIndicator: z.string().optional(),
      indicators: z.string().optional(),
      deliverables: z.string().optional(),
      personnel: z.string().optional(),
      target: z.string().optional(),
      estimatedStartDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      estimatedEndDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    })
    .superRefine(dateRangeRefinement),
});

const updateKakSchema = z.object({
  body: z
    .object({
      background: z.string().optional(),
      legalBasis: z.string().optional(),
      purpose: z.string().optional(),
      intent: z.string().optional(),
      objective: z.string().optional(),
      researchScope: z.string().optional(),
      scope: z.string().optional(),
      researchLocation: z.string().optional(),
      location: z.string().optional(),
      researchDuration: z.string().optional(),
      duration: z.string().optional(),
      researchMethodology: z.string().optional(),
      methodology: z.string().optional(),
      researchStages: z.string().optional(),
      expectedOutput: z.string().optional(),
      targetOutput: z.string().optional(),
      output: z.string().optional(),
      expectedOutcome: z.string().optional(),
      targetOutcome: z.string().optional(),
      benefit: z.string().optional(),
      successIndicator: z.string().optional(),
      indicators: z.string().optional(),
      deliverables: z.string().optional(),
      personnel: z.string().optional(),
      target: z.string().optional(),
      estimatedStartDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      estimatedEndDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    })
    .superRefine(dateRangeRefinement),
});

const returnKakSchema = z.object({
  body: z.object({
    reviewNote: z.string({
      required_error: 'Catatan telaah KAK (reviewNote) wajib diisi.',
    }).min(5, 'Catatan telaah KAK harus minimal 5 karakter'),
  }),
});

const cancelKakSchema = z.object({
  body: z.object({
    reason: z.string({
      required_error: 'Alasan pembatalan (reason) wajib diisi.',
    }).min(5, 'Alasan pembatalan harus minimal 5 karakter'),
  }),
});

module.exports = {
  createKakSchema,
  updateKakSchema,
  returnKakSchema,
  cancelKakSchema,
};
