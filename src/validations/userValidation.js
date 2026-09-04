const { z } = require('zod');

const roleEnum = z.enum(['ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA', 'OPD'], {
  errorMap: () => ({ message: 'Role must be one of: ADMIN_BRIDA, BRIDA, KEPALA_BRIDA, OPD' }),
});

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: roleEnum,
    opdId: z.string().uuid('Invalid OPD ID format').nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    role: roleEnum.optional(),
    opdId: z.string().uuid('Invalid OPD ID format').nullable().optional(),
  }),
});

const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive status boolean is required' }),
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
};
