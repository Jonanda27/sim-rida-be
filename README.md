# SIM-RIDA Backend API (Express + Prisma ORM + PostgreSQL)

Backend Sistem Informasi Riset dan Inovasi Daerah (SIM-RIDA) untuk **Autentikasi**, **Manajemen Akun**, **Master OPD**, **Usulan Riset OPD**, **Verifikasi Gatekeeper BRIDA**, **Penelaahan & Scoring (Prioritasi) Riset**, **Approval Usulan Kepala BRIDA**, **Manajemen Kajian Riset (KAK, RKA, & Tim Peneliti)**, **Penyusunan Rekomendasi Kebijakan (Policy Brief)**, **Pengesahan & TTE**, serta **Dashboard Analytics & Executive Reporting** dengan 3 Role Aktif:
1. `ADMIN_BRIDA` : Admin Litbang BRIDA (Gatekeeper, Verifikasi, Scoring, Manajemen Kajian, Penyusun Rekomendasi)
2. `KEPALA_BRIDA` : Kepala BRIDA (Approval Usulan, Pengesahan & TTE Dokumen Digital, Executive Dashboard)
3. `OPD` : Perangkat Daerah Pengusul Riset

---

## 🚀 Menjalankan Backend

### 1. Instalasi Dependencies
```bash
npm install
```

### 2. Konfigurasi Database (.env)
```env
DATABASE_URL="postgresql://postgres:naufal@localhost:5432/simrida2?schema=public"
JWT_SECRET="57d46a850afc777039fd71ad21e4ed6f683b36338ccb32fa0d50d08eebca4af4"
JWT_EXPIRES_IN="1d"
PORT=5000
```

### 3. Migrasi Schema & Seeder
```bash
npx prisma db push --force-reset
node prisma/seed.js
```

### 4. Menjalankan Server Development
```bash
npm run dev
```

---

## 🔑 Akun Default Seeder

Semua akun default menggunakan password: `password123`

| Role | Email / NIP | Nama | OPD |
| :--- | :--- | :--- | :--- |
| **`ADMIN_BRIDA`** | `admin@simrida.local` / `198503152010011002` | Admin Litbang BRIDA | BRIDA |
| **`KEPALA_BRIDA`** | `kepala@simrida.local` / `197304121998031001` | Dr. H. Bambang Priyanto, M.Si | BRIDA |
| **`OPD`** | `opd.bappeda@mimikakab.go.id` / `198807202012012004` | Staf Litbang BAPPEDA | BAPPEDA |
| **`OPD`** | `opd.dinkes@mimikakab.go.id` / `199001152014022001` | Subbag Program Dinkes | Dinkes |
| **`OPD`** | `opd.diskominfo@mimikakab.go.id` / `199205102016031003` | Bidang E-Gov Diskominfo | Diskominfo |

---

## 📡 Daftar Endpoint API (`http://localhost:5000/api/v1`)

### 1. Autentikasi (`/auth`)
- `GET /health` : Health check server
- `POST /auth/login` : Login user (Email/NIP + Password)
- `GET /auth/me` : Profil user login (Bearer Token)
- `POST /auth/change-password` : Ganti password

### 2. Manajemen Pengguna (`/users`) *(Khusus `ADMIN_BRIDA`)*
- `GET /users` : List akun pengguna
- `GET /users/:id` : Detail akun pengguna
- `POST /users` : Buat akun baru
- `PUT /users/:id` : Edit akun / role / OPD
- `PATCH /users/:id/status` : Toggle status aktif (`isActive`)
- `DELETE /users/:id` : Hapus akun

### 3. Master Data OPD (`/opds`)
- `GET /opds` : Master data instansi OPD
- `POST /opds` : Tambah master OPD (*Khusus `ADMIN_BRIDA`*)
- `PUT /opds/:id` : Update master OPD (*Khusus `ADMIN_BRIDA`*)

### 4. Usulan Riset OPD & Verifikasi Gatekeeper (`/proposals`)
- `GET /proposals` : List usulan (Role OPD otomatis hanya melihat usulan instansinya)
- `GET /proposals/:id` : Detail lengkap usulan
- `POST /proposals` : Buat usulan baru (`DRAFT` / `PENDING`)
- `PUT /proposals/:id` : Edit usulan (status `DRAFT` / `RETURNED`)
- `POST /proposals/:id/submit` : Kirim usulan ke antrean verifikasi BRIDA
- `DELETE /proposals/:id` : Hapus usulan (status `DRAFT`)
- `GET /proposals/verification/inbox` : Antrean verifikasi usulan masuk (*Khusus `ADMIN_BRIDA`*)
- `POST /proposals/:id/verify` : Keputusan verifikasi gatekeeper (`PASS` -> `IN_REVIEW` / `RETURN` -> `RETURNED`)

### 5. Penelaahan & Scoring (Prioritasi) Riset (`/scoring`)
- `GET /scoring/queue` : Antrean usulan siap dinilai / sudah dinilai (`IN_REVIEW` / `SCORED`) (*ADMIN_BRIDA & KEPALA_BRIDA*)
- `GET /scoring/:proposalId` : Detail instrumen scoring dan hasil evaluasi usulan (*ADMIN_BRIDA & KEPALA_BRIDA*)
- `POST /scoring/:proposalId` : Submit formulasi scoring digital (Otomatis hitung skor tertimbang, kategori prioritas, dan status ke `SCORED`) (*Khusus `ADMIN_BRIDA`*)

