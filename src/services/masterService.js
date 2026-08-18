const prisma = require('../config/db');

const getAllSectors = async () => {
  return await prisma.masterSector.findMany({
    orderBy: { name: 'asc' },
  });
};

const getAllAreas = async () => {
  return await prisma.masterArea.findMany({
    orderBy: { name: 'asc' },
  });
};

const getAllResearchTypes = async () => {
  return await prisma.masterResearchType.findMany({
    orderBy: { name: 'asc' },
  });
};

module.exports = {
  getAllSectors,
  getAllAreas,
  getAllResearchTypes,
};
