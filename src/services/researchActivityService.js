const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Create research activity
 */
const createActivity = async (implementationId, data, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  if (data.timelineId) {
    const timeline = await prisma.researchTimeline.findUnique({
      where: { id: data.timelineId },
    });
    if (!timeline || timeline.implementationId !== implementationId) {
      const error = new Error('Tahapan timeline tidak valid atau tidak termasuk dalam pelaksanaan ini.');
      error.statusCode = 400;
      error.code = 'INVALID_TIMELINE';
      throw error;
    }
  }

  if (data.milestoneId) {
    const milestone = await prisma.researchMilestone.findUnique({
      where: { id: data.milestoneId },
    });
    if (!milestone || milestone.implementationId !== implementationId) {
      const error = new Error('Capaian milestone tidak valid atau tidak termasuk dalam pelaksanaan ini.');
      error.statusCode = 400;
      error.code = 'INVALID_MILESTONE';
      throw error;
    }
  }

  const activity = await prisma.researchActivity.create({
    data: {
      implementationId,
      timelineId: data.timelineId || null,
      milestoneId: data.milestoneId || null,
      title: data.title,
      description: data.description || null,
      activityDate: new Date(data.activityDate),
      status: 'PLANNED',
      createdById: userId,
    },
    include: {
      timeline: { select: { id: true, title: true } },
      milestone: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_ACTIVITY_CREATED',
    'ResearchActivity',
    activity.id,
    { implementationId, title: activity.title }
  );

  return activity;
};

/**
 * Get activities with pagination and filter
 */
const getActivities = async (implementationId, query = {}) => {
  const { status, timelineId, milestoneId, startDate, endDate, page = 1, limit = 10 } = query;

  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const where = { implementationId };
  if (status) where.status = status;
  if (timelineId) where.timelineId = timelineId;
  if (milestoneId) where.milestoneId = milestoneId;
  if (startDate) where.activityDate = { ...where.activityDate, gte: new Date(startDate) };
  if (endDate) where.activityDate = { ...where.activityDate, lte: new Date(endDate) };

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [total, data] = await Promise.all([
    prisma.researchActivity.count({ where }),
    prisma.researchActivity.findMany({
      where,
      skip,
      take,
      orderBy: { activityDate: 'desc' },
      include: {
        timeline: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take) || 1,
    },
  };
};

/**
 * Update activity
 */
const updateActivity = async (id, data, userId) => {
  const activity = await prisma.researchActivity.findUnique({ where: { id } });

  if (!activity) {
    const error = new Error('Aktivitas penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'ACTIVITY_NOT_FOUND';
    throw error;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.activityDate) updateData.activityDate = new Date(data.activityDate);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.timelineId !== undefined) updateData.timelineId = data.timelineId;
  if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId;

  const updated = await prisma.researchActivity.update({
    where: { id },
    data: updateData,
    include: {
      timeline: { select: { id: true, title: true } },
      milestone: { select: { id: true, title: true } },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_ACTIVITY_UPDATED',
    'ResearchActivity',
    updated.id,
    { title: updated.title, updateData }
  );

  return updated;
};

/**
 * Start activity: -> ONGOING
 */
const startActivity = async (id, userId) => {
  const activity = await prisma.researchActivity.findUnique({ where: { id } });

  if (!activity) {
    const error = new Error('Aktivitas penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'ACTIVITY_NOT_FOUND';
    throw error;
  }

  const updated = await prisma.researchActivity.update({
    where: { id },
    data: { status: 'ONGOING' },
  });

  await logAudit(
    userId,
    'RESEARCH_ACTIVITY_STARTED',
    'ResearchActivity',
    updated.id,
    { title: updated.title }
  );

  return updated;
};

/**
 * Complete activity: -> COMPLETED
 */
const completeActivity = async (id, userId) => {
  const activity = await prisma.researchActivity.findUnique({ where: { id } });

  if (!activity) {
    const error = new Error('Aktivitas penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'ACTIVITY_NOT_FOUND';
    throw error;
  }

  const updated = await prisma.researchActivity.update({
    where: { id },
    data: { status: 'COMPLETED' },
  });

  await logAudit(
    userId,
    'RESEARCH_ACTIVITY_COMPLETED',
    'ResearchActivity',
    updated.id,
    { title: updated.title }
  );

  return updated;
};

/**
 * Cancel activity: -> CANCELLED
 */
const cancelActivity = async (id, userId) => {
  const activity = await prisma.researchActivity.findUnique({ where: { id } });

  if (!activity) {
    const error = new Error('Aktivitas penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'ACTIVITY_NOT_FOUND';
    throw error;
  }

  const updated = await prisma.researchActivity.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  await logAudit(
    userId,
    'RESEARCH_ACTIVITY_CANCELLED',
    'ResearchActivity',
    updated.id,
    { title: updated.title }
  );

  return updated;
};

module.exports = {
  createActivity,
  getActivities,
  updateActivity,
  startActivity,
  completeActivity,
  cancelActivity,
};
