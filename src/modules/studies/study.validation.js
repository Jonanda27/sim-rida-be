const { z } = require('zod');

const executionSchemeEnum = z.enum([
  'SWAKELOLA',
  'PENUNJUKAN_LANGSUNG',
  'E_KATALOG',
  'TENDER',
]);

const initializeStudySchema = z.object({
  params: z.object({
    proposalId: z.string().uuid('ID usulan tidak valid.'),
  }),
  body: z.object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
  }),
});

const saveKakSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID kajian tidak valid.'),
  }),
  body: z.object({
    background: z.string().min(10, 'Latar belakang KAK minimal 10 karakter.'),
    objectives: z.string().min(10, 'Maksud & tujuan kajian minimal 10 karakter.'),
    scopeAndMethodology: z.string().min(10, 'Ruang lingkup & metodologi riset minimal 10 karakter.'),
    targetOutput: z.string().min(5, 'Target luaran kajian minimal 5 karakter.'),
    durationMonths: z.number().int().min(1).max(24).default(3),
    status: z.enum(['DRAFT', 'FINAL']).default('DRAFT'),
  }),
});

const rkaItemSchema = z.object({
  category: z.string().min(3, 'Kategori belanja wajib diisi.'),
  description: z.string().min(3, 'Uraian rincian belanja wajib diisi.'),
  volume: z.number().positive('Volume belanja harus bernilai positif.'),
  unit: z.string().min(1, 'Satuan belanja wajib diisi (misal: OH, Paket, Bulan, Orang).'),
  unitPrice: z.number().nonnegative('Harga satuan tidak boleh negatif.'),
});

const saveRkaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID kajian tidak valid.'),
  }),
  body: z.object({
    items: z.array(rkaItemSchema).min(1, 'Minimal harus ada 1 item rincian anggaran belanja.'),
  }),
});

const teamMemberSchema = z.object({
  name: z.string().min(3, 'Nama anggota tim minimal 3 karakter.'),
  role: z.string().min(3, 'Peran / posisi dalam tim riset wajib diisi.'),
  institution: z.string().min(2, 'Asal institusi / lembaga wajib diisi.'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Format email tidak valid.').optional().nullable(),
});

const saveTeamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID kajian tidak valid.'),
  }),
  body: z.object({
    members: z.array(teamMemberSchema).min(1, 'Minimal harus ada 1 anggota/ketua tim peneliti.'),
  }),
});

const updateStudyStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID kajian tidak valid.'),
  }),
  body: z.object({
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED'], {
      errorMap: () => ({
        message: 'Status kajian harus salah satu dari: PLANNING, IN_PROGRESS, COMPLETED.',
      }),
    }),
  }),
});

module.exports = {
  initializeStudySchema,
  saveKakSchema,
  saveRkaSchema,
  saveTeamSchema,
  updateStudyStatusSchema,
};
