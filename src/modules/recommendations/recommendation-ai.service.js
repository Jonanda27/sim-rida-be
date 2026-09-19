/**
 * AI Service for Generating Policy Brief & Naskah Rekomendasi Kebijakan
 * Powered by OpenAI LLM (GPT-4o / GPT-4o-mini) with Comprehensive Multi-Document Evidence Integration
 * & Strict Zero-Tolerance Document Relevance & Anti-Hallucination Filtering
 * SIM-RIDA (Sistem Informasi Riset dan Inovasi Daerah) Kab. Mimika
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class AiPolicyBriefService {
  /**
   * Menguji relevansi semantik dan substantif sebuah dokumen terhadap pokok permasalahan
   */
  isDocumentRelevantToProblem(docName, docSubstance, context) {
    if (!docName || typeof docName !== 'string') return false;

    // Normalisasi teks dokumen: hapus ekstensi file, simbol pemisah, dan ubah ke lowercase
    const cleanDocName = docName
      .replace(/\.[a-zA-Z0-9]+$/g, '')
      .replace(/[_\-./\\()]/g, ' ')
      .toLowerCase();

    const combinedDocText = `${cleanDocName} ${docSubstance || ''}`.toLowerCase();

    // Kata-kata umum administratif non-spesifik (bukan kata kunci tematik riset)
    const genericStopwords = new Set([
      'dokumen', 'berkas', 'file', 'lampiran', 'surat', 'sk', 'pks', 'perjanjian',
      'laporan', 'riset', 'kajian', 'data', 'mentah', 'transkrip', 'fgd', 'final',
      'draft', 'draf', 'usulan', 'proposal', 'kak', 'tor', 'kerangka', 'acuan', 'kerja',
      'kabupaten', 'mimika', 'papua', 'tengah', 'pemkab', 'dinas', 'badan', 'opd',
      'tahun', 'anggaran', 'ta', '2024', '2025', '2026', '2027', 'new', 'update',
      'revisi', 'pdf', 'xlsx', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'zip', 'rar',
      'tugas', 'pegawai', 'undangan', 'notulensi', 'absen', 'kehadiran', 'sppd',
      'perjalanan', 'kwitansi', 'honor', 'rka', 'dpa', 'nota', 'disposisi', 'keputusan',
      'izin', 'dan', 'yang', 'untuk', 'dari', 'dalam', 'pada', 'oleh', 'dengan', 'ini',
      'itu', 'atau', 'adalah', 'sebagai', 'akan', 'telah', 'bisa', 'dapat', 'lebih',
      'kami', 'kita', 'saya', 'terkait', 'tentang', 'mengenai', 'atas', 'nomor', 'no'
    ]);

    // Ekstraksi kata bermakna dari nama & substansi dokumen
    const docWords = combinedDocText
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w) => w.length >= 3 && !genericStopwords.has(w));

    // Jika berkas hanya terdiri dari kata administratif umum tanpa kata tematik spesifik
    if (docWords.length === 0) {
      return false;
    }

    // Bangun korpus kata kunci dari permasalahan, judul, urgensi, dan kategori usulan
    const contextCorpus = `${context.problem || ''} ${context.title || ''} ${context.category || ''} ${context.urgency || ''} ${context.opdName || ''}`.toLowerCase();

    // Uji apakah ada kata kunci substantif dokumen yang cocok dengan konteks permasalahan
    const matchesKeyword = docWords.some((word) => {
      if (contextCorpus.includes(word)) return true;
      // Stemming parsial jika panjang kata >= 4 (misal: "stunting", "wisata", "gizi")
      if (word.length >= 4) {
        const root = word.slice(0, 4);
        return contextCorpus.includes(root);
      }
      return false;
    });

    return matchesKeyword;
  }

  /**
   * Menghasilkan draf Policy Brief dan Naskah Rekomendasi Kebijakan
   * berbasis 4 Bagian Baku:
   * 1. Ringkasan Eksekutif (Executive Summary)
   * 2. Latar Belakang (Background)
   * 3. Rekomendasi Kebijakan (Policy Recommendations)
   * 4. Kesimpulan (Conclusion)
   * Serta mengkorelasikan dokumen HANYA jika relevan dengan permasalahan yang dihadapi.
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

    // Konteks dasar untuk uji relevansi
    const baseContext = { problem, title, category, urgency, opdName };

    // 2. Evaluasi Seluruh Dokumen yang Diunggah: Pisahkan Dokumen Relevan vs Tidak Relevan
    const verifiedRelevantDocs = [];
    const irrelevantDocs = [];

    // A. Uji Lampiran Usulan OPD
    if (Array.isArray(study.proposal?.supportingDocuments) && study.proposal.supportingDocuments.length > 0) {
      for (const doc of study.proposal.supportingDocuments) {
        const docName = doc.name || '';
        const isRel = this.isDocumentRelevantToProblem(docName, '', baseContext);
        if (isRel) {
          verifiedRelevantDocs.push({
            type: 'Lampiran Usulan OPD',
            name: docName,
            detail: `${docName} (${doc.size || 'Berkas Lampiran'})`,
          });
        } else {
          irrelevantDocs.push({
            type: 'Lampiran Usulan OPD',
            name: docName,
            reason: 'Nama atau isi berkas tidak berkaitan dengan pokok permasalahan usulan',
          });
        }
      }
    }

    // B. Uji Dokumen KAK
    let kakBackground = '';
    let kakObjectives = '';
    let kakMethodology = '';
    let kakTargetOutput = expectedOutput;

    if (study.kakDocument) {
      kakBackground = study.kakDocument.background || '';
      kakObjectives = study.kakDocument.objectives || '';
      kakMethodology = study.kakDocument.scopeAndMethodology || '';
      kakTargetOutput = study.kakDocument.targetOutput || expectedOutput;

      const isKakRel = this.isDocumentRelevantToProblem(
        kakTargetOutput || 'KAK',
        `${kakBackground} ${kakObjectives}`,
        baseContext
      );
      if (isKakRel) {
        const kakName = `Kerangka_Acuan_Kerja_KAK_${study.proposal?.code || 'RIS'}.pdf`;
        verifiedRelevantDocs.push({
          type: 'Kerangka Acuan Kerja (KAK)',
          name: kakName,
          detail: `Kerangka Acuan Kerja (KAK): ${kakName}`,
        });
      } else if (kakBackground.length > 30) {
        irrelevantDocs.push({
          type: 'Kerangka Acuan Kerja (KAK)',
          name: 'Draf KAK',
          reason: 'Substansi KAK tidak selaras dengan pokok permasalahan usulan',
        });
      }
    }

    // C. Uji Legalitas SK / PKS Kerja Sama
    const cooperationDocName = study.cooperationDocName || '';
    if (cooperationDocName) {
      const isCoopRel = this.isDocumentRelevantToProblem(cooperationDocName, '', baseContext);
      if (isCoopRel) {
        verifiedRelevantDocs.push({
          type: 'Legalitas SK / PKS',
          name: cooperationDocName,
          detail: cooperationDocName,
        });
      } else {
        irrelevantDocs.push({
          type: 'Legalitas SK / PKS',
          name: cooperationDocName,
          reason: 'Legalitas/SK tidak spesifik untuk tema permasalahan usulan',
        });
      }
    }

    // D. Uji Berkas Kerja Lapangan
    if (Array.isArray(study.workingDocuments) && study.workingDocuments.length > 0) {
      for (const w of study.workingDocuments) {
        const docName = w.title || '';
        const isWorkRel = this.isDocumentRelevantToProblem(docName, w.type, baseContext);
        if (isWorkRel) {
          verifiedRelevantDocs.push({
            type: 'Berkas Kerja Riset',
            name: docName,
            detail: `${docName} [${w.type || 'Data Lapangan'}]`,
          });
        } else {
          irrelevantDocs.push({
            type: 'Berkas Kerja Riset',
            name: docName,
            reason: 'Berkas kerja tidak berkaitan dengan tema permasalahan',
          });
        }
      }
    }

    // E. Uji Laporan Akhir Riset
    const finalReportName = study.finalReportName || '';
    const finalReportSummary = study.finalReportSummary || '';
    if (finalReportName) {
      const isRepRel = this.isDocumentRelevantToProblem(finalReportName, finalReportSummary, baseContext);
      if (isRepRel) {
        verifiedRelevantDocs.push({
          type: 'Laporan Akhir Riset',
          name: finalReportName,
          detail: `${finalReportName}${finalReportSummary ? ` - ${finalReportSummary.slice(0, 100)}...` : ''}`,
        });
      } else {
        irrelevantDocs.push({
          type: 'Laporan Akhir Riset',
          name: finalReportName,
          reason: 'Laporan akhir terunggah tidak berkaitan dengan masalah yang diteliti',
        });
      }
    }

    // 3. Ekstraksi Data Validasi & Scoring BRIDA (Tahap 2)
    const verificationNotes = study.proposal?.adminVerification?.verificationNotes || '';
    const evaluatorNotes = study.proposal?.scoring?.evaluationNotes || '';
    const priorityCategory = study.proposal?.scoring?.priorityCategory || 'PRIORITAS_UTAMA';
    const researchField = study.proposal?.scoring?.researchField || 'SOSIAL_HUMANIORA';
    const kepalaNotes = study.proposal?.kepalaApproval?.notes || '';

    // 4. Ekstraksi Data Pelaksanaan Riset
    const executionScheme = study.executionScheme || study.proposal?.scoring?.executionScheme || 'SWAKELOLA';
    const fiscalYear = study.fiscalYear || new Date().getFullYear();
    const allocatedBudget = study.allocatedBudget ? Number(study.allocatedBudget).toLocaleString('id-ID') : null;
    
    // Susunan Tim Peneliti & Institusi
    const teamMembersList = Array.isArray(study.teamMembers) && study.teamMembers.length > 0
      ? study.teamMembers.map((m) => `${m.name} (${m.role} - ${m.institution})`).join('; ')
      : 'Tim Peneliti BRIDA Kabupaten Mimika';

    // Metadata dokumen relevan vs tidak relevan untuk AI
    const relevantDocsText = verifiedRelevantDocs.length > 0
      ? verifiedRelevantDocs.map((d) => `- ${d.type}: ${d.detail}`).join('\n')
      : '(TIDAK ADA DOKUMEN PENDUKUNG YANG RELEVAN TERUNGGAH)';

    const irrelevantDocsWarning = irrelevantDocs.length > 0
      ? `PERINGATAN KERAS: Berkas berikut diunggah ke sistem namun TERBUKTI TIDAK BERKAITAN dengan permasalahan (${irrelevantDocs.map((d) => d.name).join(', ')}). DILARANG KERAS MENGUTIP ATAU MENYEBUT BERKAS INI DI BAGIAN MANAPUN DALAM POLICY BRIEF!`
      : '';

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
      finalReportName,
      finalReportSummary,
      cooperationDocName,
      relevantDocsText,
      irrelevantDocsWarning,
      verifiedRelevantDocs,
      irrelevantDocs,
    };

    // 5. Coba Generate via OpenAI jika API Key tersedia
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        console.log(`[OpenAI Policy Brief] Mengirim data bukti ke OpenAI (${model}) untuk topik: "${title}" (Dokumen Relevan: ${verifiedRelevantDocs.length}, Tidak Relevan Diabaikan: ${irrelevantDocs.length})`);
        const openAiResult = await this.callOpenAiLlm({
          apiKey,
          model,
          context: fullContext,
          customPrompt,
        });

        if (
          openAiResult &&
          openAiResult.executiveSummary &&
          openAiResult.background &&
          openAiResult.policyRecommendations
        ) {
          console.log(`[OpenAI Policy Brief] Berhasil menghasilkan Policy Brief 4-Bagian dengan uji relevansi berkas!`);
          return this.normalizeAiResult(openAiResult, title, opdName, verifiedRelevantDocs, irrelevantDocs);
        }
      } catch (openAiError) {
        console.warn(`[OpenAI Policy Brief Warning] Gagal memanggil OpenAI (${openAiError.message}). Menggunakan generator kontekstual cerdas anti-halusinasi.`);
      }
    } else {
      console.log(`[OpenAI Policy Brief] OPENAI_API_KEY tidak dikonfigurasi, menggunakan generator kontekstual cerdas berbasis dokumen relevan.`);
    }

    // 6. Fallback Template Cerdas jika OpenAI offline
    return this.generateFallbackTemplate(fullContext, customPrompt, verifiedRelevantDocs);
  }

  /**
   * Memanggil OpenAI API Chat Completions dengan aturan ketat zero-tolerance anti-halusinasi
   */
  async callOpenAiLlm({ apiKey, model, context, customPrompt }) {
    const systemPrompt = `Anda adalah Ahli Analis Kebijakan Utama dan Peneliti Senior Badan Riset dan Inovasi Daerah (BRIDA) Kabupaten Mimika, Papua Tengah.
Tugas Anda adalah merumuskan Naskah Rekomendasi Kebijakan / Policy Brief Eksekutif Resmi yang objektif, faktual, berbasis bukti ilmiah (evidence-based policy), kontekstual dengan kondisi sosial-geografis Kabupaten Mimika, serta siap disahkan secara resmi oleh Kepala BRIDA dan diserahkan kepada Bupati Mimika serta OPD terkait.

FORMAT WAJIB POLICY BRIEF TERDIRI DARI 4 BAGIAN BAKU:
1. "executiveSummary" (1. Ringkasan Eksekutif):
   Ringkasan komprehensif (2-3 paragraf) yang memadukan latar belakang masalah dari OPD, metodologi riset, temuan utama, dan inti rekomendasi kebijakan.
2. "background" (2. Latar Belakang):
   Uraian mendalam mengenai konteks masalah riil di Kabupaten Mimika, landasan hukum/yuridis yang relevan, akar hambatan operasional, dan urgensi penanganan bagi perangkat daerah.
3. "policyRecommendations" (3. Rekomendasi Kebijakan):
   Butir-butir arahan rekomendasi kebijakan konkret, terukur, dan operasional bagi OPD sasaran (opsi regulasi daerah [Perbup/Perda], pembagian peran antar-OPD, dan alternatif langkah aksi teknis).
4. "conclusion" (4. Kesimpulan):
   Sintesis akhir yang menegaskan dampak strategis implementasi rekomendasi terhadap target RPJMD Mimika serta implikasi/risiko yang timbul jika rekomendasi tidak segera ditindaklanjuti.

=== ATURAN MUTLAK ZERO-TOLERANCE ANTI-HALUSINASI BERKAS DOKUMEN ===
1. POKOK PERMASALAHAN RIIL YANG DIHADAPI DAERAH:
   "${context.problem}"
2. JUDUL USULAN:
   "${context.title}"
3. KATEGORI BIDANG:
   "${context.category}"

STATUS KETERSEDIAAN DOKUMEN TERUNGGAH:
- Dokumen yang TERBUKTI RELEVAN dengan permasalahan di atas:
${context.relevantDocsText}
${context.irrelevantDocsWarning ? `\n- ${context.irrelevantDocsWarning}` : ''}

ATURAN PERILAKU ANALISIS DOKUMEN:
a. DILARANG KERAS MENGUTIP ATAU MENYEBUT DOKUMEN YANG TIDAK RELEVAN:
   Jika ada dokumen yang tidak berkaitan dengan pokok permasalahan di atas (atau tercantum dalam daftar berkas yang diabaikan/tidak relevan):
   - DILARANG KERAS MENYEBUT, MENGUTIP, ATAU MEMBAHAS NAMA BERKAS TERSEBUT di bagian manapun dalam naskah Policy Brief (Ringkasan Eksekutif, Latar Belakang, Rekomendasi, maupun Kesimpulan)!
   - JANGAN PERNAH berhalusinasi seolah-olah dokumen yang tidak relevan tersebut adalah acuan riset atau dasar rekomendasi!
   - JANGAN cantumkan dokumen yang tidak relevan tersebut pada 'correlatedDocs'!
b. HANYA DOKUMEN YANG TERBUKTI RELEVAN yang boleh dirujuk secara ilmiah dan dicantumkan pada 'correlatedDocs'.
c. JIKA TIDAK ADA DOKUMEN YANG RELEVAN (atau dokumen pendukung tidak ada / tidak sesuai):
   - Anda WAJIB BERTINDAK 100% SECARA MANDIRI melengkapi naskah Policy Brief 4 Bagian ini secara akademis, kredibel, dan aplikatif sesuai fakta dan data riil Kabupaten Mimika.
   - JANGAN SEBUT ATAU KLAIM DOKUMEN APAPUN di naskah jika memang tidak ada dokumen yang relevan!
   - Kolom 'correlatedDocs' WAJIB bernilai persis: "Telaah mandiri berbasis pokok permasalahan riil daerah (tidak ada berkas pendukung terunggah yang relevan)."

OUTPUT WAJIB DALAM FORMAT JSON DENGAN STRUKTUR BERIKUT:
{
  "title": "Policy Brief: ... di Kabupaten Mimika",
  "executiveSummary": "...",
  "background": "...",
  "policyRecommendations": "1. ...\n2. ...\n3. ...",
  "conclusion": "...",
  "correlatedDocs": "...",
  "targetPolicyType": "DRAFT_PERBUP",
  "impactLevel": "STRATEGIS_DAERAH",
  "targetOpdNames": "${context.opdName}, BAPPEDA, Bagian Hukum Setda Kab. Mimika"
}`;

    const userContent = `DATA USULAN RISET DAERAH KABUPATEN MIMIKA:

=== 1. USULAN PERMASALAHAN DAERAH ===
- Judul Usulan: ${context.title}
- Instansi Pengusul: ${context.opdName} (${context.opdCategory})
- Bidang/Kategori: ${context.category}
- Pokok Permasalahan Lapangan: ${context.problem || '(Belum dirinci)'}
- Urgensi Penanganan: ${context.urgency || '(Belum dirinci)'}
- Dampak Terhadap Target RPJMD Mimika: ${context.strategicImpact || 'Peningkatan daya saing daerah & kualitas pelayanan masyarakat'}
- Target Luaran yang Diharapkan: ${context.expectedOutput}

=== 2. CATATAN TELAAH LITBANG BRIDA ===
- Catatan Verifikasi Kelayakan BRIDA: ${context.verificationNotes || 'Memenuhi kriteria kejelasan masalah & keselarasan RPJMD'}
- Catatan Evaluasi Tim Penilai Litbang: ${context.evaluatorNotes || 'Prioritas utama riset terapan'}
- Kategori Prioritas & Bidang: ${context.priorityCategory} | Bidang ${context.researchField}
- Catatan/Arahan Kepala BRIDA: ${context.kepalaNotes || 'Disetujui untuk dilaksanakan dan ditindaklanjuti menjadi rekomendasi kebijakan'}

=== 3. PELAKSANAAN RISET ===
- Skema Pelaksanaan: ${context.executionScheme} (Tahun Anggaran: ${context.fiscalYear})
- Tim Peneliti: ${context.teamMembersList}

=== 4. BUKTI BERKAS RUJUKAN YANG TERBUKTI RELEVAN ===
${context.relevantDocsText}
${context.irrelevantDocsWarning ? `\n${context.irrelevantDocsWarning}` : ''}

${customPrompt ? `=== INSTRUKSI KHUSUS ANALISIS KEBIJAKAN ===\n${customPrompt}\n` : ''}

Rumuskan Policy Brief resmi 4 Bagian (Ringkasan Eksekutif, Latar Belakang, Rekomendasi Kebijakan, Kesimpulan). Ingat aturan mutlak: Jika dokumen tidak relevan dengan permasalahan, JANGAN PERNAH disebut atau dijadikan acuan. Bertindaklah 100% mandiri secara saintifik tanpa halusinasi!`;

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
        temperature: 0.5,
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
   * Normalisasi hasil AI dan pembersihan aktif dari halusinasi berkas tidak relevan
   */
  normalizeAiResult(aiResult, fallbackTitle, opdName, verifiedRelevantDocs = [], irrelevantDocs = []) {
    const validPolicyTypes = ['DRAFT_PERBUP', 'DRAFT_PERDA', 'SE_BUPATI', 'SOP_LAYANAN', 'RENCANA_AKSI_DAERAH', 'PETUNJUK_TEKNIS'];
    const validImpactLevels = ['STRATEGIS_DAERAH', 'SEKTORAL', 'OPERASIONAL'];

    const targetPolicyType = validPolicyTypes.includes(aiResult.targetPolicyType)
      ? aiResult.targetPolicyType
      : 'DRAFT_PERBUP';

    const impactLevel = validImpactLevels.includes(aiResult.impactLevel)
      ? aiResult.impactLevel
      : 'STRATEGIS_DAERAH';

    let executiveSummary = aiResult.executiveSummary || '';
    let background = aiResult.background || '';
    let policyRecommendations = aiResult.policyRecommendations || '';
    let conclusion = aiResult.conclusion || 'Penerapan rekomendasi kebijakan ini memerlukan komitmen terpadu dari seluruh perangkat daerah terkait demi tercapainya target pembangunan daerah Kabupaten Mimika.';
    let correlatedDocs = aiResult.correlatedDocs || '';

    // PEMBERSIHAN AKTIF (Anti-Hallucination Sanitizer):
    // Jika AI secara tidak sengaja menyebut nama berkas yang telah diklasifikasikan TIDAK RELEVAN, bersihkan sebutan tersebut
    for (const irr of irrelevantDocs) {
      if (!irr.name) continue;
      const cleanName = irr.name.replace(/\.[a-zA-Z0-9]+$/g, '');
      const regexExact = new RegExp(`\\b${escapeRegex(irr.name)}\\b`, 'gi');
      const regexClean = new RegExp(`\\b${escapeRegex(cleanName)}\\b`, 'gi');

      executiveSummary = executiveSummary.replace(regexExact, '').replace(regexClean, '');
      background = background.replace(regexExact, '').replace(regexClean, '');
      policyRecommendations = policyRecommendations.replace(regexExact, '').replace(regexClean, '');
      conclusion = conclusion.replace(regexExact, '').replace(regexClean, '');
      correlatedDocs = correlatedDocs.replace(regexExact, '').replace(regexClean, '');
    }

    // Koreksi nilai correlatedDocs sesuai kepastian data
    if (verifiedRelevantDocs.length === 0) {
      correlatedDocs = 'Telaah mandiri berbasis pokok permasalahan riil daerah (tidak ada berkas pendukung terunggah yang relevan).';
    } else if (!correlatedDocs || correlatedDocs.includes('(tidak ada')) {
      correlatedDocs = verifiedRelevantDocs.map((d) => `${d.type}: ${d.name}`).join('; ');
    }

    return {
      title: aiResult.title || `Policy Brief: Rekomendasi Kebijakan ${fallbackTitle}`,
      executiveSummary: executiveSummary.trim(),
      background: background.trim(),
      policyRecommendations: policyRecommendations.trim(),
      conclusion: conclusion.trim(),
      correlatedDocs: correlatedDocs.trim(),
      targetPolicyType,
      impactLevel,
      targetOpdNames: aiResult.targetOpdNames || `${opdName}, BAPPEDA Kab. Mimika`,
    };
  }

  /**
   * Generator Kontekstual Cerdas jika koneksi OpenAI tidak aktif,
   * menerapkan 4 Bagian Baku secara objektif dan HANYA menyebut dokumen yang terbukti relevan.
   */
  generateFallbackTemplate(ctx, customPrompt = '', verifiedRelevantDocs = []) {
    const title = ctx.title || 'Kajian Riset dan Inovasi Daerah';
    const opdName = ctx.opdName || 'Perangkat Daerah Terkait';
    const problem = ctx.problem || 'Terdapat kesenjangan integrasi data, hambatan operasional, dan perlunya payung hukum formal di Kabupaten Mimika.';
    const urgency = ctx.urgency || 'Kebutuhan mendesak penetapan regulasi pendukung pencapaian target RPJMD Kabupaten Mimika.';
    const strategicImpact = ctx.strategicImpact || 'Peningkatan efektivitas tata kelola dan kesejahteraan masyarakat di Kabupaten Mimika.';
    const team = ctx.teamMembersList || 'Tim Peneliti BRIDA Mimika';

    const recTitle = `Policy Brief: Rekomendasi Kebijakan Terkait ${title} di Kabupaten Mimika`;

    const hasRelevantDocs = verifiedRelevantDocs.length > 0;
    const relevantDocNames = verifiedRelevantDocs.map((d) => d.name).join(', ');

    // 1. RINGKASAN EKSEKUTIF (HANYA sebut dokumen jika terbukti relevan)
    let executiveSummary = `Kajian kelitbangan mengenai "${title}" yang diusulkan oleh ${opdName} dan dikaji bersama ${team} merumuskan telaah ilmiah dan formulasi intervensi kebijakan strategis di Kabupaten Mimika pada Tahun Anggaran ${ctx.fiscalYear}.`;

    if (hasRelevantDocs) {
      executiveSummary += `\n\nBerdasarkan hasil analisis terhadap berkas rujukan yang relevan (${relevantDocNames}), ditemukan bahwa pemecahan persoalan membutuhkan intervensi regulasi dan kebijakan operasional terpadu. Naskah Policy Brief ini merumuskan pilar solusi strategis berbasis bukti (evidence-based) guna mengatasi hambatan struktural serta mempercepat capaian indikator kinerja daerah.`;
    } else {
      executiveSummary += `\n\nBerdasarkan identifikasi mendalam terhadap pokok permasalahan yang dihadapi daerah, telaah kelitbangan ini bertindak secara mandiri memformulasikan intervensi regulasi dan kebijakan operasional terpadu tanpa bergantung pada kelengkapan berkas teknis awal. Naskah Policy Brief ini merumuskan pilar solusi strategis guna mengatasi hambatan struktural, mengoptimalkan koordinasi antar perangkat daerah, serta mempercepat capaian indikator kinerja daerah.`;
    }

    // 2. LATAR BELAKANG
    let background = `Kabupaten Mimika menghadapi tantangan strategis dalam tata kelola dan implementasi program pada sektor ${ctx.category}. Berdasarkan pokok permasalahan yang dilaporkan oleh ${opdName}, persoalan mendasar berpusat pada:
${problem}

Urgensi penanganan masalah ini bertumpu pada ${urgency}, yang berdampak langsung terhadap ${strategicImpact}.`;

    if (hasRelevantDocs) {
      background += `\n\nKajian ini didukung oleh berkas rujukan teknis relevan (${relevantDocNames}) yang menguraikan urgensi penyusunan regulasi guna menjamin ketepatan sasaran intervensi kebijakan daerah.`;
    } else {
      background += `\n\nTim analis BRIDA bertindak secara mandiri melakukan telaah mendalam terhadap regulasi perundang-undangan, standar teknis sektoral, serta kondisi empiris kewilayahan Kabupaten Mimika guna menyusun landasan kebijakan yang objektif, kredibel, dan berbasis bukti riil daerah.`;
    }

    // 3. REKOMENDASI KEBIJAKAN
    const policyRecommendations = `Berdasarkan bukti empiris dan telaah mendalam terhadap akar permasalahan di atas${hasRelevantDocs ? ` yang selaras dengan dokumen rujukan pendukung (${relevantDocNames})` : ''}, dirumuskan butir-butir arahan rekomendasi kebijakan aplikatif bagi ${opdName}:

1. Rekomendasi Jangka Pendek: Optimalisasi Prosedur Operasional & Standar Pelayanan Internal
- Arahan Kebijakan: Penerbitan Surat Edaran Kepala Dinas dan pemutakhiran SOP teknis standar pelayanan internal pada ${opdName}.
- Manfaat & Dampak: Eksekusi cepat (1-3 bulan) untuk merespons kebutuhan mendesak di lapangan tanpa kebutuhan alokasi APBD tambahan.
- Pertimbangan Teknis: Menjadi pijakan awal sebelum instrumen regulasi yang lebih tinggi selesai diharmonisasikan.

2. Rekomendasi Prioritas Utama: Penetapan Regulasi Daerah (Draf Peraturan Bupati) & Pokja Terpadu
- Arahan Kebijakan: Penyusunan Draf Peraturan Bupati (Perbup) definitif yang mengikat lintas perangkat daerah (${opdName}, BAPPEDA, dan Bagian Hukum Setda Mimika) disertai pembentukan Tim Koordinasi/Pokja Terpadu.
- Manfaat & Dampak: Menjamin kepastian hukum permanen, sinkronisasi program lintas instansi, dan landasan alokasi anggaran berkelanjutan.
- Pertimbangan Teknis: Membutuhkan tahapan harmonisasi hukum di Bagian Hukum Setda Mimika.

3. Rekomendasi Jangka Menengah-Panjang: Alokasi Program Prioritas & Penguatan Sarpras APBD
- Arahan Kebijakan: Pengintegrasian program ke dalam dokumen Renja OPD dan RKA belanja modal untuk pemenuhan sarana pendukung serta digitalisasi pemantauan layanan.
- Manfaat & Dampak: Transformasi tata kelola berkelanjutan dan percepatan pencapaian target kinerja daerah.
- Pertimbangan Teknis: Dibahas dalam Musrenbang dan penyusunan KUA-PPAS Kabupaten Mimika.`;

    // 4. KESIMPULAN
    const conclusion = `Penyelesaian permasalahan "${title}" tidak dapat lagi ditangani dengan pendekatan parsial tanpa payung hukum yang memadai. Adopsi butir-butir rekomendasi kebijakan ini ke dalam dokumen perencanaan daerah (Renja OPD dan RKPD Kabupaten Mimika) merupakan langkah krusial untuk memastikan ketercapaian target RPJMD Kabupaten Mimika secara berkelanjutan.

BRIDA Kabupaten Mimika merekomendasikan kepada pimpinan daerah dan ${opdName} untuk segera memprioritaskan penyusunan regulasi daerah dan penguatan koordinasi teknis terpadu.`;

    const correlatedDocs = hasRelevantDocs
      ? verifiedRelevantDocs.map((d) => `${d.type}: ${d.name}`).join('; ')
      : 'Telaah mandiri berbasis pokok permasalahan riil daerah (tidak ada berkas pendukung terunggah yang relevan).';

    return {
      title: recTitle,
      executiveSummary,
      background,
      policyRecommendations,
      conclusion,
      correlatedDocs,
      targetPolicyType: 'DRAFT_PERBUP',
      impactLevel: 'STRATEGIS_DAERAH',
      targetOpdNames: `${opdName}, BAPPEDA, Bagian Hukum Setda Kab. Mimika`,
    };
  }
}

module.exports = new AiPolicyBriefService();

