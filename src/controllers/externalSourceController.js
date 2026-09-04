const externalSourceService = require('../services/externalSourceService');

// @desc    Get all external sources
// @route   GET /api/external-sources
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getExternalSources = async (req, res, next) => {
  try {
    const result = await externalSourceService.getExternalSources(req.query);
    res.status(200).json({
      success: true,
      message: 'External sources retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get external source by ID
// @route   GET /api/external-sources/:id
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getExternalSourceById = async (req, res, next) => {
  try {
    const source = await externalSourceService.getExternalSourceById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'External source retrieved successfully',
      data: source,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new external source
// @route   POST /api/external-sources
// @access  Private (BRIDA)
const createExternalSource = async (req, res, next) => {
  try {
    const source = await externalSourceService.createExternalSource(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'External source created successfully',
      data: source,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an external source
// @route   PATCH /api/external-sources/:id
// @access  Private (BRIDA)
const updateExternalSource = async (req, res, next) => {
  try {
    const updated = await externalSourceService.updateExternalSource(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'External source updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update external source status (ACTIVE/ARCHIVED)
// @route   PATCH /api/external-sources/:id/status
// @access  Private (BRIDA)
const updateExternalSourceStatus = async (req, res, next) => {
  try {
    const updated = await externalSourceService.updateExternalSourceStatus(
      req.params.id,
      req.body.status,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: `External source status updated to ${req.body.status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all versions of an external source
// @route   GET /api/external-sources/:id/versions
// @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
const getSourceVersions = async (req, res, next) => {
  try {
    const versions = await externalSourceService.getSourceVersions(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Source versions retrieved successfully',
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload document and create new source version
// @route   POST /api/external-sources/:id/versions
// @access  Private (BRIDA)
const createSourceVersion = async (req, res, next) => {
  try {
    const version = await externalSourceService.createSourceVersion(
      req.params.id,
      req.body,
      req.file,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: `Version ${version.versionNumber} uploaded successfully`,
      data: version,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExternalSources,
  getExternalSourceById,
  createExternalSource,
  updateExternalSource,
  updateExternalSourceStatus,
  getSourceVersions,
  createSourceVersion,
};
