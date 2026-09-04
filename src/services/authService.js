const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');
const { logAudit } = require('../utils/auditLogger');

const loginUser = async (email, password) => {
  // Check for user with OPD info
  const user = await prisma.user.findUnique({
    where: { email },
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
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is inactive. Please contact your administrator.');
    error.statusCode = 401;
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = signToken(user.id, user.role);

  // Log successful login audit
  logAudit({
    userId: user.id,
    action: 'USER_LOGIN',
    entity: 'User',
    entityId: user.id,
    metadata: { role: user.role },
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      opdId: user.opdId,
      opd: user.opd,
    },
  };
};

module.exports = {
  loginUser,
};
