const prisma = require('../../config/prisma');

class RecommendationService {
  /**
   * Helper untuk generate kode rekomendasi: REK-YYYY-XXX
   */
  async generateRecommendationCode() {
    const currentYear = new Date().getFullYear();
    const prefix = `REK-${currentYear}-`;

    const lastRecommendation = await prisma.policyRecommendation.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let sequence = 1;
    if (lastRecommendation && lastRecommendation.code) {
      const parts = lastRecommendation.code.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  /**
   * Mengambil daftar seluruh naskah rekomendasi kebijakan
   */
  async getAllRecommendations(query = {}) {
    const { search, status, impactLevel, targetPolicyType, opdId, page = 1, limit = 50 } = query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (impactLevel) {
      where.impactLevel = impactLevel;
    }

    if (targetPolicyType) {
      where.targetPolicyType = targetPolicyType;
    }

    if (opdId) {
      where.study = {
        proposal: {
          opdId,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { executiveSummary: { contains: search, mode: 'insensitive' } },
        { background: { contains: search, mode: 'insensitive' } },
        { policyRecommendations: { contains: search, mode: 'insensitive' } },
        { conclusion: { contains: search, mode: 'insensitive' } },
        { targetOpdNames: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, recommendations] = await Promise.all([
      prisma.policyRecommendation.count({ where }),
      prisma.policyRecommendation.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          study: {
            include: {
              kakDocument: true,
              workingDocuments: true,
              teamMembers: true,
              proposal: {
                include: { opd: true, supportingDocuments: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, nip: true },
          },
          signedBy: {
            select: { id: true, name: true, nip: true },
          },
        },
      }),
    ]);

    return {
      recommendations,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Mengambil daftar kajian riset yang siap dirumuskan rekomendasinya
   */
  async getAvailableStudies() {
    const studies = await prisma.researchStudy.findMany({
      where: {
        status: {
          in: ['IN_PROGRESS', 'COMPLETED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        proposal: {
          include: {
            opd: true,
          },
        },
        kakDocument: true,
        teamMembers: true,
      },
    });

    return studies;
  }

  /**
   * Mengambil detail rekomendasi kebijakan berdasarkan ID
   */
  async getRecommendationById(id) {
    const recommendation = await prisma.policyRecommendation.findUnique({
      where: { id },
      include: {
        study: {
          include: {
            kakDocument: true,
            workingDocuments: true,
            teamMembers: true,
            proposal: {
              include: {
                opd: true,
                supportingDocuments: true,
                adminVerification: true,
                scoring: true,
                kepalaApproval: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, nip: true },
        },
        signedBy: {
          select: { id: true, name: true, nip: true },
        },
      },
    });

    if (!recommendation) {
      const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    return recommendation;
  }

  /**
   * Membuat draf rekomendasi kebijakan baru (Khusus Admin BRIDA)
   */
  async createRecommendation(adminUser, data) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: data.studyId },
      include: { proposal: { include: { opd: true } } },
    });

    if (!study) {
      const error = new Error('Kajian riset asal tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const code = await this.generateRecommendationCode();
    const background = (data.background || '').trim();
    const policyRecommendations = (data.policyRecommendations || '').trim();
    const conclusion = (data.conclusion || '').trim();
    const correlatedDocs = (data.correlatedDocs || '').trim() || null;

    const recommendation = await prisma.policyRecommendation.create({
      data: {
        code,
        studyId: data.studyId,
        title: data.title.trim(),
        executiveSummary: data.executiveSummary.trim(),
        background,
        policyRecommendations,
        conclusion,
        correlatedDocs,
        targetPolicyType: data.targetPolicyType || 'DRAFT_PERBUP',
        impactLevel: data.impactLevel || 'STRATEGIS_DAERAH',
        targetOpdNames:
          data.targetOpdNames || study.proposal?.opd?.name || 'Perangkat Daerah Terkait',
        status: data.status || 'DRAFT',
        documentUrl: data.documentUrl || null,
        createdById: adminUser.id,
      },
      include: {
        study: {
          include: {
            proposal: {
              include: { opd: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return recommendation;
  }

  /**
   * Mengedit draf rekomendasi kebijakan
   */
  async updateRecommendation(id, data) {
    const recommendation = await prisma.policyRecommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (recommendation.status === 'FINALIZED') {
      const error = new Error('Naskah rekomendasi yang telah disahkan (FINALIZED) tidak dapat diedit kembali.');
      error.statusCode = 400;
      throw error;
    }

    const updateData = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.executiveSummary) updateData.executiveSummary = data.executiveSummary.trim();
    if (data.background !== undefined) updateData.background = data.background.trim();
    if (data.policyRecommendations !== undefined) updateData.policyRecommendations = data.policyRecommendations.trim();
    if (data.conclusion !== undefined) updateData.conclusion = data.conclusion.trim();
    if (data.correlatedDocs !== undefined) updateData.correlatedDocs = data.correlatedDocs ? data.correlatedDocs.trim() : null;
    if (data.targetPolicyType) updateData.targetPolicyType = data.targetPolicyType;
    if (data.impactLevel) updateData.impactLevel = data.impactLevel;
    if (data.targetOpdNames !== undefined) updateData.targetOpdNames = data.targetOpdNames;
    if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;

    const updated = await prisma.policyRecommendation.update({
      where: { id },
      data: updateData,
      include: {
        study: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return updated;
  }

  /**
   * Mengajukan draf rekomendasi ke Kepala BRIDA (DRAFT -> SUBMITTED)
   */
  async submitRecommendation(id) {
    const recommendation = await prisma.policyRecommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (recommendation.status !== 'DRAFT') {
      const error = new Error(`Hanya rekomendasi berstatus DRAFT yang dapat diajukan (Status saat ini: ${recommendation.status}).`);
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.policyRecommendation.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
      },
      include: {
        study: true,
        createdBy: true,
      },
    });

    return updated;
  }

  /**
   * Pengesahan resmi rekomendasi kebijakan oleh Kepala BRIDA (SUBMITTED -> FINALIZED)
   */
  async finalizeRecommendation(id, kepalaUser) {
    const recommendation = await prisma.policyRecommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (recommendation.status === 'FINALIZED') {
      const error = new Error('Naskah rekomendasi kebijakan ini sudah disahkan sebelumnya.');
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.policyRecommendation.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        signedById: kepalaUser.id,
        signedAt: new Date(),
      },
      include: {
        study: {
          include: {
            proposal: {
              include: { opd: true },
            },
          },
        },
        signedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Sinkronisasi status kajian dan usulan menjadi COMPLETED
    if (updated.study) {
      await prisma.researchStudy.update({
        where: { id: updated.study.id },
        data: {
          status: 'COMPLETED',
          endDate: updated.study.endDate || new Date(),
        },
      });

      if (updated.study.proposalId) {
        await prisma.proposal.update({
          where: { id: updated.study.proposalId },
          data: {
            status: 'COMPLETED',
          },
        });
      }
    }

    return updated;
  }

  /**
   * Menghapus draf rekomendasi
   */
  async deleteRecommendation(id) {
    const recommendation = await prisma.policyRecommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (recommendation.status !== 'DRAFT') {
      const error = new Error('Hanya rekomendasi berstatus DRAFT yang dapat dihapus.');
      error.statusCode = 400;
      throw error;
    }

    await prisma.policyRecommendation.delete({
      where: { id },
    });

    return { message: 'Draf rekomendasi kebijakan berhasil dihapus.' };
  }

  /**
   * Menghasilkan formulasi Policy Brief & Rekomendasi Kebijakan menggunakan AI
   * dengan memadukan seluruh dokumen pendukung: Usulan OPD, Dokumen Lampiran, KAK, Tim Riset, Berkas Kerja, & Laporan Akhir
   */
  async generateAiPolicyBrief(studyId, customPrompt = '') {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
      include: {
        proposal: {
          include: {
            opd: true,
            supportingDocuments: true,
            adminVerification: true,
            scoring: true,
            kepalaApproval: true,
          },
        },
        kakDocument: true,
        teamMembers: true,
        workingDocuments: true,
        rkaItems: true,
      },
    });

    if (!study) {
      const error = new Error('Agenda kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const aiPolicyBriefService = require('./recommendation-ai.service');
    const result = await aiPolicyBriefService.generatePolicyBriefDraft(study, customPrompt);
    return result;
  }
}

module.exports = new RecommendationService();
