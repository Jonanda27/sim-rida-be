const { z } = require('zod');

const createResearchSchema = z.object({
  body: z.object({
    problemId: z.string().min(1, 'ID Masalah (problemId) wajib disertakan'),
    title: z.string().min(5, 'Judul usulan perencanaan minimal 5 karakter'),
    researchTypeId: z.string().uuid('ID Jenis Penelitian harus berupa UUID yang valid'),
    objective: z.string().min(10, 'Tujuan perencanaan wajib diisi secara jelas'),
    expectedSolution: z.string().min(10, 'Deskripsi bentuk aplikasi/solusi wajib diisi'),
    estimatedBudget: z.number().positive('Anggaran harus berupa angka positif'),
    estimatedDurationMonths: z.number().positive('Durasi harus berupa angka positif'),
  }),
});

module.exports = { createResearchSchema };
