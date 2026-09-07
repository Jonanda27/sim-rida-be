const prisma = require('../src/config/db');

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "ResearchKak" ADD COLUMN IF NOT EXISTS "budgetEstimate" DECIMAL(18,2) DEFAULT 0;`);
  console.log('Successfully added budgetEstimate column to ResearchKak');
  const cols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ResearchKak';`);
  console.log('Columns in ResearchKak:', cols);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
