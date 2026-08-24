const seedProposals = async (prisma) => {
  console.log(`Seeding proposals & research data...`);

  // 1. Get the OPD user
  const opdUser = await prisma.user.findUnique({
    where: { email: 'opd@test.com' },
  });
  if (!opdUser) {
    throw new Error('OPD user not found during seeding');
  }

  // 2. Get Master Sectors
  const kesSector = await prisma.masterSector.findFirst({ where: { name: 'Kesehatan' } });
  const lhSector = await prisma.masterSector.findFirst({ where: { name: 'Lingkungan Hidup' } });

  // 3. Get Master Research Types
  const evalType = await prisma.masterResearchType.findFirst({ where: { name: 'Evaluasi Kebijakan' } });
  const kelayakanType = await prisma.masterResearchType.findFirst({ where: { name: 'Kajian / Studi Kelayakan' } });

  // --- PRP-2026-001 (Stunting) ---
  const problem1 = await prisma.problem.upsert({
    where: { id: 'PRP-2026-001' },
    update: {},
    create: {
      id: 'PRP-2026-001',
      title: 'Kajian Efektivitas Penanganan Stunting Terintegrasi di Wilayah Pesisir',
      sectorId: kesSector.id,
      targetCompletion: 'Desember 2026',
      background: 'Pantai Cermin mencatat angka stunting sebesar 24.3%, tertinggi di kabupaten ini, meskipun merupakan wilayah penghasil ikan laut yang kaya gizi.',
      mainFocus: 'Kurangnya akses air bersih, pola asuh gizi buruk, dan rendahnya tingkat literasi sanitasi warga nelayan pesisir.',
      impact: 'Penurunan indeks pembangunan manusia (IPM) jangka panjang dan rendahnya produktivitas generasi muda di masa depan.',
      urgency: 'Pemerintah Pusat menargetkan prevalensi stunting nasional di bawah 14% pada akhir tahun depan.',
      status: 'ADMINISTRATIVE_REVIEW',
      progress: 15,
      createdById: opdUser.id,
      timeline: [
        { status: 'DRAFT', label: 'Usulan Draf Masalah', date: '10 Agt 2026', actor: 'Bappeda Litbang', isCompleted: true },
        { status: 'SUBMITTED', label: 'KAK Selesai & Diajukan', date: '11 Agt 2026', actor: 'Bappeda Litbang', isCompleted: true },
        { status: 'ADMINISTRATIVE_REVIEW', label: 'Verifikasi Administrasi BRIDA', date: '12 Agt 2026', actor: 'Admin BRIDA', isCompleted: false },
      ],
    },
  });

  const research1 = await prisma.research.upsert({
    where: { problemId: problem1.id },
    update: {},
    create: {
      id: 'RES-2026-001',
      problemId: problem1.id,
      title: 'Analisis Kebijakan & Intervensi Gizi Stunting Terintegrasi Kecamatan Pantai Cermin',
      researchTypeId: evalType.id,
      objective: 'Mengidentifikasi akar hambatan program stunting dan merekomendasikan model intervensi sosial-ekonomi pesisir.',
      researchQuestions: '1. Mengapa konsumsi ikan tinggi tidak berkorelasi dengan penurunan stunting di pesisir?\n2. Bagaimana efektivitas alokasi dana desa untuk sanitasi?',
      scope: 'Kecamatan Pantai Cermin, fokus pada 4 desa nelayan dengan prevalensi stunting tertinggi.',
      expectedOutput: 'Naskah kajian akademis, draf regulasi Bupati tentang intervensi stunting pesisir.',
      expectedOutcome: 'Penurunan prevalensi stunting pesisir menjadi di bawah 15% dalam 2 tahun.',
      successIndicators: 'Jumlah kebijakan stunting yang dievaluasi, terbentuknya tim posyandu pesisir binaan.',
      estimatedBudget: 85000000,
      estimatedDurationMonths: 4,
      createdById: opdUser.id,
    },
  });

  const kak1 = await prisma.kak.upsert({
    where: { researchId: research1.id },
    update: {},
    create: {
      id: 'KAK-2026-001',
      researchId: research1.id,
      dasarPemikiran: 'UU RI No. 36 Tahun 2009 tentang Kesehatan dan Perpres No. 72 Tahun 2021 tentang Percepatan Penurunan Stunting.',
      maksudTujuan: 'Menyediakan policy brief intervensi terpadu bagi Dinas Kesehatan dan Dinas PU.',
      ruangLingkup: 'Survei 150 rumah tangga nelayan, FGD dengan bidan desa, dan uji sampel air bersih.',
      metodologi: 'Kombinasi kuantitatif survei rumah tangga dan kualitatif deskriptif FGD.',
      output: 'Laporan Akhir Kajian Ilmiah, Draf Roadmap Sanitasi Nelayan.',
      outcome: 'Rencana aksi daerah terintegrasi stunting pesisir.',
      indikatorKinerja: 'Tingkat akurasi data stunting 95%, kepuasan OPD pengguna riset.',
      jadwalPelaksanaan: 'Agustus - November 2026',
      penutup: 'Kerangka acuan ini disusun untuk menjadi pedoman pelaksanaan kerja mitra pelaksana riset.',
    },
  });

  // Check if RAB items exist
  const existingRabs = await prisma.rabItem.findMany({ where: { kakId: kak1.id } });
  if (existingRabs.length === 0) {
    await prisma.rabItem.createMany({
      data: [
        { kakId: kak1.id, description: 'Honor Peneliti Utama', volume: 4, unit: 'OB', unitPrice: 5000000, total: 20000000 },
        { kakId: kak1.id, description: 'Honor Asisten Peneliti', volume: 8, unit: 'OB', unitPrice: 3000000, total: 24000000 },
        { kakId: kak1.id, description: 'FGD & Diskusi Pakar', volume: 2, unit: 'Keg', unitPrice: 10000000, total: 20000000 },
        { kakId: kak1.id, description: 'Survei Lapangan Nelayan', volume: 150, unit: 'Responden', unitPrice: 140000, total: 21000000 },
      ],
    });
  }

  // --- PRP-2026-002 (Electric Transport) ---
  const problem2 = await prisma.problem.upsert({
    where: { id: 'PRP-2026-002' },
    update: {},
    create: {
      id: 'PRP-2026-002',
      title: 'Evaluasi Sistem Transportasi Publik Berbasis Listrik untuk Pengurangan Emisi',
      sectorId: lhSector.id,
      targetCompletion: 'November 2026',
      background: 'Kepadatan lalu lintas perkotaan menyumbang 42% dari total emisi karbon wilayah kabupaten.',
      mainFocus: 'Belum optimalnya konversi armada angkutan umum ke kendaraan listrik dan minimnya infrastruktur stasiun pengisian kendaraan listrik umum (SPKLU).',
      impact: 'Penurunan kualitas udara perkotaan dan peningkatan kasus penyakit pernapasan warga.',
      urgency: 'Target daerah net-zero emission daerah 2030.',
      status: 'OPD_IMPLEMENTING',
      progress: 65,
      createdById: opdUser.id,
      eKatalogUrl: 'https://e-katalog.lkpp.go.id/product/bus-listrik-medium',
      eKatalogDesc: 'PT Mobil Anak Bangsa (MAB) - Bus Listrik MD12-E',
      eKatalogDeadline: new Date('2026-11-30'),
      timeline: [
        { status: 'DRAFT', label: 'Usulan Draf Masalah', date: '01 Agt 2026', actor: 'Bappeda Litbang', isCompleted: true },
        { status: 'SUBMITTED', label: 'KAK Selesai & Diajukan', date: '02 Agt 2026', actor: 'Bappeda Litbang', isCompleted: true },
        { status: 'ADMINISTRATIVE_REVIEW', label: 'Verifikasi Administrasi', date: '03 Agt 2026', actor: 'Admin BRIDA', isCompleted: true },
        { status: 'SUBSTANTIVE_REVIEW', label: 'Review Substansi & Scoring', date: '04 Agt 2026', actor: 'Reviewer BRIDA', isCompleted: true },
        { status: 'APPROVED', label: 'Disetujui Bupati', date: '05 Agt 2026', actor: 'Bupati', isCompleted: true },
        { status: 'EKATALOG_SENT', label: 'E-Katalog Dikirim ke OPD', date: '06 Agt 2026', actor: 'Admin BRIDA', isCompleted: true },
        { status: 'OPD_IMPLEMENTING', label: 'OPD Mulai Implementasi', date: '07 Agt 2026', actor: 'Admin OPD', isCompleted: false },
      ],
      verificationChecklist: {
        documentKOR: true,
        academicDraft: true,
        budgetSheet: true,
        supportingLetters: true,
        isApproved: true,
        notes: 'Dokumen verifikasi lengkap dan sesuai dengan RKPD 2026.',
      },
      substantiveReview: {
        relevansi: 85,
        urgensi: 90,
        novelty: 80,
        feasibility: 85,
        impact: 90,
        alignment: 90,
        totalScore: 87,
        recommendation: 'RECOMMENDED',
        reviewerNotes: 'Kajian ini krusial untuk mendukung komitmen net-zero emission daerah.',
      },
    },
  });

  const research2 = await prisma.research.upsert({
    where: { problemId: problem2.id },
    update: {},
    create: {
      id: 'RES-2026-002',
      problemId: problem2.id,
      title: 'Kajian Kelayakan Koridor Bus Rapid Transit Listrik Daerah',
      researchTypeId: kelayakanType.id,
      objective: 'Menilai kelayakan finansial dan operasional bus listrik perkotaan.',
      researchQuestions: '1. Di mana titik strategis charging depot?\n2. Bagaimana model subsidi tarif bus listrik?',
      scope: 'Koridor Utama Perkotaan Pusat Pemerintahan.',
      expectedOutput: 'Laporan kelayakan rute, spesifikasi teknis bus listrik.',
      expectedOutcome: 'Konversi 30% bus solar ke listrik pada tahun depan.',
      successIndicators: 'Persentase pengurangan CO2, jumlah armada bus beroperasi.',
      estimatedBudget: 120000000,
      estimatedDurationMonths: 5,
      createdById: opdUser.id,
    },
  });

  await prisma.kak.upsert({
    where: { researchId: research2.id },
    update: {},
    create: {
      id: 'KAK-2026-002',
      researchId: research2.id,
      dasarPemikiran: 'Perpres No. 55 Tahun 2019 tentang Percepatan Program Kendaraan Bermotor Listrik.',
      maksudTujuan: 'Memberikan dasar keputusan investasi pengadaan bus listrik.',
      ruangLingkup: 'Survei penumpang, analisis infrastruktur PLN, simulasi biaya.',
      metodologi: 'Analisis finansial Benefit-Cost Ratio (BCR) dan NPV.',
      output: 'Dokumen Studi Kelayakan Operasional, Draf Peta Koridor BRT.',
      outcome: 'Investasi bus listrik daerah terarah.',
      indikatorKinerja: 'Laporan disahkan Dishub.',
      jadwalPelaksanaan: 'Agustus - November 2026',
      penutup: 'Studi kelayakan diselesaikan tepat waktu.',
    },
  });

  // Check if logs exist
  const existingLogs = await prisma.opdMonitoringLog.findMany({ where: { problemId: problem2.id } });
  if (existingLogs.length === 0) {
    await prisma.opdMonitoringLog.create({
      data: {
        problemId: problem2.id,
        progress: 65,
        description: 'Melakukan pembelian/konversi e-Katalog LKPP untuk unit bus medium, sedang penyusunan stasiun PLN.',
        evidenceFile: 'kwitansi_pembelian_ekatalog.pdf',
      },
    });
  }

  // --- PRP-2026-003 (Pariwisata berkelanjutan) ---
  const problem3 = await prisma.problem.upsert({
    where: { id: 'PRP-2026-003' },
    update: {},
    create: {
      id: 'PRP-2026-003',
      title: 'Strategi Pengembangan Destinasi Wisata Bahari Berkelanjutan',
      sectorId: kesSector.id,
      targetCompletion: 'Oktober 2026',
      background: 'Potensi wisata bahari belum termaksimalkan dan mengalami kerusakan terumbu karang akibat sampah plastik.',
      mainFocus: 'Minimnya zonasi konservasi, rendahnya retribusi daerah dari sektor pariwisata, dan keterbatasan fasilitas MCK higienis.',
      impact: 'Pendapatan asli daerah (PAD) wisata menurun dan rusaknya ekosistem laut.',
      urgency: 'Wisatawan asing berkurang drastis di musim liburan lalu.',
      status: 'RECOMMENDATION_APPROVED',
      progress: 100,
      createdById: opdUser.id,
      eKatalogUrl: 'https://e-katalog.lkpp.go.id/product/alat-kebersihan-pantai',
      eKatalogDesc: 'PT Clean Beach Indonesia - Beach Sweeper Model B-50',
      eKatalogDeadline: new Date('2026-10-15'),
      timeline: [
        { status: 'DRAFT', label: 'Usulan Draf Masalah', date: '15 Jul 2026', actor: 'Dinas Pariwisata', isCompleted: true },
        { status: 'SUBMITTED', label: 'KAK Selesai & Diajukan', date: '16 Jul 2026', actor: 'Dinas Pariwisata', isCompleted: true },
        { status: 'ADMINISTRATIVE_REVIEW', label: 'Verifikasi Administrasi', date: '17 Jul 2026', actor: 'Admin BRIDA', isCompleted: true },
        { status: 'SUBSTANTIVE_REVIEW', label: 'Review Substansi & Scoring', date: '18 Jul 2026', actor: 'Reviewer BRIDA', isCompleted: true },
        { status: 'APPROVED', label: 'Disetujui Bupati', date: '20 Jul 2026', actor: 'Bupati', isCompleted: true },
        { status: 'EKATALOG_SENT', label: 'E-Katalog Dikirim ke OPD', date: '21 Jul 2026', actor: 'Admin BRIDA', isCompleted: true },
        { status: 'OPD_IMPLEMENTING', label: 'OPD Mulai Implementasi', date: '22 Jul 2026', actor: 'Admin OPD', isCompleted: true },
        { status: 'OPD_REPORTED', label: 'Laporan Akhir Diserahkan', date: '10 Agt 2026', actor: 'Admin OPD', isCompleted: true },
        { status: 'RECOMMENDATION_PENDING', label: 'Draf Rekomendasi Diajukan', date: '12 Agt 2026', actor: 'Admin BRIDA', isCompleted: true },
        { status: 'RECOMMENDATION_APPROVED', label: 'Rekomendasi Bupati Disahkan', date: '15 Agt 2026', actor: 'Bupati', isCompleted: true },
      ],
      verificationChecklist: {
        documentKOR: true,
        academicDraft: true,
        budgetSheet: true,
        supportingLetters: true,
        isApproved: true,
        notes: 'Sesuai dengan target pariwisata bahari daerah.',
      },
      substantiveReview: {
        relevansi: 90,
        urgensi: 88,
        novelty: 85,
        feasibility: 90,
        impact: 95,
        alignment: 90,
        totalScore: 91,
        recommendation: 'RECOMMENDED',
        reviewerNotes: 'PAD daerah berpotensi naik hingga 25% dengan penataan konservasi.',
      },
      policyBrief: {
        status: 'APPROVED',
        policyIssue: 'Pengembangan retribusi wisata terintegrasi dan konservasi terumbu karang.',
        evidence: 'Prevalensi tumpukan sampah pantai mencapai 5 ton per minggu.',
        researchFindings: 'Wisatawan bersedia membayar tiket konservasi jika fasilitas toilet bersih dan terumbu karang terjaga.',
        implication: 'Diperlukan Perda tentang retribusi konservasi pantai.',
        policyOptions: 'Opsi A: Kerjasama pihak ketiga. Opsi B: Tiket masuk terusan digital.',
        preferredOption: 'Opsi B: Tiket masuk terusan digital terintegrasi aplikasi pembayaran daerah.',
        implementationConsideration: 'Dibutuhkan sosialisasi kelompok sadar wisata (Pokdarwis) lokal.',
        updatedAt: '2026-08-14T09:00:00.000Z',
      },
      recommendation: {
        recommendationTitle: 'Surat Keputusan Bupati tentang Pengelolaan Wisata Bahari Terpadu',
        issue: 'Pencemaran pantai dan kurangnya PAD retribusi.',
        evidence: 'Tumpukan sampah plastik merusak karang.',
        recommendation: 'Penerapan aplikasi e-Ticketing konservasi dan pembersihan pantai menggunakan Beach Sweeper.',
        responsibleOPD: 'Dinas Pariwisata',
        priority: 'HIGH',
        expectedImpact: 'Meningkatkan PAD dan mengurangi tumpukan sampah pantai hingga 80%.',
        targetDate: '2026-12-31',
        status: 'APPROVED',
        approvedAt: '2026-08-15T10:00:00.000Z',
      },
    },
  });

  const research3 = await prisma.research.upsert({
    where: { problemId: problem3.id },
    update: {},
    create: {
      id: 'RES-2026-003',
      problemId: problem3.id,
      title: 'Strategi Tata Kelola Pariwisata Pantai Cemara Indah',
      researchTypeId: kelayakanType.id,
      objective: 'Menyusun model zonasi pariwisata bahari berkelanjutan.',
      researchQuestions: '1. Bagaimana efektivitas pengelolaan Pokdarwis?\n2. Bagaimana rancangan sistem e-ticketing?',
      scope: 'Pantai Cemara Indah.',
      expectedOutput: 'Roadmap pengembangan Pokdarwis and spesifikasi e-Ticketing.',
      expectedOutcome: 'Tersedianya Perbup retribusi konservasi pantai.',
      successIndicators: 'Kelayakan operasional e-Ticketing disetujui.',
      estimatedBudget: 95000000,
      estimatedDurationMonths: 3,
      createdById: opdUser.id,
    },
  });

  await prisma.kak.upsert({
    where: { researchId: research3.id },
    update: {},
    create: {
      id: 'KAK-2026-003',
      researchId: research3.id,
      dasarPemikiran: 'UU Pariwisata No 10 Tahun 2009.',
      maksudTujuan: 'Meningkatkan PAD pariwisata bahari.',
      ruangLingkup: 'Zonasi kawasan konservasi terumbu karang.',
      metodologi: 'FGD dengan pelaku usaha pariwisata dan Pokdarwis.',
      output: 'Dokumen Rencana Zonasi Bahari.',
      outcome: 'Zonasi wisata tertata rapi.',
      indikatorKinerja: '100% pelaku usaha menyetujui e-Ticketing.',
      jadwalPelaksanaan: 'Juli - Oktober 2026',
      penutup: 'Riset selesai dengan hasil sangat baik.',
    },
  });

  // Check if reports exist
  const existingReports = await prisma.opdReport.findMany({ where: { problemId: problem3.id } });
  if (existingReports.length === 0) {
    await prisma.opdReport.create({
      data: {
        problemId: problem3.id,
        title: 'Laporan Akhir Hasil Uji Coba e-Ticketing & Pembelian Beach Sweeper',
        findings: 'Pembelian Beach Sweeper e-Katalog berhasil mereduksi sampah pantai hingga 75%. Sistem e-Ticketing siap diluncurkan.',
        obstacles: 'Jaringan internet tidak stabil di beberapa titik pos pantai.',
        opdRecommendation: 'BRIDA merekomendasikan pemasangan pemancar sinyal (Dinas Kominfo).',
        attachments: ['laporan_akhir_cemara_indah.pdf'],
        isApproved: true,
      },
    });
  }

  console.log(`- Seeded 3 proposals with nested researches & KAKs.`);
};

module.exports = { seedProposals };
