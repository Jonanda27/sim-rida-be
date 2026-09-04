const seedSelectionCriteria = async (prisma) => {
  console.log(`Seeding Research Selection Criteria...`);

  const criteriaList = [
    {
      code: 'SC-01',
      name: 'Relevansi terhadap kebutuhan daerah',
      description: 'Kesesuaian usulan topik penelitian dengan arah kebijakan dan isu strategis pembangunan dalam RPJMD/RKPD.',
      weight: 30,
      order: 1,
      isActive: true,
    },
    {
      code: 'SC-02',
      name: 'Urgensi permasalahan',
      description: 'Tingkat kemendesakan pemecahan masalah dan dampak risiko jika permasalahan tidak segera diteliti.',
      weight: 25,
      order: 2,
      isActive: true,
    },
    {
      code: 'SC-03',
      name: 'Dampak yang diharapkan',
      description: 'Signifikansi kontribusi hasil riset terhadap peningkatan kualitas pelayanan publik, efisiensi anggaran, atau inovasi daerah.',
      weight: 20,
      order: 3,
      isActive: true,
    },
    {
      code: 'SC-04',
      name: 'Kelayakan penelitian',
      description: 'Kelayakan teknis pelaksanaan mencakup ketersediaan data sekunder/primer, estimasi waktu, dan sumber daya.',
      weight: 15,
      order: 4,
      isActive: true,
    },
    {
      code: 'SC-05',
      name: 'Kejelasan metodologi',
      description: 'Ketepatan dan ketajaman pendekatan metodologi, instrumen pengumpulan data, dan rancangan analisis kebijakan.',
      weight: 10,
      order: 5,
      isActive: true,
    },
  ];

  for (const c of criteriaList) {
    await prisma.researchSelectionCriteria.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        description: c.description,
        weight: c.weight,
        order: c.order,
        isActive: c.isActive,
      },
      create: c,
    });
    console.log(`- Upserted Criteria: ${c.code} (${c.name}, Bobot: ${c.weight}%)`);
  }
};

module.exports = { seedSelectionCriteria };
