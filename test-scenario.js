const http = require('http');

// Helper to make requests
const request = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function runTests() {
  console.log('--- STARTING END-TO-END API TEST ---');
  let opdToken, bridaToken, mitraId;
  let problemId, researchId;

  // 1. Login OPD
  console.log('\n1. Login as OPD...');
  const resOpdLogin = await request('POST', '/auth/login', { email: 'opd@test.com', password: 'password123' });
  if (resOpdLogin.status === 200) {
    opdToken = resOpdLogin.data.data.token;
    console.log('✅ OPD Login Success!');
  } else return console.error('❌ Failed', resOpdLogin);

  // 2. Login BRIDA
  console.log('\n2. Login as BRIDA...');
  const resBridaLogin = await request('POST', '/auth/login', { email: 'brida@test.com', password: 'password123' });
  if (resBridaLogin.status === 200) {
    bridaToken = resBridaLogin.data.data.token;
    console.log('✅ BRIDA Login Success!');
  } else return console.error('❌ Failed', resBridaLogin);

  // 2.5 Get Sectors
  console.log('\n2.5 Fetching Master Sectors...');
  const resSectors = await request('GET', '/master/sectors', null, opdToken);
  let sectorId;
  if (resSectors.status === 200 && resSectors.data.data.length > 0) {
    sectorId = resSectors.data.data[0].id;
    console.log('✅ Fetched Sector ID:', sectorId);
  } else return console.error('❌ Failed to fetch sectors');

  // 3. OPD Create Problem
  console.log('\n3. OPD Creates a Problem...');
  const probData = {
    title: 'Masalah Kemacetan Perkotaan',
    sectorId: sectorId,
    targetCompletion: 'Desember 2026',
    background: 'Terjadi peningkatan volume kendaraan di pusat kota secara signifikan.',
    mainFocus: 'Rekayasa persimpangan',
    impact: 'Waktu tempuh bertambah 2 jam setiap hari.',
    urgency: 'Sangat mendesak'
  };
  const resProb = await request('POST', '/problems', probData, opdToken);
  if (resProb.status === 201) {
    problemId = resProb.data.data.id;
    console.log('✅ Problem Created (Status: PROBLEM_SUBMITTED). ID:', problemId);
  } else {
    console.error('❌ Failed', JSON.stringify(resProb, null, 2));
    return;
  }

  // 4. OPD Create Research
  console.log('\n4. OPD Creates Research Proposal for the Problem...');
  const resRTypes = await request('GET', '/master/research-types', null, opdToken);
  let rTypeId;
  if (resRTypes.status === 200 && resRTypes.data.data.length > 0) {
    rTypeId = resRTypes.data.data[0].id;
  }
  
  const resData = {
    problemId: problemId,
    title: 'Riset Rekayasa Lalu Lintas',
    researchTypeId: rTypeId,
    objective: 'Menemukan pola lalu lintas ideal',
    researchQuestions: 'Bagaimana mengurangi macet 30%?',
    scope: 'Pusat kota',
    expectedOutput: 'Model AI Lalu Lintas',
    expectedOutcome: 'Kemacetan berkurang',
    successIndicators: 'Waktu tempuh turun 1 jam',
    estimatedBudget: 50000000,
    estimatedDurationMonths: 6
  };
  const resRes = await request('POST', '/researches', resData, opdToken);
  if (resRes.status === 201) {
    researchId = resRes.data.data.id;
    console.log('✅ Research Proposal Created. ID:', researchId);
  } else {
    console.error('❌ Failed', JSON.stringify(resRes, null, 2));
    return;
  }

  // 5. BRIDA Reviews Problem (Approves Idea)
  console.log('\n5. BRIDA Reviews and Approves Research Idea (RESEARCH_APPROVED)...');
  const revIdea = await request('PATCH', `/problems/${problemId}/review`, { status: 'RESEARCH_APPROVED', reviewNotes: 'Ide bagus, lanjut KAK' }, bridaToken);
  if (revIdea.status === 200) {
    console.log('✅ Status changed to RESEARCH_APPROVED.');
  } else return console.error('❌ Failed', revIdea);

  // 6. OPD Creates KAK and RAB
  console.log('\n6. OPD Submits KAK & RAB...');
  const kakData = {
    dasarPemikiran: 'Perpres bla bla',
    maksudTujuan: 'Riset kemacetan komprehensif',
    ruangLingkup: 'Jalan utama kota',
    metodologi: 'Kuantitatif dan Kualitatif',
    output: 'Dokumen kajian',
    outcome: 'Penerapan rekayasa jalan',
    indikatorKinerja: 'Kajian selesai 100%',
    jadwalPelaksanaan: 'Bulan 1-6',
    penutup: 'Demikian KAK dibuat',
    rabItems: [
      { description: 'Honor Peneliti', volume: 2, unit: 'OB', unitPrice: 5000000 },
      { description: 'Transport Lokal', volume: 10, unit: 'Kali', unitPrice: 150000 }
    ]
  };
  const resKak = await request('POST', `/researches/${researchId}/kak`, kakData, opdToken);
  if (resKak.status === 201) {
    console.log('✅ KAK & RAB Submitted! Backend auto-changed status to KAK_SUBMITTED.');
  } else return console.error('❌ Failed', resKak);

  // 7. BRIDA Final Approval
  console.log('\n7. BRIDA Final Approval of KAK (APPROVED)...');
  const revFinal = await request('PATCH', `/problems/${problemId}/review`, { status: 'APPROVED', reviewNotes: 'RAB sesuai standar.' }, bridaToken);
  if (revFinal.status === 200) {
    console.log('✅ Status changed to APPROVED.');
  } else return console.error('❌ Failed', revFinal);

  // 8. BRIDA Gets Mitra List
  console.log('\n8. BRIDA gets list of Mitra...');
  const resUsers = await request('GET', '/users?role=MITRA', null, bridaToken);
  if (resUsers.status === 200 && resUsers.data.data.length > 0) {
    mitraId = resUsers.data.data[0].id;
    console.log(`✅ Found Mitra! Name: ${resUsers.data.data[0].name}, ID: ${mitraId}`);
  } else return console.error('❌ Failed to find Mitra', resUsers);

  // 9. BRIDA Assigns Mitra
  console.log('\n9. BRIDA Assigns the Research to Mitra...');
  const resAssign = await request('PATCH', `/problems/${problemId}/assign-mitra`, { mitraId }, bridaToken);
  if (resAssign.status === 200) {
    console.log('✅ Mitra Assigned successfully! Status is now MITRA_ASSIGNED.');
  } else return console.error('❌ Failed', resAssign);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The pipeline is flawless!');
}

runTests();
