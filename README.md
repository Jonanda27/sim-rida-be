# SIM-RIDA Backend — Sistem Informasi Manajemen Riset Daerah

Backend API untuk platform **SIM-RIDA (Sistem Informasi Manajemen Riset Daerah)** berbasis Node.js, Express, Prisma ORM, dan PostgreSQL.

---

## 1. Arsitektur & Teknologi

* **Runtime & Framework**: Node.js (CommonJS), Express.js
* **ORM & Database**: Prisma Client, PostgreSQL
* **Autentikasi & Keamanan**: JSON Web Token (JWT), bcryptjs, Helmet, CORS
* **Validasi Data**: Zod Schema Validation
* **Logging**: Morgan HTTP logger & Custom Audit Logger (non-blocking)

Struktur Modular:
```text
sim-rida-be/
├── src/
│   ├── config/          # Environment & Database (Prisma singleton)
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Core business logic & Prisma access
│   ├── routes/          # Express route definitions (/api & /api/v1)
│   ├── middlewares/     # requireAuth, requireRole, errorHandler, validate
│   ├── validations/     # Zod request validation schemas
│   ├── utils/           # JWT helper & safe auditLogger
│   ├── app.js           # Express application configuration
│   └── server.js        # Server bootstrap & graceful shutdown
├── prisma/
│   ├── schema.prisma    # Prisma schema definitions (Role, User, OPD, AuditLog)
│   ├── seed.js          # Master seed orchestrator
│   └── seeders/         # Seeders (OPD, User, Sectors, Research Types, Proposals)
├── uploads/             # Static file storage directory
├── .env                 # Local environment variables
├── .env.example         # Template environment configuration
└── README.md
```

---

## 2. Prasyarat & Instalasi

### Prasyarat
* Node.js v18+ atau v20+
* PostgreSQL v14+ aktif secara lokal atau melalui Docker

### Langkah Instalasi

1. Masuk ke direktori backend:
   ```bash
   cd sim-rida-be
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Konfigurasi Environment:
   Salin berkas `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
   Pastikan konfigurasi database sesuai dengan kredensial PostgreSQL lokal Anda:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://postgres:password@localhost:5432/simrida?schema=public"
   JWT_SECRET="supersecret_jwt_key_change_in_production"
   JWT_EXPIRES_IN="1d"
   OPENAI_API_KEY=""
   UPLOAD_DIR="uploads"
   FRONTEND_URL="http://localhost:3000"
   ```

---

## 3. Database Sync & Seeding

1. **Validasi Schema Prisma**:
   ```bash
   npx prisma validate
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Sinkronisasi Schema ke Database**:
   ```bash
   npx prisma db push
   ```

4. **Jalankan Seeder**:
   ```bash
   node prisma/seed.js
   ```

---

## 4. Menjalankan Server

* **Mode Development (dengan reload otomatis)**:
  ```bash
  npm run dev
  ```

* **Mode Production**:
  ```bash
  npm start
  ```

Server akan aktif secara default di: `http://localhost:5000`.

---

## 5. Akun Development (Seed)

Untuk keperluan pengujian lokal, seluruh akun default menggunakan password: `password123`.

| Peran (Role) | Nama Lengkap | Email | Keterangan Relasi |
| :--- | :--- | :--- | :--- |
| **ADMIN_BRIDA** | Admin BRIDA | `admin@simrida.local` | Akses penuh manajemen user |
| **BRIDA** | Operator BRIDA | `brida@simrida.local` | Operator teknis riset |
| **KEPALA_BRIDA** | Kepala BRIDA | `kepala@simrida.local` | Verifikator telaah & approval |
| **OPD** | Operator Diskominfo | `opd@simrida.local` | Terhubung ke instansi `OPD-001` (Diskominfo) |

---

## 6. Daftar Master OPD Bawaan

* `OPD-001`: Dinas Komunikasi dan Informatika (`Diskominfo`)
* `OPD-002`: Badan Perencanaan Pembangunan Daerah (`Bappeda`)
* `OPD-003`: Dinas Kesehatan (`Dinkes`)
* `OPD-004`: Dinas Lingkungan Hidup (`DLH`)

---

## 7. Matriks Otorisasi (Role Access Matrix)

| Modul / Fitur | ADMIN_BRIDA | BRIDA | KEPALA_BRIDA | OPD |
| :--- | :---: | :---: | :---: | :---: |
| **Health Check** | Publik | Publik | Publik | Publik |
| **Login / Logout** | ✓ | ✓ | ✓ | ✓ |
| **Profil (`/auth/me`)** | ✓ | ✓ | ✓ | ✓ |
| **User Management** | ✓ (Penuh) | - | - | - |
| **External Sources** | Read | Full (CRUD & Upload) | Read | - |
| **AI Problem Analysis** | - | Trigger & Review | Read | - |
| **Problem Identification**| Read | Edit / Approve / Reject | Read | - |
| **Research Proposals** | Read | Full (CRUD, Submit, Review, Cancel) | Read | - |
| **Research Selection** | Read | Full (Create, Score, Finalize, Cancel) | Read | - |
| **KAK & RAB (Perencanaan)** | Read | Full (Create, Edit, Submit, Finalize, Cancel) | Read | - |
| **Mitra Peneliti (Master & Seleksi)** | Read | Full (CRUD, Submit, Return, Finalize, Docs) | Read | - |
| **Pelaksanaan Penelitian** | Read | Full (Start, Complete, Cancel, Progress, Timelines, Milestones, Activities, Docs) | Read | - |
| **Data OPD** | Read (Semua) | Read (Semua) | Read (Semua) | Read (Instansi Sendiri) |

---

## 8. Spesifikasi API Endpoint Fondasi (FASE 1)

Prefix standar: `/api` (juga tersedia alias `/api/v1` untuk kompatibilitas).

### A. Health Check
* `GET /api/health` — Memeriksa kesiapan layanan dan status konektivitas PostgreSQL melalui lightweight query `SELECT 1`.

