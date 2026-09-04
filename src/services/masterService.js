const prisma = require('../config/db');

const getAllSectors = async () => {
  return await prisma.masterSector.findMany({
    orderBy: { name: 'asc' },
  });
};

const getAllResearchTypes = async () => {
  return await prisma.masterResearchType.findMany({
    orderBy: { name: 'asc' },
  });
};

const getAllOpds = async () => {
  return await prisma.oPD.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
};

module.exports = {
  getAllSectors,
  getAllResearchTypes,
  getAllOpds,
};
