const { z } = require('zod');

const createProblemSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Judul masalah minimal 5 karakter').max(150, 'Judul terlalu panjang'),
    sectorId: z.string().uuid('ID Sektor harus berupa UUID yang valid'),
    description: z.string().min(20, 'Deskripsi masalah minimal 20 karakter'),
    impactedAreaId: z.string().uuid('ID Wilayah Terdampak harus berupa UUID yang valid'),
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
