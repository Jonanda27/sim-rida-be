/**
 * Helper format respon standar JSON untuk SIM-RIDA API
 */

const successResponse = (res, message = 'Sukses', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'Terjadi kesalahan', errors = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
