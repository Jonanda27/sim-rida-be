const { z } = require('zod');

const PartnerSelectionMethodEnum = z.enum([
  'SWAKELOLA',
  'PENUNJUKAN_LANGSUNG',
  'E_KATALOG',
  'TENDER',
]);

const PartnerDocumentTypeEnum = z.enum([
  'LEGAL_DOCUMENT',
  'PROPOSAL',
  'PROFILE',
  'QUOTATION',
  'CONTRACT_REFERENCE',
  'SELECTION_DOCUMENT',
  'E_KATALOG_REFERENCE',
  'TENDER_DOCUMENT',
  'OTHER',
]);

const selectionRefinements = (data, ctx) => {
  // 1. Date validation: endDate >= startDate
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal akhir (endDate) tidak boleh mendahului tanggal mulai (startDate)',
        path: ['endDate'],
      });
    }
  }

  // 2. External System vs Reference
  if (data.externalSystem && (!data.externalReference || !data.externalReference.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nomor referensi eksternal (externalReference) wajib diisi jika sistem eksternal ditentukan',
      path: ['externalReference'],
    });
  }
};

const createPartnerSelectionSchema = z.object({
  body: z
    .object({
      researchProposalId: z.string({
        required_error: 'researchProposalId is required',
      }),
      method: PartnerSelectionMethodEnum,
      partnerId: z.string().optional().nullable(),
      justification: z.string().optional().nullable(),
      externalSystem: z.string().optional().nullable(),
      externalReference: z.string().optional().nullable(),
      externalUrl: z.string().url('Format URL eksternal tidak valid').optional().nullable().or(z.literal('')),
      selfManagementType: z.string().optional().nullable(),
      responsiblePerson: z.string().optional().nullable(),
      implementationTeam: z.string().optional().nullable(),
      eCatalogProvider: z.string().optional().nullable(),
      eCatalogProductId: z.string().optional().nullable(),
      eCatalogTransactionReference: z.string().optional().nullable(),
      eCatalogUrl: z.string().url('Format URL e-Katalog tidak valid').optional().nullable().or(z.literal('')),
      tenderNumber: z.string().optional().nullable(),
      tenderSystem: z.string().optional().nullable(),
      tenderUrl: z.string().url('Format URL tender tidak valid').optional().nullable().or(z.literal('')),
      winnerReference: z.string().optional().nullable(),
      estimatedValue: z.number().min(0, 'Estimasi nilai tidak boleh negatif').optional().nullable(),
      finalValue: z.number().min(0, 'Nilai final kontrak tidak boleh negatif').optional().nullable(),
      selectionDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
      startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
      endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .superRefine(selectionRefinements),
});

const updatePartnerSelectionSchema = z.object({
  body: z
    .object({
      method: PartnerSelectionMethodEnum.optional(),
      partnerId: z.string().optional().nullable(),
      justification: z.string().optional().nullable(),
      externalSystem: z.string().optional().nullable(),
      externalReference: z.string().optional().nullable(),
      externalUrl: z.string().url('Format URL eksternal tidak valid').optional().nullable().or(z.literal('')),
      selfManagementType: z.string().optional().nullable(),
      responsiblePerson: z.string().optional().nullable(),
      implementationTeam: z.string().optional().nullable(),
      eCatalogProvider: z.string().optional().nullable(),
      eCatalogProductId: z.string().optional().nullable(),
      eCatalogTransactionReference: z.string().optional().nullable(),
      eCatalogUrl: z.string().url('Format URL e-Katalog tidak valid').optional().nullable().or(z.literal('')),
      tenderNumber: z.string().optional().nullable(),
      tenderSystem: z.string().optional().nullable(),
      tenderUrl: z.string().url('Format URL tender tidak valid').optional().nullable().or(z.literal('')),
      winnerReference: z.string().optional().nullable(),
      estimatedValue: z.number().min(0, 'Estimasi nilai tidak boleh negatif').optional().nullable(),
      finalValue: z.number().min(0, 'Nilai final kontrak tidak boleh negatif').optional().nullable(),
      selectionDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
      startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
      endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.startDate && data.endDate) {
        if (new Date(data.endDate) < new Date(data.startDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tanggal akhir (endDate) tidak boleh mendahului tanggal mulai (startDate)',
            path: ['endDate'],
          });
        }
      }
      if (data.externalSystem && (!data.externalReference || !data.externalReference.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nomor referensi eksternal (externalReference) wajib diisi jika sistem eksternal ditentukan',
          path: ['externalReference'],
        });
      }
    }),
});

const returnPartnerSelectionSchema = z.object({
  body: z.object({
    reviewNote: z.string({
      required_error: 'Catatan telaah pemilihan mitra (reviewNote) wajib diisi.',
    }).min(5, 'Catatan telaah harus minimal 5 karakter'),
  }),
});

const cancelPartnerSelectionSchema = z.object({
  body: z.object({
    reason: z.string({
      required_error: 'Alasan pembatalan (reason) wajib diisi.',
    }).min(5, 'Alasan pembatalan harus minimal 5 karakter'),
  }),
});

module.exports = {
  PartnerSelectionMethodEnum,
  PartnerDocumentTypeEnum,
  createPartnerSelectionSchema,
  updatePartnerSelectionSchema,
  returnPartnerSelectionSchema,
  cancelPartnerSelectionSchema,
};
