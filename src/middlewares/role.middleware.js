const { errorResponse } = require('../utils/response.util');

/**
 * Middleware untuk membatasi akses endpoint berdasarkan role
 * @param {string[]} allowedRoles - Array of roles: ['ADMIN_BRIDA', 'KEPALA_BRIDA', 'OPD']
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Akses tidak sah. Silakan login terlebih dahulu.', null, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini (Role Anda: ${req.user.role}).`,
        null,
        403
      );
    }

    next();
  };
};

module.exports = authorize;
