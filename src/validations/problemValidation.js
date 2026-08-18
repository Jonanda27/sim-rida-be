const { z } = require('zod');

const createProblemSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Judul masalah minimal 5 karakter').max(150, 'Judul terlalu panjang'),
    sector: z.string().min(1, 'Sektor wajib diisi'),
    description: z.string().min(20, 'Deskripsi masalah minimal 20 karakter'),
    impactedArea: z.string().min(1, 'Wilayah terdampak wajib diisi'),
  }),
});

const validateProblemSchema = z.object({
  body: z.object({
    status: z.enum(['VALID', 'REVISION_REQUIRED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }),
});

const updateProblemSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(150).optional(),
    sector: z.string().min(1).optional(),
    description: z.string().min(20).optional(),
    impactedArea: z.string().min(1).optional(),
  }),
});

module.exports = {
  createProblemSchema,
  validateProblemSchema,
  updateProblemSchema,
};
