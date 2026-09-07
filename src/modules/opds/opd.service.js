const prisma = require('../../config/prisma');

class OpdService {
  async getAllOpds({ search, isActive }) {
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.opd.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async getOpdById(id) {
    const opd = await prisma.opd.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            nip: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!opd) {
      const error = new Error('Data OPD tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    return opd;
  }

  async createOpd(data) {
    const existing = await prisma.opd.findUnique({
      where: { code: data.code.trim().toUpperCase() },
    });

    if (existing) {
      const error = new Error(`Kode OPD "${data.code}" sudah digunakan.`);
      error.statusCode = 409;
      throw error;
    }

    return await prisma.opd.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        category: data.category || 'Badan / Dinas Daerah',
        address: data.address,
        phone: data.phone,
        email: data.email,
        isActive: true,
      },
    });
  }

  async updateOpd(id, data) {
    await this.getOpdById(id);

    return await prisma.opd.update({
      where: { id },
      data,
    });
  }
}

module.exports = new OpdService();
