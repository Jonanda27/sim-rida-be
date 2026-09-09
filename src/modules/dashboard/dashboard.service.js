const prisma = require('../../config/prisma');

class DashboardService {
  /**
   * Executive Dashboard untuk Kepala BRIDA
   */
  async getKepalaDashboard() {
    const [
      totalProposals,
      pendingApprovalCount,
      activeStudiesCount,
      completedStudiesCount,
      finalizedRecCount,
      submittedRecCount,
      finalKakCount,
      proposalsByStatus,
      proposalsByUrgency,
      allScorings,
      allStudies,
      topOpds,
      latestApproved,
    ] = await Promise.all([
      // Total Usulan
      prisma.proposal.count(),
      // Usulan yang sudah discoring dan menunggu persetujuan Kepala BRIDA
      prisma.proposal.count({ where: { status: 'SCORED' } }),
      // Kajian aktif
      prisma.researchStudy.count({ where: { status: 'IN_PROGRESS' } }),
      // Kajian selesai
      prisma.researchStudy.count({ where: { status: 'COMPLETED' } }),
      // Rekomendasi yang telah disahkan
      prisma.policyRecommendation.count({ where: { status: 'FINALIZED' } }),
      // Rekomendasi menunggu TTE
      prisma.policyRecommendation.count({ where: { status: 'SUBMITTED' } }),
      // KAK Final menunggu pengesahan
      prisma.kakDocument.count({ where: { status: 'FINAL' } }),
      // Group status usulan
      prisma.proposal.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Group urgensi usulan
      prisma.proposal.groupBy({
        by: ['urgencyLevel'],
        _count: { id: true },
      }),
      // Seluruh data scoring untuk sebaran bidang riset
      prisma.proposalScoring.findMany({
        select: {
          researchField: true,
          executionScheme: true,
          priorityCategory: true,
          totalWeightedScore: true,
        },
      }),
      // Data kajian riset & RKA untuk ringkasan anggaran
      prisma.researchStudy.findMany({
        include: {
          rkaItems: true,
        },
      }),
      // OPD paling aktif mengajukan usulan
      prisma.opd.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          _count: {
            select: { proposals: true },
          },
        },
        orderBy: {
          proposals: { _count: 'desc' },
        },
        take: 5,
      }),
      // Usulan yang baru disetujui / diputuskan
      prisma.kepalaApproval.findMany({
        take: 5,
        orderBy: { approvedAt: 'desc' },
        include: {
          proposal: {
            include: { opd: true },
          },
          approvedBy: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    // 1. Perhitungan Anggaran (Pagu Definitif vs Realisasi RKA Belanja)
    let totalAllocatedBudget = 0;
    let totalRkaBudget = 0;
    const schemeBudgetMap = {
      SWAKELOLA: { count: 0, budget: 0 },
      PENUNJUKAN_LANGSUNG: { count: 0, budget: 0 },
      E_KATALOG: { count: 0, budget: 0 },
      TENDER: { count: 0, budget: 0 },
    };

    allStudies.forEach((st) => {
      const allocated = Number(st.allocatedBudget || 0);
      totalAllocatedBudget += allocated;

      if (schemeBudgetMap[st.executionScheme]) {
        schemeBudgetMap[st.executionScheme].count += 1;
        schemeBudgetMap[st.executionScheme].budget += allocated;
      }

      const rkaTotal = st.rkaItems.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      );
      totalRkaBudget += rkaTotal;
    });

    const remainingBudget = totalAllocatedBudget - totalRkaBudget;

    // 2. Sebaran Isu Strategis / Bidang Riset
    const fieldCounts = {
      EKONOMI_PEMBANGUNAN: 0,
      TATA_KELOLA_PEMERINTAHAN: 0,
      SOSIAL_BUDAYA: 0,
      INOVASI_TEKNOLOGI: 0,
    };
    allScorings.forEach((sc) => {
      if (fieldCounts[sc.researchField] !== undefined) {
        fieldCounts[sc.researchField] += 1;
      }
    });

    const totalScored = allScorings.length || 1;
    const researchFieldDistribution = [
      {
        field: 'EKONOMI_PEMBANGUNAN',
        label: 'Ekonomi Pembangunan & Sumber Daya Alam',
        count: fieldCounts.EKONOMI_PEMBANGUNAN,
        percentage: Math.round((fieldCounts.EKONOMI_PEMBANGUNAN / totalScored) * 100),
      },
      {
        field: 'TATA_KELOLA_PEMERINTAHAN',
        label: 'Tata Kelola Pemerintahan & Pelayanan Publik',
        count: fieldCounts.TATA_KELOLA_PEMERINTAHAN,
        percentage: Math.round((fieldCounts.TATA_KELOLA_PEMERINTAHAN / totalScored) * 100),
      },
      {
        field: 'SOSIAL_BUDAYA',
        label: 'Sosial, Kebudayaan & Pengentasan Kemiskinan',
        count: fieldCounts.SOSIAL_BUDAYA,
        percentage: Math.round((fieldCounts.SOSIAL_BUDAYA / totalScored) * 100),
      },
      {
        field: 'INOVASI_TEKNOLOGI',
        label: 'Inovasi, Smart City & Teknologi Informasi',
        count: fieldCounts.INOVASI_TEKNOLOGI,
        percentage: Math.round((fieldCounts.INOVASI_TEKNOLOGI / totalScored) * 100),
      },
    ];

    // 3. Distribusi Status Usulan
    const statusMap = {};
    proposalsByStatus.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    // 4. Data Geospasial (GIS) Riset Wilayah Kabupaten Mimika (Papua Tengah)
    const gisLocations = [
      {
        id: 'gis-1',
        title: 'Kajian Pengembangan Ekowisata Bahari dan Budaya Pesisir Mimika',
        distrik: 'Distrik Mimika Timur & Distrik Jita',
        kapanewon: 'Distrik Mimika Timur & Distrik Jita',
        coordinates: [-4.7231, 136.9125],
        field: 'SOSIAL_BUDAYA',
        status: 'IN_PROGRESS',
        leadAgency: 'Dinas Pariwisata, Kebudayaan, Pemuda dan Olahraga',
        allocatedBudget: 105000000,
      },
      {
        id: 'gis-2',
        title: 'Intervensi Percepatan Penurunan Stunting & Pelayanan Gizi Terpadu',
        distrik: 'Distrik Mimika Baru & Distrik Wania',
        kapanewon: 'Distrik Mimika Baru & Distrik Wania',
        coordinates: [-4.5421, 136.8872],
        field: 'SOSIAL_BUDAYA',
        status: 'SCORED',
        leadAgency: 'Dinas Kesehatan',
        allocatedBudget: 85000000,
      },
      {
        id: 'gis-3',
        title: 'Smart Water Management & Drainase Pertanian Dataran Rendah',
        distrik: 'Distrik Kuala Kencana & Distrik Iwaka',
        kapanewon: 'Distrik Kuala Kencana & Distrik Iwaka',
        coordinates: [-4.4289, 136.8512],
        field: 'INOVASI_TEKNOLOGI',
        status: 'IN_REVIEW',
        leadAgency: 'Dinas Pertanian, Tanaman Pangan & Perkebunan',
        allocatedBudget: 95000000,
      },
      {
        id: 'gis-4',
        title: 'Pemberdayaan Ekonomi Masyarakat Adat Amungme dan Kamoro',
        distrik: 'Distrik Tembagapura & Distrik Kwamki Narama',
        kapanewon: 'Distrik Tembagapura & Distrik Kwamki Narama',
        coordinates: [-4.2612, 137.1145],
        field: 'EKONOMI_PEMBANGUNAN',
        status: 'SCORED',
        leadAgency: 'BAPPEDA Kab. Mimika',
        allocatedBudget: 120000000,
      },
    ];

    return {
      kpis: {
        totalProposals,
        pendingApproval: pendingApprovalCount,
        activeStudies: activeStudiesCount,
        completedStudies: completedStudiesCount,
        finalizedRecommendations: finalizedRecCount,
        pendingTteCount: submittedRecCount + finalKakCount,
      },
      budgetSummary: {
        totalAllocatedBudget,
        totalRkaBudget,
        remainingBudget,
        budgetByExecutionScheme: schemeBudgetMap,
      },
      researchFieldDistribution,
      proposalStatusDistribution: {
        DRAFT: statusMap.DRAFT || 0,
        PENDING: statusMap.PENDING || 0,
        RETURNED: statusMap.RETURNED || 0,
        IN_REVIEW: statusMap.IN_REVIEW || 0,
        SCORED: statusMap.SCORED || 0,
        APPROVED: statusMap.APPROVED || 0,
        REJECTED: statusMap.REJECTED || 0,
        IN_PROGRESS: statusMap.IN_PROGRESS || 0,
        COMPLETED: statusMap.COMPLETED || 0,
      },
      topActiveOpds: topOpds.map((opd) => ({
        id: opd.id,
        code: opd.code,
        name: opd.name,
        proposalCount: opd._count.proposals,
      })),
      recentApprovals: latestApproved,
      gisLocations,
    };
  }

  /**
   * Operational Dashboard untuk Admin BRIDA
   */
  async getAdminDashboard() {
    const [
      verificationPending,
      scoringPending,
      studiesInPlanning,
      draftRecommendations,
      totalProposals,
      totalStudies,
      totalRecommendations,
      totalUsers,
      totalOpds,
      recentProposals,
      recentStudies,
    ] = await Promise.all([
      // Usulan yang menunggu verifikasi gatekeeper
      prisma.proposal.count({ where: { status: 'PENDING' } }),
      // Usulan lolos verifikasi yang siap discoring
      prisma.proposal.count({ where: { status: 'IN_REVIEW' } }),
      // Kajian yang sedang dalam tahap penyusunan KAK/RKA
      prisma.researchStudy.count({ where: { status: 'PLANNING' } }),
      // Rekomendasi yang masih draf
      prisma.policyRecommendation.count({ where: { status: 'DRAFT' } }),
      // Summary Counts
      prisma.proposal.count(),
      prisma.researchStudy.count(),
      prisma.policyRecommendation.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.opd.count({ where: { isActive: true } }),
      // 5 Usulan Masuk Terbaru
      prisma.proposal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          opd: true,
          createdBy: { select: { id: true, name: true } },
          adminVerification: true,
        },
      }),
      // 5 Kajian Riset Terbaru
      prisma.researchStudy.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          proposal: { include: { opd: true } },
          kakDocument: true,
          teamMembers: true,
        },
      }),
    ]);

    return {
      actionQueue: {
        verificationPending,
        scoringPending,
        studiesInPlanning,
        draftRecommendations,
      },
      summaryStats: {
        totalProposals,
        totalStudies,
        totalRecommendations,
        totalUsers,
        totalOpds,
      },
      recentProposals,
      recentStudies,
    };
  }

  /**
   * Proposal & Hasil Riset Dashboard untuk Perangkat Daerah (OPD)
   */
  async getOpdDashboard(opdUser) {
    if (!opdUser.opdId) {
      const error = new Error('Akun Anda belum terasosiasi dengan Perangkat Daerah (OPD).');
      error.statusCode = 400;
      throw error;
    }

    const opd = await prisma.opd.findUnique({
      where: { id: opdUser.opdId },
    });

    if (!opd) {
      const error = new Error('Data instansi OPD tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const [
      proposals,
      publishedRecommendations,
    ] = await Promise.all([
      // Seluruh usulan dari OPD yang bersangkutan
      prisma.proposal.findMany({
        where: { opdId: opd.id },
        orderBy: { createdAt: 'desc' },
        include: {
          adminVerification: true,
          revisions: { orderBy: { createdAt: 'desc' }, take: 1 },
          scoring: true,
          kepalaApproval: true,
          researchStudy: {
            include: {
              kakDocument: true,
              teamMembers: true,
            },
          },
        },
      }),
      // Rekomendasi kebijakan yang diterbitkan untuk atau terkait OPD ini
      prisma.policyRecommendation.findMany({
        where: {
          status: 'FINALIZED',
          OR: [
            { study: { proposal: { opdId: opd.id } } },
            { targetOpdNames: { contains: opd.name, mode: 'insensitive' } },
          ],
        },
        orderBy: { signedAt: 'desc' },
        include: {
          study: {
            select: { id: true, title: true, fiscalYear: true },
          },
          signedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    // Hitung metrik usulan OPD
    let draftCount = 0;
    let pendingVerificationCount = 0;
    let returnedCount = 0;
    let inReviewCount = 0;
    let scoredCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalEstimatedBudget = 0;

    proposals.forEach((p) => {
      totalEstimatedBudget += Number(p.estimatedBudget || 0);

      switch (p.status) {
        case 'DRAFT':
          draftCount++;
          break;
        case 'PENDING':
          pendingVerificationCount++;
          break;
        case 'RETURNED':
          returnedCount++;
          break;
        case 'IN_REVIEW':
          inReviewCount++;
          break;
        case 'SCORED':
          scoredCount++;
          break;
        case 'APPROVED':
        case 'IN_PROGRESS':
        case 'COMPLETED':
          approvedCount++;
          break;
        case 'REJECTED':
          rejectedCount++;
          break;
        default:
          break;
      }
    });

    return {
      opdInfo: {
        id: opd.id,
        code: opd.code,
        name: opd.name,
        category: opd.category,
      },
      kpis: {
        totalProposals: proposals.length,
        draftProposals: draftCount,
        inVerification: pendingVerificationCount,
        returnedForRevision: returnedCount,
        inReview: inReviewCount,
        scored: scoredCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      totalEstimatedBudgetProposed: totalEstimatedBudget,
      proposals,
      publishedRecommendations,
    };
  }
}

module.exports = new DashboardService();
