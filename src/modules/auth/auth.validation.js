const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email atau NIP wajib diisi.'),
    password: z.string().min(1, 'Password wajib diisi.'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Password lama wajib diisi.'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter.'),
  }),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
};