### B. Autentikasi (`/api/auth`)
* `POST /api/auth/login` — Login pengguna dan penerbitan JWT.
* `GET /api/auth/me` — Mendapatkan data profil pengguna yang sedang login.
* `POST /api/auth/logout` — Mengakhiri sesi pengguna.

### C. Manajemen User (`/api/users`)
*Hanya dapat diakses oleh peran `ADMIN_BRIDA`.*
* `GET /api/users` — Daftar pengguna (filter role, status, pencarian).
* `GET /api/users/:id` — Detail pengguna.
* `POST /api/users` — Pembuatan akun pengguna baru.
* `PATCH /api/users/:id` — Pembaruan profil pengguna.
* `PATCH /api/users/:id/status` — Pengubahan status keaktifan (`isActive`).

---

## 9. Spesifikasi API Sumber Eksternal & AI (FASE 2)

### A. Sumber Eksternal (`/api/external-sources`)
* `GET /api/external-sources` — Daftar sumber eksternal terpaginasi.
* `GET /api/external-sources/:id` — Detail sumber eksternal dan riwayat versi.
* `POST /api/external-sources` — Pembuatan sumber eksternal baru (`BRIDA`).
* `PATCH /api/external-sources/:id` — Pembaruan metadata sumber eksternal (`BRIDA`).
* `PATCH /api/external-sources/:id/status` — Pengubahan status `ACTIVE` / `ARCHIVED` (`BRIDA`).

### B. Versi & Dokumen (`/api/external-sources/:id/versions`)
* `GET /api/external-sources/:id/versions` — Riwayat versi dokumen.
* `POST /api/external-sources/:id/versions` — Upload berkas dokumen versi baru via multipart/form-data (`BRIDA`).

### C. AI-Assisted Problem Identification (`/api/external-sources/:id/analyze`)
* `POST /api/external-sources/:id/analyze` — Menjalankan analisa AI terhadap versi aktif (503 jika API key belum disetel).

### D. Pengelolaan Identifikasi Masalah (`/api/problem-identifications`)
* `GET /api/problem-identifications` — Daftar identifikasi masalah.
* `GET /api/problem-identifications/:id` — Detail identifikasi masalah, temuan, dan OPD terkait.
* `PATCH /api/problem-identifications/:id` — Penyuntingan temuan dan rincian masalah (`BRIDA`).
* `POST /api/problem-identifications/:id/approve` — Persetujuan identifikasi masalah (`BRIDA`).
* `POST /api/problem-identifications/:id/reject` — Penolakan dengan alasan telaah wajib (`BRIDA`).

---

## 10. Spesifikasi API Usulan Penelitian (FASE 3)

### Alur Status Proposal (*Proposal Workflow States*):
```text
DRAFT (Disusun BRIDA)
   │
   ├─► SUBMITTED (Dikirim untuk telaah internal)
   │      │
   │      ├─► REVISION_REQUIRED (Perlu perbaikan, dapat diedit kembali)
   │      │      └─► SUBMITTED
   │      │
   │      └─► APPROVED_FOR_SELECTION (Siap masuk tahap seleksi)
   │                 │
   │                 ├─► SELECTED (Lolos seleksi)
   │                 └─► NOT_SELECTED (Tidak lolos seleksi)
   │
   └─► CANCELLED (Dibatalkan permanen)
```

### Endpoints (`/api/research-proposals` & `/api/problem-identifications`):
* `GET /api/research-proposals` — Daftar usulan penelitian terpaginasi (filter `status`, `priority`, `opdId`, `year`, dan pencarian `search`).
* `GET /api/research-proposals/:id` — Detail usulan penelitian lengkap dengan `primaryProblem`, `supportingProblems`, `relatedOpds`, dan data pembuat/penelaah.
* `POST /api/research-proposals` — Membuat usulan penelitian baru (`status: DRAFT`).
* `POST /api/problem-identifications/:id/research-proposals` — Membuat usulan penelitian langsung dari ID identifikasi masalah yang berstatus `APPROVED`.
* `PATCH /api/research-proposals/:id` — Memperbarui draf usulan penelitian (`BRIDA`).
* `POST /api/research-proposals/:id/submit` — Mengajukan usulan untuk telaah internal (`status: SUBMITTED`).
* `POST /api/research-proposals/:id/return` — Mengembalikan usulan untuk perbaikan (`status: REVISION_REQUIRED`).
* `POST /api/research-proposals/:id/approve` — Menyetujui usulan untuk tahap seleksi (`status: APPROVED_FOR_SELECTION`).
* `POST /api/research-proposals/:id/cancel` — Membatalkan usulan penelitian (`status: CANCELLED`).
* `GET /api/research-proposals/:id/review` — Membaca data telaah internal dan alasan pembatalan.
* `GET /api/research-proposals/:id/traceability` — Menampilkan silsilah ketertelusuran lengkap dari Usulan Penelitian ➔ Identifikasi Masalah ➔ Versi Dokumen ➔ Seleksi & Skor.

---

## 11. Spesifikasi API Seleksi Usulan Penelitian (FASE 4)

### Alur Status Seleksi (*Selection Workflow States*):
```text
DRAFT (Seleksi diinisiasi untuk proposal APPROVED_FOR_SELECTION)
   │
   ├─► IN_ASSESSMENT (Penilaian skor kriteria sedang berlangsung)
   │      │
   │      └─► FINALIZED (Hasil seleksi ditetapkan)
   │             ├─► Result: SELECTED (Proposal menjadi SELECTED)
   │             └─► Result: NOT_SELECTED (Proposal menjadi NOT_SELECTED)
   │
   └─► CANCELLED (Dibatalkan saat masih DRAFT)
```

### Formula Penilaian & Pembobotan:
* Skor tiap kriteria: rentang $0 \le \text{score} \le 100$.
* Skor tertimbang: $\text{weightedScore} = \frac{\text{score} \times \text{weightSnapshot}}{100}$.
* Skor total: $\text{totalScore} = \sum \left(\frac{\text{score} \times \text{weightSnapshot}}{100}\right)$.
* Master 5 Kriteria Baku:
  1. `SC-01`: Relevansi terhadap kebutuhan daerah (Bobot 30%)
  2. `SC-02`: Urgensi permasalahan (Bobot 25%)
  3. `SC-03`: Dampak yang diharapkan (Bobot 20%)
  4. `SC-04`: Kelayakan penelitian (Bobot 15%)
  5. `SC-05`: Kejelasan metodologi (Bobot 10%)
  *Total Bobot = 100%*.

