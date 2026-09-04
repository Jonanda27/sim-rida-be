const { z } = require('zod');

const createRecommendationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Judul rekomendasi wajib diisi' }).min(3, 'Judul rekomendasi minimal 3 karakter').max(255),
    recommendationType: z.enum(
      ['POLICY', 'PROGRAM', 'APPLICATION', 'REGULATION', 'BUDGET', 'SERVICE_IMPROVEMENT', 'OTHER'],
      { invalid_type_error: 'Tipe rekomendasi tidak valid' }
    ).default('POLICY'),
    targetOpdId: z.string({ required_error: 'Target OPD wajib dipilih' }).uuid('ID Target OPD tidak valid'),
    problem: z.string({ required_error: 'Uraian permasalahan wajib diisi' }).min(3, 'Uraian permasalahan minimal 3 karakter'),
    basis: z.string({ required_error: 'Dasar/landasan riset wajib diisi' }).min(3, 'Dasar riset minimal 3 karakter'),
    recommendation: z.string({ required_error: 'Uraian rekomendasi wajib diisi' }).min(3, 'Uraian rekomendasi minimal 3 karakter'),
    expectedImpact: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
      invalid_type_error: 'Prioritas rekomendasi harus LOW, MEDIUM, HIGH, atau URGENT',
    }).default('MEDIUM'),
  }),
});

const updateRecommendationSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul rekomendasi minimal 3 karakter').max(255).optional(),
    recommendationType: z.enum(
      ['POLICY', 'PROGRAM', 'APPLICATION', 'REGULATION', 'BUDGET', 'SERVICE_IMPROVEMENT', 'OTHER'],
      { invalid_type_error: 'Tipe rekomendasi tidak valid' }
    ).optional(),
    targetOpdId: z.string().uuid('ID Target OPD tidak valid').optional(),
    problem: z.string().min(3, 'Uraian permasalahan minimal 3 karakter').optional(),
    basis: z.string().min(3, 'Dasar riset minimal 3 karakter').optional(),
    recommendation: z.string().min(3, 'Uraian rekomendasi minimal 3 karakter').optional(),
    expectedImpact: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
      invalid_type_error: 'Prioritas rekomendasi harus LOW, MEDIUM, HIGH, atau URGENT',
    }).optional(),
  }),
});

const reviewRecommendationSchema = z.object({
  body: z.object({
    notes: z.string().optional().nullable(),
  }),
});

module.exports = {
  createRecommendationSchema,
  updateRecommendationSchema,
  reviewRecommendationSchema,
};
