const { z } = require('zod');

const dateRangeRefinement = (data, ctx) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal akhir pelaksanaan (endDate) tidak boleh mendahului tanggal mulai (startDate)',
        path: ['endDate'],
      });
    }
  }
};

const createImplementationSchema = z.object({
  body: z
    .object({
      researchProposalId: z.string({
        required_error: 'researchProposalId is required',
      }),
      partnerSelectionId: z.string().optional().nullable(),
      responsibleUserId: z.string().optional().nullable(),
      startDate: z.string({
        required_error: 'Tanggal mulai pelaksanaan (startDate) wajib diisi',
      }).datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      endDate: z.string({
        required_error: 'Tanggal akhir pelaksanaan (endDate) wajib diisi',
      }).datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      description: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .superRefine(dateRangeRefinement),
});

const updateImplementationSchema = z.object({
  body: z
    .object({
      responsibleUserId: z.string().uuid('Invalid responsibleUserId format').optional(),
      startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      description: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .superRefine(dateRangeRefinement),
});

const updateProgressSchema = z.object({
  body: z.object({
    progress: z
      .number({
        required_error: 'Nilai progress wajib diisi',
      })
      .int('Nilai progress harus berupa bilangan bulat')
      .min(0, 'Progress minimal 0%')
      .max(100, 'Progress maksimal 100%'),
    notes: z.string().optional().nullable(),
  }),
});

const cancelImplementationSchema = z.object({
  body: z.object({
    reason: z.string({
      required_error: 'Alasan pembatalan (reason) wajib diisi.',
    }).min(5, 'Alasan pembatalan harus minimal 5 karakter'),
  }),
});

module.exports = {
  createImplementationSchema,
  updateImplementationSchema,
  updateProgressSchema,
  cancelImplementationSchema,
};