### Endpoints (`/api/research-selections`):
* `GET /api/research-selections`
  * **Akses**: `ADMIN_BRIDA`, `BRIDA`, `KEPALA_BRIDA`
  * **Query**: `?page=1&limit=10&status=FINALIZED&result=SELECTED&year=2026&researchProposalId=...&search=...`
* `GET /api/research-selections/statistics`
  * **Akses**: `ADMIN_BRIDA`, `BRIDA`, `KEPALA_BRIDA`
  * **Deskripsi**: Agregasi jumlah seleksi total, draft, inAssessment, finalized, selected, notSelected, dan rata-rata skor.
* `GET /api/research-selections/:id`
  * **Akses**: `ADMIN_BRIDA`, `BRIDA`, `KEPALA_BRIDA`
  * **Respons**: Memuat detail seleksi, proposal, rincian kriteria, skor, skor tertimbang, dan total skor.
* `POST /api/research-selections`
  * **Akses**: `BRIDA`
  * **Body**: `{ "researchProposalId": "uuid" }` (Proposal wajib berstatus `APPROVED_FOR_SELECTION`).
* `POST /api/research-selections/:id/start`
  * **Akses**: `BRIDA`
  * **Deskripsi**: Memulai proses penilaian (mengubah status menjadi `IN_ASSESSMENT`).
* `PATCH /api/research-selections/:id/scores/:scoreId`
  * **Akses**: `BRIDA`
  * **Body**: `{ "score": 85, "note": "Catatan penilaian..." }`
* `PATCH /api/research-selections/:id/scores`
  * **Akses**: `BRIDA`
  * **Body**: `{ "scores": [{ "criteriaId": "uuid", "score": 90, "note": "..." }] }` (Bulk scoring).
* `POST /api/research-selections/:id/finalize`
  * **Akses**: `BRIDA`
  * **Body**: `{ "result": "SELECTED" | "NOT_SELECTED", "selectionNote": "Catatan kelayakan..." }`
  * **Aturan**: Seluruh kriteria wajib telah dinilai (tidak boleh null, HTTP 422 `SELECTION_INCOMPLETE`), total bobot kriteria wajib sama dengan 100, mengunci seleksi secara permanen (HTTP 409 jika disunting ulang), dan memperbarui status proposal menjadi `SELECTED` / `NOT_SELECTED`.
* `POST /api/research-selections/:id/cancel`
  * **Akses**: `BRIDA`
  * **Body**: `{ "reason": "Alasan pembatalan..." }` (Hanya untuk seleksi berstatus `DRAFT`).

---

## 12. Spesifikasi API KAK & RAB / Perencanaan Riset (FASE 5)

### Alur Status Perencanaan (*Planning Workflow States*):
```text
Proposal: SELECTED
    │
    ├─► KAK (DRAFT) ─────────► KAK (SUBMITTED) ────────► KAK (FINALIZED)
    │                                │                          │
    └─► RAB (DRAFT) ─────────► RAB (SUBMITTED) ────────► RAB (FINALIZED)
                                                                │
                                                                ▼
                                                Proposal: READY_FOR_PARTNER
```

### Aturan Perhitungan Anggaran (Decimal Precision):
* Nilai uang menggunakan presisi `Decimal(18, 2)`.
* Subtotal item dihitung di backend: $\text{subtotal} = \text{quantity} \times \text{unitPrice}$.
* Total anggaran RAB: $\text{totalAmount} = \sum \text{subtotal}$.
* Nilai subtotal atau totalAmount yang dikirim dari klien frontend diabaikan dan selalu dihitung ulang di backend.

### A. Kerangka Acuan Kerja (`/api/research-kaks`)
* `GET /api/research-kaks` — Daftar KAK terpaginasi (filter `status`, `year`, `researchProposalId`, `search`).
* `GET /api/research-kaks/:id` — Detail KAK, proposal tertaut, seleksi, dan ringkasan RAB.
* `GET /api/research-kaks/:id/review` — Catatan telaah dan riwayat review internal KAK.
* `POST /api/research-kaks` — Membuat draf KAK baru untuk proposal yang berstatus `SELECTED`.
* `PATCH /api/research-kaks/:id` — Memperbarui draf KAK atau perbaikan KAK (`DRAFT` / `REVISION_REQUIRED`).
* `POST /api/research-kaks/:id/submit` — Mengajukan KAK untuk review internal (validasi kelengkapan atribut substantif).
* `POST /api/research-kaks/:id/return` — Mengembalikan KAK untuk perbaikan (`reviewNote` wajib).
* `POST /api/research-kaks/:id/finalize` — Menyetujui finalisasi KAK secara individual.
* `POST /api/research-kaks/:id/cancel` — Membatalkan draf KAK (`reason` wajib).

### B. Rencana Anggaran Biaya (`/api/research-rabs`)
* `GET /api/research-rabs` — Daftar RAB terpaginasi.
* `GET /api/research-rabs/:id` — Detail RAB, rincian item biaya, dan agregasi per kategori.
* `GET /api/research-rabs/:id/summary` — Ringkasan total biaya, total item, dan breakdown per kategori.
* `POST /api/research-rabs` — Membuat draf RAB baru untuk KAK aktif.
* `POST /api/research-rabs/:id/items` — Menambahkan rincian item biaya baru ke dalam RAB.
* `PATCH /api/research-rabs/:id/items/:itemId` — Memperbarui rincian item biaya.
* `DELETE /api/research-rabs/:id/items/:itemId` — Menghapus rincian item biaya.
* `PUT /api/research-rabs/:id/items` — Memperbarui seluruh rincian item biaya secara serentak (bulk replacement).
* `PATCH /api/research-rabs/:id/items/reorder` — Mengatur ulang urutan display item biaya.
* `POST /api/research-rabs/:id/submit` — Mengajukan RAB untuk review internal (minimal 1 item, totalAmount > 0).
* `POST /api/research-rabs/:id/return` — Mengembalikan RAB untuk perbaikan (`reviewNote` wajib).
* `POST /api/research-rabs/:id/finalize` — Menyetujui finalisasi RAB secara individual.
* `POST /api/research-rabs/:id/cancel` — Membatalkan draf RAB (`reason` wajib).

