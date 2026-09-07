const { z } = require('zod');

const executionSchemeEnum = z.enum([
  'SWAKELOLA',
  'PENUNJUKAN_LANGSUNG',
  'E_KATALOG',
  'TENDER',
]);

const submitApprovalSchema = z.object({
  params: z.object({
    proposalId: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    decision: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUIRED'], {
      errorMap: () => ({
        message: 'Keputusan harus salah satu dari: APPROVED (Setujui), REJECTED (Tolak), REVISION_REQUIRED (Kaji Ulang).',
      }),
    }),
    approvedBudget: z.number().nonnegative('Pagu yang disetujui tidak boleh negatif.').optional().nullable(),
    fiscalYear: z.number().int().min(2025).max(2035).optional().nullable(),
    finalExecutionScheme: executionSchemeEnum.optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

module.exports = {
  submitApprovalSchema,
};
