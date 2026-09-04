const { z } = require('zod');

const sourceTypeEnum = z.enum([
  'PLANNING_DOCUMENT',
  'POLICY_DOCUMENT',
  'REGULATION',
  'STATISTICAL_DATA',
  'RESEARCH_REPORT',
  'PUBLIC_DATA',
  'GOVERNMENT_REPORT',
  'OTHER',
], {
  errorMap: () => ({
    message: 'Invalid sourceType. Allowed: PLANNING_DOCUMENT, POLICY_DOCUMENT, REGULATION, STATISTICAL_DATA, RESEARCH_REPORT, PUBLIC_DATA, GOVERNMENT_REPORT, OTHER',
  }),
});

const sourceStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
  errorMap: () => ({ message: 'Invalid status. Allowed: DRAFT, ACTIVE, ARCHIVED' }),
});

const createExternalSourceSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Code is required and must be at least 2 characters'),
    title: z.string().min(3, 'Title is required and must be at least 3 characters'),
    description: z.string().optional(),
    sourceType: sourceTypeEnum.default('PLANNING_DOCUMENT'),
    institution: z.string().optional(),
  }),
});

const updateExternalSourceSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    sourceType: sourceTypeEnum.optional(),
    institution: z.string().optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'ARCHIVED'], {
      errorMap: () => ({ message: 'Status must be either ACTIVE or ARCHIVED' }),
    }),
  }),
});

const createVersionSchema = z.object({
  body: z.object({
    versionNumber: z.coerce.number().int().positive().optional(),
    effectiveDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    description: z.string().optional(),
  }),
});

module.exports = {
  createExternalSourceSchema,
  updateExternalSourceSchema,
  updateStatusSchema,
  createVersionSchema,
};
