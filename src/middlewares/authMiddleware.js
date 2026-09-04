const prisma = require('../config/db');
const { verifyToken } = require('../utils/jwt');

/**
 * Authentication middleware: verifies Bearer JWT and loads active user
 */
const requireAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Bearer token missing.',
        error: { code: 'UNAUTHORIZED' },
      });
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        error: { code: 'USER_NOT_FOUND' },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact your administrator.',
        error: { code: 'ACCOUNT_INACTIVE' },
      });
    }

    // Omit sensitive password
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token invalid or expired.',
      error: { code: 'INVALID_TOKEN' },
    });
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles
 */
const requireRole = (...roles) => {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification',
        error: { code: 'UNAUTHORIZED' },
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        error: { code: 'FORBIDDEN' },
      });
    }
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  protect: requireAuth,
  authorize: requireRole,
};
