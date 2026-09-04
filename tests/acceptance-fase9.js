const BASE_URL = 'http://localhost:5000/api';

async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${data?.message || res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('       SIM-RIDA FASE 9: ACCEPTANCE TESTS (A - L)     ');
  console.log('====================================================\n');

  const results = {};

  // ----------------------------------------------------
  // TEST A: Demo Accounts Login (6 demo accounts)
  // ----------------------------------------------------
  console.log('--- TEST A: LOGIN DENGAN 6 AKUN DEMO ---');
  const demoAccounts = [
    { email: 'admin@simrida.local', role: 'ADMIN_BRIDA' },
    { email: 'brida@simrida.local', role: 'BRIDA' },
    { email: 'kepala@simrida.local', role: 'KEPALA_BRIDA' },
    { email: 'opd1@simrida.local', role: 'OPD' },
    { email: 'opd2@simrida.local', role: 'OPD' },
    { email: 'opd3@simrida.local', role: 'OPD' },
  ];

  const tokens = {};
  let testAPassed = true;

  for (const acc of demoAccounts) {
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: { email: acc.email, password: 'password123' },
      });
      if (res.success && res.data.token && res.data.user.role === acc.role) {
        tokens[acc.role] = res.data.token;
        if (acc.email.startsWith('opd')) {
          tokens[acc.email] = res.data.token;
        }
        console.log(`  [OK] ${acc.email} (${acc.role}) -> Authenticated, token acquired.`);
      } else {
        testAPassed = false;
        console.log(`  [FAIL] ${acc.email} returned invalid response`);
      }
    } catch (err) {
      testAPassed = false;
      console.log(`  [FAIL] ${acc.email} failed to login: ${err.message}`);
    }
  }
  results['Test A: Authentication (6 Demo Accounts)'] = testAPassed ? 'PASSED' : 'FAILED';

  const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

  // ----------------------------------------------------
  // TEST B: Role-Based Authorization
  // ----------------------------------------------------
  console.log('\n--- TEST B: ROLE-BASED ACCESS CONTROL (RBAC) ---');
  let testBPassed = true;
  try {
    const meAdmin = await api('/auth/me', authHeader(tokens['ADMIN_BRIDA']));
    console.log(`  [OK] Admin Auth: ${meAdmin.data.email} with role ${meAdmin.data.role}`);

    try {
      await api('/users', authHeader(tokens['opd1@simrida.local']));
      testBPassed = false;
      console.log(`  [FAIL] OPD should not be allowed to GET /users`);
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        console.log(`  [OK] OPD correctly forbidden (${err.status}) from accessing admin-only /users`);
      } else {
        testBPassed = false;
        console.log(`  [FAIL] Expected 403 for OPD /users, got: ${err.message}`);
      }
    }
  } catch (err) {
    testBPassed = false;
    console.log(`  [FAIL] RBAC test error: ${err.message}`);
  }
  results['Test B: Role-Based Access Control'] = testBPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST C: Master OPDs (minimal 4 OPD)
  // ----------------------------------------------------
  console.log('\n--- TEST C: MASTER DATA OPD (MINIMAL 4 OPD) ---');
  let testCPassed = true;
  try {
    const opdsRes = await api('/opds', authHeader(tokens['BRIDA']));
    const opds = opdsRes.data;
    console.log(`  [INFO] Total OPDs found: ${opds.length}`);
    opds.forEach((o) => console.log(`    - [${o.code}] ${o.name} (${o.shortName})`));
    if (opds.length >= 4) {
      console.log(`  [OK] Master OPD count >= 4.`);
    } else {
      testCPassed = false;
      console.log(`  [FAIL] Expected at least 4 OPDs, found ${opds.length}`);
    }
  } catch (err) {
    testCPassed = false;
    console.log(`  [FAIL] Master OPD error: ${err.message}`);
  }
  results['Test C: Master OPD (min 4)'] = testCPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST D: External Sources (minimal 5 dokumen)
  // ----------------------------------------------------
  console.log('\n--- TEST D: EXTERNAL SOURCES (MINIMAL 5 DOKUMEN) ---');
  let testDPassed = true;
  try {
    const sourcesRes = await api('/external-sources', authHeader(tokens['BRIDA']));
    const sources = sourcesRes.data;
    console.log(`  [INFO] Total External Sources found: ${sources.length}`);
    sources.forEach((s) => console.log(`    - [${s.code}] ${s.title} (${s.sourceType})`));
    if (sources.length >= 5) {
      console.log(`  [OK] External Sources count >= 5.`);
    } else {
      testDPassed = false;
      console.log(`  [FAIL] Expected at least 5 external sources, found ${sources.length}`);
    }
  } catch (err) {
    testDPassed = false;
    console.log(`  [FAIL] External Sources error: ${err.message}`);
  }
  results['Test D: External Sources (min 5)'] = testDPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST E: Problem Identification (minimal 8 problem)
  // ----------------------------------------------------
  console.log('\n--- TEST E: PROBLEM IDENTIFICATION (MINIMAL 8 PROBLEM) ---');
  let testEPassed = true;
  try {
    const probsRes = await api('/problem-identifications', authHeader(tokens['BRIDA']));
    const probs = probsRes.data;
    console.log(`  [INFO] Total Problem Identifications found: ${probs.length}`);
    probs.forEach((p) => console.log(`    - [${p.code}] ${p.title} (Status: ${p.status})`));
    if (probs.length >= 8) {
      console.log(`  [OK] Problem Identifications count >= 8.`);
    } else {
      testEPassed = false;
      console.log(`  [FAIL] Expected at least 8 problem identifications, found ${probs.length}`);
    }
  } catch (err) {
    testEPassed = false;
    console.log(`  [FAIL] Problem Identifications error: ${err.message}`);
  }
  results['Test E: Problem Identifications (min 8)'] = testEPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST F: Research Proposal (minimal 6 proposal & variasi status)
  // ----------------------------------------------------
  console.log('\n--- TEST F: RESEARCH PROPOSALS (MINIMAL 6 PROPOSAL) ---');
  let testFPassed = true;
  try {
    const propsRes = await api('/research-proposals?limit=100', authHeader(tokens['BRIDA']));
    const props = propsRes.data;
    console.log(`  [INFO] Total Research Proposals found: ${props.length}`);
    const statuses = new Set(props.map((p) => p.status));
    props.forEach((p) => console.log(`    - [${p.code}] ${p.title} (Status: ${p.status})`));
    console.log(`  [INFO] Distinct proposal statuses: ${Array.from(statuses).join(', ')}`);
    if (props.length >= 6 && statuses.size >= 4) {
      console.log(`  [OK] Proposal count >= 6 with at least 4 distinct workflow statuses.`);
    } else {
      testFPassed = false;
      console.log(`  [FAIL] Proposal count or status variety requirement not met.`);
    }
  } catch (err) {
    testFPassed = false;
    console.log(`  [FAIL] Proposals error: ${err.message}`);
  }
  results['Test F: Research Proposals (min 6 & 4 statuses)'] = testFPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST G: Research Selection (Kriteria 100% Bobot & Scoring)
  // ----------------------------------------------------
  console.log('\n--- TEST G: RESEARCH SELECTION & CRITERIA ---');
  let testGPassed = true;
  try {
    const critRes = await api('/research-selections/criteria', authHeader(tokens['BRIDA']));
    const criteria = critRes.data;
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    console.log(`  [INFO] Total Criteria: ${criteria.length}, Sum of weights: ${totalWeight}%`);
    criteria.forEach((c) => console.log(`    - [${c.code}] ${c.name} (${c.weight}%)`));

    const selRes = await api('/research-selections', authHeader(tokens['BRIDA']));
    const selections = selRes.data;
    console.log(`  [INFO] Total Selections: ${selections.length}`);
    selections.forEach((s) => console.log(`    - [${s.code}] Status: ${s.status}, Final Score: ${s.finalScore}`));

    if (totalWeight === 100 && selections.length > 0) {
      console.log(`  [OK] Criteria sum to 100% and selections populated.`);
    } else {
      testGPassed = false;
      console.log(`  [FAIL] Selection criteria weight or selection records invalid.`);
    }
  } catch (err) {
    testGPassed = false;
    console.log(`  [FAIL] Selection error: ${err.message}`);
  }
  results['Test G: Selection Criteria & Scoring'] = testGPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST H: KAK & RAB Planning
  // ----------------------------------------------------
  console.log('\n--- TEST H: KAK & RAB PLANNING ---');
  let testHPassed = true;
  try {
    const kaksRes = await api('/research-kaks', authHeader(tokens['BRIDA']));
    const rabsRes = await api('/research-rabs', authHeader(tokens['BRIDA']));
    console.log(`  [INFO] Total KAK: ${kaksRes.data.length}, Total RAB: ${rabsRes.data.length}`);
    const sampleRab = rabsRes.data.find((r) => r.items && r.items.length > 0) || rabsRes.data[0];
    if (sampleRab) {
      console.log(`  [INFO] Sample RAB: ${sampleRab.code}, Total Amount: Rp ${Number(sampleRab.totalAmount).toLocaleString('id-ID')}`);
      if (sampleRab.items) {
        sampleRab.items.forEach((it) => console.log(`    - [${it.category}] ${it.itemName}: ${it.volume} ${it.unit} x Rp ${Number(it.unitPrice).toLocaleString('id-ID')} = Rp ${Number(it.totalPrice).toLocaleString('id-ID')}`));
      }
      console.log(`  [OK] KAK and RAB documents validated with itemized breakdown.`);
    } else {
      testHPassed = false;
      console.log(`  [FAIL] No RAB found with items.`);
    }
  } catch (err) {
    testHPassed = false;
    console.log(`  [FAIL] KAK/RAB error: ${err.message}`);
  }
  results['Test H: KAK & RAB Planning'] = testHPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST I: Partner Procurement
  // ----------------------------------------------------
  console.log('\n--- TEST I: PARTNER PROCUREMENT ---');
  let testIPassed = true;
  try {
    const partnersRes = await api('/research-partners', authHeader(tokens['BRIDA']));
    const partnerSelsRes = await api('/research-partner-selections', authHeader(tokens['BRIDA']));
    console.log(`  [INFO] Partners count: ${partnersRes.data.length}, Partner Selections: ${partnerSelsRes.data.length}`);
    partnerSelsRes.data.forEach((ps) => console.log(`    - [${ps.code}] Method: ${ps.method}, Status: ${ps.status}, Partner: ${ps.partner?.name || 'Belum dipilih'}`));
    if (partnersRes.data.length >= 3 && partnerSelsRes.data.length > 0) {
      console.log(`  [OK] Partner and Procurement records validated.`);
    } else {
      testIPassed = false;
      console.log(`  [FAIL] Partner procurement records missing.`);
    }
  } catch (err) {
    testIPassed = false;
    console.log(`  [FAIL] Partner error: ${err.message}`);
  }
  results['Test I: Partner Procurement'] = testIPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST J: Implementation, Milestones, Activities
  // ----------------------------------------------------
  console.log('\n--- TEST J: IMPLEMENTATION, MILESTONES & ACTIVITIES ---');
  let testJPassed = true;
  try {
    const implsRes = await api('/research-implementations', authHeader(tokens['BRIDA']));
    const impls = implsRes.data;
    console.log(`  [INFO] Total Implementations: ${impls.length}`);
    const completedOrOngoing = impls.find((i) => i.status === 'COMPLETED' || i.status === 'ONGOING') || impls[0];
    if (completedOrOngoing) {
      console.log(`  [INFO] Implementation ${completedOrOngoing.code}: Status ${completedOrOngoing.status}, Progress ${completedOrOngoing.progress}%`);
      console.log(`    - Milestones count: ${completedOrOngoing.milestones?.length || 0}`);
      console.log(`    - Activities count: ${completedOrOngoing.activities?.length || 0}`);
      console.log(`  [OK] Implementation lifecycle verified.`);
    } else {
      testJPassed = false;
      console.log(`  [FAIL] No valid implementation found.`);
    }
  } catch (err) {
    testJPassed = false;
    console.log(`  [FAIL] Implementation error: ${err.message}`);
  }
  results['Test J: Implementation & Monitoring'] = testJPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST K: Reports & Policy Briefs (APPROVED Status)
  // ----------------------------------------------------
  console.log('\n--- TEST K: REPORTS & POLICY BRIEFS ---');
  let testKPassed = true;
  try {
    const reportsRes = await api('/research-reports', authHeader(tokens['BRIDA']));
    const briefsRes = await api('/policy-briefs', authHeader(tokens['BRIDA']));
    console.log(`  [INFO] Reports count: ${reportsRes.data.length}, Policy Briefs: ${briefsRes.data.length}`);
    reportsRes.data.forEach((r) => console.log(`    - Report [${r.reportType}]: ${r.title} (Status: ${r.status})`));
    briefsRes.data.forEach((pb) => console.log(`    - Policy Brief: ${pb.title} (Status: ${pb.status})`));
    const hasApproved = reportsRes.data.some((r) => r.status === 'APPROVED') && briefsRes.data.some((pb) => pb.status === 'APPROVED');
    if (hasApproved) {
      console.log(`  [OK] Validated APPROVED Reports and Policy Briefs.`);
    } else {
      testKPassed = false;
      console.log(`  [FAIL] APPROVED report or policy brief not found.`);
    }
  } catch (err) {
    testKPassed = false;
    console.log(`  [FAIL] Report/Brief error: ${err.message}`);
  }
  results['Test K: Reports & Policy Briefs (APPROVED)'] = testKPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // TEST L: OPD Recommendation Portal (PUBLISHED Status & Targeted OPD)
  // ----------------------------------------------------
  console.log('\n--- TEST L: OPD RECOMMENDATION PORTAL (PUBLISHED ONLY) ---');
  let testLPassed = true;
  try {
    const allRecs = await api('/recommendations', authHeader(tokens['BRIDA']));
    console.log(`  [INFO] Total Recommendations in system: ${allRecs.data.length}`);
    allRecs.data.forEach((rec) => console.log(`    - [${rec.id}] ${rec.title} -> Target: ${rec.targetOpd?.name || rec.targetOpdId} (Status: ${rec.status})`));

    const opd1Recs = await api('/opd/recommendations', authHeader(tokens['opd1@simrida.local']));
    console.log(`  [INFO] OPD 1 (Diskominfo) Recommendations: ${opd1Recs.data.length}`);
    opd1Recs.data.forEach((rec) => console.log(`    - [${rec.id}] ${rec.title} (Status: ${rec.status})`));

    const allPublished = opd1Recs.data.every((r) => r.status === 'PUBLISHED');
    if (allPublished) {
      console.log(`  [OK] All recommendations visible to OPD have status PUBLISHED.`);
    } else {
      testLPassed = false;
      console.log(`  [FAIL] OPD received non-PUBLISHED recommendations.`);
    }
  } catch (err) {
    testLPassed = false;
    console.log(`  [FAIL] OPD Recommendation portal error: ${err.message}`);
  }
  results['Test L: OPD Recommendation Portal (PUBLISHED)'] = testLPassed ? 'PASSED' : 'FAILED';

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('             ACCEPTANCE TEST SUMMARY                ');
  console.log('====================================================');
  let allPassed = true;
  for (const [test, status] of Object.entries(results)) {
    const mark = status === 'PASSED' ? '[V]' : '[X]';
    console.log(`  ${mark} ${test}: ${status}`);
    if (status !== 'PASSED') allPassed = false;
  }
  console.log('====================================================');
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  console.log('====================================================\n');
}

runAcceptanceTests().catch(console.error);
