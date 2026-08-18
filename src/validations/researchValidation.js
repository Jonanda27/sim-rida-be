const { z } = require('zod');

const createResearchSchema = z.object({
  body: z.object({
    problemId: z.string().min(1, 'ID Masalah (problemId) wajib disertakan'),
    title: z.string().min(5, 'Judul usulan perencanaan minimal 5 karakter'),
    researchTypeId: z.string().uuid('ID Jenis Penelitian harus berupa UUID yang valid'),
    objective: z.string().min(10, 'Tujuan penelitian wajib diisi secara jelas'),
    researchQuestions: z.string().min(10, 'Pertanyaan penelitian wajib diisi'),
    scope: z.string().min(5, 'Ruang lingkup kajian wajib diisi'),
    expectedOutput: z.string().min(5, 'Output yang diharapkan wajib diisi'),
    expectedOutcome: z.string().min(5, 'Outcome yang diharapkan wajib diisi'),
    successIndicators: z.string().min(5, 'Indikator keberhasilan wajib diisi'),
    estimatedBudget: z.number().positive('Anggaran harus berupa angka positif'),
    estimatedDurationMonths: z.number().int().positive('Durasi harus berupa angka bulan (bilangan bulat positif)'),
  }),
});

module.exports = { createResearchSchema };
