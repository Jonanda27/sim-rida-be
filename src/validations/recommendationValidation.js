const { z } = require('zod');

const createRecommendationSchema = z.object({
  body: z.object({
    decision: z.string().min(5, 'Keputusan rekomendasi wajib diisi'),
    notes: z.string().optional(),
  }),
});

module.exports = {
  createRecommendationSchema,
};
