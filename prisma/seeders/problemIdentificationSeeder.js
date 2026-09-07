const { PrismaClient } = require('@prisma/client');

/**
 * Idempotent seeder for Problem Identifications (MVP Tanpa AI)
 */
async function seedProblemIdentifications(prisma) {
  console.log('Seeding Identifikasi Kebutuhan OPD (MVP Tanpa AI)...');

  // Find BRIDA creator user
  const bridaUser = await prisma.user.findFirst({
    where: {
      role: { in: ['BRIDA', 'ADMIN_BRIDA'] },
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const kepalaUser = await prisma.user.findFirst({
    where: { role: 'KEPALA_BRIDA' },
  });

  if (!bridaUser) {
    console.log('  ⚠️ User BRIDA tidak ditemukan, melewati seed identifikasi kebutuhan.');
    return;
  }

  // Find OPDs
  const dinkes = await prisma.oPD.findFirst({
    where: {
      OR: [{ name: { contains: 'Kesehatan', mode: 'insensitive' } }, { shortName: { contains: 'Dinkes', mode: 'insensitive' } }],
    },
  });

  const disdik = await prisma.oPD.findFirst({
    where: {
      OR: [{ name: { contains: 'Pendidikan', mode: 'insensitive' } }, { shortName: { contains: 'Disdik', mode: 'insensitive' } }],
    },
  });

  const dlh = await prisma.oPD.findFirst({
    where: {
      OR: [{ name: { contains: 'Lingkungan', mode: 'insensitive' } }, { shortName: { contains: 'DLH', mode: 'insensitive' } }],
    },
  });

  // Find baseline documents
  const baselineRpjm = await prisma.externalSource.findFirst({
    where: { code: { contains: 'RPJMD', mode: 'insensitive' } },
    include: { currentVersion: true },
  });

  const baselineRkpd = await prisma.externalSource.findFirst({
    where: { code: { contains: 'RKPD', mode: 'insensitive' } },
    include: { currentVersion: true },
  });

  const sampleIdentifications = [
    {
      code: 'PRI-2026-001',
      title: 'Kebutuhan Penguatan Monitoring Kinerja Internal Dinas Kesehatan',
      year: 2026,
      field: 'Kinerja',
      opdId: dinkes?.id,
      bridaFindings: 'Berdasarkan hasil pemantauan BRIDA, mekanisme monitoring kinerja pegawai dan fasilitas layanan kesehatan tingkat pertama pada OPD belum terintegrasi dan masih dilakukan secara manual dan parsial.',
      currentCondition: 'Pimpinan OPD memperoleh laporan kinerja secara periodik melalui rekapan spreadsheet, namun belum tersedia mekanisme monitoring real-time yang memberikan gambaran capaian indikator SPM kesehatan secara terstruktur.',
      problemStatement: 'Belum tersedianya mekanisme monitoring kinerja yang terintegrasi sehingga pimpinan kesulitan memantau capaian target SPM dan beban kerja nakes secara cepat.',
      impact: 'Pimpinan kesulitan mendeteksi keterlambatan penanganan stunting dan capaian imunisasi secara cepat dan terukur, sehingga evaluasi kinerja triwulanan menjadi kurang optimal.',
      potentialNeed: 'Diperlukan kajian dan perumusan mekanisme monitoring kinerja internal terintegrasi berbasis indikator standar pelayanan minimal.',
      priority: 'HIGH',
      status: 'APPROVED',
      sourceVersionId: baselineRpjm?.currentVersionId || null,
      baselineRelationship: 'Kebutuhan ini selaras dengan Sasaran Misi ke-2 RPJMD Kabupaten Mimika 2025-2029 mengenai peningkatan mutu layanan kesehatan masyarakat.',
      analysisNotes: 'Perlu dikaji lebih lanjut keterpaduan indikator SPM dengan sistem pelaporan Dinkes yang sudah ada.',
      reviewNote: 'Analisis kebutuhan lengkap dan tervalidasi layak untuk ditindaklanjuti menjadi usulan riset.',
    },
    {
      code: 'PRI-2026-002',
      title: 'Kebutuhan Penguatan Tata Kelola Distribusi dan Pemerataan Guru Daerah 3T',
      year: 2026,
      field: 'SDM',
      opdId: disdik?.id,
      bridaFindings: 'Hasil pemantauan lapangan menunjukkan adanya ketimpangan rasio guru dan murid antara sekolah di perkotaan dan wilayah pedalaman/pesisir 3T.',
      currentCondition: 'Distribusi penempatan tenaga pendidik belum berbasis pemetaan beban kerja dan kebutuhan riil per satuan pendidikan di wilayah kepulauan dan pedalaman.',
      problemStatement: 'Belum tersedianya model penataan dan pemerataan tenaga pendidik yang adaptif terhadap karakteristik geografis wilayah.',
      impact: 'Kualitas pembelajaran di sekolah pedalaman tertinggal dan angka putus sekolah di distrik terluar masih tinggi.',
      potentialNeed: 'Diperlukan kajian komprehensif mengenai strategi pemerataan dan retensi tenaga guru di wilayah terpencil.',
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      sourceVersionId: baselineRkpd?.currentVersionId || null,
      baselineRelationship: 'Mendukung target pencapaian Angka Partisipasi Murni (APM) SMP/SMA pada Renstra Dinas Pendidikan dan RKPD 2026.',
      analysisNotes: 'Membutuhkan survei lapangan di 5 distrik pedalaman untuk memvalidasi beban kerja guru.',
      reviewNote: 'Sedang dalam proses telaah substantif oleh Tim Litbang BRIDA.',
    },
    {
      code: 'PRI-2026-003',
      title: 'Kebutuhan Penguatan Sistem Pengelolaan dan Reduksi Sampah Berbasis Komunitas',
      year: 2026,
      field: 'Pelayanan Publik',
      opdId: dlh?.id,
      bridaFindings: 'Volume timbulan sampah rumah tangga di kawasan perkotaan meningkat pesat tanpa diimbangi kapasitas TPS 3R dan pemilahan dari sumber.',
      currentCondition: 'Pengangkutan sampah masih mengandalkan pola kumpul-angkut-buang langsung ke TPA yang sudah mendekati kapasitas maksimal.',
      problemStatement: 'Minimnya partisipasi masyarakat dalam pemilahan sampah mandiri serta keterbatasan skema sirkular ekonomi lokal.',
      impact: 'Usia pakai TPA berkurang drastis dan timbul pencemaran lingkungan di sempadan sungai perkotaan.',
      potentialNeed: 'Diperlukan kajian model pemberdayaan bank sampah unit dan insentif pemilahan sampah berbasis distrik/kelurahan.',
      priority: 'HIGH',
      status: 'APPROVED',
      sourceVersionId: baselineRpjm?.currentVersionId || null,
      baselineRelationship: 'Selaras dengan target Indeks Kualitas Lingkungan Hidup (IKLH) pada RPJMD Kabupaten Mimika 2025-2029.',
      analysisNotes: 'Riset dapat melibatkan studi banding pengelolaan TPS 3R mandiri di daerah percontohan.',
      reviewNote: 'Disetujui untuk disusun menjadi KAK penelitian daerah.',
    },
  ];

  for (const item of sampleIdentifications) {
    const existing = await prisma.problemIdentification.findUnique({
      where: { code: item.code },
    });

    if (existing) {
      // Update existing
      await prisma.problemIdentification.update({
        where: { code: item.code },
        data: {
          title: item.title,
          year: item.year,
          field: item.field,
          opdId: item.opdId,
          bridaFindings: item.bridaFindings,
          currentCondition: item.currentCondition,
          problemStatement: item.problemStatement,
          impact: item.impact,
          potentialNeed: item.potentialNeed,
          priority: item.priority,
          status: item.status,
          sourceVersionId: item.sourceVersionId,
          baselineRelationship: item.baselineRelationship,
          analysisNotes: item.analysisNotes,
          reviewNote: item.reviewNote,
          reviewedById: item.status === 'APPROVED' ? kepalaUser?.id : null,
          reviewedAt: item.status === 'APPROVED' ? new Date() : null,
        },
      });
      console.log(`  ✔ Updated: ${item.code} - ${item.title}`);
    } else {
      // Create new
      const created = await prisma.problemIdentification.create({
        data: {
          code: item.code,
          title: item.title,
          year: item.year,
          field: item.field,
          opdId: item.opdId,
          bridaFindings: item.bridaFindings,
          currentCondition: item.currentCondition,
          problemStatement: item.problemStatement,
          impact: item.impact,
          potentialNeed: item.potentialNeed,
          priority: item.priority,
          status: item.status,
          description: item.problemStatement,
          sourceVersionId: item.sourceVersionId,
          baselineRelationship: item.baselineRelationship,
          analysisNotes: item.analysisNotes,
          reviewNote: item.reviewNote,
          createdById: bridaUser.id,
          reviewedById: item.status === 'APPROVED' ? kepalaUser?.id : null,
          reviewedAt: item.status === 'APPROVED' ? new Date() : null,
        },
      });

      if (item.opdId) {
        await prisma.problemIdentificationOpd.create({
          data: {
            problemIdentificationId: created.id,
            opdId: item.opdId,
            relevanceScore: 0.95,
            reason: 'OPD Pengusul / Target Identifikasi Kebutuhan',
          },
        });
      }

      await prisma.problemIdentificationFinding.create({
        data: {
          problemIdentificationId: created.id,
          title: item.title,
          description: item.bridaFindings,
          evidence: item.potentialNeed,
          confidence: 1.0,
          sourceReference: 'Analisis Pemantauan BRIDA',
        },
      });

      console.log(`  ✔ Created: ${item.code} - ${item.title}`);
    }
  }

  console.log('✔ Identifikasi Kebutuhan OPD berhasil diseed.\n');
}

module.exports = { seedProblemIdentifications };
