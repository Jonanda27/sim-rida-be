const { z } = require('zod');

const researchFieldEnum = z.enum([
  'EKONOMI_PEMBANGUNAN',
  'TATA_KELOLA_PEMERINTAHAN',
  'SOSIAL_BUDAYA',
  'INOVASI_TEKNOLOGI',
], {
  errorMap: () => ({
    message: 'Klasifikasi bidang harus salah satu dari: EKONOMI_PEMBANGUNAN, TATA_KELOLA_PEMERINTAHAN, SOSIAL_BUDAYA, INOVASI_TEKNOLOGI.',
  }),
});

const executionSchemeEnum = z.enum([
  'SWAKELOLA',
  'PENUNJUKAN_LANGSUNG',
  'E_KATALOG',
  'TENDER',
], {
  errorMap: () => ({
    message: 'Skema pelaksanaan riset harus salah satu dari: SWAKELOLA, PENUNJUKAN_LANGSUNG, E_KATALOG, TENDER.',
  }),
});

const submitScoringSchema = z.object({
  params: z.object({
    proposalId: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    // 4 Kriteria Pembobotan Digital (0 - 100)
    visionAlignmentScore: z
      .number({ required_error: 'Skor kesesuaian visi-misi wajib diisi.' })
      .min(0, 'Skor minimal 0.')
      .max(100, 'Skor maksimal 100.'),
    urgencyScore: z
      .number({ required_error: 'Skor urgensi masalah wajib diisi.' })
      .min(0, 'Skor minimal 0.')
      .max(100, 'Skor maksimal 100.'),
    budgetFeasibilityScore: z
      .number({ required_error: 'Skor ketersediaan anggaran wajib diisi.' })
      .min(0, 'Skor minimal 0.')
      .max(100, 'Skor maksimal 100.'),
    dataReadinessScore: z
      .number({ required_error: 'Skor kesiapan data & kapasitas wajib diisi.' })
      .min(0, 'Skor minimal 0.')
      .max(100, 'Skor maksimal 100.'),

    // Klasifikasi & Skema Pelaksanaan
    researchField: researchFieldEnum,
    executionScheme: executionSchemeEnum,

    // Catatan telaah teknis
    evaluationNotes: z
      .string({ required_error: 'Catatan telaah teknis wajib diisi.' })
      .min(10, 'Catatan telaah teknis minimal 10 karakter.'),
  }),
});

module.exports = {
  submitScoringSchema,
};
