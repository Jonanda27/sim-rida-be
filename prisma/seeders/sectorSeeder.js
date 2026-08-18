const seedSectors = async (prisma) => {
  console.log(`Seeding Master Sectors...`);
  const sectors = ['Pendidikan', 'Kesehatan', 'Pekerjaan Umum', 'Lingkungan Hidup', 'Tata Kelola Pemerintahan'];
  for (const sectorName of sectors) {
    await prisma.masterSector.upsert({
      where: { name: sectorName },
      update: {},
      create: { name: sectorName },
    });
  }
  console.log(`- Seeded ${sectors.length} Master Sectors.`);
};

module.exports = { seedSectors };
