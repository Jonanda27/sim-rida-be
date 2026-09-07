const { z } = require('zod');

const createOpdSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Kode OPD minimal 2 karakter.'),
    name: z.string().min(3, 'Nama OPD minimal 3 karakter.'),
    category: z.string().optional().default('Badan / Dinas Daerah'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Format email OPD tidak valid.').optional(),
  }),
});

const updateOpdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID OPD tidak valid.'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama OPD minimal 3 karakter.').optional(),
    category: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Format email OPD tidak valid.').optional(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  createOpdSchema,
  updateOpdSchema,
};