### C. Paket Perencanaan Riset Terpadu (`/api/research-planning`)
* `GET /api/research-planning/:proposalId` — Mendapatkan paket lengkap proposal, KAK, RAB, dan derived planning status (`NOT_STARTED`, `DRAFT`, `SUBMITTED`, `REVISION_REQUIRED`, `FINALIZED`).
* `POST /api/research-planning/:proposalId/submit` — Mengajukan paket KAK dan RAB secara bersamaan dalam satu transaksi atomik.
* `POST /api/research-planning/:proposalId/finalize` — Memfinalisasi KAK dan RAB secara bersamaan dan mengubah status proposal menjadi `READY_FOR_PARTNER`.
* `GET /api/research-planning/statistics` — Agregasi dashboard perencanaan: `totalSelectedProposals`, `withoutKak`, `draft`, `submitted`, `revisionRequired`, `finalized`, dan `totalBudget`.

---

## 13. Spesifikasi API Mitra Peneliti & Metode Pemilihan (FASE 6)

### Alur Status Penetapan Mitra:
```text
Proposal: READY_FOR_PARTNER
   │
   ▼
Selection: DRAFT ────────► SUBMITTED ────────► SELECTED
   │                           │                    │
   └─► CANCELLED               └─► REVISION_REQUIRED │
                                                     ▼
                                     Proposal: READY_FOR_IMPLEMENTATION
```

### Konsep Bisnis:
* SIM-RIDA mencatat keputusan manajerial penetapan mitra penelitian (*research partner assignment*), bukan pengganti SPSE, LPSE, atau e-Katalog.
* Menggunakan referensi sistem eksternal: `externalSystem` ("SPSE", "E_KATALOG_LKPP"), `externalReference`, dan `externalUrl`.
* Empat metode pemilihan:
  1. `SWAKELOLA`: Riset dikerjakan mandiri/internal BRIDA atau swakelola tipe I-IV. `partnerId` boleh null atau internal.
  2. `PENUNJUKAN_LANGSUNG`: Penunjukan mitra berdasarkan keahlian spesifik (`partnerId` wajib, menyertakan `justification`).
  3. `E_KATALOG`: Pengadaan melalui katalog elektronik pemerintah (`partnerId` wajib, referensi transaksi e-Katalog).
  4. `TENDER`: Pengadaan melalui lelang umum SPSE (`partnerId` wajib saat pemenang ditetapkan).
* **Budget Warning**: Nilai moneter menggunakan tipe `Decimal(18, 2)`. Jika `finalValue > rabAmount`, sistem tidak menolak transaksi melainkan menyertakan indikator `budgetWarning: true` dan pesan peringatan.
* **Integritas Master Mitra (Soft Deactivation)**: Mitra yang pernah digunakan dalam riwayat seleksi dicegah dari hard-delete (HTTP 400 `PARTNER_IN_USE`). Penonaktifan dilakukan melalui `POST /api/research-partners/:id/deactivate`.

### A. Master Data Mitra Peneliti (`/api/research-partners`)
* `GET /api/research-partners` — Daftar mitra terpaginasi (filter `type`, `isActive`, search `name`, `institutionName`, `registrationNumber`).
* `GET /api/research-partners/statistics` — Statistik mitra: `totalPartners`, `activePartners`, `inactivePartners`, dan `byType`.
* `GET /api/research-partners/:id` — Detail mitra beserta riwayat usulan/seleksi aktif.
* `POST /api/research-partners` — Menambahkan mitra baru (mencegah duplikasi nama dan nomor registrasi).
* `PATCH /api/research-partners/:id` — Memperbarui data profil master mitra.
* `POST /api/research-partners/:id/deactivate` — Menonaktifkan mitra secara soft (`isActive: false`).
* `POST /api/research-partners/:id/reactivate` — Mengaktifkan kembali mitra.
* `DELETE /api/research-partners/:id` — Menghapus mitra (hanya diizinkan jika mitra belum pernah digunakan pada seleksi apa pun).

### B. Proses Pemilihan & Penetapan Mitra (`/api/research-partner-selections`)
* `GET /api/research-partner-selections` — Daftar proses pemilihan mitra (filter `status`, `method`, `year`, `partnerId`, search).
* `GET /api/research-partner-selections/available-proposals` — Daftar usulan berstatus `READY_FOR_PARTNER` yang belum memiliki proses seleksi aktif.
* `GET /api/research-partner-selections/statistics` — Statistik dashboard: `totalReadyForPartner`, `draft`, `submitted`, `revisionRequired`, `selected`, dan breakdown `byMethod`.
* `GET /api/research-partner-selections/:id` — Detail lengkap proses pemilihan mitra, proposal tertaut, KAK, RAB, mitra, dan dokumen pendukung.
* `GET /api/research-partner-selections/:id/summary` — Ringkasan komparasi nilai mitra vs pagu RAB serta status `budgetWarning`.
* `POST /api/research-partner-selections` — Membuat draf pemilihan mitra baru untuk proposal yang berstatus `READY_FOR_PARTNER`.
* `PATCH /api/research-partner-selections/:id` — Memperbarui draf pemilihan atau revisi pemilihan mitra.
* `POST /api/research-partner-selections/:id/submit` — Mengajukan proses pemilihan untuk review internal.
* `POST /api/research-partner-selections/:id/return` — Mengembalikan proses pemilihan untuk perbaikan (`reviewNote` wajib).
* `POST /api/research-partner-selections/:id/finalize` — Menyetujui finalisasi penetapan mitra (status seleksi menjadi `SELECTED` dan status proposal secara atomik berubah menjadi `READY_FOR_IMPLEMENTATION`).
* `POST /api/research-partner-selections/:id/cancel` — Membatalkan draf pemilihan mitra (`reason` wajib).

