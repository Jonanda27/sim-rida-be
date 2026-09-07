const { errorResponse } = require('../utils/response.util');

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR ${new Date().toISOString()}] ${req.method} ${req.url}:`, err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return errorResponse(res, `Data dengan ${target} tersebut sudah terdaftar dalam sistem.`, null, 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return errorResponse(res, 'Data tidak ditemukan.', null, 404);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token autentikasi tidak valid.', null, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Sesi login telah berakhir (Token Expired). Silakan login ulang.', null, 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server.';
  return errorResponse(res, message, err.errors || null, statusCode);
};

module.exports = errorHandler;
