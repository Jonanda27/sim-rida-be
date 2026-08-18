const prisma = require('../config/db');

const createProblem = async (data, userId) => {
  return await prisma.problem.create({
    data: {
      ...data,
      createdById: userId,
      status: 'PROBLEM_SUBMITTED', // Set default as submitted
    },
  });
};

const getProblems = async (user) => {
  const where = {};
  
  if (user.role === 'OPD') {
    where.createdById = user.id;
  } else if (user.role === 'MITRA') {
    where.assignedMitraId = user.id;
  }
  // BRIDA can see all problems, so where remains {}

  return await prisma.problem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      sector: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      research: true,
    },
  });
};

const reviewProblem = async (id, status, reviewNotes) => {
  const problem = await prisma.problem.findUnique({ where: { id } });
  
  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  return await prisma.problem.update({
    where: { id },
    data: {
      status,
      reviewNotes: reviewNotes || null,
    },
  });
};

const assignMitra = async (id, mitraId) => {
  const problem = await prisma.problem.findUnique({ where: { id } });
  
  if (!problem) {
    throw Object.assign(new Error('Masalah tidak ditemukan'), { statusCode: 404 });
  }

  if (problem.status !== 'APPROVED') {
    throw Object.assign(new Error('Proposal belum disetujui, tidak bisa menugaskan mitra'), { statusCode: 400 });
  }

  // Cek apakah mitra valid
  const mitra = await prisma.user.findFirst({
    where: { id: mitraId, role: 'MITRA' }
  });

  if (!mitra) {
    throw Object.assign(new Error('Mitra tidak valid atau tidak ditemukan'), { statusCode: 400 });
  }

  return await prisma.problem.update({
    where: { id },
    data: {
      assignedMitraId: mitraId,
      status: 'MITRA_ASSIGNED'
    },
  });
};

const getProblemById = async (id, user) => {
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      sector: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      research: true,
    },
  });

  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  // Jika OPD, pastikan ini adalah masalah milik instansinya
  if (user.role === 'OPD' && problem.createdById !== user.id) {
    throw Object.assign(new Error('Not authorized to access this problem'), { statusCode: 403 });
  }

  // Jika MITRA, pastikan masalah ini ditugaskan padanya
  if (user.role === 'MITRA' && problem.assignedMitraId !== user.id) {
    throw Object.assign(new Error('Not authorized to access this problem'), { statusCode: 403 });
  }

  return problem;
};

const updateProblem = async (id, data, user) => {
  const problem = await prisma.problem.findUnique({ where: { id } });

  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  // Pastikan yang mengedit adalah pemiliknya
  if (problem.createdById !== user.id) {
    throw Object.assign(new Error('Not authorized to edit this problem'), { statusCode: 403 });
  }

  // Cek apakah status mengizinkan edit
  if (problem.status !== 'PROBLEM_SUBMITTED' && problem.status !== 'REVISION_REQUIRED') {
    throw Object.assign(new Error('Cannot edit problem because it is already being processed'), { statusCode: 400 });
  }

  // Jika diedit setelah revisi, kembalikan statusnya untuk di-review ulang
  const newStatus = problem.status === 'REVISION_REQUIRED' ? 'PROBLEM_SUBMITTED' : problem.status;

  return await prisma.problem.update({
    where: { id },
    data: {
      ...data,
      status: newStatus
    },
  });
};

module.exports = {
  createProblem,
  getProblems,
  reviewProblem,
  assignMitra,
  getProblemById,
  updateProblem,
};
