const seedResearchTypes = async (prisma) => {
  console.log(`Seeding Master Research Types...`);
  const types = ['Pengembangan Sistem Aplikasi', 'Kajian / Studi Kelayakan', 'Evaluasi Kebijakan', 'Survei dan Pemetaan', 'Pemberdayaan Masyarakat'];
  
  for (const typeName of types) {
    await prisma.masterResearchType.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName },
    });
  }
  console.log(`- Seeded ${types.length} Master Research Types.`);
};

module.exports = { seedResearchTypes };
