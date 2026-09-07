const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database SIM-RIDA...');

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

  // 2. Seed Master Data OPD
  const opdBrida = await prisma.opd.create({
    data: {
      code: 'BRIDA',
      name: 'Badan Riset dan Inovasi Daerah (BRIDA)',
      category: 'Badan Daerah',
      email: 'brida@slemankab.go.id',
      phone: '0274-868405',
      address: 'Jl. Parasamya No. 1, Beran, Tridadi, Sleman',
      isActive: true,
    },
  });

  const opdBappeda = await prisma.opd.create({
    data: {
      code: 'BAPPEDA',
      name: 'Badan Perencanaan Pembangunan Daerah (BAPPEDA)',
      category: 'Badan Daerah',
      email: 'bappeda@slemankab.go.id',
      phone: '0274-868512',
      address: 'Kompleks Pemda Sleman, Jl. Parasamya No. 1, Sleman',
      isActive: true,
    },
  });

  const opdDinkes = await prisma.opd.create({
    data: {
      code: 'DINKES',
      name: 'Dinas Kesehatan (DINKES)',
      category: 'Dinas Daerah',
      email: 'dinkes@slemankab.go.id',
      phone: '0274-868409',
      address: 'Jl. KRT Pringgodiningrat No. 11, Beran, Sleman',
      isActive: true,
    },
  });

  const opdDiskominfo = await prisma.opd.create({
    data: {
      code: 'DISKOMINFO',
      name: 'Dinas Komunikasi dan Informatika (DISKOMINFO)',
      category: 'Dinas Daerah',
      email: 'diskominfo@slemankab.go.id',
      phone: '0274-868934',
      address: 'Jl. Parasamya No. 2, Beran, Tridadi, Sleman',
      isActive: true,
    },
  });

  const opdDisdik = await prisma.opd.create({
    data: {
      code: 'DISDIK',
      name: 'Dinas Pendidikan (DISDIK)',
      category: 'Dinas Daerah',
      email: 'disdik@slemankab.go.id',
      phone: '0274-868512',
      address: 'Jl. Parasamya No. 1, Beran, Sleman',
      isActive: true,
    },
  });

  const opdDlh = await prisma.opd.create({
    data: {
      code: 'DLH',
      name: 'Dinas Lingkungan Hidup (DLH)',
      category: 'Dinas Daerah',
      email: 'dlh@slemankab.go.id',
      phone: '0274-868900',
      address: 'Jl. Magelang Km. 10, Tridadi, Sleman',
      isActive: true,
    },
  });

  console.log('✅ Master data OPD berhasil dibuat.');

  // 3. Hash Password default: password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 4. Seed Akun Pengguna Sesuai 3 Role Aktif
  
  // ROLE 1: ADMIN_BRIDA
  const adminBrida = await prisma.user.create({
    data: {
      name: 'Admin Litbang BRIDA Kab. Sleman',
      nip: '198503152010011002',
      email: 'admin@simrida.local',
      password: hashedPassword,
      phone: '081234567890',
      role: 'ADMIN_BRIDA',
      isActive: true,
      opdId: opdBrida.id,
    },
  });

  // ROLE 2: KEPALA_BRIDA
  const kepalaBrida = await prisma.user.create({
    data: {
      name: 'Dr. H. Bambang Priyanto, M.Si (Kepala BRIDA)',
      nip: '197304121998031001',
      email: 'kepala@simrida.local',
      password: hashedPassword,
      phone: '081298765432',
      role: 'KEPALA_BRIDA',
      isActive: true,
      opdId: opdBrida.id,
    },
  });

  // ROLE 3: OPD
  const userBappeda = await prisma.user.create({
    data: {
      name: 'Staf Litbang BAPPEDA Sleman',
      nip: '198807202012012004',
      email: 'opd.bappeda@slemankab.go.id',
      password: hashedPassword,
      phone: '081345678901',
      role: 'OPD',
      isActive: true,
      opdId: opdBappeda.id,
    },
  });

  const userDinkes = await prisma.user.create({
    data: {
      name: 'Subbag Program & Data Dinkes Sleman',
      nip: '199001152014022001',
      email: 'opd.dinkes@slemankab.go.id',
      password: hashedPassword,
      phone: '081398765432',
      role: 'OPD',
      isActive: true,
      opdId: opdDinkes.id,
    },
  });

  const userDiskominfo = await prisma.user.create({
    data: {
      name: 'Bidang E-Gov Diskominfo Sleman',
      nip: '199205102016031003',
      email: 'opd.diskominfo@slemankab.go.id',
      password: hashedPassword,
      phone: '081223344556',
      role: 'OPD',
      isActive: true,
      opdId: opdDiskominfo.id,
    },
  });

  console.log('✅ Akun pengguna multi-role berhasil di-seed.');

  // 5. Seed Usulan Riset OPD (Sample Proposals)

  // Usulan 1: PENDING (Masuk ke Inbox Verifikasi Gatekeeper BRIDA)
  const propPending = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-001',
      title: 'Kajian Efektivitas Penyaluran Bantuan Sosial Terpadu Berbasis Geospasial',
      category: 'Sosial Budaya & Kesejahteraan Masyarakat',
      problemStatement: 'Terdapat anomali data penerima bantuan sosial di tingkat kalurahan di mana 18.4% alokasi tidak tepat sasaran akibat keterlambatan pembaruan DTKS.',
      urgencyReason: 'Perlu formulasi algoritma matching spasial dan verifikasi faktual agar alokasi APBD TA 2027 tepat sasaran dan mengurangi kemiskinan ekstrem.',
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
            name: 'Data_DTKS_Sleman_Q2_2026.xlsx',
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

  // Usulan 2: RETURNED (Dikembalikan oleh Gatekeeper ke OPD Dinkes untuk Revisi)
  const propReturned = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-002',
      title: 'Evaluasi Integrasi Layanan Primer Puskesmas dalam Penanganan Stunting',
      category: 'Sosial Budaya & Kesejahteraan Masyarakat',
      problemStatement: 'Prevalensi stunting di 3 kapanewon masih berada di atas 14%, intervensi gizi terpadu antar posyandu dan puskesmas belum sinkron.',
      urgencyReason: 'Diperlukan SOP integrasi posyandu-puskesmas sebelum evaluasi target Renstra Dinkes akhir tahun 2026.',
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
            name: 'Laporan_Cakupan_Gizi_Balita_2025.pdf',
            size: '2.8 MB',
          },
        ],
      },
      revisions: {
        create: {
          revisionNotes: 'Mohon lengkapi data sebaran prevalensi per lokus kalurahan prioritas dan rincian target intervensi yang diharapkan agar reviewer dapat menilai ruang lingkup kajian.',
          returnedById: adminBrida.id,
        },
      },
    },
  });

  // Usulan 3: IN_REVIEW (Telah Lolos Verifikasi Gatekeeper, Siap untuk Scoring)
  const propInReview = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-003',
      title: 'Studi Kelayakan Implementasi Sistem Smart Water Management untuk Irigasi Pertanian',
      category: 'Inovasi Daerah & Teknologi',
      problemStatement: 'Efisiensi distribusi air irigasi di wilayah barat Sleman menurun 27% pada musim kemarau karena kebocoran saluran sekunder dan pengaturan pintu air manual.',
      urgencyReason: 'Mendukung ketahanan pangan daerah dan mitigasi dampak anomali iklim tahun 2026-2027.',
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
            name: 'Peta_Jaringan_Irigasi_Sleman_2026.pdf',
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
          verificationNotes: 'Uraian masalah dan urgensi lapangan sangat jelas, selaras dengan prioritas ketahanan pangan RPJMD. Berkas lolos verifikasi administrasi untuk diteruskan ke kajian scoring teknis.',
          verifiedById: adminBrida.id,
          verifiedAt: new Date('2026-09-03T14:20:00Z'),
        },
      },
    },
  });

  // Usulan 4: DRAFT (Disimpan oleh OPD Diskominfo)
  const propDraft = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-004',
      title: 'Analisis Kesiapan Transformasi Digital Keamanan Informasi Smart City Sleman',
      category: 'Tata Kelola Pemerintahan & Pelayanan Publik',
      problemStatement: 'Peningkatan integrasi layanan publik digital membutuhkan penguatan tata kelola CSIRT dan sertifikasi ISO 27001.',
      urgencyReason: 'Kebutuhan audit keamanan siber sebelum implementasi Super-App Pemkab Sleman.',
      urgencyLevel: 'SEDANG',
      expectedOutput: 'NASKAH_AKADEMIK',
      estimatedBudget: 50000000,
      status: 'DRAFT',
      opdId: opdDiskominfo.id,
      createdById: userDiskominfo.id,
    },
  });

  // Usulan 5: SCORED (Telah Dinilai & Diberi Skor, Menunggu Approval Kepala BRIDA)
  const propScored = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-005',
      title: 'Strategi Akselerasi Penurunan Kemiskinan Ekstrem melalui Intervensi Program Padat Karya',
      category: 'Sosial Budaya & Kesejahteraan Masyarakat',
      problemStatement: 'Kantong kemiskinan ekstrem di 5 kalurahan masih mencatatkan angka 7.8%, program bantuan konvensional belum menciptakan kemandirian ekonomi keluarga pra-sejahtera.',
      urgencyReason: 'Target nasional dan RPJMD mengharuskan 0% kemiskinan ekstrem pada tahun 2027.',
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
            name: 'Peta_Sebaran_Kemiskinan_Ekstrem_2026.pdf',
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
          evaluationNotes: 'Riset sangat mendesak dan relevan dengan visi RPJMD Sleman. Disarankan menggunakan skema Swakelola Tipe I bekerja sama dengan tim peneliti internal BRIDA dan Bappeda.',
          evaluatorId: adminBrida.id,
          evaluatedAt: new Date('2026-08-25T14:30:00Z'),
        },
      },
    },
  });

  // Usulan 6: APPROVED (Telah Disetujui Kepala BRIDA, Siap Masuk Manajemen Kajian KAK/RKA)
  const propApproved = await prisma.proposal.create({
    data: {
      code: 'PROP-2026-006',
      title: 'Kajian Pengembangan Pariwisata Berkelanjutan Berbasis Desa Wisata Heritage di Kawasan Lereng Merapi',
      category: 'Ekonomi & Pembangunan',
      problemStatement: 'Potensi wisata budaya dan alam di lereng Merapi belum terintegrasi dalam jejaring paket wisata tematik, memicu kesenjangan pendapatan antar kalurahan wisata.',
      urgencyReason: 'Mendukung pemulihan ekonomi kawasan rawan bencana dan diversifikasi mata pencaharian warga pasca erupsi.',
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
            name: 'Masterplan_Kawasan_Merapi_2025.pdf',
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
          evaluationNotes: 'Riset bernilai strategis tinggi untuk masterplan kepariwisataan Sleman 2026-2030.',
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
          notes: 'Disetujui untuk dilaksanakan pada TA 2026 dengan pagu definitif Rp 105.000.000 melalui kemitraan Pusat Studi Pariwisata UGM. Tim segera menyusun KAK dan RKA.',
          approvedById: kepalaBrida.id,
          approvedAt: new Date('2026-08-18T15:00:00Z'),
        },
      },
    },
  });

  // 6. Seed Kajian Riset Aktif (ResearchStudy) untuk usulan yang sudah APPROVED (PROP-2026-006)
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
          background: 'Kawasan lereng Merapi memiliki 12 desa wisata yang tumbuh organik pasca erupsi 2010. Namun, integrasi tata kelola antar kalurahan wisata masih lemah sehingga terjadi disparitas kunjungan.',
          objectives: 'Menyusun dokumen masterplan dan rekomendasi kebijakan standarisasi paket wisata heritage terpadu lereng Merapi Sleman.',
          scopeAndMethodology: 'Survei komprehensif ke 12 kalurahan wisata, Focus Group Discussion (FGD) bersama pelaku pariwisata, analisis daya dukung lingkungan (carrying capacity), dan perumusan matriks kebijakan.',
          targetOutput: 'Dokumen Masterplan Pengembangan Pariwisata Heritage Berkelanjutan & Draft Naskah Kebijakan Bupati Sleman.',
          durationMonths: 4,
          status: 'FINAL',
          finalizedAt: new Date('2026-08-25T10:00:00Z'),
        },
      },
      rkaItems: {
        create: [
          {
            category: 'Honorarium Pakar & Tenaga Ahli',
            description: 'Honorarium Tenaga Ahli Utama Kebijakan Pariwisata (4 Bulan)',
            volume: 4,
            unit: 'OB',
            unitPrice: 8000000,
            totalPrice: 32000000,
          },
          {
            category: 'Honorarium Pakar & Tenaga Ahli',
            description: 'Honorarium Peneliti Pendamping Sosial Ekonomi (4 Bulan)',
            volume: 4,
            unit: 'OB',
            unitPrice: 5000000,
            totalPrice: 20000000,
          },
          {
            category: 'Belanja Survei & Pengumpulan Data Lapangan',
            description: 'Biaya Survei Lapangan & Transpor Enumerator ke 12 Kalurahan',
            volume: 24,
            unit: 'OH',
            unitPrice: 500000,
            totalPrice: 12000000,
          },
          {
            category: 'FGD & Konsultasi Publik',
            description: 'Penyelenggaraan FGD Stakeholder Pariwisata & OPD Terkait (2 Kali)',
            volume: 2,
            unit: 'Paket',
            unitPrice: 10500000,
            totalPrice: 21000000,
          },
          {
            category: 'Pelaporan & Publikasi',
            description: 'Penyusunan, Penggandaan Laporan Akhir & Policy Brief Eksklusif',
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
            name: 'Prof. Dr. Ir. Heddy Shri Ahimsa-Putra, M.A.',
            role: 'Ketua Tim Peneliti / Tenaga Ahli Utama',
            institution: 'Pusat Studi Pariwisata UGM',
            phone: '08122718290',
            email: 'heddy.ahimsa@ugm.ac.id',
          },
          {
            name: 'Dra. Retno Wulandari, M.Sc',
            role: 'Peneliti Bidang Sosial Budaya & Kelembagaan',
            institution: 'Pusat Studi Kebudayaan UGM',
            phone: '08139281726',
            email: 'retno.wulandari@ugm.ac.id',
          },
          {
            name: 'Kurniawan Prasetyo, S.Sos., M.P.A.',
            role: 'Peneliti Pendamping Internal BRIDA',
            institution: 'BRIDA Kab. Sleman',
            phone: '08112345678',
            email: 'kurniawan@slemankab.go.id',
          },
        ],
      },
    },
  });

  // 7. Seed Naskah Rekomendasi Kebijakan (PolicyRecommendation) untuk study1
  const rec1 = await prisma.policyRecommendation.create({
    data: {
      code: 'REK-2026-001',
      studyId: study1.id,
      title: 'Rekomendasi Strategis Tata Kelola Terpadu Klaster Desa Wisata Heritage Lereng Merapi Sleman Berbasis Keberlanjutan Lingkungan',
      executiveSummary: 'Kajian merekomendasikan pembentukan Badan Otorita Pengelola Desa Wisata Heritage Lintas Kalurahan di Lereng Merapi guna mengatasi disparitas kunjungan dan melindungi daya dukung lingkungan kawasan rawan bencana.',
      keyFindings: '1. Kesenjangan pendapatan antar kalurahan wisata mencapai 60% akibat persaingan tarif tidak sehat.\n2. Belum ada SOP mitigasi evakuasi terpadu berbasis pariwisata saat aktivitas vulkanik Merapi meningkat.\n3. Standardisasi homestay dan sertifikasi pemandu wisata lokal masih di bawah 30%.',
      policyActions: '1. JANGKA PENDEK (0-6 Bulan): Penerbitan Surat Edaran Bupati tentang Standarisasi Tarif Paket Wisata Edukasi Heritage.\n2. JANGKA MENENGAH (6-18 Bulan): Penyusunan Rancangan Peraturan Bupati (Perbup) tentang Pembentukan Klaster Desa Wisata Heritage Lereng Merapi Terpadu.\n3. JANGKA PANJANG: Alokasi Bantuan Keuangan Khusus (BKK) Kalurahan berbasis indikator pariwisata berkelanjutan.',
      targetPolicyType: 'DRAFT_PERBUP',
      impactLevel: 'STRATEGIS_DAERAH',
      targetOpdNames: 'Dinas Pariwisata, BAPPEDA, BPBD, Dinas Kebudayaan, Dinas Lingkungan Hidup',
      status: 'FINALIZED',
      createdById: adminBrida.id,
      signedById: kepalaBrida.id,
      signedAt: new Date('2026-09-02T11:00:00Z'),
    },
  });

  // 8. Seed DigitalSignatureLog untuk rec1
  const sig1 = await prisma.digitalSignatureLog.create({
    data: {
      certificateNumber: 'DS-2026-0001',
      documentType: 'POLICY_RECOMMENDATION',
      documentId: rec1.id,
      documentTitle: rec1.title,
      documentCode: rec1.code,
      signerId: kepalaBrida.id,
      signerName: kepalaBrida.name,
      signerNip: kepalaBrida.nip,
      signerRole: 'Kepala Badan Riset dan Inovasi Daerah (BRIDA) Kab. Sleman',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a29f8644b9a6549a',
      verificationUrl: '/verify-signature/DS-2026-0001',
      status: 'VALID',
      notes: 'Disahkan secara resmi oleh Kepala BRIDA Kab. Sleman untuk diteruskan kepada Bupati Sleman dan Dinas Terkait.',
      signedAt: new Date('2026-09-02T11:00:00Z'),
    },
  });

  console.log('✅ Sample usulan riset berhasil di-seed:');
  console.log(`   - [${propPending.status}] ${propPending.code} : ${propPending.title}`);
  console.log(`   - [${propReturned.status}] ${propReturned.code} : ${propReturned.title}`);
  console.log(`   - [${propInReview.status}] ${propInReview.code} : ${propInReview.title}`);
  console.log(`   - [${propDraft.status}] ${propDraft.code} : ${propDraft.title}`);
  console.log(`   - [${propScored.status}] ${propScored.code} : ${propScored.title}`);
  console.log(`   - [${propApproved.status}] ${propApproved.code} : ${propApproved.title}`);
  console.log(`✅ Sample Kajian Riset Aktif berhasil di-seed: [${study1.status}] ${study1.title} (Pagu: Rp ${study1.allocatedBudget})`);
  console.log(`✅ Sample Rekomendasi Kebijakan berhasil di-seed: [${rec1.status}] ${rec1.code} : ${rec1.title}`);
  console.log(`✅ Sample Sertifikat TTE Digital berhasil di-seed: [${sig1.status}] ${sig1.certificateNumber} (${sig1.signerName})`);

  console.log('🌱 Seeding database SIM-RIDA selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
