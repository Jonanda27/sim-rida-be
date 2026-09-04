const { z } = require('zod');

const PartnerTypeEnum = z.enum([
  'UNIVERSITY',
  'RESEARCH_INSTITUTION',
  'CONSULTANT',
  'COMPANY',
  'INDIVIDUAL',
  'INTERNAL_BRIDA',
  'OTHER',
]);

const createPartnerSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Nama mitra (name) wajib diisi',
    }).min(2, 'Nama mitra minimal 2 karakter'),
    type: PartnerTypeEnum.default('OTHER'),
    institutionName: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    email: z.string().optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    taxIdentifier: z.string().optional().nullable(),
    registrationNumber: z.string().optional().nullable(),
    website: z.string().optional().nullable().or(z.literal('')),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

const updatePartnerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama mitra minimal 2 karakter').optional(),
    type: PartnerTypeEnum.optional(),
    institutionName: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    email: z.string().optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    taxIdentifier: z.string().optional().nullable(),
    registrationNumber: z.string().optional().nullable(),
    website: z.string().optional().nullable().or(z.literal('')),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  PartnerTypeEnum,
  createPartnerSchema,
  updatePartnerSchema,
};
