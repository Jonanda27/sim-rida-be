const seedOpds = async (prisma) => {
  console.log(`Seeding Master OPD...`);

  const opds = [
    {
      code: 'OPD-001',
      name: 'Dinas Komunikasi dan Informatika',
      shortName: 'Diskominfo',
      description: 'Pengelola infrastruktur TIK, integrasi data daerah, dan statistik sektoral.',
      isActive: true,
    },
    {
      code: 'OPD-002',
      name: 'Badan Perencanaan Pembangunan Daerah',
      shortName: 'Bappeda',
      description: 'Perencanaan dan koordinasi pembangunan daerah serta perumusan target makro.',
      isActive: true,
    },
    {
      code: 'OPD-003',
      name: 'Dinas Kesehatan',
      shortName: 'Dinkes',
      description: 'Penyelenggaraan pelayanan kesehatan publik, puskesmas, dan pencegahan penyakit.',
      isActive: true,
    },
    {
      code: 'OPD-004',
      name: 'Dinas Lingkungan Hidup',
      shortName: 'DLH',
      description: 'Pengelolaan lingkungan, ruang terbuka hijau, dan pengendalian persampahan.',
      isActive: true,
    },
  ];

  for (const opd of opds) {
    const record = await prisma.oPD.upsert({
      where: { code: opd.code },
      update: {
        name: opd.name,
        shortName: opd.shortName,
        description: opd.description,
        isActive: opd.isActive,
      },
      create: opd,
    });
    console.log(`- Created/Upserted OPD: ${record.code} (${record.shortName})`);
  }
};

module.exports = { seedOpds };
