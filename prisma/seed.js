const { PrismaClient } = require('@prisma/client');
const { seedUsers } = require('./seeders/userSeeder');
const { seedSectors } = require('./seeders/sectorSeeder');
const { seedResearchTypes } = require('./seeders/researchTypeSeeder');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...\n`);

  await seedUsers(prisma);
  await seedSectors(prisma);
  await seedResearchTypes(prisma);

  console.log(`\nSeeding finished successfully.`);
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
