/**
 * AI Service for Generating Policy Brief & Naskah Rekomendasi Kebijakan
 * Powered by OpenAI LLM (GPT-4o / GPT-4o-mini) with Comprehensive Multi-Document Evidence Integration
 * SIM-RIDA (Sistem Informasi Riset dan Inovasi Daerah) Kab. Mimika
 */

class AiPolicyBriefService {
  /**
   * Menghasilkan draf Policy Brief dan Naskah Rekomendasi Kebijakan
   * berbasis integrasi seluruh dokumen pendukung:
   * 1. Usulan Masalah & Lampiran OPD
   * 2. Hasil Validasi, Scoring, & Arahan Litbang BRIDA
   * 3. Kerangka Acuan Kerja (KAK) Terintegrasi
   * 4. Tim Peneliti, Berkas Kerja Lapangan, & Laporan Akhir Riset
   */
  async generatePolicyBriefDraft(study, customPrompt = '') {
    // 1. Ekstraksi Data Usulan Masalah (Tahap 1)
    const title = study.title || study.proposal?.title || 'Kajian Kebijakan Strategis Daerah';
    const opdName = study.proposal?.opd?.name || 'Perangkat Daerah Kabupaten Mimika';
    const opdCategory = study.proposal?.opd?.category || 'OPD Teknis';
    const category = study.proposal?.category || 'Tata Kelola Pemerintahan & Pembangunan Daerah';
    const problem = study.proposal?.problemStatement || '';
    const urgency = study.proposal?.urgencyReason || '';
    const strategicImpact = study.proposal?.strategicImpact || '';
    const urgencyLevel = study.proposal?.urgencyLevel || 'TINGGI';
    const expectedOutput = study.proposal?.expectedOutput || 'REKOMENDASI_KEBIJAKAN';
    const estimatedBudget = study.proposal?.estimatedBudget ? Number(study.proposal.estimatedBudget).toLocaleString('id-ID') : null;
    const estimatedDuration = study.proposal?.estimatedDuration || 3;
    
    // Dokumen Lampiran Usulan OPD
    const supportingDocs = Array.isArray(study.proposal?.supportingDocuments)
      ? study.proposal.supportingDocuments.map((d) => `${d.name} (${d.size || 'Lampiran Usulan'})`).join(', ')
      : '';

    // 2. Ekstraksi Data Validasi & Scoring BRIDA (Tahap 2)
    const verificationNotes = study.proposal?.adminVerification?.verificationNotes || '';
    const evaluatorNotes = study.proposal?.scoring?.evaluationNotes || '';
    const priorityCategory = study.proposal?.scoring?.priorityCategory || 'PRIORITAS_UTAMA';
    const researchField = study.proposal?.scoring?.researchField || 'SOSIAL_HUMANIORA';
    const kepalaNotes = study.proposal?.kepalaApproval?.notes || '';

    // 3. Ekstraksi Data KAK (Tahap 3)
    const kakBackground = study.kakDocument?.background || '';
    const kakObjectives = study.kakDocument?.objectives || '';
    const kakMethodology = study.kakDocument?.scopeAndMethodology || '';
    const kakTargetOutput = study.kakDocument?.targetOutput || expectedOutput;

    // 4. Ekstraksi Data Pelaksanaan & Laporan Akhir Riset (Tahap 4)
    const executionScheme = study.executionScheme || study.proposal?.scoring?.executionScheme || 'SWAKELOLA';
    const fiscalYear = study.fiscalYear || new Date().getFullYear();
    const allocatedBudget = study.allocatedBudget ? Number(study.allocatedBudget).toLocaleString('id-ID') : null;
    
    // Susunan Tim Peneliti & Institusi
    const teamMembersList = Array.isArray(study.teamMembers) && study.teamMembers.length > 0
      ? study.teamMembers.map((m) => `${m.name} (${m.role} - ${m.institution})`).join('; ')
      : 'Tim Peneliti BRIDA Kabupaten Mimika';

    // Berkas Kerja Lapangan (Data Mentah, Transkrip FGD, Laporan Antara)
    const workingDocsList = Array.isArray(study.workingDocuments) && study.workingDocuments.length > 0
      ? study.workingDocuments.map((w) => `${w.title} [${w.type}]`).join(', ')
      : '';

    // Dokumen Laporan Akhir Riset
    const finalReportName = study.finalReportName || '';
    const finalReportSummary = study.finalReportSummary || '';
    const cooperationDocName = study.cooperationDocName || '';

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL && !process.env.OPENAI_MODEL.includes('gpt-5')
      ? process.env.OPENAI_MODEL
      : 'gpt-4o-mini';

    const fullContext = {
      title,
      opdName,
      opdCategory,
      category,
      problem,
      urgency,
      strategicImpact,
      urgencyLevel,
      expectedOutput,
      estimatedBudget,
      estimatedDuration,
      supportingDocs,
      verificationNotes,
      evaluatorNotes,
      priorityCategory,
      researchField,
      kepalaNotes,
      kakBackground,
      kakObjectives,
      kakMethodology,
      kakTargetOutput,
      executionScheme,
      fiscalYear,
      allocatedBudget,
      teamMembersList,
      workingDocsList,
      finalReportName,
      finalReportSummary,
      cooperationDocName,
    };

    // 1. Coba Generate via OpenAI jika API Key tersedia
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        console.log(`[OpenAI Policy Brief] Mengirim seluruh berkas bukti pendukung ke OpenAI (${model}) untuk topik: "${title}"`);
        const openAiResult = await this.callOpenAiLlm({
          apiKey,
          model,
          context: fullContext,
          customPrompt,
        });

        if (openAiResult && openAiResult.executiveSummary && openAiResult.keyFindings && openAiResult.policyActions) {
          console.log(`[OpenAI Policy Brief] Berhasil menghasilkan Policy Brief berbasis seluruh bukti dokumen!`);
          return this.normalizeAiResult(openAiResult, title, opdName);
        }
      } catch (openAiError) {
        console.warn(`[OpenAI Policy Brief Warning] Gagal memanggil OpenAI (${openAiError.message}). Menggunakan generator kontekstual cerdas berbasis seluruh dokumen.`);
      }
    } else {
      console.log(`[OpenAI Policy Brief] OPENAI_API_KEY tidak dikonfigurasi, menggunakan generator kontekstual berbasis dokumen pendukung.`);
    }

    // 2. Fallback Template Cerdas jika OpenAI offline
    return this.generateFallbackTemplate(fullContext, customPrompt);
  }

  /**
   * Memanggil OpenAI API Chat Completions dengan seluruh evidence context
   */
  async callOpenAiLlm({ apiKey, model, context, customPrompt }) {
    const systemPrompt = `Anda adalah Ahli Analis Kebijakan Utama dan Peneliti Senior Badan Riset dan Inovasi Daerah (BRIDA) Kabupaten Mimika, Papua Tengah.
Tugas Anda adalah merumuskan Naskah Rekomendasi Kebijakan / Policy Brief Eksekutif Resmi yang tajam, kredibel, berbasis bukti ilmiah menyeluruh (evidence-based policy), kontekstual dengan kondisi sosial-geografis Kabupaten Mimika, serta siap ditandatangani oleh Kepala BRIDA dan diserahkan kepada Bupati Mimika dan Kepala OPD sasaran.

INTEGRASI DOKUMEN BUKTI YANG DISEDIAKAN:
Anda akan menerima data menyeluruh dari 4 tahapan siklus riset:
1. Usulan Masalah, Urgensi, dan Dokumen Lampiran OPD.
2. Hasil Validasi 5 Pilar BRIDA & Catatan Telaah Tim Evaluator Litbang.
3. Kerangka Acuan Kerja (KAK): Latar Belakang Ilmiah, Maksud/Tujuan, Metodologi & Ruang Lingkup.
4. Tim Peneliti Ahli, Berkas Kerja Lapangan (Data mentah/FGD/Laporan antara), dan Laporan Akhir Riset.

PANDUAN STRUKTUR POLICY BRIEF RESMI:
1. "title": Rumuskan judul Policy Brief yang formal, presisi, dan mencerminkan solusi regulasi konkret (contoh: "Policy Brief: Strategi Akselerasi ... Melalui Regulasi ... di Kabupaten Mimika").
2. "executiveSummary": Uraikan Ringkasan Eksekutif (2-3 paragraf berbobot) yang memadukan latar belakang masalah dari OPD, metodologi riset KAK, hasil kajian lapangan, serta inti usulan regulasi/intervensi.
3. "keyFindings": Jabarkan 3-5 poin Temuan Kunci Riset & Fakta Lapangan yang memuat:
   - Bukti empiris dari laporan akhir / berkas kerja lapangan.
   - Analisis akar masalah struktural, kelembagaan, regulasi, atau keterbatasan infrastruktur di Mimika.
   - Dampak terhadap target RPJMD jika masalah tidak segera diintervensi.
4. "policyActions": Rumuskan Rekomendasi Kebijakan & Rencana Aksi Terukur yang dibagi dalam 3 horizon implementasi:
   - JANGKA PENDEK (0-6 Bulan): Penerbitan payung hukum operasional (Perbup/Kepbup/Surat Edaran/SOP Layanan), pembentukan Tim Koordinasi/Pokja Terpadu.
   - JANGKA MENENGAH (6-18 Bulan): Alokasi pos anggaran APBD/DPA OPD, standardisasi program, pemenuhan sarpras, dan peningkatan kapasitas SDM.
   - JANGKA PANJANG (18-36 Bulan): Pelembagaan inovasi, integrasi ke Renstra OPD & RPJMD, evaluasi dampak terukur berkelanjutan.
5. "targetPolicyType": Pilih salah satu nilai enum: [DRAFT_PERBUP, DRAFT_PERDA, SE_BUPATI, SOP_LAYANAN, RENCANA_AKSI_DAERAH, PETUNJUK_TEKNIS].
6. "impactLevel": Pilih salah satu: [STRATEGIS_DAERAH, SEKTORAL, OPERASIONAL].
7. "targetOpdNames": Cantumkan OPD pengusul dan OPD pendukung terkait di Pemkab Mimika (misal: "${context.opdName}, Bappeda, Bagian Hukum Setda Mimika").

OUTPUT WAJIB DALAM FORMAT JSON DENGAN STRUKTUR BERIKUT:
{
  "title": "...",
  "executiveSummary": "...",
  "keyFindings": "1. ...\n2. ...\n3. ...",
  "policyActions": "1. JANGKA PENDEK (0-6 Bulan):\n- ...\n2. JANGKA MENENGAH (6-18 Bulan):\n- ...\n3. JANGKA PANJANG (18-36 Bulan):\n- ...",
  "targetPolicyType": "DRAFT_PERBUP",
  "impactLevel": "STRATEGIS_DAERAH",
  "targetOpdNames": "${context.opdName}, Bappeda, Bagian Hukum Setda Kab. Mimika"
}`;

    const userContent = `BERKAS LENGKAP BUKTI RISET DAERAH KABUPATEN MIMIKA:

=== 1. TAHAP USULAN MASALAH & DOKUMEN PENGUSUL ===
- Judul Agenda Riset: ${context.title}
- Instansi Pengusul: ${context.opdName} (${context.opdCategory})
- Bidang/Kategori: ${context.category}
- Pokok Permasalahan Lapangan: ${context.problem || '(Belum dirinci)'}
- Urgensi Penanganan: ${context.urgency || '(Belum dirinci)'}
- Dampak Terhadap Target RPJMD Mimika: ${context.strategicImpact || 'Peningkatan daya saing daerah & kualitas pelayanan masyarakat'}
- Target Luaran yang Diharapkan: ${context.expectedOutput}
- Dokumen Lampiran Pengusul: ${context.supportingDocs || 'Dokumen telaah internal OPD'}

=== 2. TAHAP VALIDASI & TELAAH LITBANG BRIDA ===
- Catatan Verifikasi Kelayakan BRIDA: ${context.verificationNotes || 'Memenuhi kriteria kejelasan masalah & keselarasan RPJMD'}
- Catatan Evaluasi Tim Penilai Litbang: ${context.evaluatorNotes || 'Prioritas utama riset terapan'}
- Kategori Prioritas & Bidang: ${context.priorityCategory} | Bidang ${context.researchField}
- Catatan/Arahan Kepala BRIDA: ${context.kepalaNotes || 'Disetujui untuk dilaksanakan dan ditindaklanjuti menjadi rekomendasi kebijakan'}

=== 3. TAHAP KERANGKA ACUAN KERJA (KAK) ===
- Latar Belakang Ilmiah KAK: ${context.kakBackground || '-'}
- Maksud & Tujuan Riset KAK: ${context.kakObjectives || '-'}
- Metodologi & Ruang Lingkup KAK: ${context.kakMethodology || '-'}
- Target Output KAK: ${context.kakTargetOutput}

=== 4. TAHAP PELAKSANAAN RISET & DOKUMEN LAPANGAN ===
- Skema Pelaksanaan: ${context.executionScheme} (Tahun Anggaran: ${context.fiscalYear})
- Tim Peneliti / Institusi Pelaksana: ${context.teamMembersList}
- Berkas Kerja & Data Lapangan: ${context.workingDocsList || 'Tabulasi Data Primer & Laporan Kemajuan'}
- Judul Dokumen Laporan Akhir: ${context.finalReportName || 'Laporan Akhir Hasil Riset Terapan'}
- Ringkasan Intisari Laporan Akhir: ${context.finalReportSummary || 'Telah dilakukan analisis empiris dan pemetaan komprehensif terhadap variabel masalah di wilayah Kabupaten Mimika.'}
${context.cooperationDocName ? `- Dokumen Perjanjian Kerja Sama (PKS): ${context.cooperationDocName}` : ''}

${customPrompt ? `=== INSTRUKSI KHUSUS ANALISIS KEBIJAKAN ===\n${customPrompt}\n` : ''}

Tolong rumuskan naskah Policy Brief & Rekomendasi Kebijakan yang sangat komprehensif, berbasis seluruh bukti di atas, dan siap diajukan ke Kepala BRIDA dalam format JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI mengembalikan respons kosong.');
    }

    return JSON.parse(content);
  }

  /**
   * Normalisasi hasil AI agar sesuai standar enum dan struktur database
   */
  normalizeAiResult(aiResult, fallbackTitle, opdName) {
    const validPolicyTypes = ['DRAFT_PERBUP', 'DRAFT_PERDA', 'SE_BUPATI', 'SOP_LAYANAN', 'RENCANA_AKSI_DAERAH', 'PETUNJUK_TEKNIS'];
    const validImpactLevels = ['STRATEGIS_DAERAH', 'SEKTORAL', 'OPERASIONAL'];

    const targetPolicyType = validPolicyTypes.includes(aiResult.targetPolicyType)
      ? aiResult.targetPolicyType
      : 'DRAFT_PERBUP';

    const impactLevel = validImpactLevels.includes(aiResult.impactLevel)
      ? aiResult.impactLevel
      : 'STRATEGIS_DAERAH';

    return {
      title: aiResult.title || `Policy Brief: Rekomendasi Kebijakan ${fallbackTitle}`,
      executiveSummary: aiResult.executiveSummary || '',
      keyFindings: aiResult.keyFindings || '',
      policyActions: aiResult.policyActions || '',
      targetPolicyType,
      impactLevel,
      targetOpdNames: aiResult.targetOpdNames || `${opdName}, BAPPEDA Kab. Mimika`,
    };
  }

  /**
   * Generator Kontekstual Cerdas jika koneksi OpenAI tidak aktif,
   * memanfaatkan seluruh data dokumen nyata yang ada.
   */
  generateFallbackTemplate(ctx, customPrompt = '') {
    const title = ctx.title || 'Kajian Riset dan Inovasi Daerah';
    const opdName = ctx.opdName || 'Perangkat Daerah Terkait';
    const problem = ctx.problem || 'Terdapat kesenjangan integrasi data, hambatan operasional, dan perlunya payung hukum formal di Kabupaten Mimika.';
    const urgency = ctx.urgency || 'Kebutuhan mendesak penetapan regulasi pendukung pencapaian target RPJMD Kabupaten Mimika.';
    const strategicImpact = ctx.strategicImpact || 'Peningkatan efektivitas tata kelola dan kesejahteraan masyarakat di Kabupaten Mimika.';
    const team = ctx.teamMembersList || 'Tim Peneliti BRIDA Mimika';
    const finalRep = ctx.finalReportSummary || 'Hasil analisis riset terapan menunjukkan pentingnya standardisasi prosedur dan penguatan alokasi sumber daya.';

    const recTitle = `Policy Brief: Rekomendasi Kebijakan Terkait ${title} di Kabupaten Mimika`;

    const executiveSummary = `Kajian riset mengenai "${title}" yang diinisiasi oleh ${opdName} dan dilaksanakan oleh ${team} telah merampungkan seluruh tahapan penyelidikan ilmiah dan telaah empiris lapangan di Kabupaten Mimika pada Tahun Anggaran ${ctx.fiscalYear}.

Berdasarkan Kerangka Acuan Kerja (KAK) dan Laporan Akhir Riset, ditemukan bahwa penyelesaian persoalan ini membutuhkan intervensi regulasi yang kuat dan terpadu. Naskah Policy Brief ini merumuskan arah kebijakan strategis berbasis bukti (evidence-based) untuk mengatasi hambatan struktural, mengoptimalkan koordinasi antar perangkat daerah, serta mempercepat pencapaian target pembangunan prioritas daerah Kabupaten Mimika.`;

    const keyFindings = `1. Temuan Bukti Empiris & Laporan Akhir Riset:
${finalRep}

2. Pokok Hambatan Struktural & Kesenjangan Lapangan:
${problem}

3. Urgensi Intervensi Regulasi & Kebijakan:
${urgency}

4. Dampak Strategis Terhadap Target RPJMD Mimika:
${strategicImpact}
${ctx.workingDocsList ? `\n(Didukung oleh telaah berkas kerja lapangan: ${ctx.workingDocsList})` : ''}`;

    const policyActions = `1. JANGKA PENDEK (0 - 6 Bulan):
- Penerbitan Peraturan Bupati / Keputusan Bupati Mimika tentang Standarisasi dan Pedoman Pelaksanaan terkait ${title}.
- Pembentukan Kelompok Kerja (Pokja) / Tim Koordinasi Terpadu melibatkan ${opdName}, BAPPEDA, dan Bagian Hukum Setda Kabupaten Mimika.
- Penyusunan dan penetapan Standar Operasional Prosedur (SOP) Layanan Terpadu.

2. JANGKA MENENGAH (6 - 18 Bulan):
- Alokasi pos anggaran prioritas pada APBD/DPA ${opdName} untuk implementasi program intervensi teknis.
- Penguatan kapasitas teknis SDM aparatur dan pengadaan sarana prasarana pendukung di distrik prioritas.
- Pelaksanaan uji coba operasional (pilot implementation) disertai pemantauan indikator kinerja secara berkala.

3. JANGKA PANJANG (18 - 36 Bulan):
- Integrasi permanen indikator capaian ke dalam dokumen Renstra Perangkat Daerah dan RPJMD Kabupaten Mimika.
- Evaluasi dampak menyeluruh dan pelembagaan inovasi secara berkelanjutan melalui ekosistem SIM-RIDA Mimika.`;

    return {
      title: recTitle,
      executiveSummary,
      keyFindings,
      policyActions,
      targetPolicyType: 'DRAFT_PERBUP',
      impactLevel: 'STRATEGIS_DAERAH',
      targetOpdNames: `${opdName}, BAPPEDA, Bagian Hukum Setda Kab. Mimika`,
    };
  }
}

module.exports = new AiPolicyBriefService();
