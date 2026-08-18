const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
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
  console.log(`Created/Upserted user with id: ${bridaUser.id} and role: BRIDA`);

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
  console.log(`Created/Upserted user with id: ${opdUser.id} and role: OPD`);
  
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
