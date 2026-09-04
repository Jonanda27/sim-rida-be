const researchRabService = require('../services/researchRabService');

// @desc    Get paginated RAB list
// @route   GET /api/research-rabs
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getRabs = async (req, res, next) => {
  try {
    const result = await researchRabService.getRabs(req.query);
    res.status(200).json({
      success: true,
      message: 'Research RABs retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed RAB by ID
// @route   GET /api/research-rabs/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getRabById = async (req, res, next) => {
  try {
    const rab = await researchRabService.getRabById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Research RAB retrieved successfully',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new RAB for KAK
// @route   POST /api/research-rabs
// @access  Private (BRIDA)
const createRab = async (req, res, next) => {
  try {
    const rab = await researchRabService.createRab(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Research RAB created successfully as DRAFT',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add single item to RAB
// @route   POST /api/research-rabs/:id/items
// @access  Private (BRIDA)
const addRabItem = async (req, res, next) => {
  try {
    const rab = await researchRabService.addRabItem(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'RAB item added successfully',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single item in RAB
// @route   PATCH /api/research-rabs/:id/items/:itemId
// @access  Private (BRIDA)
const updateRabItem = async (req, res, next) => {
  try {
    const rab = await researchRabService.updateRabItem(
      req.params.id,
      req.params.itemId,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'RAB item updated successfully',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single item from RAB
// @route   DELETE /api/research-rabs/:id/items/:itemId
// @access  Private (BRIDA)
const deleteRabItem = async (req, res, next) => {
  try {
    const rab = await researchRabService.deleteRabItem(
      req.params.id,
      req.params.itemId,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'RAB item deleted successfully',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk set/update items in RAB
// @route   PUT /api/research-rabs/:id/items
// @access  Private (BRIDA)
const bulkUpdateRabItems = async (req, res, next) => {
  try {
    const rab = await researchRabService.bulkUpdateRabItems(
      req.params.id,
      req.body.items,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'RAB items updated in bulk successfully',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder RAB items
// @route   PATCH /api/research-rabs/:id/items/reorder
// @access  Private (BRIDA)
const reorderRabItems = async (req, res, next) => {
  try {
    const rab = await researchRabService.reorderRabItems(
      req.params.id,
      req.body.items,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'RAB items reordered successfully',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category summary of RAB
// @route   GET /api/research-rabs/:id/summary
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getRabSummary = async (req, res, next) => {
  try {
    const summary = await researchRabService.getRabSummary(req.params.id);
    res.status(200).json({
      success: true,
      message: 'RAB summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit RAB for review
// @route   POST /api/research-rabs/:id/submit
// @access  Private (BRIDA)
const submitRab = async (req, res, next) => {
  try {
    const rab = await researchRabService.submitRab(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research RAB submitted successfully (status: SUBMITTED)',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return RAB for revision
// @route   POST /api/research-rabs/:id/return
// @access  Private (BRIDA)
const returnRab = async (req, res, next) => {
  try {
    const rab = await researchRabService.returnRab(req.params.id, req.body.reviewNote, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research RAB returned for revision (status: REVISION_REQUIRED)',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalize RAB individually
// @route   POST /api/research-rabs/:id/finalize
// @access  Private (BRIDA)
const finalizeRab = async (req, res, next) => {
  try {
    const rab = await researchRabService.finalizeRab(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research RAB finalized successfully (status: FINALIZED)',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel RAB draft
// @route   POST /api/research-rabs/:id/cancel
// @access  Private (BRIDA)
const cancelRab = async (req, res, next) => {
  try {
    const rab = await researchRabService.cancelRab(req.params.id, req.body.reason, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Research RAB cancelled',
      data: rab,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRabs,
  getRabById,
  createRab,
  addRabItem,
  updateRabItem,
  deleteRabItem,
  bulkUpdateRabItems,
  reorderRabItems,
  getRabSummary,
  submitRab,
  returnRab,
  finalizeRab,
  cancelRab,
};
