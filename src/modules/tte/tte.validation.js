const { z } = require('zod');

const signedDocumentTypeEnum = z.enum([
  'POLICY_RECOMMENDATION',
  'KAK_DOCUMENT',
], {
  errorMap: () => ({
    message: 'Tipe dokumen harus salah satu dari: POLICY_RECOMMENDATION, KAK_DOCUMENT.',
  }),
});

const signDocumentSchema = z.object({
  body: z.object({
    documentType: signedDocumentTypeEnum,
    documentId: z.string().uuid('ID dokumen tidak valid.'),
    passphrase: z.string().min(6, 'Passphrase / PIN TTE minimal 6 karakter.'),
    notes: z.string().optional().nullable(),
  }),
});

const getDocumentDetailSchema = z.object({
  params: z.object({
    documentType: signedDocumentTypeEnum,
    id: z.string().uuid('ID dokumen tidak valid.'),
  }),
});

module.exports = {
  signDocumentSchema,
  getDocumentDetailSchema,
};
