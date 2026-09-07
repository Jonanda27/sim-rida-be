const { z } = require('zod');

const impactLevelEnum = z.enum([
  'STRATEGIS_DAERAH',
  'SEKTORAL',
  'OPERASIONAL',
], {
  errorMap: () => ({
    message: 'Tingkat dampak rekomendasi harus salah satu dari: STRATEGIS_DAERAH, SEKTORAL, OPERASIONAL.',
  }),
});

const policyTargetTypeEnum = z.enum([
  'DRAFT_PERBUP',
  'DRAFT_PERDA',
  'SE_BUPATI',
  'SOP_LAYANAN',
  'RENCANA_AKSI_DAERAH',
  'PETUNJUK_TEKNIS',
], {
  errorMap: () => ({
    message: 'Target bentuk kebijakan harus salah satu dari: DRAFT_PERBUP, DRAFT_PERDA, SE_BUPATI, SOP_LAYANAN, RENCANA_AKSI_DAERAH, PETUNJUK_TEKNIS.',
  }),
});

const createRecommendationSchema = z.object({
  body: z.object({
    studyId: z.string().uuid('ID kajian riset tidak valid.'),
    title: z.string().min(10, 'Judul rekomendasi kebijakan minimal 10 karakter.'),
    executiveSummary: z.string().min(20, 'Ringkasan eksekutif minimal 20 karakter.'),
    keyFindings: z.string().min(20, 'Temuan utama riset minimal 20 karakter.'),
    policyActions: z.string().min(20, 'Butir-butir rekomendasi kebijakan minimal 20 karakter.'),
    targetPolicyType: policyTargetTypeEnum.default('DRAFT_PERBUP'),
    impactLevel: impactLevelEnum.default('STRATEGIS_DAERAH'),
    targetOpdNames: z.string().optional().nullable(),
    documentUrl: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT'),
  }),
});

const updateRecommendationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID rekomendasi tidak valid.'),
  }),
  body: z.object({
    title: z.string().min(10, 'Judul rekomendasi kebijakan minimal 10 karakter.').optional(),
    executiveSummary: z.string().min(20, 'Ringkasan eksekutif minimal 20 karakter.').optional(),
    keyFindings: z.string().min(20, 'Temuan utama riset minimal 20 karakter.').optional(),
    policyActions: z.string().min(20, 'Butir-butir rekomendasi kebijakan minimal 20 karakter.').optional(),
    targetPolicyType: policyTargetTypeEnum.optional(),
    impactLevel: impactLevelEnum.optional(),
    targetOpdNames: z.string().optional().nullable(),
    documentUrl: z.string().optional().nullable(),
  }),
});

const finalizeRecommendationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID rekomendasi tidak valid.'),
  }),
  body: z.object({
    feedbackNotes: z.string().optional().nullable(),
  }),
});

module.exports = {
  createRecommendationSchema,
  updateRecommendationSchema,
  finalizeRecommendationSchema,
};
