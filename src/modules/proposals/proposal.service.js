const prisma = require('../../config/prisma');

class ProposalService {
  /**
   * Helper untuk membuat nomor/kode unik usulan (format: PROP-YYYY-XXX)
   */
  async generateProposalCode() {
    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.proposal.count({
      where: {
        code: {
          startsWith: `PROP-${currentYear}-`,
        },
      },
    });

    const nextNumber = String(countThisYear + 1).padStart(3, '0');
    return `PROP-${currentYear}-${nextNumber}`;
  }

  /**
   * Mengambil daftar usulan berdasarkan role dan filter
   */
  async getAllProposals(user, query = {}) {
    const { search, status, category, opdId, source, page = 1, limit = 50 } = query;
    const where = {};

    // Jika role OPD, otomatis hanya usulan OPD miliknya
    if (user.role === 'OPD') {
      if (!user.opdId) {
        return { proposals: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
      }
      where.opdId = user.opdId;
    } else if (opdId) {
      where.opdId = opdId;
    }

    if (source) {
      where.source = source;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { problemStatement: { contains: search, mode: 'insensitive' } },
        { strategicImpact: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, proposals] = await Promise.all([
      prisma.proposal.count({ where }),
      prisma.proposal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
              email: true,
              phone: true,
            },
          },
          supportingDocuments: {
            select: {
              id: true,
              name: true,
              size: true,
              uploadDate: true,
              fileUrl: true,
            },
          },
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
          revisions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              returnedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          followUp: {
            include: {
              submittedBy: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          researchStudy: {
            include: {
              kakDocument: true,
              rkaItems: true,
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
   * Mengambil detail satu usulan
   */
  async getProposalById(id, user) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
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
        revisions: {
          orderBy: { createdAt: 'desc' },
          include: {
            returnedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        followUp: {
          include: {
            submittedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        scoring: true,
        kepalaApproval: true,
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

    // Role OPD hanya boleh melihat usulan miliknya
    if (user.role === 'OPD' && proposal.opdId !== user.opdId) {
      const error = new Error('Akses ditolak. Anda tidak berhak melihat usulan instansi lain.');
      error.statusCode = 403;
      throw error;
    }

    return proposal;
  }

  /**
   * Membuat usulan baru (bisa disimpan DRAFT, PENDING, atau jika BRIDA_ANALYSIS langsung APPROVED / siap KAK)
   */
  async createProposal(user, data) {
    if (user.role === 'OPD' && !user.opdId) {
      const error = new Error('Akun OPD Anda belum terhubung dengan instansi OPD manapun.');
      error.statusCode = 400;
      throw error;
    }

    const targetOpdId = user.role === 'OPD' ? user.opdId : data.opdId || user.opdId;
    if (!targetOpdId) {
      const error = new Error('Instansi OPD target/pemohon wajib disertakan.');
      error.statusCode = 400;
      throw error;
    }

    // Tentukan sumber inisiasi: jika OPD maka pasti OPD_PROPOSAL, jika BRIDA bisa BRIDA_ANALYSIS
    const source = user.role === 'OPD' ? 'OPD_PROPOSAL' : data.source || 'BRIDA_ANALYSIS';

    const code = await this.generateProposalCode();

    // Logika Status:
    // 1. Jika Draft -> DRAFT
    // 2. Jika Bukan Draft dan dari BRIDA_ANALYSIS -> APPROVED (langsung siap KAK, by-pass tahap validasi)
    // 3. Jika Bukan Draft dan dari OPD_PROPOSAL -> PENDING (masuk ke antrean Validasi BRIDA)
    let status = 'PENDING';
    if (data.isDraft) {
      status = 'DRAFT';
    } else if (source === 'BRIDA_ANALYSIS') {
      status = 'APPROVED';
    }

    const submittedAt = data.isDraft ? null : new Date();

    const proposal = await prisma.proposal.create({
      data: {
        code,
        source,
        title: data.title.trim(),
        category: data.category.trim(),
        problemStatement: data.problemStatement.trim(),
        urgencyReason: data.urgencyReason ? data.urgencyReason.trim() : '',
        strategicImpact: data.strategicImpact ? data.strategicImpact.trim() : null,
        urgencyLevel: data.urgencyLevel || 'TINGGI',
        expectedOutput: data.expectedOutput || 'REKOMENDASI_KEBIJAKAN',
        estimatedBudget: data.estimatedBudget !== undefined && data.estimatedBudget !== null && data.estimatedBudget !== '' ? data.estimatedBudget : null,
        estimatedDuration: data.estimatedDuration !== undefined && data.estimatedDuration !== null && data.estimatedDuration !== '' ? Number(data.estimatedDuration) : 3,
        status,
        submittedAt,
        opdId: targetOpdId,
        createdById: user.id,
        supportingDocuments: {
          create: (data.supportingDocuments || []).map((doc) => ({
            name: doc.name,
            size: doc.size,
            fileUrl: doc.fileUrl || null,
          })),
        },
      },
      include: {
        opd: true,
        supportingDocuments: true,
      },
    });

    return proposal;
  }

  /**
   * Mengedit data usulan (hanya boleh jika status DRAFT atau RETURNED)
   */
  async updateProposal(id, user, data) {
    const existing = await this.getProposalById(id, user);

    if (!['DRAFT', 'RETURNED'].includes(existing.status)) {
      const error = new Error(`Usulan dengan status "${existing.status}" tidak dapat diedit.`);
      error.statusCode = 400;
      throw error;
    }

    const updateData = {
      ...(data.title && { title: data.title.trim() }),
      ...(data.category && { category: data.category.trim() }),
      ...(data.problemStatement && { problemStatement: data.problemStatement.trim() }),
      ...(data.urgencyReason && { urgencyReason: data.urgencyReason.trim() }),
      ...(data.strategicImpact !== undefined && { strategicImpact: data.strategicImpact ? data.strategicImpact.trim() : null }),
      ...(data.urgencyLevel && { urgencyLevel: data.urgencyLevel }),
      ...(data.expectedOutput && { expectedOutput: data.expectedOutput }),
      ...(data.estimatedBudget !== undefined && { estimatedBudget: data.estimatedBudget !== null && data.estimatedBudget !== '' ? Number(data.estimatedBudget) : null }),
      ...(data.estimatedDuration !== undefined && { estimatedDuration: data.estimatedDuration ? Number(data.estimatedDuration) : 3 }),
    };

    if (data.isSubmit) {
      updateData.status = 'PENDING';
      updateData.submittedAt = new Date();
    }

    // Jika ada update dokumen pendukung
    if (data.supportingDocuments && Array.isArray(data.supportingDocuments)) {
      await prisma.proposalDocument.deleteMany({
        where: { proposalId: id },
      });

      updateData.supportingDocuments = {
        create: data.supportingDocuments.map((doc) => ({
          name: doc.name,
          size: doc.size,
          fileUrl: doc.fileUrl || null,
        })),
      };
    }

    return await prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        opd: true,
        supportingDocuments: true,
        revisions: true,
      },
    });
  }

  /**
   * Mengirim usulan ke antrean verifikasi BRIDA (DRAFT/RETURNED -> PENDING)
   */
  async submitProposal(id, user) {
    const existing = await this.getProposalById(id, user);

    if (!['DRAFT', 'RETURNED'].includes(existing.status)) {
      const error = new Error(`Hanya usulan berstatus DRAFT atau RETURNED yang dapat dikirim ke BRIDA.`);
      error.statusCode = 400;
      throw error;
    }

    return await prisma.proposal.update({
      where: { id },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
      },
      include: {
        opd: true,
        supportingDocuments: true,
        revisions: true,
      },
    });
  }

  /**
   * Menghapus usulan (hanya boleh jika status DRAFT)
   */
  async deleteProposal(id, user) {
    const existing = await this.getProposalById(id, user);

    if (existing.status !== 'DRAFT') {
      const error = new Error('Hanya usulan berstatus DRAFT yang dapat dihapus.');
      error.statusCode = 400;
      throw error;
    }

    await prisma.proposal.delete({
      where: { id },
    });

    return { message: 'Usulan draft berhasil dihapus.' };
  }

  /**
   * GATEKEEPER: Inbox Usulan Masuk Menunggu Verifikasi (Khusus Usulan OPD / OPD_PROPOSAL)
   */
  async getVerificationInbox(query = {}) {
    return await this.getAllProposals(
      { role: 'ADMIN_BRIDA' },
      { ...query, source: 'OPD_PROPOSAL', status: query.status || 'PENDING' }
    );
  }

  /**
   * GATEKEEPER: Verifikasi & Validasi 5 Pilar Usulan OPD (Khusus ADMIN_BRIDA)
   * decision: 
   *   - 'PASS' (Lolos Validasi -> Status APPROVED, Siap Masuk Tahap 3 KAK)
   *   - 'RETURN' (Kembalikan ke OPD untuk revisi -> Status RETURNED)
   *   - 'REJECT' (Tolak Usulan -> Status REJECTED)
   */
  async verifyProposal(id, adminUser, data) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { opd: true },
    });

    if (!proposal) {
      const error = new Error('Usulan riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (proposal.status !== 'PENDING') {
      const error = new Error(`Usulan ini tidak berada dalam antrean validasi (Status saat ini: ${proposal.status}).`);
      error.statusCode = 400;
      throw error;
    }

    const verificationPayload = {
      isProblemClear: data.isProblemClear ?? true,
      isNotDuplicated: data.isNotDuplicated ?? true,
      isUrgencyRelevant: data.isUrgencyRelevant ?? true,
      isStrategicAligned: data.isStrategicAligned ?? true,
      isResearchFeasible: data.isResearchFeasible ?? true,
      isBudgetFeasible: data.isBudgetFeasible ?? true,
      isDataAdequate: data.isDataAdequate ?? true,
      decision: data.decision,
      verificationNotes: data.verificationNotes.trim(),
      verifiedById: adminUser.id,
      verifiedAt: new Date(),
    };

    if (data.decision === 'PASS') {
      // 1. Loloskan Validasi -> Status langsung menjadi APPROVED (Siap KAK)
      await prisma.adminVerification.upsert({
        where: { proposalId: id },
        create: {
          proposalId: id,
          ...verificationPayload,
        },
        update: {
          ...verificationPayload,
        },
      });

      const updated = await prisma.proposal.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: {
          opd: true,
          adminVerification: true,
          supportingDocuments: true,
        },
      });

      return {
        message: 'Usulan OPD dinyatakan Lolos Validasi BRIDA dan siap diteruskan ke Tahap 3 (Penyusunan KAK).',
        proposal: updated,
      };
    } else if (data.decision === 'RETURN') {
      // 2. Kembalikan ke OPD -> Status menjadi RETURNED
      await prisma.proposalRevision.create({
        data: {
          proposalId: id,
          revisionNotes: data.verificationNotes.trim(),
          returnedById: adminUser.id,
        },
      });

      await prisma.adminVerification.upsert({
        where: { proposalId: id },
        create: {
          proposalId: id,
          ...verificationPayload,
        },
        update: {
          ...verificationPayload,
        },
      });

      const updated = await prisma.proposal.update({
        where: { id },
        data: { status: 'RETURNED' },
        include: {
          opd: true,
          revisions: { orderBy: { createdAt: 'desc' }, take: 1 },
          supportingDocuments: true,
        },
      });

      return {
        message: 'Usulan berhasil dikembalikan ke OPD dengan catatan revisi perbaikan.',
        proposal: updated,
      };
    } else {
      // 3. Tolak Usulan -> Status menjadi REJECTED
      await prisma.adminVerification.upsert({
        where: { proposalId: id },
        create: {
          proposalId: id,
          ...verificationPayload,
        },
        update: {
          ...verificationPayload,
        },
      });

      const updated = await prisma.proposal.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: {
          opd: true,
          adminVerification: true,
          supportingDocuments: true,
        },
      });

      return {
        message: 'Usulan OPD telah ditolak dengan catatan alasan ketidaklayakan.',
        proposal: updated,
      };
    }
  }

  /**
   * Mengirimkan laporan tindak lanjut / pemanfaatan rekomendasi oleh OPD
   */
  async submitFollowUp(id, user, data) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { opd: true },
    });

    if (!proposal) {
      const error = new Error('Usulan riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'OPD' && proposal.opdId !== user.opdId) {
      const error = new Error('Akses ditolak. Anda hanya dapat melaporkan tindak lanjut usulan instansi Anda.');
      error.statusCode = 403;
      throw error;
    }

    const followUp = await prisma.proposalFollowUp.upsert({
      where: { proposalId: id },
      create: {
        proposalId: id,
        utilizationType: data.utilizationType,
        utilizationSummary: data.utilizationSummary,
        satisfactionRating: data.satisfactionRating,
        feedbackNotes: data.feedbackNotes || null,
        submittedById: user.id,
      },
      update: {
        utilizationType: data.utilizationType,
        utilizationSummary: data.utilizationSummary,
        satisfactionRating: data.satisfactionRating,
        feedbackNotes: data.feedbackNotes || null,
        submittedById: user.id,
        submittedAt: new Date(),
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return followUp;
  }
}

module.exports = new ProposalService();
