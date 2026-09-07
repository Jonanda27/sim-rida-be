const prisma = require('../../config/prisma');

class ScoringService {
  /**
   * Helper untuk menghitung total skor tertimbang dan kategori prioritas
   */
  calculateWeightedScore({ visionAlignmentScore, urgencyScore, budgetFeasibilityScore, dataReadinessScore }) {
    // Formula: (Visi * 0.30) + (Urgensi * 0.30) + (Anggaran * 0.20) + (Kesiapan Data * 0.20)
    const rawScore =
      visionAlignmentScore * 0.3 +
      urgencyScore * 0.3 +
      budgetFeasibilityScore * 0.2 +
      dataReadinessScore * 0.2;

    const totalWeightedScore = Math.round(rawScore * 10) / 10; // 1 desimal

    let priorityCategory = 'TIDAK_PRIORITAS';
    if (totalWeightedScore >= 80) {
      priorityCategory = 'PRIORITAS_UTAMA';
    } else if (totalWeightedScore >= 65) {
      priorityCategory = 'PRIORITAS_KEDUA';
    }

    return { totalWeightedScore, priorityCategory };
  }

  /**
   * Mengambil antrean usulan yang siap dinilai atau sudah dinilai (IN_REVIEW / SCORED)
   */
  async getScoringQueue(query = {}) {
    const { search, status, researchField, opdId, page = 1, limit = 50 } = query;
    const where = {
      status: {
        in: status ? [status] : ['IN_REVIEW', 'SCORED'],
      },
    };

    if (opdId) {
      where.opdId = opdId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { problemStatement: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (researchField) {
      where.scoring = {
        researchField: researchField,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, proposals] = await Promise.all([
      prisma.proposal.count({ where }),
      prisma.proposal.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          opd: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              nip: true,
            },
          },
          adminVerification: {
            select: {
              decision: true,
              verificationNotes: true,
              verifiedAt: true,
              verifiedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          scoring: {
            include: {
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
          supportingDocuments: {
            select: {
              id: true,
              name: true,
              size: true,
            },
          },
        },
      }),
    ]);

    return {
      proposals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Mengambil detail usulan dan instrumen penilaian scoring
   */
  async getScoringDetail(proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        opd: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
            phone: true,
          },
        },
        supportingDocuments: true,
        adminVerification: {
          include: {
            verifiedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        scoring: {
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      const error = new Error('Usulan riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (!['IN_REVIEW', 'SCORED', 'APPROVED', 'REJECTED'].includes(proposal.status)) {
      const error = new Error(
        `Usulan berstatus "${proposal.status}" belum/tidak dapat dinilai pada modul scoring (harus lolos verifikasi administrasi terlebih dahulu).`
      );
      error.statusCode = 400;
      throw error;
    }

    return proposal;
  }

  /**
   * Memproses dan menyimpan formulasi scoring digital (Khusus ADMIN_BRIDA)
   */
  async submitScoring(proposalId, evaluatorUser, data) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      const error = new Error('Usulan riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (!['IN_REVIEW', 'SCORED'].includes(proposal.status)) {
      const error = new Error(
        `Penilaian scoring hanya dapat dilakukan pada usulan berstatus IN_REVIEW atau SCORED (Status saat ini: ${proposal.status}).`
      );
      error.statusCode = 400;
      throw error;
    }

    // Kalkulasi skor tertimbang & penentuan kategori prioritas
    const { totalWeightedScore, priorityCategory } = this.calculateWeightedScore({
      visionAlignmentScore: data.visionAlignmentScore,
      urgencyScore: data.urgencyScore,
      budgetFeasibilityScore: data.budgetFeasibilityScore,
      dataReadinessScore: data.dataReadinessScore,
    });

    // Simpan / update record proposalScoring
    const scoring = await prisma.proposalScoring.upsert({
      where: { proposalId },
      create: {
        proposalId,
        visionAlignmentScore: data.visionAlignmentScore,
        urgencyScore: data.urgencyScore,
        budgetFeasibilityScore: data.budgetFeasibilityScore,
        dataReadinessScore: data.dataReadinessScore,
        totalWeightedScore,
        researchField: data.researchField,
        executionScheme: data.executionScheme,
        priorityCategory,
        evaluationNotes: data.evaluationNotes.trim(),
        evaluatorId: evaluatorUser.id,
        evaluatedAt: new Date(),
      },
      update: {
        visionAlignmentScore: data.visionAlignmentScore,
        urgencyScore: data.urgencyScore,
        budgetFeasibilityScore: data.budgetFeasibilityScore,
        dataReadinessScore: data.dataReadinessScore,
        totalWeightedScore,
        researchField: data.researchField,
        executionScheme: data.executionScheme,
        priorityCategory,
        evaluationNotes: data.evaluationNotes.trim(),
        evaluatorId: evaluatorUser.id,
        evaluatedAt: new Date(),
      },
      include: {
        evaluator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Ubah status usulan menjadi SCORED (siap untuk review & approval Kepala BRIDA)
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'SCORED',
      },
      include: {
        opd: true,
        scoring: true,
      },
    });

    return {
      message: 'Penelaahan & scoring usulan berhasil disimpan. Usulan siap diajukan untuk persetujuan Kepala BRIDA.',
      scoring,
      proposal: updatedProposal,
    };
  }
}

module.exports = new ScoringService();
