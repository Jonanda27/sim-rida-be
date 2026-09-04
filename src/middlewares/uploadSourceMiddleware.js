const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const env = require('../config/env');

// Temporary staging directory for external source uploads before moving to version folder
const tempUploadDir = path.resolve(env.UPLOAD_DIR, 'external-sources', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Storage configuration with secure random filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `source-${Date.now()}-${randomName}${ext}`);
  },
});

// Allowed file types: PDF, DOCX, XLSX, XLS, CSV, TXT
const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt'];
const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'text/plain',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = allowedExtensions.includes(ext);
  const isMimeAllowed = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported file format (${ext}). Allowed formats: PDF, DOCX, XLSX, XLS, CSV, TXT.`);
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const maxSizeBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const uploadSourceFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeBytes,
  },
}).single('file');

// Wrapper middleware to catch Multer errors and format standard response
const uploadSourceMiddleware = (req, res, next) => {
  uploadSourceFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File size exceeds the limit of ${env.MAX_UPLOAD_SIZE_MB}MB.`,
          error: { code: 'FILE_TOO_LARGE' },
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
        error: { code: err.code || 'UPLOAD_ERROR' },
      });
    } else if (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
        error: { code: err.code || 'INVALID_FILE' },
      });
    }
    next();
  });
};

module.exports = uploadSourceMiddleware;