### C. Dokumen Pendukung Mitra (`/api/research-partner-selections/:id/documents`)
* `GET /api/research-partner-selections/:id/documents` — Mendapatkan daftar dokumen pendukung pemilihan mitra.
* `POST /api/research-partner-selections/:id/documents` — Mengunggah berkas dokumen pendukung (`multipart/form-data`, file maksimal 5MB, format PDF/DOC/DOCX/JPG/PNG).
* `DELETE /api/research-partner-selections/:id/documents/:documentId` — Menghapus dokumen pendukung (hanya diizinkan jika seleksi belum `SELECTED`).

---

## 14. Spesifikasi API Pelaksanaan Penelitian (FASE 7)

### Alur Status Pelaksanaan Penelitian:
```text
Proposal: READY_FOR_IMPLEMENTATION
   │
   ▼
Implementation: PLANNED ────────► ONGOING ────────► COMPLETED
   │                                 │
   └──────────────► CANCELLED ◄──────┘
```

### Konsep Bisnis:
* Proposal wajib berstatus `READY_FOR_IMPLEMENTATION` dan telah menetapkan mitra (`partnerSelection.status = SELECTED`).
* Satu usulan penelitian hanya boleh memiliki satu pelaksanaan aktif (`ResearchImplementation` relasi 1:1).
* Penanggung jawab (PIC) internal BRIDA (`responsibleUserId`) wajib berstatus pegawai BRIDA internal (bukan OPD).
* Penomoran kode pelaksanaan otomatis berurutan tahunan: `IMP-YYYY-XXX`.
* Aturan Progress: Nilai progress berupa bilangan bulat `0 - 100`. Nilai progress tidak boleh turun secara normal (misal 50% ➔ 40% ditolak dengan HTTP 409 Conflict). Setiap pembaruan progress disimpan ke dalam model `ResearchProgressUpdate`.
* Validasi Batas Tanggal (*Boundary Validation*): Tanggal tahapan (*timeline*), capaian (*milestone*), dan kegiatan (*activity*) wajib berada dalam rentang jadwal pelaksanaan penelitian (`[startDate, endDate]`).
* Deteksi Keterlambatan (*Overdue Detection*): Ditandai otomatis dengan `isOverdue: true` jika tanggal saat ini melampaui `endDate` dan pelaksanaan belum `COMPLETED` atau `CANCELLED`.

### A. Pelaksanaan Penelitian (`/api/research-implementations`)
* `GET /api/research-implementations` — Daftar pelaksanaan terpaginasi (filter `status`, `year`, `partnerId`, `responsibleUserId`, search, indikator `isOverdue`).
* `GET /api/research-implementations/available-proposals` — Daftar proposal `READY_FOR_IMPLEMENTATION` yang belum memiliki pelaksanaan aktif.
* `GET /api/research-implementations/statistics` — Statistik dashboard pelaksanaan: `total`, `planned`, `ongoing`, `completed`, `cancelled`, `averageProgress`, `overdueCount`.
* `GET /api/research-implementations/:id` — Detail lengkap pelaksanaan, proposal, KAK, RAB, mitra, PIC, timelines, milestones, activities, progressHistory, documents.
* `GET /api/research-implementations/:id/summary` — Ringkasan dashboard pelaksanaan riset.
* `GET /api/research-implementations/:id/progress-history` — Riwayat perkembangan progress berurutan kronologis.
* `POST /api/research-implementations` — Membuat pelaksanaan penelitian baru (status awal `PLANNED`, progress `0`).
* `PATCH /api/research-implementations/:id` — Memperbarui jadwal periode atau PIC pelaksanaan (hanya diizinkan jika belum `COMPLETED` / `CANCELLED`).
* `POST /api/research-implementations/:id/start` — Memulai pelaksanaan penelitian (`PLANNED` ➔ `ONGOING`, `actualStartDate = now`).
* `POST /api/research-implementations/:id/complete` — Menyelesaikan pelaksanaan penelitian (`ONGOING` ➔ `COMPLETED`, `actualEndDate = now`, `progress = 100`).
* `POST /api/research-implementations/:id/cancel` — Membatalkan pelaksanaan penelitian (`cancelReason` wajib, progress terakhir dipertahankan).
* `PATCH /api/research-implementations/:id/progress` — Memperbarui nilai progress (0-100%, non-decreasing).

### B. Tahapan Timeline (`/api/research-timelines` & sub-routes)
* `GET /api/research-implementations/:id/timelines` — Daftar tahapan timeline pelaksanaan dengan flag `isOverdue`.
* `POST /api/research-implementations/:id/timelines` — Menambahkan tahapan timeline baru (validasi batas waktu).
* `PATCH /api/research-timelines/:id` — Memperbarui data atau status tahapan timeline (`PENDING`, `ONGOING`, `COMPLETED`, `SKIPPED`).
* `DELETE /api/research-timelines/:id` — Menghapus tahapan timeline (hanya diizinkan jika pelaksanaan masih `PLANNED`).

### C. Capaian Milestone (`/api/research-milestones` & sub-routes)
* `GET /api/research-implementations/:id/milestones` — Daftar capaian milestone pelaksanaan.
* `POST /api/research-implementations/:id/milestones` — Menambahkan target capaian milestone baru (validasi batas waktu).
* `PATCH /api/research-milestones/:id` — Memperbarui data capaian milestone.
* `POST /api/research-milestones/:id/complete` — Menyelesaikan milestone (`COMPLETED`, progress 100%, `completedDate = now`).
* `PATCH /api/research-milestones/:id/progress` — Memperbarui progress capaian milestone (0-100%, non-decreasing).

### D. Aktivitas Kegiatan (`/api/research-activities` & sub-routes)
* `GET /api/research-implementations/:id/activities` — Daftar kegiatan lapangan terpaginasi.
* `POST /api/research-implementations/:id/activities` — Mencatat kegiatan penelitian baru.
* `PATCH /api/research-activities/:id` — Memperbarui data kegiatan penelitian.
* `POST /api/research-activities/:id/start` — Mengubah status kegiatan menjadi `ONGOING`.
* `POST /api/research-activities/:id/complete` — Mengubah status kegiatan menjadi `COMPLETED`.
* `POST /api/research-activities/:id/cancel` — Mengubah status kegiatan menjadi `CANCELLED`.

