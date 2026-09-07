const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

class AuthService {
  /**
   * Login user menggunakan Email atau NIP
   */
  async login({ identifier, password }) {
    const isEmail = identifier.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier.trim().toLowerCase() } : { nip: identifier.trim() },
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
      const error = new Error('Kredensial login salah. Email/NIP atau password tidak cocok.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Akun Anda dinonaktifkan oleh Admin BRIDA. Silakan hubungi admin.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Kredensial login salah. Email/NIP atau password tidak cocok.');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Format data respon
    const userData = {
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

    return {
      token,
      user: userData,
    };
  }

  /**
   * Mengambil detail profil user yang sedang login
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      const error = new Error('User tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    return {
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
  }

  /**
   * Mengganti password user yang sedang login
   */
  async changePassword(userId, { oldPassword, newPassword }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error('User tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      const error = new Error('Password lama tidak sesuai.');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil diperbarui.' };
  }
}

module.exports = new AuthService();
