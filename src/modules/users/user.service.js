const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');

class UserService {
  async getAllUsers({ search, role, opdId, isActive, page = 1, limit = 50 }) {
    const where = {};

    if (role) {
      where.role = role;
    }

    if (opdId) {
      where.opdId = opdId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          nip: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          opdId: true,
          createdAt: true,
          updatedAt: true,
          opd: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        opdId: true,
        createdAt: true,
        updatedAt: true,
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('Akun pengguna tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  async createUser(data) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (emailExists) {
      const error = new Error(`Email "${data.email}" sudah terdaftar.`);
      error.statusCode = 409;
      throw error;
    }

    if (data.nip) {
      const nipExists = await prisma.user.findUnique({
        where: { nip: data.nip.trim() },
      });
      if (nipExists) {
        const error = new Error(`NIP "${data.nip}" sudah digunakan akun lain.`);
        error.statusCode = 409;
        throw error;
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        nip: data.nip ? data.nip.trim() : null,
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        phone: data.phone ? data.phone.trim() : null,
        role: data.role,
        opdId: data.opdId || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        opdId: true,
        createdAt: true,
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  async updateUser(id, data) {
    await this.getUserById(id);

    if (data.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email.trim().toLowerCase(),
          NOT: { id },
        },
      });
      if (emailExists) {
        const error = new Error(`Email "${data.email}" sudah digunakan akun lain.`);
        error.statusCode = 409;
        throw error;
      }
    }

    if (data.nip) {
      const nipExists = await prisma.user.findFirst({
        where: {
          nip: data.nip.trim(),
          NOT: { id },
        },
      });
      if (nipExists) {
        const error = new Error(`NIP "${data.nip}" sudah digunakan akun lain.`);
        error.statusCode = 409;
        throw error;
      }
    }

    const updatePayload = {
      ...(data.name && { name: data.name.trim() }),
      ...(data.nip !== undefined && { nip: data.nip ? data.nip.trim() : null }),
      ...(data.email && { email: data.email.trim().toLowerCase() }),
      ...(data.phone !== undefined && { phone: data.phone ? data.phone.trim() : null }),
      ...(data.role && { role: data.role }),
      ...(data.opdId !== undefined && { opdId: data.opdId }),
    };

    if (data.password) {
      updatePayload.password = await bcrypt.hash(data.password, 10);
    }

    return await prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        opdId: true,
        updatedAt: true,
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async toggleUserStatus(id, isActive) {
    await this.getUserById(id);

    return await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async deleteUser(id) {
    await this.getUserById(id);

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'Akun pengguna berhasil dihapus.' };
  }
}

module.exports = new UserService();
