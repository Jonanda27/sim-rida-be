const { z } = require('zod');

const createFollowUpSchema = z.object({
  body: z.object({
    actionPlan: z.string().min(5, 'Rencana aksi tindak lanjut wajib diisi'),
    progress: z.string().min(5, 'Progres pelaksanaan wajib diisi'),
  }),
});

module.exports = {
  createFollowUpSchema,
};
