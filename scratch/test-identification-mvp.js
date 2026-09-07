const API_BASE = 'http://localhost:5000/api';

async function testIdentificationMvp() {
  console.log('=== TESTING MODUL IDENTIFIKASI KEBUTUHAN OPD (MVP TANPA AI) ===\n');

  // 1. Login as ADMIN_BRIDA
  console.log('1. Login sebagai ADMIN_BRIDA...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@simrida.local',
      password: 'password123',
    }),
  });
  const loginData = await loginRes.json();
  const adminToken = loginData.data?.token;
  if (!adminToken) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  console.log('✔ Login Admin Berhasil');

  // 2. Fetch list of OPDs
  console.log('\n2. Mengambil master OPD...');
  const opdRes = await fetch(`${API_BASE}/master/opd`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const opdData = await opdRes.json();
  const opds = opdData.data || [];
  console.log(`✔ Ditemukan ${opds.length} OPD.`);
  const targetOpd = opds[0];

  // 3. Fetch list of baseline sources
  console.log('\n3. Mengambil dokumen baseline...');
  const baseRes = await fetch(`${API_BASE}/external-sources`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const baseData = await baseRes.json();
  const baselines = baseData.data || [];
  console.log(`✔ Ditemukan ${baselines.length} dokumen baseline.`);
  const targetVersionId = baselines[0]?.currentVersionId || baselines[0]?.currentVersion?.id;

  // 4. Create new identification
  console.log('\n4. Membuat Identifikasi Kebutuhan baru (Manual BRIDA, Tanpa AI)...');
  const createPayload = {
    opdId: targetOpd?.id,
    year: 2026,
    field: 'Tata Kelola Pemerintahan & SPBE',
    title: 'Kebutuhan Penguatan Integrasi Layanan Publik Distrik',
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    sourceVersionId: targetVersionId,
    baselineRelationship: 'Selaras dengan Bab IV RPJMD Mimika tentang transformasi digital pemerintahan daerah.',
    bridaFindings: 'Hasil observasi BRIDA menemukan disparitas pelaporan administrasi antar distrik terpencil.',
    currentCondition: 'Pengiriman laporan masih menggunakan berkas manual dan jaringan belum merata.',
    problemStatement: 'Ketiadaan standarisasi sistem pelaporan digital terintegrasi di tingkat distrik.',
    impact: 'Keterlambatan monitoring evaluasi program prioritas daerah hingga lebih dari 30 hari.',
    potentialNeed: 'Kajian kebutuhan model integrasi pelaporan pelayanan publik distrik berbasis offline-first.',
    analysisNotes: 'Prioritas riset semester 1 tahun 2026.',
  };

  const createRes = await fetch(`${API_BASE}/problem-identifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(createPayload),
  });
  const createData = await createRes.json();
  if (!createData.success) {
    throw new Error('Create failed: ' + JSON.stringify(createData));
  }
  const created = createData.data;
  console.log(`✔ Identifikasi Berhasil Dibuat: Code = ${created.code}, ID = ${created.id}`);
  console.log(`  - Status: ${created.status}`);
  console.log(`  - Prioritas: ${created.priority}`);
  console.log(`  - Field: ${created.field}`);

  // 5. Get Identification by ID / Code
  console.log('\n5. Mengambil detail identifikasi...');
  const detailRes = await fetch(`${API_BASE}/problem-identifications/${created.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const detailData = await detailRes.json();
  const detail = detailData.data;
  console.log(`✔ Detail dimuat: ${detail.code} - ${detail.title}`);
  console.log(`  - Temuan BRIDA: "${detail.bridaFindings}"`);
  console.log(`  - Permasalahan: "${detail.problemStatement}"`);
  console.log(`  - Dampak: "${detail.impact}"`);
  console.log(`  - Kebutuhan: "${detail.potentialNeed}"`);

  // 6. Update Identification
  console.log('\n6. Mengubah / merevisi identifikasi...');
  const updateRes = await fetch(`${API_BASE}/problem-identifications/${created.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Kebutuhan Penguatan Integrasi Layanan Publik Distrik Terpencil',
      potentialNeed: 'Kajian dan perancangan prototipe sistem pelaporan pelayanan terpadu distrik.',
    }),
  });
  const updateData = await updateRes.json();
  console.log(`✔ Update berhasil: "${updateData.data.title}"`);

  // 7. Approve Identification
  console.log('\n7. Menyetujui (Approve) Identifikasi...');
  const approveRes = await fetch(`${API_BASE}/problem-identifications/${created.id}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      decision: 'APPROVE',
      notes: 'Disetujui untuk dimasukkan dalam agenda usulan penelitian daerah tahun 2026.',
    }),
  });
  const approveData = await approveRes.json();
  console.log('approveData:', JSON.stringify(approveData));
  const approved = approveData.data;
  console.log(`✔ Approval Berhasil: Status = ${approved.status}`);
  console.log(`  - Reviewer: ${approved.reviewedBy?.name}`);
  console.log(`  - Review Note: "${approved.reviewNote}"`);

  // 8. Fetch list with filters
  console.log('\n8. Mengambil daftar identifikasi dengan filter status=APPROVED...');
  const listRes = await fetch(`${API_BASE}/problem-identifications?status=APPROVED`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const listData = await listRes.json();
  console.log(`✔ Total APPROVED: ${listData.data.length} identifikasi ditemukan.`);

  console.log('\n======================================================');
  console.log('SEMUA TEST MODUL IDENTIFIKASI KEBUTUHAN OPD MVP (BERHASIL 100%)');
  console.log('======================================================\n');
}

testIdentificationMvp().catch((err) => {
  console.error('❌ Test Failed:', err.message);
  process.exit(1);
});
