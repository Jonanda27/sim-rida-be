const { z } = require('zod');

const createPolicyBriefSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Judul policy brief minimal 5 karakter'),
    content: z.string().min(20, 'Konten minimal 20 karakter'),
  }),
});

module.exports = {
  createPolicyBriefSchema,
};