### E. Dokumen Pelaksanaan (`/api/research-implementations/:id/documents`)
* `GET /api/research-implementations/:id/documents` — Mendapatkan daftar berkas dokumen pelaksanaan riset.
* `POST /api/research-implementations/:id/documents` — Mengunggah dokumen pelaksanaan (`multipart/form-data`, file maksimal 5MB, format PDF/DOC/DOCX/JPG/PNG).
* `DELETE /api/research-implementations/:id/documents/:documentId` — Menghapus dokumen pelaksanaan (hanya diizinkan sebelum pelaksanaan `COMPLETED`).

---

## 15. Modul Laporan Penelitian, Policy Brief & Rekomendasi (FASE 8)

Modul ini mengelola siklus akhir riset: penyusunan laporan hasil riset, penyusunan policy brief terstruktur, perumusan rekomendasi kebijakan, review internal BRIDA, persetujuan dan penerbitan oleh Kepala BRIDA, serta akses khusus OPD terhadap rekomendasi yang diterbitkan.

### A. Laporan Penelitian (`/api/research-reports`)
* `GET /api/research-reports` — Daftar laporan penelitian terpaginasi (filter: `status`, `reportType`, `year`, `implementationId`, `search`).
* `GET /api/research-reports/statistics` — Statistik status laporan (`total`, `draft`, `submitted`, `revisionRequired`, `approved`, `rejected`).
* `GET /api/research-reports/:id` — Detail komprehensif laporan penelitian (pelaksanaan, proposal, mitra, tim penanggung jawab, dokumen, review, policy brief).
* `POST /api/research-implementations/:id/reports` — Menyusun laporan hasil penelitian (hanya diizinkan jika pelaksanaan `COMPLETED` dan belum memiliki `FINAL_REPORT` aktif).
* `PATCH /api/research-reports/:id` — Memperbarui data laporan (hanya saat `DRAFT` atau `REVISION_REQUIRED`).
* `POST /api/research-reports/:id/submit` — Submit laporan untuk review internal (`DRAFT`/`REVISION_REQUIRED` ➔ `SUBMITTED`).
* `POST /api/research-reports/:id/review` — Review laporan internal BRIDA (`APPROVE` ➔ `APPROVED`, `REVISION` ➔ `REVISION_REQUIRED`, `REJECT` ➔ `REJECTED`).
* `GET /api/research-reports/:id/documents` — Daftar dokumen pendukung laporan.
* `POST /api/research-reports/:id/documents` — Unggah berkas dokumen laporan (maks 5MB, PDF/DOC/DOCX/JPG/PNG).
* `DELETE /api/research-reports/:id/documents/:documentId` — Hapus dokumen laporan (hanya saat `DRAFT` atau `REVISION_REQUIRED`).

### B. Policy Brief (`/api/policy-briefs`)
* `GET /api/policy-briefs` — Daftar policy brief terpaginasi (filter: `status`, `reportId`, `search`).
* `GET /api/policy-briefs/statistics` — Statistik status policy brief (`total`, `draft`, `submitted`, `revisionRequired`, `approved`).
* `GET /api/policy-briefs/:id` — Detail lengkap policy brief (struktur ringkasan eksekutif, masalah kebijakan, temuan riset, opsi kebijakan, rekomendasi kebijakan, kesimpulan).
* `POST /api/research-reports/:id/policy-briefs` — Menyusun policy brief baru (hanya diizinkan dari laporan akhir yang berstatus `APPROVED`).
* `PATCH /api/policy-briefs/:id` — Memperbarui data policy brief (hanya saat `DRAFT` atau `REVISION_REQUIRED`).
* `POST /api/policy-briefs/:id/submit` — Submit policy brief untuk review (`DRAFT`/`REVISION_REQUIRED` ➔ `SUBMITTED`).
* `POST /api/policy-briefs/:id/review` — Review policy brief internal (`APPROVE` ➔ `APPROVED`, `REVISION` ➔ `REVISION_REQUIRED`).
* `GET /api/policy-briefs/:id/documents` — Daftar dokumen pendukung policy brief.
* `POST /api/policy-briefs/:id/documents` — Unggah berkas dokumen policy brief.
* `DELETE /api/policy-briefs/:id/documents/:documentId` — Hapus dokumen policy brief.

### C. Rekomendasi Kebijakan BRIDA (`/api/recommendations`)
* `GET /api/recommendations` — Daftar rekomendasi terpaginasi (filter: `status`, `priority`, `recommendationType`, `targetOpdId`, `year`, `search`).
* `GET /api/recommendations/statistics` — Statistik status rekomendasi (`total`, `draft`, `submitted`, `revisionRequired`, `approved`, `published`).
* `GET /api/recommendations/:id` — Detail lengkap rekomendasi beserta target OPD, dasar riset, dan dampak yang diharapkan.
* `POST /api/policy-briefs/:id/recommendations` — Menyusun rekomendasi kebijakan (hanya dari policy brief `APPROVED`).
* `PATCH /api/recommendations/:id` — Memperbarui draf rekomendasi (hanya saat `DRAFT` atau `REVISION_REQUIRED`).
* `POST /api/recommendations/:id/submit` — Submit rekomendasi ke Kepala BRIDA (`DRAFT`/`REVISION_REQUIRED` ➔ `SUBMITTED`).
* `POST /api/recommendations/:id/approve` — Persetujuan rekomendasi oleh Kepala BRIDA (`KEPALA_BRIDA` only; `SUBMITTED` ➔ `APPROVED`).
* `POST /api/recommendations/:id/revision` — Permintaan revisi oleh Kepala BRIDA (`KEPALA_BRIDA` only; `SUBMITTED` ➔ `REVISION_REQUIRED`).
* `POST /api/recommendations/:id/publish` — Penerbitan rekomendasi ke OPD oleh Kepala BRIDA (`KEPALA_BRIDA` only; `APPROVED` ➔ `PUBLISHED`).
* `GET /api/recommendations/:id/documents` — Daftar dokumen rekomendasi (surat pengantar, naskah kebijakan).
* `POST /api/recommendations/:id/documents` — Unggah berkas dokumen rekomendasi.
* `DELETE /api/recommendations/:id/documents/:documentId` — Hapus dokumen rekomendasi (dilarang jika sudah `PUBLISHED`).

