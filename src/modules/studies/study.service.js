const prisma = require('../../config/prisma');
const aiKakService = require('./ai.service');

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
              source: true,
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
          workingDocuments: true,
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
        kakFinalizedAt: study.kakDocument?.finalizedAt || null,
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
   * Mengambil daftar seluruh usulan yang berstatus APPROVED (siap untuk disusun KAK)
   */
  async getApprovedProposals(query = {}) {
    const { search, opdId, source } = query;
    const where = {
      status: { in: ['APPROVED', 'IN_PROGRESS'] },
    };

    if (opdId) {
      where.opdId = opdId;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { problemStatement: { contains: search, mode: 'insensitive' } },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        opd: true,
        adminVerification: true,
        researchStudy: {
          include: {
            kakDocument: true,
            rkaItems: true,
          },
        },
      },
    });

    return proposals;
  }

  /**
   * AI Assistant: Generate draf KAK & RKA komprehensif dari data usulan
   */
  async generateKakAi(proposalId, customPrompt = '') {
    try {
      console.log(`[AI KAK] Memulai generate KAK untuk Proposal ID: ${proposalId}`);
      let proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { opd: true },
      });

      if (!proposal) {
        // Coba cari tanpa include jika gagal relasi
        proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
        });
      }

      if (!proposal) {
        const error = new Error('Usulan riset tidak ditemukan di database.');
        error.statusCode = 404;
        throw error;
      }

      console.log(`[AI KAK] Berhasil membaca usulan: [${proposal.code}] ${proposal.title}`);
      const aiResult = await aiKakService.generateKakDraft(proposal, customPrompt);
      console.log(`[AI KAK] Berhasil merumuskan draf KAK & RKA untuk: ${proposal.code}`);
      return aiResult;
    } catch (err) {
      console.error(`[AI KAK Error] Gagal generate KAK untuk Proposal ID ${proposalId}:`, err);
      throw err;
    }
  }

  /**
   * Menyimpan / Memperbarui KAK dan RKA terpadu untuk suatu usulan (In-System Live Editor)
   */
  async initOrUpdateKakStudy(proposalId, adminUser, data = {}) {
    try {
      console.log(`[KAK Editor] Menyimpan data KAK & RKA untuk Proposal ID: ${proposalId}, Status: ${data.status || 'DRAFT'}`);
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          researchStudy: {
            include: {
              kakDocument: true,
              rkaItems: true,
            },
          },
        },
      });

      if (!proposal) {
        const error = new Error('Usulan riset tidak ditemukan.');
        error.statusCode = 404;
        throw error;
      }

      const fiscalYear = Number(data.fiscalYear) || new Date().getFullYear();
      let study = proposal.researchStudy;
      const allocatedBudget = study?.allocatedBudget ? Number(study.allocatedBudget) : Number(proposal.estimatedBudget || 100000000);
      const executionScheme = study?.executionScheme || data.executionScheme || 'SWAKELOLA';
      const isFinal = data.status === 'FINAL';

    // 1. Upsert ResearchStudy
    if (!study) {
      study = await prisma.researchStudy.create({
        data: {
          proposalId,
          title: proposal.title,
          fiscalYear,
          allocatedBudget,
          executionScheme,
          status: 'PLANNING',
          createdById: adminUser.id,
        },
      });
    } else {
      study = await prisma.researchStudy.update({
        where: { id: study.id },
        data: {
          title: proposal.title,
          fiscalYear,
          allocatedBudget,
          executionScheme,
        },
      });
    }

    // 2. Upsert KakDocument
    await prisma.kakDocument.upsert({
      where: { studyId: study.id },
      create: {
        studyId: study.id,
        background: data.background ? data.background.trim() : '',
        objectives: data.objectives ? data.objectives.trim() : '',
        scopeAndMethodology: data.scopeAndMethodology ? data.scopeAndMethodology.trim() : '',
        targetOutput: data.targetOutput ? data.targetOutput.trim() : '',
        status: isFinal ? 'FINAL' : (data.status || 'DRAFT'),
        finalizedAt: isFinal ? new Date() : null,
      },
      update: {
        background: data.background !== undefined ? data.background.trim() : undefined,
        objectives: data.objectives !== undefined ? data.objectives.trim() : undefined,
        scopeAndMethodology: data.scopeAndMethodology !== undefined ? data.scopeAndMethodology.trim() : undefined,
        targetOutput: data.targetOutput !== undefined ? data.targetOutput.trim() : undefined,
        status: isFinal ? 'FINAL' : (data.status || 'DRAFT'),
        finalizedAt: isFinal ? new Date() : undefined,
      },
    });

    // 3. Simpan RKA Items jika dikirimkan
    if (data.rkaItems && Array.isArray(data.rkaItems)) {
      const formattedItems = data.rkaItems.map((item) => ({
        studyId: study.id,
        category: item.category ? item.category.trim() : 'Belanja Operasional',
        description: item.description ? item.description.trim() : '',
        volume: Number(item.volume) || 1,
        unit: item.unit ? item.unit.trim() : 'Paket',
        unitPrice: Number(item.unitPrice) || 0,
        totalPrice: (Number(item.volume) || 1) * (Number(item.unitPrice) || 0),
      }));

      await prisma.$transaction([
        prisma.rkaItem.deleteMany({ where: { studyId: study.id } }),
        prisma.rkaItem.createMany({ data: formattedItems }),
      ]);
    }

    return await this.getStudyById(study.id);
  } catch (err) {
    console.error(`[KAK Editor Error] Gagal menyimpan KAK & RKA untuk Proposal ID ${proposalId}:`, err);
    throw err;
  }
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
        workingDocuments: {
          orderBy: { uploadDate: 'desc' },
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
        status: data.status || 'DRAFT',
        finalizedAt: isFinal ? new Date() : null,
      },
      update: {
        background: data.background.trim(),
        objectives: data.objectives.trim(),
        scopeAndMethodology: data.scopeAndMethodology.trim(),
        targetOutput: data.targetOutput.trim(),
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
   * Menyimpan / memperbarui dokumen kerja sama / SK Tim Peneliti (Tahap 4)
   */
  async saveCooperationDoc(studyId, { cooperationDocName, cooperationDocUrl, docName, fileUrl, executionScheme }) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const nameToSave = cooperationDocName || docName;
    const urlToSave = cooperationDocUrl !== undefined ? cooperationDocUrl : fileUrl;

    const dataToUpdate = {
      status: study.status === 'PLANNING' ? 'IN_PROGRESS' : study.status,
    };
    if (nameToSave) dataToUpdate.cooperationDocName = nameToSave.trim();
    if (urlToSave !== undefined) dataToUpdate.cooperationDocUrl = urlToSave;
    if (executionScheme) dataToUpdate.executionScheme = executionScheme;

    await prisma.researchStudy.update({
      where: { id: studyId },
      data: dataToUpdate,
    });

    // Update proposal status to IN_PROGRESS if still APPROVED
    await prisma.proposal.updateMany({
      where: { id: study.proposalId, status: 'APPROVED' },
      data: { status: 'IN_PROGRESS' },
    });

    return await this.getStudyById(studyId);
  }

  /**
   * Menambahkan dokumen kerja lapangan / laporan antara (Tahap 4)
   */
  async addWorkingDocument(studyId, { title, type, fileUrl, fileSize }) {
    const study = await prisma.researchStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      const error = new Error('Kajian riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const doc = await prisma.researchWorkingDocument.create({
      data: {
        studyId,
        title: title?.trim() || 'Dokumen Kerja Riset',
        type: type?.trim() || 'Laporan Antara',
        fileUrl: fileUrl || null,
        fileSize: fileSize || '1.5 MB',
      },
    });

    return doc;
  }

  /**
   * Menghapus dokumen kerja lapangan (Tahap 4)
   */
  async deleteWorkingDocument(studyId, docId) {
    const doc = await prisma.researchWorkingDocument.findFirst({
      where: { id: docId, studyId },
    });

    if (!doc) {
      const error = new Error('Dokumen kerja riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.researchWorkingDocument.delete({
      where: { id: docId },
    });

    return true;
  }

  /**
   * Mengunggah Laporan Akhir Riset & Menandai Riset Selesai (Tahap 4 -> Siap Tahap 5)
   */
  async submitFinalReport(studyId, { reportName, reportUrl, summary }) {
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
      data: {
        finalReportName: reportName?.trim() || 'Laporan_Akhir_Riset.pdf',
        finalReportUrl: reportUrl || null,
        finalReportSummary: summary?.trim() || 'Laporan akhir hasil riset telah rampung dan siap diekstraksi ke draf rekomendasi kebijakan.',
        status: 'COMPLETED',
        endDate: new Date(),
      },
    });

    // Update status proposal menjadi COMPLETED
    await prisma.proposal.update({
      where: { id: study.proposalId },
      data: { status: 'COMPLETED' },
    });

    return await this.getStudyById(studyId);
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
