const researchTimelineService = require('../services/researchTimelineService');
const researchMilestoneService = require('../services/researchMilestoneService');
const researchActivityService = require('../services/researchActivityService');

// Timelines
const updateTimeline = async (req, res, next) => {
  try {
    const data = await researchTimelineService.updateTimeline(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Tahapan timeline berhasil diperbarui.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTimeline = async (req, res, next) => {
  try {
    const result = await researchTimelineService.deleteTimeline(req.params.id, req.user.id);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Milestones
const updateMilestone = async (req, res, next) => {
  try {
    const data = await researchMilestoneService.updateMilestone(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Capaian milestone berhasil diperbarui.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const completeMilestone = async (req, res, next) => {
  try {
    const data = await researchMilestoneService.completeMilestone(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Capaian milestone berhasil diselesaikan (status: COMPLETED, progress: 100%).',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateMilestoneProgress = async (req, res, next) => {
  try {
    const data = await researchMilestoneService.updateMilestoneProgress(
      req.params.id,
      req.body.progress,
      req.body.notes,
      req.user.id
    );
    res.json({
      success: true,
      message: 'Progress milestone berhasil diperbarui.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Activities
const updateActivity = async (req, res, next) => {
  try {
    const data = await researchActivityService.updateActivity(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Aktivitas pelaksanaan berhasil diperbarui.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const startActivity = async (req, res, next) => {
  try {
    const data = await researchActivityService.startActivity(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Aktivitas pelaksanaan berhasil dimulai (status: ONGOING).',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const completeActivity = async (req, res, next) => {
  try {
    const data = await researchActivityService.completeActivity(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Aktivitas pelaksanaan berhasil diselesaikan (status: COMPLETED).',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const cancelActivity = async (req, res, next) => {
  try {
    const data = await researchActivityService.cancelActivity(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Aktivitas pelaksanaan berhasil dibatalkan (status: CANCELLED).',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateTimeline,
  deleteTimeline,
  updateMilestone,
  completeMilestone,
  updateMilestoneProgress,
  updateActivity,
  startActivity,
  completeActivity,
  cancelActivity,
};
