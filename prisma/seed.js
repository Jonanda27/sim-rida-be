const { PrismaClient } = require('@prisma/client');
const { seedOpds } = require('./seeders/opdSeeder');
const { seedUsers } = require('./seeders/userSeeder');
const { seedSectors } = require('./seeders/sectorSeeder');
const { seedResearchTypes } = require('./seeders/researchTypeSeeder');
const { seedSelectionCriteria } = require('./seeders/selectionCriteriaSeeder');
const { seedBaselineDocuments } = require('./seeders/baselineSeeder');
const { seedProblemIdentifications } = require('./seeders/problemIdentificationSeeder');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding (Master Data, User Login Access & Baseline Documents) ...\n`);

  // 1. Master OPDs (Diperlukan agar akun OPD dan opsi perangkat daerah valid)
  await seedOpds(prisma);

  // 2. Akun Pengguna Demo / Akses Login
  await seedUsers(prisma);

  // 3. Konfigurasi Master Bidang / Sektor
  await seedSectors(prisma);

  // 4. Konfigurasi Master Jenis Riset
  await seedResearchTypes(prisma);

  // 5. Kriteria Penilaian Seleksi Riset (Rubrik dasar bobot 100%)
  await seedSelectionCriteria(prisma);

  // 6. Dokumen Baseline Resmi Kabupaten Mimika (Knowledge Base)
  await seedBaselineDocuments(prisma);

  // 7. Identifikasi Kebutuhan OPD (Demo data MVP Tanpa AI)
  await seedProblemIdentifications(prisma);

  console.log(`\n======================================================`);
  console.log(`Seeding selesai: AKSES USER, MASTER DATA, BASELINE & IDENTIFIKASI KEBUTUHAN.`);
  console.log(`======================================================\n`);
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
