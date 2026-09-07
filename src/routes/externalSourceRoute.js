const express = require('express');
const {
  getExternalSources,
  getExternalSourceById,
  createExternalSource,
  updateExternalSource,
  updateExternalSourceStatus,
  getSourceVersions,
  createSourceVersion,
} = require('../controllers/externalSourceController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const uploadSourceMiddleware = require('../middlewares/uploadSourceMiddleware');
const {
  createExternalSourceSchema,
  updateExternalSourceSchema,
  updateStatusSchema,
  createVersionSchema,
} = require('../validations/externalSourceValidation');

const router = express.Router();

// Require login for all routes
router.use(requireAuth);

// Read routes: Accessible by ADMIN_BRIDA, BRIDA, KEPALA_BRIDA
const allowReadRoles = requireRole('ADMIN_BRIDA', 'BRIDA', 'KEPALA_BRIDA');
// Mutation routes: BRIDA only
const allowBridaOnly = requireRole('BRIDA');

/**
 * @route   POST /api/external-sources/:id/analyze
 * @desc    Trigger document indexing on active version
 * @access  Private (BRIDA)
 */
router.post('/:id/analyze', allowBridaOnly, (req, res) => {
  res.json({ success: true, message: 'Dokumen baseline telah aktif dan siap dirujuk.' });
});

/**
 * @route   GET /api/external-sources
 * @desc    Get paginated list of external sources
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/external-sources
 * @desc    Create a new external source
 * @access  Private (BRIDA)
 */
router.route('/')
  .get(allowReadRoles, getExternalSources)
  .post(allowBridaOnly, validate(createExternalSourceSchema), createExternalSource);

/**
 * @route   GET /api/external-sources/:id
 * @desc    Get external source detail
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   PATCH /api/external-sources/:id
 * @desc    Update external source metadata
 * @access  Private (BRIDA)
 */
router.route('/:id')
  .get(allowReadRoles, getExternalSourceById)
  .patch(allowBridaOnly, validate(updateExternalSourceSchema), updateExternalSource);

/**
 * @route   PATCH /api/external-sources/:id/status
 * @desc    Update status (ACTIVE/ARCHIVED)
 * @access  Private (BRIDA)
 */
router.patch('/:id/status', allowBridaOnly, validate(updateStatusSchema), updateExternalSourceStatus);

/**
 * @route   GET /api/external-sources/:id/versions
 * @desc    Get version history of external source
 * @access  Private (ADMIN_BRIDA, BRIDA, KEPALA_BRIDA)
 * 
 * @route   POST /api/external-sources/:id/versions
 * @desc    Upload document and create new source version
 * @access  Private (BRIDA)
 */
router.route('/:id/versions')
  .get(allowReadRoles, getSourceVersions)
  .post(allowBridaOnly, uploadSourceMiddleware, validate(createVersionSchema), createSourceVersion);

module.exports = router;
