const bcrypt = require('bcryptjs');

const seedUsers = async (prisma) => {
  console.log(`Seeding Users...`);
  const password = await bcrypt.hash('password123', 10);

  // Find OPD-001 for OPD user linking
  const diskominfoOpd = await prisma.oPD.findUnique({
    where: { code: 'OPD-001' },
  });

  // Official SIM-RIDA Development Accounts
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@simrida.local' },
    update: {
      name: 'Admin BRIDA',
      role: 'ADMIN_BRIDA',
      isActive: true,
    },
    create: {
      name: 'Admin BRIDA',
      email: 'admin@simrida.local',
      password: password,
      role: 'ADMIN_BRIDA',
      isActive: true,
    },
  });
  console.log(`- Created/Upserted user: ${adminUser.email} (ADMIN_BRIDA)`);

  const bridaUser = await prisma.user.upsert({
    where: { email: 'brida@simrida.local' },
    update: {
      name: 'Operator BRIDA',
      role: 'BRIDA',
      isActive: true,
    },
    create: {
      name: 'Operator BRIDA',
      email: 'brida@simrida.local',
      password: password,
      role: 'BRIDA',
      isActive: true,
    },
  });
  console.log(`- Created/Upserted user: ${bridaUser.email} (BRIDA)`);

  const kepalaBridaUser = await prisma.user.upsert({
    where: { email: 'kepala@simrida.local' },
    update: {
      name: 'Kepala BRIDA',
      role: 'KEPALA_BRIDA',
      isActive: true,
    },
    create: {
      name: 'Kepala BRIDA',
      email: 'kepala@simrida.local',
      password: password,
      role: 'KEPALA_BRIDA',
      isActive: true,
    },
  });
  console.log(`- Created/Upserted user: ${kepalaBridaUser.email} (KEPALA_BRIDA)`);

  const opdUser = await prisma.user.upsert({
    where: { email: 'opd@simrida.local' },
    update: {
      name: 'Operator Diskominfo',
      role: 'OPD',
      opdId: diskominfoOpd ? diskominfoOpd.id : null,
      isActive: true,
    },
    create: {
      name: 'Operator Diskominfo',
      email: 'opd@simrida.local',
      password: password,
      role: 'OPD',
      opdId: diskominfoOpd ? diskominfoOpd.id : null,
      isActive: true,
    },
  });
  console.log(`- Created/Upserted user: ${opdUser.email} (OPD -> OPD-001)`);

  // OPD 1 (Diskominfo), OPD 2 (Bappeda), OPD 3 (Dinkes)
  const bappedaOpd = await prisma.oPD.findUnique({ where: { code: 'OPD-002' } });
  const dinkesOpd = await prisma.oPD.findUnique({ where: { code: 'OPD-003' } });

  const opd1 = await prisma.user.upsert({
    where: { email: 'opd1@simrida.local' },
    update: { name: 'Operator Diskominfo', role: 'OPD', opdId: diskominfoOpd?.id, isActive: true },
    create: { name: 'Operator Diskominfo', email: 'opd1@simrida.local', password, role: 'OPD', opdId: diskominfoOpd?.id, isActive: true },
  });
  console.log(`- Created/Upserted user: ${opd1.email} (OPD -> Diskominfo)`);

  const opd2 = await prisma.user.upsert({
    where: { email: 'opd2@simrida.local' },
    update: { name: 'Operator Bappeda', role: 'OPD', opdId: bappedaOpd?.id, isActive: true },
    create: { name: 'Operator Bappeda', email: 'opd2@simrida.local', password, role: 'OPD', opdId: bappedaOpd?.id, isActive: true },
  });
  console.log(`- Created/Upserted user: ${opd2.email} (OPD -> Bappeda)`);

  const opd3 = await prisma.user.upsert({
    where: { email: 'opd3@simrida.local' },
    update: { name: 'Operator Dinkes', role: 'OPD', opdId: dinkesOpd?.id, isActive: true },
    create: { name: 'Operator Dinkes', email: 'opd3@simrida.local', password, role: 'OPD', opdId: dinkesOpd?.id, isActive: true },
  });
  console.log(`- Created/Upserted user: ${opd3.email} (OPD -> Dinkes)`);

  // Existing test accounts preserved for backwards compatibility
  await prisma.user.upsert({
    where: { email: 'brida@test.com' },
    update: { role: 'BRIDA', isActive: true },
    create: {
      name: 'Admin BRIDA',
      email: 'brida@test.com',
      password: password,
      role: 'BRIDA',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'opd@test.com' },
    update: { role: 'OPD', isActive: true },
    create: {
      name: 'Admin OPD',
      email: 'opd@test.com',
      password: password,
      role: 'OPD',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'kepala@test.com' },
    update: { role: 'KEPALA_BRIDA', isActive: true },
    create: {
      name: 'Kepala BRIDA',
      email: 'kepala@test.com',
      password: password,
      role: 'KEPALA_BRIDA',
      isActive: true,
    },
  });
};

module.exports = { seedUsers };
