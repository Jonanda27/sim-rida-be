const prisma = require('../../config/prisma');

class DashboardService {
  /**
   * Executive Dashboard untuk Kepala BRIDA
   */
  async getKepalaDashboard() {
    // Ambil semua dokumen yang sudah sah bertanda tangan TTE
    const existingLogs = await prisma.digitalSignatureLog.findMany({
      where: { status: 'VALID' },
      select: { documentType: true, documentId: true },
    });
    const signedRecIds = existingLogs
      .filter((l) => l.documentType === 'POLICY_RECOMMENDATION')
      .map((l) => l.documentId);
    const signedKakIds = existingLogs
      .filter((l) => l.documentType === 'KAK_DOCUMENT')
      .map((l) => l.documentId);

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
      prisma.policyRecommendation.count({
        where: {
          status: 'SUBMITTED',
          id: { notIn: signedRecIds },
        },
      }),
      // KAK Final menunggu pengesahan TTE
      prisma.kakDocument.count({
        where: {
          status: 'FINAL',
          id: { notIn: signedKakIds },
        },
      }),
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
    // Ambil data kajian riil yang sedang atau telah berjalan di database
    const dbStudies = await prisma.researchStudy.findMany({
      where: {
        status: { in: ['PLANNING', 'IN_PROGRESS', 'COMPLETED'] },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        proposal: {
          include: {
            opd: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            scoring: {
              select: {
                researchField: true,
              },
            },
          },
        },
      },
    });

    // Koordinat distrik representatif di Kabupaten Mimika
    const mimikaDistricts = [
      { distrik: 'Distrik Mimika Baru', coordinates: [-4.5421, 136.8872] },
      { distrik: 'Distrik Kuala Kencana', coordinates: [-4.4289, 136.8512] },
      { distrik: 'Distrik Wania', coordinates: [-4.5600, 136.8900] },
      { distrik: 'Distrik Mimika Timur', coordinates: [-4.7231, 136.9125] },
      { distrik: 'Distrik Iwaka', coordinates: [-4.4800, 136.7900] },
      { distrik: 'Distrik Kwamki Narama', coordinates: [-4.4950, 136.9100] },
      { distrik: 'Distrik Tembagapura', coordinates: [-4.2612, 137.1145] },
      { distrik: 'Distrik Agimuga', coordinates: [-4.6300, 137.2800] },
    ];

    let gisLocations = dbStudies.map((study, idx) => {
      const districtLoc = mimikaDistricts[idx % mimikaDistricts.length];
      return {
        id: study.id,
        title: study.title || study.proposal?.title || 'Kajian Riset BRIDA',
        distrik: districtLoc.distrik,
        kapanewon: districtLoc.distrik,
        coordinates: districtLoc.coordinates,
        field: study.proposal?.scoring?.researchField || study.proposal?.category || 'Kajian Kelitbangan',
        status: study.status,
        leadAgency: study.proposal?.opd?.name || 'Pemerintah Kabupaten Mimika',
        allocatedBudget: Number(study.allocatedBudget || study.proposal?.estimatedBudget || 0),
      };
    });

    // Jika belum ada research study, periksa proposal aktif yang telah disetujui / dinilai
    if (gisLocations.length === 0) {
      const activeProposals = await prisma.proposal.findMany({
        where: { status: { in: ['APPROVED', 'SCORED', 'IN_PROGRESS', 'COMPLETED'] } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { opd: true, scoring: true },
      });

      gisLocations = activeProposals.map((prop, idx) => {
        const districtLoc = mimikaDistricts[idx % mimikaDistricts.length];
        return {
          id: prop.id,
          title: prop.title,
          distrik: districtLoc.distrik,
          kapanewon: districtLoc.distrik,
          coordinates: districtLoc.coordinates,
          field: prop.scoring?.researchField || prop.category || 'Kajian Kelitbangan',
          status: prop.status,
          leadAgency: prop.opd?.name || 'Pemerintah Kabupaten Mimika',
          allocatedBudget: Number(prop.estimatedBudget || 0),
        };
      });
    }

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
