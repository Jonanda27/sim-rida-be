const seedAreas = async (prisma) => {
  console.log(`Seeding Master Areas...`);
  const areas = ['Kecamatan Mimika Baru', 'Kecamatan Kuala Kencana', 'Distrik Tembagapura', 'Distrik Agimuga'];
  for (const areaName of areas) {
    await prisma.masterArea.upsert({
      where: { name: areaName },
      update: {},
      create: { name: areaName },
    });
  }
  console.log(`- Seeded ${areas.length} Master Areas.`);
};

module.exports = { seedAreas };
