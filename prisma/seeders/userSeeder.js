const bcrypt = require('bcryptjs');

const seedUsers = async (prisma) => {
  console.log(`Seeding Users...`);
  const password = await bcrypt.hash('password123', 10);

  const bridaUser = await prisma.user.upsert({
    where: { email: 'brida@test.com' },
    update: {},
    create: {
      name: 'Admin BRIDA',
      email: 'brida@test.com',
      password: password,
      role: 'BRIDA',
    },
  });
  console.log(`- Created/Upserted user with id: ${bridaUser.id} and role: BRIDA`);

  const opdUser = await prisma.user.upsert({
    where: { email: 'opd@test.com' },
    update: {},
    create: {
      name: 'Admin OPD',
      email: 'opd@test.com',
      password: password,
      role: 'OPD',
    },
  });
  console.log(`- Created/Upserted user with id: ${opdUser.id} and role: OPD`);
};

module.exports = { seedUsers };
