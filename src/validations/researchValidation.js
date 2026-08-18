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

const updateResearchSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Judul minimal 5 karakter').optional(),
    researchTypeId: z.string().uuid('ID Jenis Riset tidak valid').optional(),
    objective: z.string().min(10, 'Tujuan minimal 10 karakter').optional(),
    researchQuestions: z.string().min(10, 'Pertanyaan riset minimal 10 karakter').optional(),
    scope: z.string().min(5, 'Ruang lingkup minimal 5 karakter').optional(),
    expectedOutput: z.string().min(5, 'Output minimal 5 karakter').optional(),
    expectedOutcome: z.string().min(5, 'Outcome minimal 5 karakter').optional(),
    successIndicators: z.string().min(5, 'Indikator keberhasilan minimal 5 karakter').optional(),
    estimatedBudget: z.number().min(0, 'Anggaran tidak boleh negatif').optional(),
    estimatedDurationMonths: z.number().min(1, 'Durasi minimal 1 bulan').optional(),
  }),
});

module.exports = {
  createResearchSchema,
  updateResearchSchema,
};
