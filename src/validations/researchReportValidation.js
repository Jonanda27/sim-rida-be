const { z } = require('zod');

const createReportSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Judul laporan wajib diisi' }).min(3, 'Judul laporan minimal 3 karakter').max(255),
    reportType: z.enum(['FINAL_REPORT', 'INTERIM_REPORT', 'OTHER'], {
      invalid_type_error: 'Tipe laporan tidak valid',
    }).default('FINAL_REPORT'),
    summary: z.string().optional().nullable(),
  }),
});

const updateReportSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul laporan minimal 3 karakter').max(255).optional(),
    reportType: z.enum(['FINAL_REPORT', 'INTERIM_REPORT', 'OTHER'], {
      invalid_type_error: 'Tipe laporan tidak valid',
    }).optional(),
    summary: z.string().optional().nullable(),
  }),
});

const reviewReportSchema = z.object({
  body: z.object({
    decision: z.enum(['APPROVE', 'REVISION', 'REJECT'], {
      required_error: 'Keputusan review wajib diisi',
      invalid_type_error: 'Keputusan review harus APPROVE, REVISION, atau REJECT',
    }),
    notes: z.string().optional().nullable(),
  }),
});

module.exports = {
  createReportSchema,
  updateReportSchema,
  reviewReportSchema,
};
