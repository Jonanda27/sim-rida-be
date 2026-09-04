const prisma = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

/**
 * Create timeline under implementation with boundary date validation
 */
const createTimeline = async (implementationId, data, userId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const implStart = new Date(implementation.startDate);
  const implEnd = new Date(implementation.endDate);

  // Section 48: Boundary Validation
  if (start < implStart || end > implEnd) {
    const error = new Error(
      `Jadwal tahapan (timeline) harus berada dalam periode pelaksanaan penelitian (${implStart.toISOString().split('T')[0]} s/d ${implEnd.toISOString().split('T')[0]}).`
    );
    error.statusCode = 422;
    error.code = 'TIMELINE_OUTSIDE_PERIOD';
    throw error;
  }

  const timeline = await prisma.researchTimeline.create({
    data: {
      implementationId,
      title: data.title || data.name,
      description: data.description || null,
      startDate: start,
      endDate: end,
      order: data.order !== undefined ? data.order : 0,
      status: 'PENDING',
    },
  });

  await logAudit(
    userId,
    'RESEARCH_TIMELINE_CREATED',
    'ResearchTimeline',
    timeline.id,
    { implementationId, title: timeline.title }
  );

  return timeline;
};

/**
 * Get timelines for an implementation
 */
const getTimelines = async (implementationId) => {
  const implementation = await prisma.researchImplementation.findUnique({
    where: { id: implementationId },
  });

  if (!implementation) {
    const error = new Error('Pelaksanaan penelitian tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'IMPLEMENTATION_NOT_FOUND';
    throw error;
  }

  const timelines = await prisma.researchTimeline.findMany({
    where: { implementationId },
    orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
    include: {
      milestones: {
        orderBy: [{ order: 'asc' }, { targetDate: 'asc' }],
      },
      activities: {
        orderBy: { activityDate: 'asc' },
      },
    },
  });

  const now = new Date();
  const enriched = timelines.map((tl) => ({
    ...tl,
    isOverdue: now > new Date(tl.endDate) && tl.status !== 'COMPLETED',
  }));

  return enriched;
};

/**
 * Update timeline
 */
const updateTimeline = async (id, data, userId) => {
  const timeline = await prisma.researchTimeline.findUnique({
    where: { id },
    include: { implementation: true },
  });

  if (!timeline) {
    const error = new Error('Tahapan timeline tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'TIMELINE_NOT_FOUND';
    throw error;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.status !== undefined) updateData.status = data.status;

  const start = data.startDate ? new Date(data.startDate) : timeline.startDate;
  const end = data.endDate ? new Date(data.endDate) : timeline.endDate;
  const implStart = new Date(timeline.implementation.startDate);
  const implEnd = new Date(timeline.implementation.endDate);

  if (data.startDate || data.endDate) {
    if (start < implStart || end > implEnd) {
      const error = new Error(
        `Jadwal tahapan (timeline) harus berada dalam periode pelaksanaan penelitian (${implStart.toISOString().split('T')[0]} s/d ${implEnd.toISOString().split('T')[0]}).`
      );
      error.statusCode = 422;
      error.code = 'TIMELINE_OUTSIDE_PERIOD';
      throw error;
    }
    if (data.startDate) updateData.startDate = start;
    if (data.endDate) updateData.endDate = end;
  }

  const updated = await prisma.researchTimeline.update({
    where: { id },
    data: updateData,
  });

  await logAudit(
    userId,
    'RESEARCH_TIMELINE_UPDATED',
    'ResearchTimeline',
    updated.id,
    { title: updated.title, updateData }
  );

  return updated;
};

/**
 * Delete timeline (only allowed if implementation.status = PLANNED)
 */
const deleteTimeline = async (id, userId) => {
  const timeline = await prisma.researchTimeline.findUnique({
    where: { id },
    include: { implementation: true },
  });

  if (!timeline) {
    const error = new Error('Tahapan timeline tidak ditemukan.');
    error.statusCode = 404;
    error.code = 'TIMELINE_NOT_FOUND';
    throw error;
  }

  // Section 24: Hanya boleh jika implementation.status = PLANNED
  if (timeline.implementation.status !== 'PLANNED') {
    const error = new Error(
      `Tahapan tidak dapat dihapus saat penelitian sudah berstatus "${timeline.implementation.status}". Gunakan status "SKIPPED" jika diperlukan.`
    );
    error.statusCode = 409;
    error.code = 'CANNOT_DELETE_TIMELINE_ONGOING';
    throw error;
  }

  await prisma.researchTimeline.delete({ where: { id } });

  await logAudit(
    userId,
    'RESEARCH_TIMELINE_DELETED',
    'ResearchTimeline',
    id,
    { title: timeline.title }
  );

  return { message: 'Tahapan timeline berhasil dihapus.' };
};

module.exports = {
  createTimeline,
  getTimelines,
  updateTimeline,
  deleteTimeline,
};
