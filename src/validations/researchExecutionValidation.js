const { z } = require('zod');

const TimelineStatusEnum = z.enum(['PENDING', 'ONGOING', 'COMPLETED', 'SKIPPED']);
const MilestoneStatusEnum = z.enum(['PENDING', 'ONGOING', 'COMPLETED', 'SKIPPED']);
const ActivityStatusEnum = z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED']);
const ImplementationDocumentTypeEnum = z.enum([
  'WORK_PLAN',
  'TIMELINE',
  'ACTIVITY_DOCUMENT',
  'MEETING_DOCUMENT',
  'FIELD_DOCUMENTATION',
  'INTERIM_DOCUMENT',
  'OTHER',
]);

const createTimelineSchema = z.object({
  body: z
    .object({
      title: z.string().min(2, 'Judul minimal 2 karakter').optional(),
      name: z.string().min(2, 'Judul minimal 2 karakter').optional(),
      description: z.string().optional().nullable(),
      startDate: z.string({ required_error: 'Tanggal mulai (startDate) wajib diisi' }).datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      endDate: z.string({ required_error: 'Tanggal akhir (endDate) wajib diisi' }).datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      order: z.number().int().optional().default(0),
    })
    .superRefine((data, ctx) => {
      if (!data.title && !data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Judul tahapan (title/name) wajib diisi',
          path: ['title'],
        });
      }
      if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal akhir tahapan (endDate) tidak boleh mendahului tanggal mulai (startDate)',
          path: ['endDate'],
        });
      }
    }),
});

const updateTimelineSchema = z.object({
  body: z
    .object({
      title: z.string().min(2).optional(),
      name: z.string().min(2).optional(),
      description: z.string().optional().nullable(),
      startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      order: z.number().int().optional(),
      status: TimelineStatusEnum.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal akhir tahapan (endDate) tidak boleh mendahului tanggal mulai (startDate)',
          path: ['endDate'],
        });
      }
    }),
});

const createMilestoneSchema = z.object({
  body: z.object({
    timelineId: z.string().uuid('Invalid timelineId format').optional().nullable(),
    title: z.string().min(2, 'Judul minimal 2 karakter').optional(),
    name: z.string().min(2, 'Judul minimal 2 karakter').optional(),
    description: z.string().optional().nullable(),
    targetDate: z.string({ required_error: 'Target tanggal capaian (targetDate) wajib diisi' }).datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    weight: z.number().optional().nullable(),
    order: z.number().int().optional().default(0),
  }).superRefine((data, ctx) => {
    if (!data.title && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Judul capaian (title/name) wajib diisi',
        path: ['title'],
      });
    }
  }),
});

const updateMilestoneSchema = z.object({
  body: z.object({
    timelineId: z.string().uuid('Invalid timelineId format').optional().nullable(),
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    targetDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    status: MilestoneStatusEnum.optional(),
    progress: z.number().int().min(0).max(100).optional(),
    order: z.number().int().optional(),
  }),
});

const updateMilestoneProgressSchema = z.object({
  body: z.object({
    progress: z.number({ required_error: 'Progress wajib diisi' }).int().min(0).max(100),
    notes: z.string().optional().nullable(),
  }),
});

const createActivitySchema = z.object({
  body: z.object({
    timelineId: z.string().uuid('Invalid timelineId format').optional().nullable(),
    milestoneId: z.string().uuid('Invalid milestoneId format').optional().nullable(),
    title: z.string({ required_error: 'Judul aktivitas (title) wajib diisi' }).min(2, 'Judul minimal 2 karakter'),
    description: z.string().optional().nullable(),
    activityDate: z.string({ required_error: 'Tanggal aktivitas (activityDate) wajib diisi' }).datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  }),
});

const updateActivitySchema = z.object({
  body: z.object({
    timelineId: z.string().uuid('Invalid timelineId format').optional().nullable(),
    milestoneId: z.string().uuid('Invalid milestoneId format').optional().nullable(),
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    activityDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    status: ActivityStatusEnum.optional(),
  }),
});

module.exports = {
  TimelineStatusEnum,
  MilestoneStatusEnum,
  ActivityStatusEnum,
  ImplementationDocumentTypeEnum,
  createTimelineSchema,
  updateTimelineSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  updateMilestoneProgressSchema,
  createActivitySchema,
  updateActivitySchema,
};
