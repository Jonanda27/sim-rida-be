const { z } = require('zod');

const rabItemSchema = z.object({
  description: z.string().min(3, 'Nama barang/kegiatan minimal 3 karakter'),
  volume: z.number().int().positive('Volume harus berupa angka bulat positif'),
  unit: z.string().min(1, 'Satuan wajib diisi (contoh: Paket, Orang, Bulan)'),
  unitPrice: z.number().positive('Harga satuan harus berupa angka positif'),
});

const createKakSchema = z.object({
  body: z.object({
    dasarPemikiran: z.string().min(10, 'Dasar pemikiran wajib diisi secara jelas'),
    maksudTujuan: z.string().min(10, 'Maksud & tujuan wajib diisi'),
    ruangLingkup: z.string().min(10, 'Ruang lingkup kegiatan wajib diisi'),
    metodologi: z.string().min(10, 'Metodologi & pengumpulan data wajib diisi'),
    output: z.string().min(5, 'Output keluaran KAK wajib diisi'),
    outcome: z.string().min(5, 'Outcome KAK wajib diisi'),
    indikatorKinerja: z.string().min(5, 'Indikator kinerja wajib diisi'),
    jadwalPelaksanaan: z.string().min(5, 'Jadwal pelaksanaan wajib diisi'),
    penutup: z.string().min(10, 'Penutup wajib diisi'),
    rabItems: z.array(rabItemSchema).nonempty('Minimal harus ada 1 item Rincian Anggaran Biaya (RAB)'),
  }),
});

const updateKakSchema = z.object({
  body: z.object({
    dasarPemikiran: z.string().min(10).optional(),
    maksudTujuan: z.string().min(10).optional(),
    ruangLingkup: z.string().min(10).optional(),
    metodologi: z.string().min(10).optional(),
    output: z.string().min(5).optional(),
    outcome: z.string().min(5).optional(),
    indikatorKinerja: z.string().min(5).optional(),
    jadwalPelaksanaan: z.string().min(5).optional(),
    penutup: z.string().min(5).optional(),
    rabItems: z.array(
      z.object({
        description: z.string().min(3),
        volume: z.number().min(1),
        unit: z.string().min(1),
        unitPrice: z.number().min(0),
      })
    ).min(1).optional(),
  }),
});

module.exports = {
  createKakSchema,
  updateKakSchema,
};
