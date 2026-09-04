const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  opdId: true,
  createdAt: true,
  updatedAt: true,
  opd: {
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
    },
  },
};

const getUsers = async (query = {}) => {
  const { role, isActive, search } = query;
  const where = {};

  if (role) {
    where.role = role;
  }

  if (typeof isActive !== 'undefined') {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    const error = new Error(`User with ID ${id} not found`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return user;
};

const createUser = async (data, actorId = null) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Validate OPD ID if provided
  if (data.opdId) {
    const opd = await prisma.oPD.findUnique({
      where: { id: data.opdId },
    });
    if (!opd) {
      const error = new Error(`OPD with ID ${data.opdId} does not exist`);
      error.statusCode = 400;
      error.code = 'INVALID_OPD_ID';
      throw error;
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      opdId: data.opdId || null,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    },
    select: userSelect,
  });

  logAudit({
    userId: actorId,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return user;
};

const updateUser = async (id, data, actorId = null) => {
  // Ensure user exists
  await getUserById(id);

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id },
      },
    });

    if (existing) {
      const error = new Error('Email is already in use by another account');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }
  }

  if (data.opdId) {
    const opd = await prisma.oPD.findUnique({
      where: { id: data.opdId },
    });
    if (!opd) {
      const error = new Error(`OPD with ID ${data.opdId} does not exist`);
      error.statusCode = 400;
      error.code = 'INVALID_OPD_ID';
      throw error;
    }
  }

  const updatePayload = {};
  if (typeof data.name !== 'undefined') updatePayload.name = data.name;
  if (typeof data.email !== 'undefined') updatePayload.email = data.email;
  if (typeof data.role !== 'undefined') updatePayload.role = data.role;
  if (typeof data.opdId !== 'undefined') updatePayload.opdId = data.opdId;

  const updated = await prisma.user.update({
    where: { id },
    data: updatePayload,
    select: userSelect,
  });

  logAudit({
    userId: actorId,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: updated.id,
    metadata: { updatedFields: Object.keys(updatePayload) },
  });

  return updated;
};

const updateUserStatus = async (id, isActive, actorId = null) => {
  await getUserById(id);

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: userSelect,
  });

  logAudit({
    userId: actorId,
    action: 'USER_STATUS_CHANGED',
    entity: 'User',
    entityId: updated.id,
    metadata: { isActive },
  });

  return updated;
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
};
