const prisma = require('../config/db');

const createResearch = async (data, userId) => {
  // 1. Cek apakah Masalah (problemId) tersebut benar-benar ada
  const problemExists = await prisma.problem.findUnique({
    where: { id: data.problemId }
  });

  if (!problemExists) {
    throw Object.assign(new Error('Masalah tidak ditemukan!'), { statusCode: 404 });
  }

  // 2. Simpan Usulan Perencanaan / Solusi Aplikasi
  const newResearch = await prisma.research.create({
    data: {
      ...data,
      createdById: userId, // Ini berfungsi ganda sebagai identitas OPD juga
    },
    include: {
      problem: true // Langsung sertakan data masalahnya dalam response
    }
  });

  return newResearch;
};

const getResearches = async (user) => {
  const where = {};
  
  // Jika OPD, hanya melihat usulannya sendiri
  if (user.role === 'OPD') {
    where.createdById = user.id;
  }
  // BRIDA melihat semua, where tetap {}

  return await prisma.research.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      problem: true,
      researchType: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const getResearchById = async (id, user) => {
  const research = await prisma.research.findUnique({
    where: { id },
    include: {
      problem: true,
      researchType: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!research) {
    throw Object.assign(new Error('Usulan penelitian tidak ditemukan'), { statusCode: 404 });
  }

  // Pastikan akses khusus (OPD hanya akses miliknya)
  if (user.role === 'OPD' && research.createdById !== user.id) {
    throw Object.assign(new Error('Anda tidak memiliki akses ke usulan ini'), { statusCode: 403 });
  }

  return research;
};

const updateResearch = async (id, userId, data) => {
  const research = await prisma.research.findUnique({
    where: { id },
    include: { problem: true },
  });

  if (!research) throw new Error('Usulan penelitian tidak ditemukan');
  if (research.createdById !== userId) throw new Error('Akses ditolak: Bukan pemilik usulan');

  const updatedResearch = await prisma.research.update({
    where: { id },
    data,
  });

  // Jika status sebelumnya REVISION_REQUIRED, kembalikan ke RESEARCH_SUBMITTED (atau PROBLEM_SUBMITTED jika belum KAK)
  if (research.problem.status === 'REVISION_REQUIRED') {
    await prisma.problem.update({
      where: { id: research.problemId },
      data: { status: 'PROBLEM_SUBMITTED' },
    });
  }

  return updatedResearch;
};

module.exports = {
  createResearch,
  getResearches,
  getResearchById,
  updateResearch,
};
