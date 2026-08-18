const prisma = require('../config/db');

const createKak = async (researchId, kakData) => {
  // Check if research exists
  const research = await prisma.research.findUnique({ where: { id: researchId } });
  if (!research) {
    throw new Error('Usulan penelitian tidak ditemukan');
  }

  // Check if KAK already exists for this research
  const existingKak = await prisma.kak.findUnique({ where: { researchId } });
  if (existingKak) {
    throw new Error('KAK untuk penelitian ini sudah dibuat sebelumnya');
  }

  // Calculate totals for RAB items and prepare for nested insert
  const rabItemsData = kakData.rabItems.map((item) => ({
    description: item.description,
    volume: item.volume,
    unit: item.unit,
    unitPrice: item.unitPrice,
    total: item.volume * item.unitPrice, // Auto-calculate total server-side
  }));

  // Create KAK and RAB Items using Prisma nested writes
  return await prisma.kak.create({
    data: {
      researchId,
      dasarPemikiran: kakData.dasarPemikiran,
      maksudTujuan: kakData.maksudTujuan,
      ruangLingkup: kakData.ruangLingkup,
      metodologi: kakData.metodologi,
      output: kakData.output,
      outcome: kakData.outcome,
      indikatorKinerja: kakData.indikatorKinerja,
      jadwalPelaksanaan: kakData.jadwalPelaksanaan,
      penutup: kakData.penutup,
      rabItems: {
        create: rabItemsData,
      },
    },
    include: {
      rabItems: true,
    },
  });
};

const getKakByResearchId = async (researchId) => {
  return await prisma.kak.findUnique({
    where: { researchId },
    include: {
      rabItems: true,
      research: {
        select: {
          title: true,
          estimatedBudget: true,
        },
      },
    },
  });
};

module.exports = {
  createKak,
  getKakByResearchId,
};
