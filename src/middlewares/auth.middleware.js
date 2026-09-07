const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const prisma = require('../config/prisma');
const { errorResponse } = require('../utils/response.util');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Akses ditolak. Token autentikasi tidak ditemukan.', null, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'Akun pengguna tidak ditemukan.', null, 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Akun Anda telah dinonaktifkan oleh Admin BRIDA. Hubungi administrator.', null, 403);
    }

    req.user = {
      id: user.id,
      name: user.name,
      nip: user.nip,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      opdId: user.opdId,
      opd: user.opd,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
