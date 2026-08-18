const prisma = require('../config/db');

const createProblem = async (data, userId) => {
  return await prisma.problem.create({
    data: {
      ...data,
      createdById: userId,
      status: 'SUBMITTED', // Set default as submitted
    },
  });
};

const getProblems = async (user) => {
  const where = {};
  
  // If user is OPD, they can only see their own problems
  if (user.role === 'OPD') {
    where.createdById = user.id;
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
      researches: true,
    },
  });
};

const validateProblem = async (id, status, rejectionReason) => {
  const problem = await prisma.problem.findUnique({ where: { id } });
  
  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  return await prisma.problem.update({
    where: { id },
    data: {
      status,
      rejectionReason: rejectionReason || null,
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
      researches: true,
    },
  });

  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  // Jika OPD, pastikan ini adalah masalah milik instansinya
  if (user.role === 'OPD' && problem.createdById !== user.id) {
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

  // Cek apakah status masih DRAFT (atau SUBMITTED jika kita asumsikan belum divalidasi)
  if (problem.status !== 'DRAFT' && problem.status !== 'SUBMITTED') {
    throw Object.assign(new Error('Cannot edit problem because it is already being processed'), { statusCode: 400 });
  }

  return await prisma.problem.update({
    where: { id },
    data,
  });
};

module.exports = {
  createProblem,
  getProblems,
  validateProblem,
  getProblemById,
  updateProblem,
};
