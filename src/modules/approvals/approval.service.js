const prisma = require('../../config/prisma');

class ApprovalService {
  /**
   * Mengambil antrean usulan yang menunggu persetujuan (SCORED) atau riwayat keputusan (APPROVED / REJECTED)
   */
  async getApprovalInbox(query = {}) {
    const { search, status, researchField, opdId, page = 1, limit = 50 } = query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    } else if (!status) {
      // Default: Usulan yang sedang menunggu approval (SCORED)
      where.status = 'SCORED';
    } else if (status === 'ALL') {
      where.status = {
        in: ['SCORED', 'APPROVED', 'REJECTED'],
      };
    }

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
          kepalaApproval: {
            include: {
              approvedBy: {
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
   * Mengambil detail lengkap usulan untuk review cepat Kepala BRIDA
   */
  async getApprovalDetail(proposalId) {
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
        kepalaApproval: {
          include: {
            approvedBy: {
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

    return proposal;
  }

  /**
   * Memberikan keputusan persetujuan final (Khusus KEPALA_BRIDA)
   */
  async submitApproval(proposalId, kepalaUser, data) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { scoring: true },
    });

    if (!proposal) {
      const error = new Error('Usulan riset tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (!['SCORED', 'APPROVED', 'REJECTED'].includes(proposal.status)) {
      const error = new Error(
        `Keputusan persetujuan hanya dapat diberikan pada usulan yang telah selesai dinilai (Status saat ini: ${proposal.status}).`
      );
      error.statusCode = 400;
      throw error;
    }

    let newProposalStatus = 'APPROVED';
    let message = 'Usulan riset berhasil disetujui.';

    if (data.decision === 'APPROVED') {
      newProposalStatus = 'APPROVED';
      message = 'Usulan riset disetujui dan siap masuk ke tahap penyusunan KAK & RKA riset.';
    } else if (data.decision === 'REJECTED') {
      newProposalStatus = 'REJECTED';
      message = 'Usulan riset telah ditolak oleh Kepala BRIDA.';
    } else if (data.decision === 'REVISION_REQUIRED') {
      newProposalStatus = 'IN_REVIEW';
      message = 'Usulan riset dikembalikan ke tim evaluator BRIDA untuk dikaji ulang.';
    }

    // Default pagu definitif dan skema jika tidak diisi saat disetujui
    const approvedBudget =
      data.approvedBudget !== undefined
        ? data.approvedBudget
        : proposal.estimatedBudget;
    const fiscalYear =
      data.fiscalYear || new Date().getFullYear();
    const finalExecutionScheme =
      data.finalExecutionScheme || proposal.scoring?.executionScheme || 'SWAKELOLA';

    // Upsert KepalaApproval record
    const approval = await prisma.kepalaApproval.upsert({
      where: { proposalId },
      create: {
        proposalId,
        decision: data.decision,
        approvedBudget: data.decision === 'APPROVED' ? approvedBudget : null,
        fiscalYear: data.decision === 'APPROVED' ? fiscalYear : null,
        finalExecutionScheme: data.decision === 'APPROVED' ? finalExecutionScheme : null,
        notes: data.notes ? data.notes.trim() : null,
        approvedById: kepalaUser.id,
        approvedAt: new Date(),
      },
      update: {
        decision: data.decision,
        approvedBudget: data.decision === 'APPROVED' ? approvedBudget : null,
        fiscalYear: data.decision === 'APPROVED' ? fiscalYear : null,
        finalExecutionScheme: data.decision === 'APPROVED' ? finalExecutionScheme : null,
        notes: data.notes ? data.notes.trim() : null,
        approvedById: kepalaUser.id,
        approvedAt: new Date(),
      },
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update status proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: newProposalStatus,
      },
      include: {
        opd: true,
        scoring: true,
        kepalaApproval: true,
      },
    });

    return {
      message,
      approval,
      proposal: updatedProposal,
    };
  }
}

module.exports = new ApprovalService();
