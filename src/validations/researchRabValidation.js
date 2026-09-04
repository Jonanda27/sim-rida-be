const { z } = require('zod');

const RabCategoryEnum = z.enum([
  'PERSONNEL',
  'TRANSPORTATION',
  'ACCOMMODATION',
  'CONSUMABLES',
  'EQUIPMENT',
  'DATA_COLLECTION',
  'DATA_PROCESSING',
  'MEETING',
  'DISSEMINATION',
  'DOCUMENTATION',
  'OTHER',
]);

const createRabSchema = z.object({
  body: z.object({
    researchKakId: z.string({
      required_error: 'researchKakId is required',
    }).uuid('Invalid researchKakId format'),
    notes: z.string().optional(),
  }),
});

const updateRabSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

const mapCategory = (cat) => {
  if (!cat) return 'OTHER';
  const c = String(cat).toUpperCase();
  if (c.includes('AHLI') || c.includes('HONOR') || c.includes('PERSONNEL') || c.includes('GAJI')) return 'PERSONNEL';
  if (c.includes('JALAN') || c.includes('TRANSPORT') || c.includes('TIKET') || c.includes('BBM')) return 'TRANSPORTATION';
  if (c.includes('INAP') || c.includes('HOTEL') || c.includes('ACCOMMODATION')) return 'ACCOMMODATION';
  if (c.includes('BAHAN') || c.includes('OPERASIONAL') || c.includes('ATK') || c.includes('CONSUMABLE')) return 'CONSUMABLES';
  if (c.includes('SEWA') || c.includes('ALAT') || c.includes('EQUIPMENT')) return 'EQUIPMENT';
  if (c.includes('SURVEI') || c.includes('DATA') || c.includes('COLLECTION')) return 'DATA_COLLECTION';
  if (c.includes('OLAH') || c.includes('ANALISIS') || c.includes('PROCESSING')) return 'DATA_PROCESSING';
  if (c.includes('FGD') || c.includes('RAPAT') || c.includes('MEETING')) return 'MEETING';
  if (c.includes('SEMINAR') || c.includes('PUBLIKASI') || c.includes('DISSEMINATION')) return 'DISSEMINATION';
  if (c.includes('CETAK') || c.includes('DOKUMEN') || c.includes('DOCUMENTATION')) return 'DOCUMENTATION';
  return 'OTHER';
};

const createRabItemSchema = z.object({
  body: z.object({
    category: z.string().optional().transform(mapCategory),
    itemName: z.string().optional(),
    component: z.string().optional(),
    specification: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().default('Unit'),
    quantity: z.number().optional(),
    volume: z.number().optional(),
    unitPrice: z.number().min(0, 'Harga satuan tidak boleh bernilai negatif').default(0),
    subtotal: z.number().optional(),
    order: z.number().int().optional(),
    notes: z.string().optional(),
  }).transform((data) => {
    const desc = data.description || [data.itemName || data.component, data.specification].filter(Boolean).join(' - ') || 'Item Belanja';
    const qty = (typeof data.quantity === 'number' && data.quantity > 0)
      ? data.quantity
      : (typeof data.volume === 'number' && data.volume > 0 ? data.volume : 1);
    return {
      category: data.category || 'OTHER',
      description: desc,
      unit: data.unit || 'Unit',
      quantity: qty,
      unitPrice: data.unitPrice || 0,
      subtotal: qty * (data.unitPrice || 0),
      order: data.order,
      notes: data.notes || data.specification || null,
    };
  }),
});

const updateRabItemSchema = z.object({
  body: z.object({
    category: z.string().optional().transform(mapCategory),
    itemName: z.string().optional(),
    component: z.string().optional(),
    specification: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    quantity: z.number().optional(),
    volume: z.number().optional(),
    unitPrice: z.number().min(0, 'Harga satuan tidak boleh bernilai negatif').optional(),
    subtotal: z.number().optional(),
    order: z.number().int().optional(),
    notes: z.string().optional(),
  }).transform((data) => {
    const res = {};
    if (data.category) res.category = data.category;
    if (data.description || data.itemName || data.component) {
      res.description = data.description || [data.itemName || data.component, data.specification].filter(Boolean).join(' - ');
    }
    if (data.unit) res.unit = data.unit;
    if (typeof data.quantity === 'number' && data.quantity > 0) res.quantity = data.quantity;
    else if (typeof data.volume === 'number' && data.volume > 0) res.quantity = data.volume;
    if (typeof data.unitPrice === 'number' && data.unitPrice >= 0) res.unitPrice = data.unitPrice;
    if (typeof data.order === 'number') res.order = data.order;
    if (data.notes || data.specification) res.notes = data.notes || data.specification;
    return res;
  }),
});

const bulkRabItemsSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().uuid().optional(),
        category: z.string().optional().transform(mapCategory),
        itemName: z.string().optional(),
        component: z.string().optional(),
        specification: z.string().optional(),
        description: z.string().optional(),
        unit: z.string().default('Unit'),
        quantity: z.number().optional(),
        volume: z.number().optional(),
        unitPrice: z.number().min(0, 'Harga satuan tidak boleh bernilai negatif').default(0),
        subtotal: z.number().optional(),
        order: z.number().int().optional(),
        notes: z.string().optional(),
      }).transform((item) => {
        const desc = item.description || [item.itemName || item.component, item.specification].filter(Boolean).join(' - ') || 'Item Belanja';
        const qty = (typeof item.quantity === 'number' && item.quantity > 0)
          ? item.quantity
          : (typeof item.volume === 'number' && item.volume > 0 ? item.volume : 1);
        return {
          id: item.id,
          category: item.category || 'OTHER',
          description: desc,
          unit: item.unit || 'Unit',
          quantity: qty,
          unitPrice: item.unitPrice || 0,
          subtotal: qty * (item.unitPrice || 0),
          order: item.order,
          notes: item.notes || item.specification || null,
        };
      })
    ).min(1, 'Minimal satu rincian item biaya wajib disertakan'),
  }),
});

const reorderRabItemsSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().uuid('Invalid item ID format'),
        order: z.number().int(),
      })
    ).min(1, 'Daftar item reorder tidak boleh kosong'),
  }),
});

const returnRabSchema = z.object({
  body: z.object({
    reviewNote: z.string({
      required_error: 'Catatan telaah RAB (reviewNote) wajib diisi.',
    }).min(5, 'Catatan telaah RAB harus minimal 5 karakter'),
  }),
});

const cancelRabSchema = z.object({
  body: z.object({
    reason: z.string({
      required_error: 'Alasan pembatalan (reason) wajib diisi.',
    }).min(5, 'Alasan pembatalan harus minimal 5 karakter'),
  }),
});

module.exports = {
  createRabSchema,
  updateRabSchema,
  createRabItemSchema,
  updateRabItemSchema,
  bulkRabItemsSchema,
  reorderRabItemsSchema,
  returnRabSchema,
  cancelRabSchema,
};
