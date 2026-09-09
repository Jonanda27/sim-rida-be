const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database SIM-RIDA Kab. Mimika (Papua Tengah)...');

  // 1. Bersihkan data lama
  await prisma.digitalSignatureLog.deleteMany();
  await prisma.policyRecommendation.deleteMany();
  await prisma.rkaItem.deleteMany();
  await prisma.kakDocument.deleteMany();
  await prisma.researchTeamMember.deleteMany();
  await prisma.researchStudy.deleteMany();
  await prisma.kepalaApproval.deleteMany();
  await prisma.proposalScoring.deleteMany();
  await prisma.adminVerification.deleteMany();
  await prisma.proposalRevision.deleteMany();
  await prisma.proposalDocument.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.opd.deleteMany();

  console.log('🧹 Data tabel lama berhasil dibersihkan.');

  // 2. Seed Master Data OPD Kabupaten Mimika
  const opdBrida = await prisma.opd.create({
    data: {
      code: 'BRIDA',
      name: 'Badan Riset dan Inovasi Daerah (BRIDA) Kab. Mimika',
      category: 'Badan Daerah',
      email: 'brida@mimikakab.go.id',
      phone: '0901-321123',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah 99910',
      isActive: true,
    },
  });

  const opdBappeda = await prisma.opd.create({
    data: {
      code: 'BAPPEDA',
      name: 'Badan Perencanaan Pembangunan Daerah (BAPPEDA) Kab. Mimika',
      category: 'Badan Daerah',
      email: 'bappeda@mimikakab.go.id',
      phone: '0901-321456',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah 99910',
      isActive: true,
    },
  });

  const opdDinkes = await prisma.opd.create({
    data: {
      code: 'DINKES',
      name: 'Dinas Kesehatan (DINKES) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'dinkes@mimikakab.go.id',
      phone: '0901-321789',
      address: 'Jl. Yos Sudarso No. 12, Distrik Mimika Baru, Timika, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDiskominfo = await prisma.opd.create({
    data: {
      code: 'DISKOMINFO',
      name: 'Dinas Komunikasi dan Informatika (DISKOMINFO) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'diskominfo@mimikakab.go.id',
      phone: '0901-321900',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDisdik = await prisma.opd.create({
    data: {
      code: 'DISDIK',
      name: 'Dinas Pendidikan (DISDIK) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'disdik@mimikakab.go.id',
      phone: '0901-321555',
      address: 'Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDlh = await prisma.opd.create({
    data: {
      code: 'DLH',
      name: 'Dinas Lingkungan Hidup (DLH) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'dlh@mimikakab.go.id',
      phone: '0901-321666',
      address: 'Jl. Cenderawasih SP 2, Distrik Mimika Baru, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDispar = await prisma.opd.create({
    data: {
      code: 'DISPARBUD',
      name: 'Dinas Pariwisata, Kebudayaan, Pemuda dan Olahraga Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'disparbud@mimikakab.go.id',
      phone: '0901-321777',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Kuala Kencana, Mimika',
      isActive: true,
    },
  });

  const opdDistan = await prisma.opd.create({
    data: {
      code: 'DISTAN',
      name: 'Dinas Pertanian, Tanaman Pangan, Hortikultura dan Perkebunan Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'pertanian@mimikakab.go.id',
      phone: '0901-321888',
      address: 'Jl. Poros Timika - Mapurujaya KM 8, Distrik Mimika Timur, Mimika',
      isActive: true,
    },
  });

  const opdDinkop = await prisma.opd.create({
    data: {
      code: 'DINKOP',
      name: 'Dinas Koperasi dan Usaha Kecil Menengah Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'dinkop@mimikakab.go.id',
      phone: '0901-321444',
      address: 'Jl. Yos Sudarso, Distrik Mimika Baru, Mimika',
      isActive: true,
    },
  });

  const opdBpbd = await prisma.opd.create({
    data: {
      code: 'BPBD',
      name: 'Badan Penanggulangan Bencana Daerah (BPBD) Kab. Mimika',
      category: 'Badan Daerah',
      email: 'bpbd@mimikakab.go.id',
      phone: '0901-321999',
      address: 'Jl. Cenderawasih SP 3, Distrik Kuala Kencana, Mimika',
      isActive: true,
    },
  });

  console.log('✅ Master data 10 OPD Kab. Mimika berhasil dibuat.');

  // 3. Hash Password default: password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 4. Seed Akun Pengguna
  const adminBrida = await prisma.user.create({
    data: {
      name: 'Admin Litbang BRIDA Kab. Mimika',
      nip: '198503152010011002',
      email: 'admin@simrida.local',
      password: hashedPassword,
      phone: '081234567890',
      role: 'ADMIN_BRIDA',
      isActive: true,
      opdId: opdBrida.id,
    },
  });

  const kepalaBrida = await prisma.user.create({
    data: {
      name: 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA Kab. Mimika)',
      nip: '197304121998031001',
      email: 'kepala@simrida.local',
      password: hashedPassword,
      phone: '081298765432',
      role: 'KEPALA_BRIDA',
      isActive: true,
      opdId: opdBrida.id,
    },
  });

  const userBappeda = await prisma.user.create({
    data: {
      name: 'Staf Litbang BAPPEDA Mimika',
      nip: '198807202012012004',
      email: 'bappeda@simrida.local',
      password: hashedPassword,
      phone: '081345678901',
      role: 'OPD',
      isActive: true,
      opdId: opdBappeda.id,
    },
  });

  const userDinkes = await prisma.user.create({
    data: {
      name: 'Subbag Program & Data Dinkes Mimika',
      nip: '199001152014022001',
      email: 'dinkes@simrida.local',
      password: hashedPassword,
      phone: '081398765432',
      role: 'OPD',
      isActive: true,
      opdId: opdDinkes.id,
    },
  });

  const userDiskominfo = await prisma.user.create({
    data: {
      name: 'Bidang E-Gov Diskominfo Mimika',
      nip: '199205102016031003',
      email: 'diskominfo@simrida.local',
      password: hashedPassword,
      phone: '081223344556',
      role: 'OPD',
      isActive: true,
      opdId: opdDiskominfo.id,
    },
  });

  const userDisdik = await prisma.user.create({
    data: {
      name: 'Subbag Perencanaan Disdik Mimika',
      nip: '199104122015021002',
      email: 'disdik@simrida.local',
      password: hashedPassword,
      phone: '081223344888',
      role: 'OPD',
      isActive: true,
      opdId: opdDisdik.id,
    },
  });

  const userDlh = await prisma.user.create({
    data: {
      name: 'Bidang Pengendalian Lingkungan DLH Mimika',
      nip: '198909182013012001',
      email: 'dlh@simrida.local',
      password: hashedPassword,
      phone: '081223344999',
      role: 'OPD',
      isActive: true,
      opdId: opdDlh.id,
    },
  });

  console.log('✅ Akun pengguna multi-role Kab. Mimika berhasil di-seed.');

  // 5. Seed Usulan Riset OPD

  // Usulan 1: PENDING
  const propPending = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-001',
      title: 'Kajian Efektivitas Penyaluran Bantuan Sosial Terpadu Berbasis Geospasial di Distrik Mimika Baru dan Distrik Kuala Kencana',
      category: 'Sosial Budaya & Kesejahteraan Masyarakat',
      problemStatement: 'Terdapat anomali data penerima bantuan sosial di tingkat kampung dan kelurahan di mana 18.4% alokasi belum tepat sasaran akibat keterlambatan sinkronisasi data kependudukan lapangan.',
      urgencyReason: 'Perlu formulasi algoritma matching spasial dan verifikasi faktual agar alokasi APBD TA 2027 tepat sasaran dan mengurangi kemiskinan ekstrem di Kabupaten Mimika.',
      urgencyLevel: 'TINGGI',
      expectedOutput: 'REKOMENDASI_KEBIJAKAN',
      estimatedBudget: 85000000,
      status: 'PENDING',
      submittedAt: new Date('2026-09-01T08:30:00Z'),
      opdId: opdBappeda.id,
      createdById: userBappeda.id,
      supportingDocuments: {
        create: [
          {
            name: 'Data_DTKS_Mimika_Q2_2026.xlsx',
            size: '3.4 MB',
          },
          {
            name: 'Surat_Pengantar_Kepala_Bappeda_No89.pdf',
            size: '1.1 MB',
          },
        ],
      },
    },
  });

  // Usulan 2: RETURNED
  const propReturned = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-002',
      title: 'Evaluasi Integrasi Layanan Primer Puskesmas dalam Penanganan Stunting dan Malaria di Distrik Pesisir Mimika',
      category: 'Sosial Budaya & Kesejahteraan Masyarakat',
      problemStatement: 'Prevalensi stunting dan malaria di 3 distrik pesisir Mimika (Mimika Barat, Mimika Barat Tengah, Mimika Barat Jauh) masih memerlukan integrasi layanan gizi posyandu dan puskesmas keliling.',
      urgencyReason: 'Diperlukan SOP operasional integrasi posyandu-puskesmas sebelum evaluasi target Renstra Dinkes Mimika akhir tahun 2026.',
      urgencyLevel: 'SEDANG',
      expectedOutput: 'REKOMENDASI_KEBIJAKAN',
      estimatedBudget: 60000000,
      status: 'RETURNED',
      submittedAt: new Date('2026-09-02T10:00:00Z'),
      opdId: opdDinkes.id,
      createdById: userDinkes.id,
      supportingDocuments: {
        create: [
          {
            name: 'Laporan_Cakupan_Gizi_Balita_Mimika_2025.pdf',
            size: '2.8 MB',
          },
        ],
      },
      revisions: {
        create: {
          revisionNotes: 'Mohon lengkapi data sebaran prevalensi per lokus kampung prioritas di distrik pesisir dan rincian target intervensi yang diharapkan agar reviewer dapat menilai ruang lingkup kajian.',
          returnedById: adminBrida.id,
        },
      },
    },
  });

  // Usulan 3: IN_REVIEW
  const propInReview = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-003',
      title: 'Studi Kelayakan Implementasi Sistem Smart Water Management untuk Kawasan Pertanian Dataran Rendah Mimika',
      category: 'Inovasi Daerah & Teknologi',
      problemStatement: 'Efisiensi distribusi air irigasi di kawasan sentra pertanian SP 2 dan SP 3 Distrik Kuala Kencana dan Iwaka memerlukan tata kelola drainase terpadu menghadapi curah hujan tinggi khas Mimika.',
      urgencyReason: 'Mendukung ketahanan pangan daerah Kabupaten Mimika dan swasembada sayuran lokal tahun 2026-2027.',
      urgencyLevel: 'TINGGI',
      expectedOutput: 'STUDI_KELAYAKAN',
      estimatedBudget: 95000000,
      status: 'IN_REVIEW',
      submittedAt: new Date('2026-08-28T09:15:00Z'),
      opdId: opdBappeda.id,
      createdById: userBappeda.id,
      supportingDocuments: {
        create: [
          {
            name: 'Peta_Jaringan_Drainase_Pertanian_Mimika_2026.pdf',
            size: '5.2 MB',
          },
        ],
      },
      adminVerification: {
        create: {
          isProblemClear: true,
          isUrgencyRelevant: true,
          isBudgetFeasible: true,
          isDataAdequate: true,
          decision: 'PASS',
          verificationNotes: 'Uraian masalah dan urgensi lapangan sangat jelas, selaras dengan prioritas ketahanan pangan RPJMD Kab. Mimika. Berkas lolos verifikasi administrasi untuk diteruskan ke kajian scoring teknis.',
          verifiedById: adminBrida.id,
          verifiedAt: new Date('2026-09-03T14:20:00Z'),
        },
      },
    },
  });

  // Usulan 4: DRAFT
  const propDraft = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-004',
      title: 'Analisis Kesiapan Transformasi Digital Keamanan Informasi Smart City Mimika',
      category: 'Tata Kelola Pemerintahan & Pelayanan Publik',
      problemStatement: 'Peningkatan integrasi layanan publik digital pemerintahan Kabupaten Mimika membutuhkan penguatan tata kelola CSIRT dan sertifikasi ISO 27001.',
      urgencyReason: 'Kebutuhan audit keamanan siber sebelum implementasi Super-App Pemkab Mimika.',
      urgencyLevel: 'SEDANG',
      expectedOutput: 'NASKAH_AKADEMIK',
      estimatedBudget: 50000000,
      status: 'DRAFT',
      opdId: opdDiskominfo.id,
      createdById: userDiskominfo.id,
    },
  });

  // Usulan 5: SCORED
  const propScored = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-005',
      title: 'Strategi Akselerasi Penurunan Kemiskinan Ekstrem melalui Pemberdayaan Ekonomi Masyarakat Adat Amungme dan Kamoro di Kabupaten Mimika',
      category: 'Sosial Budaya & Kesejahteraan Masyarakat',
      problemStatement: 'Kantong kemiskinan di beberapa kampung pedalaman dan pesisir Mimika memerlukan model intervensi padat karya dan pendampingan usaha berbasis komoditas lokal (sagu, perikanan tangkap, dan pertanian dataran tinggi).',
      urgencyReason: 'Target nasional dan RPJMD Kab. Mimika mengharuskan akselerasi pengentasan kemiskinan ekstrem melalui perlindungan masyarakat hukum adat.',
      urgencyLevel: 'TINGGI',
      expectedOutput: 'REKOMENDASI_KEBIJAKAN',
      estimatedBudget: 90000000,
      status: 'SCORED',
      submittedAt: new Date('2026-08-20T08:00:00Z'),
      opdId: opdBappeda.id,
      createdById: userBappeda.id,
      supportingDocuments: {
        create: [
          {
            name: 'Peta_Sebaran_Sosial_Ekonomi_Mimika_2026.pdf',
            size: '4.1 MB',
          },
        ],
      },
      adminVerification: {
        create: {
          isProblemClear: true,
          isUrgencyRelevant: true,
          isBudgetFeasible: true,
          isDataAdequate: true,
          decision: 'PASS',
          verificationNotes: 'Berkas dan data mikro kemiskinan lengkap dan terverifikasi.',
          verifiedById: adminBrida.id,
          verifiedAt: new Date('2026-08-22T10:00:00Z'),
        },
      },
      scoring: {
        create: {
          visionAlignmentScore: 92,
          urgencyScore: 90,
          budgetFeasibilityScore: 85,
          dataReadinessScore: 88,
          totalWeightedScore: 89.2,
          researchField: 'SOSIAL_BUDAYA',
          executionScheme: 'SWAKELOLA',
          priorityCategory: 'PRIORITAS_UTAMA',
          evaluationNotes: 'Riset sangat mendesak dan relevan dengan visi RPJMD Mimika. Disarankan menggunakan skema Swakelola Tipe I bekerja sama dengan tim peneliti internal BRIDA dan BAPPEDA Mimika.',
          evaluatorId: adminBrida.id,
          evaluatedAt: new Date('2026-08-25T14:30:00Z'),
        },
      },
    },
  });

  // Usulan 6: APPROVED
  const propApproved = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-006',
      title: 'Kajian Pengembangan Ekowisata Bahari dan Budaya Berkelanjutan Berbasis Kearifan Lokal di Kawasan Pesisir Kabupaten Mimika',
      category: 'Ekonomi & Pembangunan',
      problemStatement: 'Potensi wisata alam mangrove, pulau pesisir Mimika, dan kebudayaan seni ukir Kamoro belum terintegrasi dalam jejaring paket wisata tematik, memicu kesenjangan pendapatan masyarakat kampung pesisir.',
      urgencyReason: 'Mendukung diversifikasi ekonomi non-tambang di Kabupaten Mimika dan pelestarian ekosistem pesisir Papua Tengah.',
      urgencyLevel: 'TINGGI',
      expectedOutput: 'DOKUMEN_MASTERPLAN',
      estimatedBudget: 110000000,
      status: 'APPROVED',
      submittedAt: new Date('2026-08-10T09:00:00Z'),
      opdId: opdBappeda.id,
      createdById: userBappeda.id,
      supportingDocuments: {
        create: [
          {
            name: 'Masterplan_Ekowisata_Pesisir_Mimika_2025.pdf',
            size: '6.5 MB',
          },
        ],
      },
      adminVerification: {
        create: {
          isProblemClear: true,
          isUrgencyRelevant: true,
          isBudgetFeasible: true,
          isDataAdequate: true,
          decision: 'PASS',
          verificationNotes: 'Lolos verifikasi administrasi.',
          verifiedById: adminBrida.id,
          verifiedAt: new Date('2026-08-12T10:00:00Z'),
        },
      },
      scoring: {
        create: {
          visionAlignmentScore: 95,
          urgencyScore: 88,
          budgetFeasibilityScore: 90,
          dataReadinessScore: 85,
          totalWeightedScore: 89.9,
          researchField: 'EKONOMI_PEMBANGUNAN',
          executionScheme: 'PENUNJUKAN_LANGSUNG',
          priorityCategory: 'PRIORITAS_UTAMA',
          evaluationNotes: 'Riset bernilai strategis tinggi untuk masterplan kepariwisataan Kabupaten Mimika 2026-2030.',
          evaluatorId: adminBrida.id,
          evaluatedAt: new Date('2026-08-15T11:00:00Z'),
        },
      },
      kepalaApproval: {
        create: {
          decision: 'APPROVED',
          approvedBudget: 105000000,
          fiscalYear: 2026,
          finalExecutionScheme: 'PENUNJUKAN_LANGSUNG',
          notes: 'Disetujui untuk dilaksanakan pada TA 2026 dengan pagu definitif Rp 105.000.000 melalui kemitraan Pusat Kajian Pembangunan Daerah & Universitas Papua (UNIPA). Tim segera menyusun KAK dan RKA.',
          approvedById: kepalaBrida.id,
          approvedAt: new Date('2026-08-18T15:00:00Z'),
        },
      },
    },
  });

  // 6. Seed Kajian Riset Aktif (ResearchStudy)
  const study1 = await prisma.researchStudy.create({
    data: {
      proposalId: propApproved.id,
      title: propApproved.title,
      fiscalYear: 2026,
      allocatedBudget: 105000000,
      executionScheme: 'PENUNJUKAN_LANGSUNG',
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-12-31T00:00:00Z'),
      status: 'IN_PROGRESS',
      createdById: adminBrida.id,
      kakDocument: {
        create: {
          background: 'Kawasan pesisir Mimika memiliki hutan mangrove terluas dan kekayaan budaya ukir suku Kamoro yang unik. Integrasi tata kelola antar kampung pesisir perlu distandardisasi agar menarik kunjungan ekowisata berkelanjutan.',
          objectives: 'Menyusun dokumen masterplan dan rekomendasi kebijakan standarisasi paket ekowisata budaya terpadu pesisir Kabupaten Mimika.',
          scopeAndMethodology: 'Survei komprehensif ke 12 kampung pesisir di Distrik Mimika Timur dan Mimika Barat, Focus Group Discussion (FGD) bersama Lembaga Musyawarah Adat, analisis daya dukung lingkungan pesisir, dan perumusan matriks kebijakan daerah.',
          targetOutput: 'Dokumen Masterplan Pengembangan Ekowisata Bahari dan Budaya Berkelanjutan & Draft Peraturan Bupati Mimika.',
          durationMonths: 4,
          status: 'FINAL',
          finalizedAt: new Date('2026-08-25T10:00:00Z'),
        },
      },
      rkaItems: {
        create: [
          {
            category: 'Honorarium Pakar & Tenaga Ahli',
            description: 'Honorarium Tenaga Ahli Utama Kebijakan Pariwisata & Budaya Papua (4 Bulan)',
            volume: 4,
            unit: 'OB',
            unitPrice: 8000000,
            totalPrice: 32000000,
          },
          {
            category: 'Honorarium Pakar & Tenaga Ahli',
            description: 'Honorarium Peneliti Pendamping Sosial Budaya Adat (4 Bulan)',
            volume: 4,
            unit: 'OB',
            unitPrice: 5000000,
            totalPrice: 20000000,
          },
          {
            category: 'Belanja Survei & Pengumpulan Data Lapangan',
            description: 'Biaya Survei Lapangan & Transportasi Laut/Sungai Enumerator ke 12 Kampung Pesisir Mimika',
            volume: 24,
            unit: 'OH',
            unitPrice: 500000,
            totalPrice: 12000000,
          },
          {
            category: 'FGD & Konsultasi Publik',
            description: 'Penyelenggaraan FGD Stakeholder Pariwisata, Tokoh Adat Amungme-Kamoro & OPD Terkait (2 Kali)',
            volume: 2,
            unit: 'Paket',
            unitPrice: 10500000,
            totalPrice: 21000000,
          },
          {
            category: 'Pelaporan & Publikasi',
            description: 'Penyusunan, Penggandaan Laporan Akhir & Policy Brief Eksklusif Bupati Mimika',
            volume: 1,
            unit: 'Paket',
            unitPrice: 20000000,
            totalPrice: 20000000,
          },
        ],
      },
      teamMembers: {
        create: [
          {
            name: 'Dr. Yakobus Kogoya, M.Si',
            role: 'Ketua Tim Peneliti / Tenaga Ahli Utama',
            institution: 'Pusat Studi Pembangunan Daerah Papua (UNIPA)',
            phone: '08122718290',
            email: 'yakobus.kogoya@unipa.ac.id',
          },
          {
            name: 'Maria Maturbongs, S.Sos., M.Sc',
            role: 'Peneliti Bidang Sosial Budaya & Antropologi',
            institution: 'Lembaga Riset Papua',
            phone: '08139281726',
            email: 'maria.maturbongs@papuaresearch.org',
          },
          {
            name: 'Kurniawan Prasetyo, S.Sos., M.P.A.',
            role: 'Peneliti Pendamping Internal BRIDA',
            institution: 'BRIDA Kab. Mimika',
            phone: '08112345678',
            email: 'kurniawan@mimikakab.go.id',
          },
        ],
      },
    },
  });

  // Kajian 2 (COMPLETED) untuk Naskah Rekomendasi Finalized & TTE
  const propCompletedDinkes = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-007',
      title: 'Kajian Formulasi Pangan Tambahan Berbasis Komoditas Lokal Sagu dan Ikan Laut untuk Percepatan Penurunan Stunting di Kabupaten Mimika',
      category: 'Kesehatan & Gizi Masyarakat',
      problemStatement: 'Prevalensi stunting balita di wilayah distrik pesisir dan pedalaman Mimika masih memerlukan intervensi gizi spesifik berbasis pangan lokal yang mudah diakses dan diterima oleh kultur masyarakat adat.',
      urgencyReason: 'Mendukung target percepatan penurunan stunting nasional dan program prioritas bidang kesehatan Pemerintah Kabupaten Mimika.',
      urgencyLevel: 'TINGGI',
      expectedOutput: 'REKOMENDASI_KEBIJAKAN',
      estimatedBudget: 85000000,
      status: 'APPROVED',
      submittedAt: new Date('2026-07-05T08:30:00Z'),
      opdId: opdDinkes.id,
      createdById: userDinkes.id,
      adminVerification: {
        create: {
          isProblemClear: true,
          isUrgencyRelevant: true,
          isBudgetFeasible: true,
          isDataAdequate: true,
          decision: 'PASS',
          verificationNotes: 'Lolos verifikasi data gizi dan sasaran.',
          verifiedById: adminBrida.id,
          verifiedAt: new Date('2026-07-08T10:00:00Z'),
        },
      },
      scoring: {
        create: {
          visionAlignmentScore: 96,
          urgencyScore: 95,
          budgetFeasibilityScore: 90,
          dataReadinessScore: 92,
          totalWeightedScore: 93.7,
          researchField: 'SOSIAL_BUDAYA',
          executionScheme: 'SWAKELOLA',
          priorityCategory: 'PRIORITAS_UTAMA',
          evaluationNotes: 'Riset sangat krusial untuk panduan menu PMT Puskesmas di Mimika.',
          evaluatorId: adminBrida.id,
          evaluatedAt: new Date('2026-07-10T14:00:00Z'),
        },
      },
      kepalaApproval: {
        create: {
          decision: 'APPROVED',
          approvedBudget: 85000000,
          fiscalYear: 2026,
          finalExecutionScheme: 'SWAKELOLA',
          notes: 'Disetujui. Lakukan uji klinis gizi bersama Fakultas Kedokteran & Kesehatan Masyarakat.',
          approvedById: kepalaBrida.id,
          approvedAt: new Date('2026-07-12T16:00:00Z'),
        },
      },
    },
  });

  const study2 = await prisma.researchStudy.create({
    data: {
      proposalId: propCompletedDinkes.id,
      title: propCompletedDinkes.title,
      fiscalYear: 2026,
      allocatedBudget: 85000000,
      executionScheme: 'SWAKELOLA',
      startDate: new Date('2026-07-15T00:00:00Z'),
      endDate: new Date('2026-08-30T00:00:00Z'),
      status: 'COMPLETED',
      createdById: adminBrida.id,
      kakDocument: {
        create: {
          background: 'Pemanfaatan pangan lokal bergizi tinggi seperti sagu fortified dan olahan tepung ikan laut Mimika untuk balita sasaran stunting.',
          objectives: 'Merumuskan standar formula PMT lokal dan SOP penanganan stunting terpadu bagi Puskesmas dan Posyandu.',
          scopeAndMethodology: 'Uji nilai gizi laboratorium, survei akseptabilitas rasa pada balita di 5 distrik, perumusan standar operasional prosedur.',
          targetOutput: 'Buku Pedoman Menu PMT Lokal & Draf Peraturan Bupati tentang Penanggulangan Stunting Terpadu.',
          durationMonths: 2,
          status: 'FINAL',
          finalizedAt: new Date('2026-07-20T09:00:00Z'),
        },
      },
    },
  });

  // 7. Seed Naskah Rekomendasi Kebijakan
  // rec1: Status DRAFT (Siap disusun & diperbarui oleh Admin BRIDA pada kajian ekowisata)
  const rec1 = await prisma.policyRecommendation.create({
    data: {
      code: 'REK-2026-001',
      studyId: study1.id,
      title: 'Draf Rekomendasi Tata Kelola Klaster Ekowisata Pesisir dan Perlindungan Mangrove Kabupaten Mimika',
      executiveSummary: 'Draf policy brief ini merumuskan rekomendasi kebijakan strategis bagi Dinas Pariwisata dan BAPPEDA guna mengoptimalkan potensi ekowisata pesisir berkelanjutan berbasis kearifan lokal masyarakat adat Kamoro.',
      keyFindings: '1. Kesenjangan sarana dan akses perahu antar kampung wisata pesisir mencapai 55%.\n2. Perlindungan zona inti hutan mangrove membutuhkan regulasi zonasi daerah yang mengikat.\n3. Standardisasi pembinaan kelompok sadar wisata (Pokdarwis) lokal masih belum dilembagakan.',
      policyActions: '1. JANGKA PENDEK (0-6 Bulan): Penerbitan Surat Edaran Bupati tentang Standarisasi Tarif dan Pembinaan Pokdarwis Pesisir Mimika.\n2. JANGKA MENENGAH (6-18 Bulan): Penyusunan Rancangan Perbup tentang Masterplan Pariwisata Daerah.\n3. JANGKA PANJANG: Alokasi anggaran afirmasi pemberdayaan ekonomi kampung pesisir.',
      targetPolicyType: 'DRAFT_PERBUP',
      impactLevel: 'STRATEGIS_DAERAH',
      targetOpdNames: 'Dinas Pariwisata, Kebudayaan, Pemuda dan Olahraga, BAPPEDA, Dinas Lingkungan Hidup Kab. Mimika',
      status: 'DRAFT',
      createdById: adminBrida.id,
    },
  });

  // rec2: Status FINALIZED (Telah disahkan resmi dengan TTE BSrE oleh Kepala BRIDA)
  const rec2 = await prisma.policyRecommendation.create({
    data: {
      code: 'REK-2026-002',
      studyId: study2.id,
      title: 'Rekomendasi Kebijakan Standarisasi Pemberian Makanan Tambahan (PMT) Berbasis Pangan Lokal untuk Percepatan Eliminasi Stunting di Kabupaten Mimika',
      executiveSummary: 'Kajian merekomendasikan penerbitan Peraturan Bupati Mimika mengenai standarisasi menu PMT berbahan baku sagu lokal dan ikan laut segar pada seluruh Puskesmas dan Posyandu di 18 Distrik Kabupaten Mimika.',
      keyFindings: '1. Hasil uji laboratorium menunjukkan biskuit sagu fortified ikan laut memiliki kandungan protein dan zink 40% lebih tinggi dibanding makanan pabrikan.\n2. Tingkat penerimaan (akseptabilitas rasa) oleh balita dan ibu di kampung mencapai 92%.\n3. Penggunaan bahan baku lokal menghemat biaya logistik distribusi PMT daerah hingga 35%.',
      policyActions: '1. Penerbitan Perbup tentang Standarisasi Menu PMT Berbasis Pangan Lokal Papua di Kabupaten Mimika.\n2. Alokasi wajib minimal 20% dana Bantuan Operasional Kesehatan (BOK) Puskesmas untuk belanja komoditas pangan lokal kelompok tani dan nelayan setempat.\n3. Integrasi pemantauan digital pertumbuhan balita melalui aplikasi SIM-RIDA Dinkes Mimika.',
      targetPolicyType: 'DRAFT_PERBUP',
      impactLevel: 'STRATEGIS_DAERAH',
      targetOpdNames: 'Dinas Kesehatan, BAPPEDA, Dinas Ketahanan Pangan, DP3AKB Kab. Mimika',
      status: 'FINALIZED',
      createdById: adminBrida.id,
      signedById: kepalaBrida.id,
      signedAt: new Date('2026-08-31T10:00:00Z'),
    },
  });

  // 8. Seed DigitalSignatureLog untuk rec2
  const sig1 = await prisma.digitalSignatureLog.create({
    data: {
      certificateNumber: 'DS-2026-0001',
      documentType: 'POLICY_RECOMMENDATION',
      documentId: rec2.id,
      documentTitle: rec2.title,
      documentCode: rec2.code,
      signerId: kepalaBrida.id,
      signerName: kepalaBrida.name,
      signerNip: kepalaBrida.nip,
      signerRole: 'Kepala Badan Riset dan Inovasi Daerah (BRIDA) Kab. Mimika',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a29f8644b9a6549a',
      verificationUrl: '/verify-signature/DS-2026-0001',
      status: 'VALID',
      notes: 'Disahkan secara resmi oleh Kepala BRIDA Kab. Mimika untuk diteruskan kepada Bupati Mimika dan Dinas Kesehatan.',
      signedAt: new Date('2026-08-31T10:00:00Z'),
    },
  });

  console.log('✅ Sample usulan riset berhasil di-seed:');
  console.log(`   - [${propPending.status}] ${propPending.code} : ${propPending.title}`);
  console.log(`   - [${propReturned.status}] ${propReturned.code} : ${propReturned.title}`);
  console.log(`   - [${propInReview.status}] ${propInReview.code} : ${propInReview.title}`);
  console.log(`   - [${propDraft.status}] ${propDraft.code} : ${propDraft.title}`);
  console.log(`   - [${propScored.status}] ${propScored.code} : ${propScored.title}`);
  console.log(`   - [${propApproved.status}] ${propApproved.code} : ${propApproved.title}`);
  console.log(`   - [${propCompletedDinkes.status}] ${propCompletedDinkes.code} : ${propCompletedDinkes.title}`);
  console.log(`✅ Sample Kajian Riset Aktif & Selesai berhasil di-seed:`);
  console.log(`   - [${study1.status}] ${study1.title} (Pagu: Rp ${study1.allocatedBudget})`);
  console.log(`   - [${study2.status}] ${study2.title} (Pagu: Rp ${study2.allocatedBudget})`);
  console.log(`✅ Sample Rekomendasi Kebijakan berhasil di-seed:`);
  console.log(`   - [${rec1.status}] ${rec1.code} : ${rec1.title}`);
  console.log(`   - [${rec2.status}] ${rec2.code} : ${rec2.title}`);
  console.log(`✅ Sample Sertifikat TTE Digital berhasil di-seed: [${sig1.status}] ${sig1.certificateNumber} (${sig1.signerName})`);

  console.log('🌱 Seeding database SIM-RIDA Kab. Mimika selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
