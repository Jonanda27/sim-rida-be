const prisma = require('../../config/prisma');

class StudyService {
  /**
   * Mengambil daftar seluruh kajian riset aktif
   */
  async getAllStudies(query = {}) {
    const { search, status, fiscalYear, executionScheme, opdId, page = 1, limit = 50 } = query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (fiscalYear) {
      where.fiscalYear = Number(fiscalYear);
    }

    if (executionScheme) {
      where.executionScheme = executionScheme;
    }

    if (opdId) {
      where.proposal = { opdId };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { proposal: { code: { contains: search, mode: 'insensitive' } } },
        { proposal: { opd: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, studies] = await Promise.all([
      prisma.researchStudy.count({ where }),
      prisma.researchStudy.findMany({
        where,
        skip,
        take,
        orderBy: [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
        include: {
          proposal: {
            select: {
              id: true,
              code: true,
              title: true,
              category: true,
              status: true,
              opd: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          kakDocument: {
            select: {
              id: true,
              status: true,
              durationMonths: true,
              finalizedAt: true,
            },
          },
          rkaItems: {
            select: {
              id: true,
              category: true,
              totalPrice: true,
            },
          },
          teamMembers: {
            select: {
              id: true,
              name: true,
              role: true,
              institution: true,
            },
          },
        },
      }),
    ]);

    // Format ringkasan data rka & tim
    const formattedStudies = studies.map((study) => {
      const totalRkaBudget = study.rkaItems.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0
      );
      return {
        ...study,
        totalRkaBudget,
        teamCount: study.teamMembers.length,
        hasKak: !!study.kakDocument,
        kakStatus: study.kakDocument?.status || 'NOT_STARTED',
      };
    });

    return {
      studies: formattedStudies,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Mengambil daftar usulan berstatus APPROVED yang siap diinisiasi menjadi kajian
   */
  async getApprovedProposals(query = {}) {
    const { search } = query;
    const where = {
      status: 'APPROVED',
      researchStudy: null, // Belum diinisiasi
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        opd: true,
        scoring: true,
        kepalaApproval: {
          include: {
            approvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return proposals;
  }

  /**
   * Menginisiasi usulan APPROVED menjadi Kajian Riset Aktif (ResearchStudy)
   */
  async initializeStudy(proposalId, adminUser, data = {}) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        kepalaApproval: true,
        scoring: true,
        researchStudy: true,
      },
    });

    if (!proposal) {
      const error = new Error('Usulan riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (proposal.status !== 'APPROVED') {
      const error = new Error(
        `Hanya usulan yang telah disetujui Kepala BRIDA (status: APPROVED) yang dapat diinisiasi menjadi kajian riset (Status saat ini: ${proposal.status}).`
      );
      error.statusCode = 400;
      throw error;
    }

    if (proposal.researchStudy) {
      const error = new Error('Usulan ini telah diinisiasi menjadi kajian riset sebelumnya.');
      error.statusCode = 400;
      throw error;
    }

    const allocatedBudget =
      proposal.kepalaApproval?.approvedBudget || proposal.estimatedBudget || 0;
    const fiscalYear =
      proposal.kepalaApproval?.fiscalYear || new Date().getFullYear();
    const executionScheme =
      proposal.kepalaApproval?.finalExecutionScheme ||
      proposal.scoring?.executionScheme ||
      'SWAKELOLA';

    // Buat ResearchStudy dan default draf KAK awal
    const study = await prisma.researchStudy.create({
      data: {
        proposalId,
        title: proposal.title,
        fiscalYear,
        allocatedBudget,
        executionScheme,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'PLANNING',
        createdById: adminUser.id,
        kakDocument: {
          create: {
            background: proposal.problemStatement + '\n\nUrgensi: ' + proposal.urgencyReason,
            objectives: `Mengkaji dan merumuskan solusi atas permasalahan: ${proposal.title}`,
            scopeAndMethodology: 'Survei data lapangan, Focus Group Discussion (FGD), analisis dokumen kebijakan, dan penyusunan rekomendasi akhir.',
            targetOutput: `Dokumen ${proposal.expectedOutput.replace(/_/g, ' ')} & Rekomendasi Kebijakan untuk Perangkat Daerah.`,
            durationMonths: 3,
            status: 'DRAFT',
          },
        },
      },
      include: {
        proposal: {
          include: { opd: true },
        },
        kakDocument: true,
        rkaItems: true,
        teamMembers: true,
      },
    });

    // Update status usulan menjadi IN_PROGRESS
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'IN_PROGRESS' },
    });

    return study;
  }

  /**
   * Mengambil detail lengkap kajian riset (KAK, RKA, Tim Peneliti, Usulan)
   */
  async getStudyById(id) {
    const study = await prisma.researchStudy.findUnique({
      where: { id },
      include: {
        proposal: {
          include: {
            opd: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                nip: true,
                email: true,
              },
            },
            adminVerification: true,
            scoring: true,
            kepalaApproval: {
              include: {
                approvedBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        kakDocument: true,
        rkaItems: {
          orderBy: { createdAt: 'asc' },
        },
        teamMembers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const totalRkaBudget = study.rkaItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    const remainingBudget = Number(study.allocatedBudget) - totalRkaBudget;

    return {
      ...study,
      totalRkaBudget,
      remainingBudget,
      isBudgetExceeded: remainingBudget < 0,
    };
  }

  /**
   * Menyimpan / memperbarui dokumen Kerangka Acuan Kerja (KAK) digital
   */
  async saveKak(studyId, data) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const isFinal = data.status === 'FINAL';

    const kak = await prisma.kakDocument.upsert({
      where: { studyId },
      create: {
        studyId,
        background: data.background.trim(),
        objectives: data.objectives.trim(),
        scopeAndMethodology: data.scopeAndMethodology.trim(),
        targetOutput: data.targetOutput.trim(),
        durationMonths: data.durationMonths || 3,
        status: data.status || 'DRAFT',
        finalizedAt: isFinal ? new Date() : null,
      },
      update: {
        background: data.background.trim(),
        objectives: data.objectives.trim(),
        scopeAndMethodology: data.scopeAndMethodology.trim(),
        targetOutput: data.targetOutput.trim(),
        durationMonths: data.durationMonths || 3,
        status: data.status || 'DRAFT',
        finalizedAt: isFinal ? new Date() : null,
      },
    });

    return kak;
  }

  /**
   * Menyimpan daftar rincian RKA belanja riset (dengan validasi pagu)
   */
  async saveRka(studyId, { items }) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    // Hitung total harga semua item
    const formattedItems = items.map((item) => {
      const totalPrice = Number(item.volume) * Number(item.unitPrice);
      return {
        studyId,
        category: item.category.trim(),
        description: item.description.trim(),
        volume: Number(item.volume),
        unit: item.unit.trim(),
        unitPrice: Number(item.unitPrice),
        totalPrice,
      };
    });

    const totalCalculated = formattedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Validasi apakah melebihi pagu yang dialokasikan
    if (totalCalculated > Number(study.allocatedBudget)) {
      const error = new Error(
        `Total anggaran rincian RKA (Rp ${totalCalculated.toLocaleString('id-ID')}) melebihi pagu definitif yang dialokasikan (Rp ${Number(study.allocatedBudget).toLocaleString('id-ID')}).`
      );
      error.statusCode = 400;
      throw error;
    }

    // Ganti data lama dengan data baru dalam transaksi
    await prisma.$transaction([
      prisma.rkaItem.deleteMany({ where: { studyId } }),
      prisma.rkaItem.createMany({ data: formattedItems }),
    ]);

    const updatedItems = await prisma.rkaItem.findMany({
      where: { studyId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      totalRkaBudget: totalCalculated,
      allocatedBudget: Number(study.allocatedBudget),
      remainingBudget: Number(study.allocatedBudget) - totalCalculated,
      items: updatedItems,
    };
  }

  /**
   * Menyimpan susunan tim peneliti / pelaksana riset
   */
  async saveTeam(studyId, { members }) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const formattedMembers = members.map((member) => ({
      studyId,
      name: member.name.trim(),
      role: member.role.trim(),
      institution: member.institution.trim(),
      phone: member.phone ? member.phone.trim() : null,
      email: member.email ? member.email.trim() : null,
    }));

    await prisma.$transaction([
      prisma.researchTeamMember.deleteMany({ where: { studyId } }),
      prisma.researchTeamMember.createMany({ data: formattedMembers }),
    ]);

    const updatedMembers = await prisma.researchTeamMember.findMany({
      where: { studyId },
      orderBy: { createdAt: 'asc' },
    });

    return updatedMembers;
  }

  /**
   * Mengubah status pelaksanaan kajian riset (PLANNING -> IN_PROGRESS -> COMPLETED)
   */
  async updateStudyStatus(studyId, { status }) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.researchStudy.update({
      where: { id: studyId },
      data: { status },
      include: {
        proposal: true,
        kakDocument: true,
        rkaItems: true,
        teamMembers: true,
      },
    });

    // Jika status kajian diubah menjadi COMPLETED, update juga status proposal
    if (status === 'COMPLETED') {
      await prisma.proposal.update({
        where: { id: study.proposalId },
        data: { status: 'COMPLETED' },
      });
    }

    return updated;
  }
}

module.exports = new StudyService();
