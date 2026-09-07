const { z } = require('zod');

const urgencyEnum = z.enum(['TINGGI', 'SEDANG', 'RENDAH']);
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
    title: z.string().min(5, 'Judul usulan penelitian minimal 5 karakter.'),
    category: z.string().min(3, 'Kategori bidang usulan wajib dipilih.'),
    problemStatement: z.string().min(10, 'Identifikasi masalah / latar belakang lapangan wajib diisi minimal 10 karakter.'),
    urgencyReason: z.string().min(10, 'Alasan urgensi penelitian wajib diisi minimal 10 karakter.'),
    urgencyLevel: urgencyEnum.default('TINGGI'),
    expectedOutput: expectedOutputEnum.default('REKOMENDASI_KEBIJAKAN'),
    estimatedBudget: z.number().nonnegative('Estimasi anggaran tidak boleh negatif.').optional().nullable(),
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
    urgencyLevel: urgencyEnum.optional(),
    expectedOutput: expectedOutputEnum.optional(),
    estimatedBudget: z.number().nonnegative().optional().nullable(),
    supportingDocuments: z.array(documentItemSchema).optional(),
  }),
});

const verifyProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    isProblemClear: z.boolean().default(true),
    isUrgencyRelevant: z.boolean().default(true),
    isBudgetFeasible: z.boolean().default(true),
    isDataAdequate: z.boolean().default(true),
    decision: z.enum(['PASS', 'RETURN'], {
      errorMap: () => ({ message: 'Keputusan verifikasi harus PASS (Loloskan) atau RETURN (Kembalikan).' }),
    }),
    verificationNotes: z.string().min(5, 'Catatan verifikator wajib diisi minimal 5 karakter.'),
  }),
});

module.exports = {
  createProposalSchema,
  updateProposalSchema,
  verifyProposalSchema,
};
