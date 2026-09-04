const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Create milestone with boundary date validation
 */
const createMilestone = async (implementationId, data, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const targetDate = new Date(data.targetDate);
  const implStart = new Date(implementation.startDate);
  const implEnd = new Date(implementation.endDate);

  // Section 49: Boundary Validation
  if (targetDate < implStart || targetDate > implEnd) {
    const error = new Error(
      `Target tanggal capaian (milestone) harus berada dalam periode pelaksanaan penelitian (${implStart.toISOString().split('T')[0]} s/d ${implEnd.toISOString().split('T')[0]}).`
    );
    error.statusCode = 422;
    error.code = 'MILESTONE_OUTSIDE_PERIOD';
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

  const milestone = await prisma.researchMilestone.create({
    data: {
      implementationId,
      timelineId: data.timelineId || null,
      title: data.title || data.name,
      description: data.description || null,
      targetDate,
      order: data.order !== undefined ? data.order : 0,
      status: 'PENDING',
      progress: 0,
    },
    include: {
      timeline: { select: { id: true, title: true } },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_MILESTONE_CREATED',
    'ResearchMilestone',
    milestone.id,
    { implementationId, title: milestone.title }
  );

  return milestone;
};

/**
 * Get milestones for an implementation
 */
const getMilestones = async (implementationId, query = {}) => {
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
  if (query.status) where.status = query.status;
  if (query.timelineId) where.timelineId = query.timelineId;

  const milestones = await prisma.researchMilestone.findMany({
    where,
    orderBy: [{ order: 'asc' }, { targetDate: 'asc' }],
    include: {
      timeline: { select: { id: true, title: true } },
      activities: { select: { id: true, title: true, status: true, activityDate: true } },
    },
  });

  return milestones;
};

/**
 * Update milestone
 */
const updateMilestone = async (id, data, userId) => {
  const milestone = await prisma.researchMilestone.findUnique({
    where: { id },
    include: { implementation: true },
  });

  if (!milestone) {
    const error = new Error('Capaian milestone tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'MILESTONE_NOT_FOUND';
    throw error;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.progress !== undefined) updateData.progress = data.progress;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.timelineId !== undefined) updateData.timelineId = data.timelineId;

  if (data.targetDate) {
    const targetDate = new Date(data.targetDate);
    const implStart = new Date(milestone.implementation.startDate);
    const implEnd = new Date(milestone.implementation.endDate);

    if (targetDate < implStart || targetDate > implEnd) {
      const error = new Error(
        `Target tanggal capaian (milestone) harus berada dalam periode pelaksanaan penelitian (${implStart.toISOString().split('T')[0]} s/d ${implEnd.toISOString().split('T')[0]}).`
      );
      error.statusCode = 422;
      error.code = 'MILESTONE_OUTSIDE_PERIOD';
      throw error;
    }
    updateData.targetDate = targetDate;
  }

  const updated = await prisma.researchMilestone.update({
    where: { id },
    data: updateData,
    include: {
      timeline: { select: { id: true, title: true } },
    },
  });

  await logAudit(
    userId,
    'RESEARCH_MILESTONE_UPDATED',
    'ResearchMilestone',
    updated.id,
    { title: updated.title, updateData }
  );

  return updated;
};

/**
 * Complete milestone: status -> COMPLETED, progress -> 100, completedDate -> now
 */
const completeMilestone = async (id, userId) => {
  const milestone = await prisma.researchMilestone.findUnique({
    where: { id },
  });

  if (!milestone) {
    const error = new Error('Capaian milestone tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'MILESTONE_NOT_FOUND';
    throw error;
  }

  const now = new Date();
  const updated = await prisma.researchMilestone.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      progress: 100,
      completedDate: now,
    },
  });

  await logAudit(
    userId,
    'RESEARCH_MILESTONE_COMPLETED',
    'ResearchMilestone',
    updated.id,
    { title: updated.title, completedDate: now }
  );

  return updated;
};

/**
 * Update milestone progress (0 - 100, non-decreasing)
 */
const updateMilestoneProgress = async (id, progress, notes, userId) => {
  const milestone = await prisma.researchMilestone.findUnique({
    where: { id },
  });

  if (!milestone) {
    const error = new Error('Capaian milestone tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'MILESTONE_NOT_FOUND';
    throw error;
  }

  if (progress < milestone.progress) {
    const error = new Error(
      `Nilai progress capaian tidak boleh lebih kecil dari nilai saat ini (${milestone.progress}%). Progress baru: ${progress}%.`
    );
    error.statusCode = 409;
    error.code = 'PROGRESS_CANNOT_DECREASE';
    throw error;
  }

  const updateData = { progress };
  if (progress === 100) {
    updateData.status = 'COMPLETED';
    updateData.completedDate = new Date();
  } else if (milestone.status === 'PENDING' && progress > 0) {
    updateData.status = 'ONGOING';
  }

  const updated = await prisma.researchMilestone.update({
    where: { id },
    data: updateData,
  });

  await logAudit(
    userId,
    'RESEARCH_MILESTONE_UPDATED',
    'ResearchMilestone',
    updated.id,
    { title: updated.title, progress, notes }
  );

  return updated;
};

module.exports = {
  createMilestone,
  getMilestones,
  updateMilestone,
  completeMilestone,
  updateMilestoneProgress,
};