### D. Akses Khusus OPD (`/api/opd/recommendations`)
* `GET /api/opd/recommendations` — Daftar rekomendasi yang telah diterbitkan (`PUBLISHED`) khusus untuk OPD pengguna yang sedang login (`targetOpdId === user.opdId`).
* `GET /api/opd/recommendations/:id` — Detail rekomendasi untuk OPD terkait (Read-Only; dilarang mengakses milik OPD lain).

### E. Dashboard Hasil Riset (`/api/research-results/dashboard`)
* `GET /api/research-results/dashboard` — Metrik statistik terpadu riset selesai, rekapitulasi laporan, policy brief, dan rekomendasi.

---

## 16. Audit Logging

Aktivitas mutasi pada sistem dicatat secara otomatis ke dalam tabel `AuditLog`:
* **User**: `USER_LOGIN`, `USER_CREATED`, `USER_UPDATED`, `USER_STATUS_CHANGED`
* **External Source**: `EXTERNAL_SOURCE_CREATED`, `EXTERNAL_SOURCE_UPDATED`, `EXTERNAL_SOURCE_STATUS_CHANGED`, `SOURCE_VERSION_UPLOADED`
* **Problem Identification**: `AI_ANALYSIS_STARTED`, `AI_ANALYSIS_COMPLETED`, `AI_ANALYSIS_FAILED`, `PROBLEM_IDENTIFICATION_CREATED`, `PROBLEM_IDENTIFICATION_UPDATED`, `PROBLEM_IDENTIFICATION_APPROVED`, `PROBLEM_IDENTIFICATION_REJECTED`
* **Research Proposal**: `RESEARCH_PROPOSAL_CREATED`, `RESEARCH_PROPOSAL_UPDATED`, `RESEARCH_PROPOSAL_SUBMITTED`, `RESEARCH_PROPOSAL_RETURNED`, `RESEARCH_PROPOSAL_APPROVED`, `RESEARCH_PROPOSAL_CANCELLED`
* **Research Selection**: `RESEARCH_SELECTION_CREATED`, `RESEARCH_SELECTION_STARTED`, `RESEARCH_SELECTION_SCORED`, `RESEARCH_SELECTION_FINALIZED`, `RESEARCH_SELECTION_CANCELLED`
* **Research KAK & RAB**: `RESEARCH_KAK_CREATED`, `RESEARCH_KAK_UPDATED`, `RESEARCH_KAK_SUBMITTED`, `RESEARCH_KAK_RETURNED`, `RESEARCH_KAK_FINALIZED`, `RESEARCH_KAK_CANCELLED`, `RESEARCH_RAB_CREATED`, `RESEARCH_RAB_UPDATED`, `RESEARCH_RAB_ITEM_CREATED`, `RESEARCH_RAB_ITEM_UPDATED`, `RESEARCH_RAB_ITEM_DELETED`, `RESEARCH_RAB_SUBMITTED`, `RESEARCH_RAB_RETURNED`, `RESEARCH_RAB_FINALIZED`, `RESEARCH_RAB_CANCELLED`, `RESEARCH_PLANNING_FINALIZED`
* **Research Partner & Selection**: `RESEARCH_PARTNER_CREATED`, `RESEARCH_PARTNER_UPDATED`, `RESEARCH_PARTNER_DEACTIVATED`, `PARTNER_SELECTION_CREATED`, `PARTNER_SELECTION_UPDATED`, `PARTNER_SELECTION_SUBMITTED`, `PARTNER_SELECTION_RETURNED`, `PARTNER_SELECTION_SELECTED`, `PARTNER_SELECTION_CANCELLED`, `PARTNER_DOCUMENT_UPLOADED`, `PARTNER_DOCUMENT_DELETED`
* **Research Implementation (FASE 7)**: `RESEARCH_IMPLEMENTATION_CREATED`, `RESEARCH_IMPLEMENTATION_UPDATED`, `RESEARCH_IMPLEMENTATION_STARTED`, `RESEARCH_IMPLEMENTATION_COMPLETED`, `RESEARCH_IMPLEMENTATION_CANCELLED`, `RESEARCH_PROGRESS_UPDATED`, `RESEARCH_TIMELINE_CREATED`, `RESEARCH_TIMELINE_UPDATED`, `RESEARCH_TIMELINE_DELETED`, `RESEARCH_MILESTONE_CREATED`, `RESEARCH_MILESTONE_UPDATED`, `RESEARCH_MILESTONE_COMPLETED`, `RESEARCH_ACTIVITY_CREATED`, `RESEARCH_ACTIVITY_UPDATED`, `RESEARCH_ACTIVITY_STARTED`, `RESEARCH_ACTIVITY_COMPLETED`, `RESEARCH_ACTIVITY_CANCELLED`, `RESEARCH_IMPLEMENTATION_DOCUMENT_UPLOADED`, `RESEARCH_IMPLEMENTATION_DOCUMENT_DELETED`
* **Research Results & Recommendations (FASE 8)**: `RESEARCH_REPORT_CREATED`, `RESEARCH_REPORT_UPDATED`, `RESEARCH_REPORT_SUBMITTED`, `RESEARCH_REPORT_REVIEWED`, `RESEARCH_REPORT_APPROVED`, `RESEARCH_REPORT_REVISION_REQUIRED`, `RESEARCH_REPORT_REJECTED`, `RESEARCH_REPORT_DOCUMENT_UPLOADED`, `RESEARCH_REPORT_DOCUMENT_DELETED`, `POLICY_BRIEF_CREATED`, `POLICY_BRIEF_UPDATED`, `POLICY_BRIEF_SUBMITTED`, `POLICY_BRIEF_REVIEWED`, `POLICY_BRIEF_APPROVED`, `POLICY_BRIEF_REVISION_REQUIRED`, `POLICY_BRIEF_DOCUMENT_UPLOADED`, `POLICY_BRIEF_DOCUMENT_DELETED`, `RECOMMENDATION_CREATED`, `RECOMMENDATION_UPDATED`, `RECOMMENDATION_SUBMITTED`, `RECOMMENDATION_REVISION_REQUIRED`, `RECOMMENDATION_APPROVED`, `RECOMMENDATION_PUBLISHED`, `RECOMMENDATION_DOCUMENT_UPLOADED`, `RECOMMENDATION_DOCUMENT_DELETED`, `RECOMMENDATION_VIEWED_BY_OPD`