### 6. Approval Usulan Riset (`/approvals`)
- `GET /approvals/inbox` : Daftar tunggu persetujuan usulan (`SCORED`) dan riwayat approval (`APPROVED`/`REJECTED`) (*KEPALA_BRIDA & ADMIN_BRIDA*)
- `GET /approvals/:proposalId` : Detail dossier eksekutif usulan untuk review cepat Kepala BRIDA (*KEPALA_BRIDA & ADMIN_BRIDA*)
- `POST /approvals/:proposalId` : Keputusan persetujuan final: Setujui (`APPROVED` + penetapan pagu definitif/TA/skema riset), Tolak (`REJECTED`), atau Kaji Ulang (`REVISION_REQUIRED`) (*Khusus `KEPALA_BRIDA`*)

### 7. Manajemen Kajian Riset (`/studies`)
- `GET /studies` : Daftar seluruh kajian riset aktif (*ADMIN_BRIDA & KEPALA_BRIDA*)
- `GET /studies/approved-proposals` : Daftar usulan berstatus `APPROVED` yang siap diinisiasi (*Khusus `ADMIN_BRIDA`*)
- `POST /studies/initialize/:proposalId` : Menginisiasi usulan yang disetujui menjadi kajian riset aktif (*Khusus `ADMIN_BRIDA`*)
- `GET /studies/:id` : Detail lengkap kajian riset (Usulan asal, KAK digital, RKA, Tim Peneliti)
- `PUT /studies/:id/kak` : Menyimpan / memperbarui dokumen Kerangka Acuan Kerja (KAK) digital (*Khusus `ADMIN_BRIDA`*)
- `POST /studies/:id/rka` : Menyimpan rincian anggaran belanja RKA (dengan validasi plafon pagu anggaran) (*Khusus `ADMIN_BRIDA`*)
- `POST /studies/:id/team` : Menetapkan susunan tim peneliti / narasumber riset (*Khusus `ADMIN_BRIDA`*)
- `PATCH /studies/:id/status` : Memperbarui status pelaksanaan kajian (`PLANNING` -> `IN_PROGRESS` -> `COMPLETED`) (*Khusus `ADMIN_BRIDA`*)

### 8. Penyusunan Rekomendasi Kebijakan (`/recommendations`)
- `GET /recommendations` : Daftar seluruh naskah rekomendasi kebijakan (*Semua Role*)
- `GET /recommendations/available-studies` : Daftar kajian riset yang siap dirumuskan rekomendasinya (*Khusus `ADMIN_BRIDA`*)
- `GET /recommendations/:id` : Detail lengkap naskah rekomendasi kebijakan (*Semua Role*)
- `POST /recommendations` : Membuat draf rekomendasi kebijakan baru (`REK-YYYY-XXX`) (*Khusus `ADMIN_BRIDA`*)
- `PUT /recommendations/:id` : Memperbarui draf rekomendasi (*Khusus `ADMIN_BRIDA`*)
- `POST /recommendations/:id/submit` : Mengajukan rekomendasi ke Kepala BRIDA (`DRAFT` -> `SUBMITTED`) (*Khusus `ADMIN_BRIDA`*)
- `POST /recommendations/:id/finalize` : Pengesahan resmi rekomendasi kebijakan (`SUBMITTED` -> `FINALIZED`) (*Khusus `KEPALA_BRIDA`*)
- `DELETE /recommendations/:id` : Menghapus draf rekomendasi kebijakan (*Khusus `ADMIN_BRIDA`*)

### 9. Pengesahan & Tanda Tangan Elektronik (TTE) (`/tte`)
- `GET /tte/inbox` : Daftar antrean dokumen menunggu tanda tangan elektronik (*Khusus `KEPALA_BRIDA`*)
- `GET /tte/history` : Riwayat arsip seluruh dokumen yang telah bertanda tangan digital (*KEPALA_BRIDA & ADMIN_BRIDA*)
- `GET /tte/detail/:documentType/:id` : Preview isi dokumen & lembar pengesahan TTE (*Khusus `KEPALA_BRIDA`*)
- `POST /tte/sign` : Eksekusi penandatanganan elektronik dengan verifikasi passphrase & penerbitan hash SHA-256 + nomor sertifikat digital (*Khusus `KEPALA_BRIDA`*)
- `GET /tte/verify/:certificateNumber` : **Endpoint Publik** untuk verifikasi keabsahan dokumen via Scan QR Code (*Tanpa Login*)

### 10. Dashboard Analytics & Reporting (`/dashboard`)
- `GET /dashboard/summary` : Agregasi dashboard otomatis sesuai role user login
- `GET /dashboard/kepala` : Executive Dashboard Kepala BRIDA (KPI Kinerja, Isu Strategis, Pagu vs RKA, GIS Map)
- `GET /dashboard/admin` : Operational Dashboard Admin BRIDA (Antrean Aksi Verifikasi/Scoring, Keaktifan OPD)
- `GET /dashboard/opd` : Dashboard Usulan & Hasil Riset Instansi OPD
