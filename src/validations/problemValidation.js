const { z } = require('zod');

const createProblemSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Judul masalah minimal 5 karakter').max(150, 'Judul terlalu panjang'),
    sectorId: z.string().uuid('ID Sektor harus berupa UUID yang valid'),
    targetCompletion: z.string().min(3, 'Target penyelesaian wajib diisi (contoh: Desember 2026)'),
    background: z.string().min(20, 'Latar belakang masalah minimal 20 karakter'),
    mainFocus: z.string().min(10, 'Fokus masalah utama wajib diisi'),
    impact: z.string().min(10, 'Dampak masalah wajib diisi'),
    urgency: z.string().min(5, 'Urgensi masalah wajib diisi'),
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