---

## 17. Baseline Documents (FASE 10)

Sistem SIM-RIDA dilengkapi dengan repositori dokumen rujukan resmi (*knowledge base baseline*) Kabupaten Mimika untuk mendukung analisis kebutuhan riset daerah berbasis bukti (*evidence-based policy research*).

### A. Lokasi Berkas Fisik (12 Dokumen Resmi - 100% Tersedia)
```text
sim-rida-be/uploads/baseline/
├── statistik/
│   └── kerangka-ekonomi-makro-mimika-2025.pdf    (0.18 MB, 1 halaman)
├── perencanaan/
│   ├── rpjmd-mimika-2025-2029.pdf                (5.49 MB, 375 halaman)
│   ├── rkpd-mimika-2025.pdf                      (12.65 MB, 270 halaman)
│   ├── rkpd-mimika-2026.pdf                      (17.99 MB, 458 halaman)
│   ├── perda-apbd-mimika-2025.pdf                (10.95 MB, 1173 halaman)
│   └── kupa-ppas-mimika-2025.pdf                 (14.09 MB, 611 halaman)
├── evaluasi/
│   ├── lkjip-pemkab-mimika.pdf                   (9.81 MB, 110 halaman)
│   ├── lkpd-mimika-2025.pdf                      (19.26 MB, 305 halaman)
│   └── opini-bpk-lkpd-mimika-2025.pdf            (2.10 MB, 6 halaman)
├── iptek/
│   └── program-prioritas-mimika-2025.pdf         (0.27 MB, 7 halaman)
└── opd/
    ├── renja-opd-mimika-2025.pdf                 (23.43 MB, 329 halaman)
    └── dpa-opd-mimika-2025.pdf                   (6.59 MB, 100 halaman)
```

### B. Menjalankan Seeder Baseline
Untuk menginisialisasi atau memperbarui metadata dokumen baseline dan akun login pengguna:
```bash
npx prisma db seed
# atau
node prisma/seed.js
```
> **Catatan Idempotensi & Cache**: Seeder menggunakan mekanisme `upsert` pada seluruh model (`ExternalSource`, `ExternalSourceVersion`, `ExternalSourceDocument`) dan memeriksa *file size cache* sehingga eksekusi berulang berjalan sangat cepat tanpa duplikasi data.

### C. Daftar Dokumen Baseline (Manifest Audit)
Seluruh 12 dokumen baseline berhasil diunduh langsung dari portal resmi Pemerintah Kabupaten Mimika (`https://mimikakab.go.id/ipkd`) dengan total **3.745 halaman** dokumen:

| Kode | Dokumen Baseline | Kategori | Tahun | Ukuran | Halaman | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **BASELINE-001** | Kerangka Ekonomi Makro Kabupaten Mimika 2025 (Statistik & Proyeksi) | STATISTIK | 2025 | 0.18 MB | 1 | `AVAILABLE` |
| **BASELINE-002** | RPJMD Kabupaten Mimika 2025–2029 | PERENCANAAN | 2025 | 5.49 MB | 375 | `AVAILABLE` |
| **BASELINE-003** | Program Prioritas Pembangunan & Riset IPTEK Mimika 2025 | IPTEK | 2025 | 0.27 MB | 7 | `AVAILABLE` |
| **BASELINE-004** | RKPD Kabupaten Mimika 2025 (Perencanaan Tahunan Daerah) | PERENCANAAN | 2025 | 12.65 MB | 270 | `AVAILABLE` |
| **BASELINE-005** | RKPD Kabupaten Mimika 2026 | PERENCANAAN | 2026 | 17.99 MB | 458 | `AVAILABLE` |
| **BASELINE-006** | LKjIP Pemerintah Kabupaten Mimika 2025 | EVALUASI | 2025 | 9.81 MB | 110 | `AVAILABLE` |
| **BASELINE-007** | Rencana Kerja Perangkat Daerah (RENJA OPD) Mimika 2025 | OPD | 2025 | 23.43 MB | 329 | `AVAILABLE` |
| **BASELINE-008** | Dokumen Pelaksanaan Anggaran (DPA OPD) Mimika 2025 | OPD | 2025 | 6.59 MB | 100 | `AVAILABLE` |
| **BASELINE-009** | Laporan Keuangan Pemerintah Daerah (LKPD) Mimika 2025 | EVALUASI | 2025 | 19.26 MB | 305 | `AVAILABLE` |
| **BASELINE-010** | Laporan Hasil Pemeriksaan / Opini BPK atas LKPD Mimika 2025 | EVALUASI | 2025 | 2.10 MB | 6 | `AVAILABLE` |
| **BASELINE-011** | Peraturan Daerah Kabupaten Mimika No. 1/2025 (APBD 2025) | REGULASI | 2025 | 10.95 MB | 1.173 | `AVAILABLE` |
| **BASELINE-012** | KUPA dan PPAS Perubahan Kabupaten Mimika 2025 | PERENCANAAN | 2025 | 14.09 MB | 611 | `AVAILABLE` |

> **Integritas Data Penuh**: 100% dari dokumen baseline memiliki berkas fisik PDF resmi yang tersimpan di storage lokal (`uploads/baseline/`), terhubung ke database, memiliki pratinjau PDF interaktif di frontend, dan dapat diunduh langsung oleh pengguna.








