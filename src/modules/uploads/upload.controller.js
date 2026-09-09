const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { successResponse, errorResponse } = require('../../utils/response.util');

// Pastikan folder uploads/documents ada
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format nama berkas: timestamp-sanitized-name
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedOriginalName}`;
    cb(null, uniqueName);
  },
});

// File filter (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, JPG, PNG, ZIP)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|jpg|jpeg|png|zip|rar)$/i;
  if (!file.originalname.match(allowedExtensions)) {
    const error = new Error('Tipe file tidak diizinkan. Hanya berkas dokumen (PDF, DOCX, XLSX, dll) yang dapat diunggah.');
    error.statusCode = 400;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter,
});

const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 10);

class UploadController {
  /**
   * Handle Single File Upload
   * POST /api/v1/uploads
   */
  async handleSingleUpload(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'Tidak ada berkas yang diunggah. Pastikan field bernama "file".', null, 400);
      }

      const file = req.file;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
      const fileUrl = `${baseUrl}/uploads/documents/${file.filename}`;

      const fileData = {
        name: file.originalname,
        filename: file.filename,
        size: sizeStr,
        sizeBytes: file.size,
        mimetype: file.mimetype,
        path: `/uploads/documents/${file.filename}`,
        fileUrl,
        uploadDate: new Date().toISOString(),
      };

      return successResponse(res, 'Berkas berhasil diunggah ke server.', fileData, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handle Multiple Files Upload
   * POST /api/v1/uploads/multiple
   */
  async handleMultipleUpload(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return errorResponse(res, 'Tidak ada berkas yang diunggah. Pastikan field bernama "files".', null, 400);
      }

      const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
      const uploadedFiles = req.files.map((file) => {
        const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        return {
          name: file.originalname,
          filename: file.filename,
          size: sizeStr,
          sizeBytes: file.size,
          mimetype: file.mimetype,
          path: `/uploads/documents/${file.filename}`,
          fileUrl: `${baseUrl}/uploads/documents/${file.filename}`,
          uploadDate: new Date().toISOString(),
        };
      });

      return successResponse(res, `${uploadedFiles.length} berkas berhasil diunggah ke server.`, uploadedFiles, 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  uploadController: new UploadController(),
  uploadSingle,
  uploadMultiple,
};
