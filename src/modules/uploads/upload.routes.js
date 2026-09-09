const { Router } = require('express');
const { uploadController, uploadSingle, uploadMultiple } = require('./upload.controller');
const authenticate = require('../../middlewares/auth.middleware');

const router = Router();

// Endpoint upload single file: POST /api/v1/uploads
router.post('/', authenticate, uploadSingle, (req, res, next) => {
  uploadController.handleSingleUpload(req, res, next);
});

// Endpoint upload multiple files: POST /api/v1/uploads/multiple
router.post('/multiple', authenticate, uploadMultiple, (req, res, next) => {
  uploadController.handleMultipleUpload(req, res, next);
});

module.exports = router;
