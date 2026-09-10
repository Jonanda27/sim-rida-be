const { z } = require('zod');

const urgencyEnum = z.enum(['TINGGI', 'SEDANG', 'RENDAH']);
const sourceEnum = z.enum(['BRIDA_ANALYSIS', 'OPD_PROPOSAL']);
const expectedOutputEnum = z.enum([
  'REKOMENDASI_KEBIJAKAN',
  'NASKAH_AKADEMIK',
  'PROTOTIPE_SISTEM',
  'DOKUMEN_MASTERPLAN',
  'STUDI_KELAYAKAN',
]);

const documentItemSchema = z.object({
  name: z.string().min(1, 'Nama file wajib diisi.'),
  size: z.string().min(1, 'Ukuran file wajib diisi.'),
  fileUrl: z.string().optional(),
});

const createProposalSchema = z.object({
  body: z.object({
    source: sourceEnum.optional().default('OPD_PROPOSAL'),
    opdId: z.string().uuid('ID OPD tidak valid.').optional(),
    title: z.string().min(5, 'Judul usulan / analisis strategis minimal 5 karakter.'),
    category: z.string().min(3, 'Kategori bidang usulan wajib dipilih.'),
    problemStatement: z.string().min(10, 'Identifikasi masalah / analisis lapangan wajib diisi minimal 10 karakter.'),
    urgencyReason: z.string().min(10, 'Alasan urgensi penelitian wajib diisi minimal 10 karakter.'),
    strategicImpact: z.string().optional().nullable(),
    urgencyLevel: urgencyEnum.default('TINGGI'),
    expectedOutput: expectedOutputEnum.default('REKOMENDASI_KEBIJAKAN'),
    estimatedBudget: z.number().nonnegative('Estimasi anggaran tidak boleh negatif.').optional().nullable(),
    estimatedDuration: z.number().int().min(1, 'Durasi minimal 1 bulan.').max(24, 'Durasi maksimal 24 bulan.').optional().default(3),
    isDraft: z.boolean().optional().default(false),
    supportingDocuments: z.array(documentItemSchema).optional().default([]),
  }),
});

const updateProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    title: z.string().min(5, 'Judul usulan penelitian minimal 5 karakter.').optional(),
    category: z.string().min(3, 'Kategori bidang usulan wajib dipilih.').optional(),
    problemStatement: z.string().min(10, 'Identifikasi masalah lapangan minimal 10 karakter.').optional(),
    urgencyReason: z.string().min(10, 'Alasan urgensi penelitian minimal 10 karakter.').optional(),
    strategicImpact: z.string().optional().nullable(),
    urgencyLevel: urgencyEnum.optional(),
    expectedOutput: expectedOutputEnum.optional(),
    estimatedBudget: z.number().nonnegative().optional().nullable(),
    estimatedDuration: z.number().int().min(1).max(24).optional().nullable(),
    supportingDocuments: z.array(documentItemSchema).optional(),
  }),
});

const verifyProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    isProblemClear: z.boolean().default(true),
    isNotDuplicated: z.boolean().default(true),
    isUrgencyRelevant: z.boolean().default(true),
    isStrategicAligned: z.boolean().default(true),
    isResearchFeasible: z.boolean().default(true),
    isBudgetFeasible: z.boolean().default(true).optional(),
    isDataAdequate: z.boolean().default(true).optional(),
    decision: z.enum(['PASS', 'RETURN', 'REJECT'], {
      errorMap: () => ({ message: 'Keputusan validasi harus PASS (Loloskan ke KAK), RETURN (Kembalikan untuk revisi), atau REJECT (Tolak usulan).' }),
    }),
    verificationNotes: z.string().min(5, 'Catatan hasil validasi wajib diisi minimal 5 karakter.'),
  }),
});

const followUpProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    utilizationType: z.string().min(3, 'Jenis pemanfaatan wajib dipilih.'),
    utilizationSummary: z.string().min(10, 'Ringkasan implementasi / pemanfaatan minimal 10 karakter.'),
    satisfactionRating: z.number().int().min(1).max(5).default(5),
    feedbackNotes: z.string().optional().nullable(),
  }),
});

module.exports = {
  createProposalSchema,
  updateProposalSchema,
  verifyProposalSchema,
  followUpProposalSchema,
};
