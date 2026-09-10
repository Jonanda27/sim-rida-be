const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding: OPD & User saja (data bersih)...');

  // 1. Seed Master Data OPD Kabupaten Mimika
  const opdBrida = await prisma.opd.create({
    data: {
      code: 'BRIDA',
      name: 'Badan Riset dan Inovasi Daerah (BRIDA) Kab. Mimika',
      category: 'Badan Daerah',
      email: 'brida@mimikakab.go.id',
      phone: '0901-321123',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah 99910',
      isActive: true,
    },
  });

  const opdBappeda = await prisma.opd.create({
    data: {
      code: 'BAPPEDA',
      name: 'Badan Perencanaan Pembangunan Daerah (BAPPEDA) Kab. Mimika',
      category: 'Badan Daerah',
      email: 'bappeda@mimikakab.go.id',
      phone: '0901-321456',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah 99910',
      isActive: true,
    },
  });

  const opdDinkes = await prisma.opd.create({
    data: {
      code: 'DINKES',
      name: 'Dinas Kesehatan (DINKES) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'dinkes@mimikakab.go.id',
      phone: '0901-321789',
      address: 'Jl. Yos Sudarso No. 12, Distrik Mimika Baru, Timika, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDiskominfo = await prisma.opd.create({
    data: {
      code: 'DISKOMINFO',
      name: 'Dinas Komunikasi dan Informatika (DISKOMINFO) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'diskominfo@mimikakab.go.id',
      phone: '0901-321900',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDisdik = await prisma.opd.create({
    data: {
      code: 'DISDIK',
      name: 'Dinas Pendidikan (DISDIK) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'disdik@mimikakab.go.id',
      phone: '0901-321555',
      address: 'Jl. Poros Timika - SP 3, Distrik Kuala Kencana, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDlh = await prisma.opd.create({
    data: {
      code: 'DLH',
      name: 'Dinas Lingkungan Hidup (DLH) Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'dlh@mimikakab.go.id',
      phone: '0901-321666',
      address: 'Jl. Cenderawasih SP 2, Distrik Mimika Baru, Mimika, Papua Tengah',
      isActive: true,
    },
  });

  const opdDispar = await prisma.opd.create({
    data: {
      code: 'DISPARBUD',
      name: 'Dinas Pariwisata, Kebudayaan, Pemuda dan Olahraga Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'disparbud@mimikakab.go.id',
      phone: '0901-321777',
      address: 'Pusat Pemerintahan Kab. Mimika, Jl. Poros Timika - SP 3, Kuala Kencana, Mimika',
      isActive: true,
    },
  });

  const opdDistan = await prisma.opd.create({
    data: {
      code: 'DISTAN',
      name: 'Dinas Pertanian, Tanaman Pangan, Hortikultura dan Perkebunan Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'pertanian@mimikakab.go.id',
      phone: '0901-321888',
      address: 'Jl. Poros Timika - Mapurujaya KM 8, Distrik Mimika Timur, Mimika',
      isActive: true,
    },
  });

  const opdDinkop = await prisma.opd.create({
    data: {
      code: 'DINKOP',
      name: 'Dinas Koperasi dan Usaha Kecil Menengah Kab. Mimika',
      category: 'Dinas Daerah',
      email: 'dinkop@mimikakab.go.id',
      phone: '0901-321444',
      address: 'Jl. Yos Sudarso, Distrik Mimika Baru, Mimika',
      isActive: true,
    },
  });

  const opdBpbd = await prisma.opd.create({
    data: {
      code: 'BPBD',
      name: 'Badan Penanggulangan Bencana Daerah (BPBD) Kab. Mimika',
      category: 'Badan Daerah',
      email: 'bpbd@mimikakab.go.id',
      phone: '0901-321999',
      address: 'Jl. Cenderawasih SP 3, Distrik Kuala Kencana, Mimika',
      isActive: true,
    },
  });

  console.log('✅ Master data 10 OPD Kab. Mimika berhasil dibuat.');

  // 2. Hash Password default: password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Seed Akun Pengguna
  await prisma.user.create({
    data: {
      name: 'Admin Litbang BRIDA Kab. Mimika',
      nip: '198503152010011002',
      email: 'admin@simrida.local',
      password: hashedPassword,
      phone: '081234567890',
      role: 'ADMIN_BRIDA',
      isActive: true,
      opdId: opdBrida.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dr. Petrus Renyaan, M.Si (Kepala BRIDA Kab. Mimika)',
      nip: '197304121998031001',
      email: 'kepala@simrida.local',
      password: hashedPassword,
      phone: '081298765432',
      role: 'KEPALA_BRIDA',
      isActive: true,
      opdId: opdBrida.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Staf Litbang BAPPEDA Mimika',
      nip: '198807202012012004',
      email: 'bappeda@simrida.local',
      password: hashedPassword,
      phone: '081345678901',
      role: 'OPD',
      isActive: true,
      opdId: opdBappeda.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Subbag Program & Data Dinkes Mimika',
      nip: '199001152014022001',
      email: 'dinkes@simrida.local',
      password: hashedPassword,
      phone: '081398765432',
      role: 'OPD',
      isActive: true,
      opdId: opdDinkes.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Bidang E-Gov Diskominfo Mimika',
      nip: '199205102016031003',
      email: 'diskominfo@simrida.local',
      password: hashedPassword,
      phone: '081223344556',
      role: 'OPD',
      isActive: true,
      opdId: opdDiskominfo.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Subbag Perencanaan Disdik Mimika',
      nip: '199104122015021002',
      email: 'disdik@simrida.local',
      password: hashedPassword,
      phone: '081223344888',
      role: 'OPD',
      isActive: true,
      opdId: opdDisdik.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Bidang Pengendalian Lingkungan DLH Mimika',
      nip: '198909182013012001',
      email: 'dlh@simrida.local',
      password: hashedPassword,
      phone: '081223344999',
      role: 'OPD',
      isActive: true,
      opdId: opdDlh.id,
    },
  });

  console.log('✅ Akun pengguna berhasil di-seed.');
  console.log('');
  console.log('📋 Akun Login yang tersedia:');
  console.log('   ADMIN  : admin@simrida.local    | password123');
  console.log('   KEPALA : kepala@simrida.local   | password123');
  console.log('   OPD    : bappeda@simrida.local  | password123');
  console.log('   OPD    : dinkes@simrida.local   | password123');
  console.log('   OPD    : diskominfo@simrida.local | password123');
  console.log('   OPD    : disdik@simrida.local   | password123');
  console.log('   OPD    : dlh@simrida.local      | password123');
  console.log('');
  console.log('🌱 Seeding selesai. Database bersih & siap digunakan!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
