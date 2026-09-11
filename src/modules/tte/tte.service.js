const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');

class TteService {
  /**
   * Helper untuk generate nomor sertifikat digital: DS-YYYY-XXXX
   */
  async generateCertificateNumber() {
    const currentYear = new Date().getFullYear();
    const prefix = `DS-${currentYear}-`;

    const lastLog = await prisma.digitalSignatureLog.findFirst({
      where: {
        certificateNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        certificateNumber: 'desc',
      },
      select: {
        certificateNumber: true,
      },
    });

    let sequence = 1;
    if (lastLog && lastLog.certificateNumber) {
      const parts = lastLog.certificateNumber.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Helper untuk membuat hash kriptografis SHA-256 dari konten dokumen
   */
  generateSignatureHash(payload) {
    const rawString = JSON.stringify(payload);
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  /**
   * Mengambil antrean inbox dokumen yang menunggu TTE Kepala BRIDA
   */
  async getTteInbox() {
    // 1. Ambil semua documentId yang sudah memiliki TTE valid di DigitalSignatureLog
    const existingLogs = await prisma.digitalSignatureLog.findMany({
      where: {
        status: 'VALID',
      },
      select: {
        documentType: true,
        documentId: true,
      },
    });

    const signedRecIds = existingLogs
      .filter((l) => l.documentType === 'POLICY_RECOMMENDATION')
      .map((l) => l.documentId);

    const signedKakIds = existingLogs
      .filter((l) => l.documentType === 'KAK_DOCUMENT')
      .map((l) => l.documentId);

    const [pendingRecommendations, finalizedKaks] = await Promise.all([
      // Rekomendasi Kebijakan yang diajukan (status: SUBMITTED) dan belum memiliki TTE sah
      prisma.policyRecommendation.findMany({
        where: {
          status: 'SUBMITTED',
          id: {
            notIn: signedRecIds,
          },
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          study: {
            include: {
              proposal: {
                include: { opd: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, nip: true },
          },
        },
      }),
      // KAK Document yang sudah difinalisasi staff tapi belum tercatat tanda tangan digital (TTE)
      prisma.kakDocument.findMany({
        where: {
          status: 'FINAL',
          id: {
            notIn: signedKakIds,
          },
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          study: {
            include: {
              proposal: {
                include: { opd: true },
              },
              createdBy: {
                select: { id: true, name: true, nip: true },
              },
            },
          },
        },
      }),
    ]);

    // Format output terpadu
    const inboxItems = [];

    pendingRecommendations.forEach((rec) => {
      inboxItems.push({
        id: rec.id,
        documentType: 'POLICY_RECOMMENDATION',
        documentCode: rec.code,
        title: rec.title,
        studyTitle: rec.study?.title,
        opdName: rec.study?.proposal?.opd?.name,
        fiscalYear: rec.study?.fiscalYear,
        submittedBy: rec.createdBy?.name,
        submittedAt: rec.updatedAt,
        status: rec.status,
        targetPolicyType: rec.targetPolicyType,
        impactLevel: rec.impactLevel,
      });
    });

    finalizedKaks.forEach((kak) => {
      inboxItems.push({
        id: kak.id,
        documentType: 'KAK_DOCUMENT',
        documentCode: `KAK-${kak.study?.proposal?.code || 'STUDY'}`,
        title: `Kerangka Acuan Kerja (KAK) - ${kak.study?.title}`,
        studyTitle: kak.study?.title,
        opdName: kak.study?.proposal?.opd?.name,
        fiscalYear: kak.study?.fiscalYear,
        submittedBy: kak.study?.createdBy?.name,
        submittedAt: kak.updatedAt,
        status: kak.status,
        durationMonths: kak.study?.proposal?.estimatedDuration || 3,
      });
    });

    return {
      total: inboxItems.length,
      items: inboxItems,
    };
  }

  /**
   * Mengambil riwayat arsip tanda tangan elektronik
   */
  async getTteHistory(query = {}) {
    const { search, documentType, page = 1, limit = 50 } = query;
    const where = {};

    if (documentType) {
      where.documentType = documentType;
    }

    if (search) {
      where.OR = [
        { certificateNumber: { contains: search, mode: 'insensitive' } },
        { documentTitle: { contains: search, mode: 'insensitive' } },
        { documentCode: { contains: search, mode: 'insensitive' } },
        { signerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, logs] = await Promise.all([
      prisma.digitalSignatureLog.count({ where }),
      prisma.digitalSignatureLog.findMany({
        where,
        skip,
        take,
        orderBy: { signedAt: 'desc' },
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Mengambil preview detail dokumen sebelum ditandatangani
   */
  async getDocumentDetail(documentType, id) {
    if (documentType === 'POLICY_RECOMMENDATION') {
      const rec = await prisma.policyRecommendation.findUnique({
        where: { id },
        include: {
          study: {
            include: {
              proposal: { include: { opd: true } },
              teamMembers: true,
              kakDocument: true,
            },
          },
          createdBy: { select: { id: true, name: true, nip: true } },
        },
      });

      if (!rec) {
        const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
        error.statusCode = 404;
        throw error;
      }

      return {
        documentType,
        document: rec,
      };
    } else if (documentType === 'KAK_DOCUMENT') {
      const kak = await prisma.kakDocument.findUnique({
        where: { id },
        include: {
          study: {
            include: {
              proposal: { include: { opd: true } },
              teamMembers: true,
              rkaItems: true,
              createdBy: { select: { id: true, name: true, nip: true } },
            },
          },
        },
      });

      if (!kak) {
        const error = new Error('Dokumen KAK tidak ditemukan.');
        error.statusCode = 404;
        throw error;
      }

      return {
        documentType,
        document: kak,
      };
    } else {
      const error = new Error('Tipe dokumen tidak valid.');
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Eksekusi Penandatanganan Elektronik (TTE) oleh Kepala BRIDA
   */
  async signDocument(kepalaUser, data) {
    const { documentType, documentId, passphrase, notes } = data;

    // 1. Verifikasi Passphrase Kepala BRIDA
    const userFromDb = await prisma.user.findUnique({
      where: { id: kepalaUser.id },
    });

    if (!userFromDb) {
      const error = new Error('Pengguna tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const isPassphraseValid = await bcrypt.compare(passphrase, userFromDb.password);
    if (!isPassphraseValid) {
      const error = new Error('Passphrase / PIN TTE tidak valid. Penandatanganan dokumen dibatalkan.');
      error.statusCode = 401;
      throw error;
    }

    let documentTitle = '';
    let documentCode = null;
    let payloadForHash = {};

    // 2. Ambil dan validasi dokumen berdasarkan tipe
    // Pastikan dokumen belum pernah ditandatangani TTE secara valid
    const existingSignature = await prisma.digitalSignatureLog.findFirst({
      where: {
        documentType,
        documentId,
        status: 'VALID',
      },
    });

    if (existingSignature) {
      const error = new Error('Dokumen ini sudah ditandatangani secara elektronik (TTE) dan sah secara hukum.');
      error.statusCode = 400;
      throw error;
    }

    if (documentType === 'POLICY_RECOMMENDATION') {
      const rec = await prisma.policyRecommendation.findUnique({
        where: { id: documentId },
      });

      if (!rec) {
        const error = new Error('Naskah rekomendasi kebijakan tidak ditemukan.');
        error.statusCode = 404;
        throw error;
      }

      documentTitle = rec.title;
      documentCode = rec.code;
      payloadForHash = {
        documentType,
        documentId,
        code: rec.code,
        title: rec.title,
        executiveSummary: rec.executiveSummary,
        keyFindings: rec.keyFindings,
        policyActions: rec.policyActions,
        signerNip: userFromDb.nip,
        signerName: userFromDb.name,
        timestamp: new Date().toISOString(),
      };

      // Update status rekomendasi menjadi FINALIZED
      await prisma.policyRecommendation.update({
        where: { id: documentId },
        data: {
          status: 'FINALIZED',
          signedById: userFromDb.id,
          signedAt: new Date(),
        },
      });

      // Sinkronisasi status kajian dan usulan menjadi COMPLETED
      if (rec.studyId) {
        const study = await prisma.researchStudy.findUnique({
          where: { id: rec.studyId },
        });

        if (study) {
          await prisma.researchStudy.update({
            where: { id: study.id },
            data: {
              status: 'COMPLETED',
              endDate: study.endDate || new Date(),
            },
          });

          if (study.proposalId) {
            await prisma.proposal.update({
              where: { id: study.proposalId },
              data: {
                status: 'COMPLETED',
              },
            });
          }
        }
      }
    } else if (documentType === 'KAK_DOCUMENT') {
      const kak = await prisma.kakDocument.findUnique({
        where: { id: documentId },
        include: { study: true },
      });

      if (!kak) {
        const error = new Error('Dokumen KAK tidak ditemukan.');
        error.statusCode = 404;
        throw error;
      }

      documentTitle = `Kerangka Acuan Kerja (KAK) - ${kak.study?.title}`;
      documentCode = `KAK-${kak.study?.fiscalYear}`;
      payloadForHash = {
        documentType,
        documentId,
        studyTitle: kak.study?.title,
        background: kak.background,
        objectives: kak.objectives,
        scopeAndMethodology: kak.scopeAndMethodology,
        targetOutput: kak.targetOutput,
        signerNip: userFromDb.nip,
        signerName: userFromDb.name,
        timestamp: new Date().toISOString(),
      };

      // Update status KAK menjadi FINAL
      await prisma.kakDocument.update({
        where: { id: documentId },
        data: {
          status: 'FINAL',
          finalizedAt: new Date(),
        },
      });

      // Jika kajian riset masih dalam tahap PLANNING, majukan ke IN_PROGRESS karena KAK telah sah TTE
      if (kak.study && kak.study.status === 'PLANNING') {
        await prisma.researchStudy.update({
          where: { id: kak.study.id },
          data: {
            status: 'IN_PROGRESS',
            startDate: new Date(),
          },
        });

        if (kak.study.proposalId) {
          await prisma.proposal.update({
            where: { id: kak.study.proposalId },
            data: {
              status: 'IN_PROGRESS',
            },
          });
        }
      }
    }

    // 3. Generate SHA-256 Hash dan Nomor Sertifikat
    const signatureHash = this.generateSignatureHash(payloadForHash);
    const certificateNumber = await this.generateCertificateNumber();
    const verificationUrl = `/verify-signature/${certificateNumber}`;

    // 4. Catat ke tabel log tanda tangan digital
    const signatureLog = await prisma.digitalSignatureLog.create({
      data: {
        certificateNumber,
        documentType,
        documentId,
        documentTitle,
        documentCode,
        signerId: userFromDb.id,
        signerName: userFromDb.name,
        signerNip: userFromDb.nip,
        signerRole: 'Kepala Badan Riset dan Inovasi Daerah (BRIDA) Kab. Mimika',
        signatureHash,
        verificationUrl,
        status: 'VALID',
        notes: notes ? notes.trim() : 'Disahkan secara sah menggunakan Sertifikat Elektronik SIM-RIDA.',
        signedAt: new Date(),
      },
    });

    return signatureLog;
  }

  /**
   * Endpoint publik untuk verifikasi keabsahan tanda tangan digital (Scan QR Code)
   */
  async verifyCertificate(certificateNumber) {
    const log = await prisma.digitalSignatureLog.findUnique({
      where: { certificateNumber },
      include: {
        signer: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      const error = new Error('Sertifikat Tanda Tangan Elektronik tidak ditemukan atau tidak valid.');
      error.statusCode = 404;
      throw error;
    }

    return {
      isValid: log.status === 'VALID',
      certificateNumber: log.certificateNumber,
      documentType: log.documentType,
      documentCode: log.documentCode,
      documentTitle: log.documentTitle,
      signer: {
        name: log.signerName,
        nip: log.signerNip,
        role: log.signerRole,
      },
      signatureHash: log.signatureHash,
      signedAt: log.signedAt,
      status: log.status,
      notes: log.notes,
      issuer: 'Badan Riset dan Inovasi Daerah (BRIDA) Kab. Mimika - SIM-RIDA Digital Authority',
    };
  }
}

module.exports = new TteService();
