const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama pengguna minimal 2 karakter.'),
    nip: z.string().optional(),
    email: z.string().email('Format email tidak valid.'),
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    phone: z.string().optional(),
    role: z.enum(['ADMIN_BRIDA', 'KEPALA_BRIDA', 'OPD'], {
      errorMap: () => ({ message: 'Role harus salah satu dari: ADMIN_BRIDA, KEPALA_BRIDA, OPD.' }),
    }),
    opdId: z.string().uuid('ID OPD tidak valid.').optional().nullable(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID user tidak valid.'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nama pengguna minimal 2 karakter.').optional(),
    nip: z.string().optional().nullable(),
    email: z.string().email('Format email tidak valid.').optional(),
    phone: z.string().optional().nullable(),
    role: z.enum(['ADMIN_BRIDA', 'KEPALA_BRIDA', 'OPD']).optional(),
    opdId: z.string().uuid('ID OPD tidak valid.').optional().nullable(),
    password: z.string().min(6, 'Password minimal 6 karakter.').optional(),
  }),
});

const toggleStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID user tidak valid.'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'Status isActive (boolean) wajib diisi.' }),
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  toggleStatusSchema,
};
