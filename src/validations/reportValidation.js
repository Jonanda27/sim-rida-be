const { z } = require('zod');

const createReportSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Judul laporan minimal 5 karakter'),
    summary: z.string().min(10, 'Ringkasan minimal 10 karakter'),
  }),
});

module.exports = {
  createReportSchema,
};
