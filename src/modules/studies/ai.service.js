/**
 * AI Service for Generating Terms of Reference (KAK / Kerangka Acuan Kerja) & RKA Budget
 * Powered by OpenAI LLM (GPT-4o-mini) with Intelligent Dynamic Fallback
 * SIM-RIDA (Sistem Informasi Riset dan Inovasi Daerah) Kab. Mimika
 */

class AiKakService {
  /**
   * Menghasilkan draft KAK komprehensif dan rincian pos belanja RKA/RAB
   * berdasarkan data usulan riset menggunakan OpenAI LLM, dengan fallback template aman.
   */
  async generateKakDraft(proposal, customPrompt = '') {
    const title = proposal.title || 'Kajian Riset dan Inovasi Daerah';
    const opdName = proposal.opd?.name || proposal.opdName || 'Perangkat Daerah Kabupaten Mimika';
    const category = proposal.category || 'Sosial Budaya & Kesejahteraan';
    const problem = proposal.problemStatement || '';
    const urgency = proposal.urgencyReason || '';
    const strategicImpact = proposal.strategicImpact || '';
    const budget = Number(proposal.estimatedBudget || 100000000);
    const expectedOutput = proposal.expectedOutput || 'REKOMENDASI_KEBIJAKAN';

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL && !process.env.OPENAI_MODEL.includes('gpt-5')
      ? process.env.OPENAI_MODEL
      : 'gpt-4o-mini';

    // 1. Coba Generate via OpenAI jika API Key tersedia
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        console.log(`[OpenAI KAK] Mengirim prompt ke OpenAI (${model}) untuk topik: "${title}"`);
        const openAiResult = await this.callOpenAiLlm({
          apiKey,
          model,
          proposal: { title, opdName, category, problem, urgency, strategicImpact, budget, expectedOutput },
          customPrompt,
        });

        if (openAiResult && openAiResult.background && openAiResult.objectives) {
          console.log(`[OpenAI KAK] Berhasil menerima dan memvalidasi respons cerdas dari OpenAI LLM!`);
          return this.normalizeAndBalanceAiResult(openAiResult, budget, opdName, title);
        }
      } catch (openAiError) {
        console.warn(`[OpenAI KAK Warning] Gagal memanggil OpenAI (${openAiError.message}). Beralih ke fallback template cerdas.`);
      }
    } else {
      console.log(`[OpenAI KAK] OPENAI_API_KEY tidak dikonfigurasi, menggunakan rule-based dynamic template.`);
    }

    // 2. Fallback Template jika OpenAI offline atau tidak tersedia
    return this.generateFallbackTemplate(proposal, customPrompt);
  }

  /**
   * Memanggil OpenAI API Chat Completions dengan format JSON terstruktur
   */
  async callOpenAiLlm({ apiKey, model, proposal, customPrompt }) {
    const systemPrompt = `Anda adalah Ahli Peneliti Senior dan Analis Kebijakan Badan Riset dan Inovasi Daerah (BRIDA) Kabupaten Mimika, Papua Tengah.
Tugas Anda adalah menyusun Dokumen Kerangka Acuan Kerja (KAK / Terms of Reference) dan Rencana Kerja & Anggaran (RKA / RAB Belanja) yang sangat tajam, ilmiah, kontekstual, dan aplikatif untuk Pemerintah Kabupaten Mimika.

PANDUAN PENYUSUNAN:
1. Latar Belakang: Uraikan kondisi faktual lapangan, data empiris di Mimika, akar permasalahan, urgensi penyelesaian, dampak strategis terhadap RPJMD Mimika, dan dasar hukum litbang daerah (UU No. 11/2019, Permendagri No. 17/2016, Perda RPJMD Mimika).
2. Maksud & Tujuan: Rumuskan maksud kegiatan dan butir-butir tujuan riset yang terukur (measurable) serta sasaran integrasi ke Renja perangkat daerah terkait.
3. Ruang Lingkup & Metodologi: Jelaskan batasan wilayah (distrik/kelurahan/kampung di Mimika), pendekatan riset (mixed-methods/survei/wawancara mendalam), tahapan kerja teknis, dan keterlibatan stakeholder.
4. Target Output: Tentukan bentuk keluaran konkret (Laporan Akhir, Policy Brief Eksekutif untuk Bupati/Kepala OPD, Matriks Inovasi Daerah, Draf Peraturan Bupati / Surat Edaran / SOP).
5. RKA Belanja Riset: Buat 6-10 pos rincian belanja yang SANGAT SPESIFIK sesuai topik kajian (bukan generik). Sesuaikan dengan pagu anggaran total Rp ${proposal.budget.toLocaleString('id-ID')}. Total pos belanja HARUS seimbang dan tidak boleh melebihi pagu definitif.

OUTPUT WAJIB DALAM FORMAT JSON DENGAN STRUKTUR BERIKUT:
{
  "background": "Teks lengkap bab latar belakang...",
  "problemStatement": "Teks rumusan masalah & batasan lingkup...",
  "objectives": "Teks maksud, tujuan & sasaran riset...",
  "scopeAndMethodology": "Teks ruang lingkup & metodologi kajian...",
  "targetOutput": "Teks target keluaran konkret...",
  "durationMonths": 4,
  "executionScheme": "SWAKELOLA",
  "allocatedBudget": ${proposal.budget},
  "rkaItems": [
    {
      "category": "Honorarium Pakar & Tenaga Ahli",
      "description": "Uraian tugas spesifik...",
      "volume": 4,
      "unit": "OB",
      "unitPrice": 5000000
    },
    ...
  ]
}`;

    const userContent = `DATA USULAN RISET KABUPATEN MIMIKA:
- Judul Riset: ${proposal.title}
- Instansi Pengusul: ${proposal.opdName}
- Bidang/Kategori: ${proposal.category}
- Uraian Masalah Utama: ${proposal.problem}
- Urgensi Masalah: ${proposal.urgency}
- Dampak Strategis: ${proposal.strategicImpact || 'Peningkatan efektivitas layanan dan inovasi daerah'}
- Pagu Anggaran Maksimal: Rp ${proposal.budget.toLocaleString('id-ID')}
- Target Keluaran: ${proposal.expectedOutput}
${customPrompt ? `\nINSTRUKSI KHUSUS DARI TIM LITBANG: ${customPrompt}` : ''}

Tolong susunkan dokumen KAK dan pos rincian belanja RKA yang sangat mendalam dan realistis sesuai data di atas dalam format JSON.`;

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
   * Menormalisasi dan menyeimbangkan kalkulasi pos belanja RKA dari AI
   */
  normalizeAndBalanceAiResult(aiResult, targetBudget, opdName, title) {
    const budget = Number(targetBudget) > 0 ? Number(targetBudget) : 100000000;
    let rkaItems = Array.isArray(aiResult.rkaItems) && aiResult.rkaItems.length > 0
      ? aiResult.rkaItems
      : this.generateBalancedRkaItems(budget, opdName);

    // Format item dan kalkulasi total
    let formattedItems = rkaItems.map((item) => {
      const volume = Number(item.volume) > 0 ? Number(item.volume) : 1;
      const unitPrice = Number(item.unitPrice) > 0 ? Number(item.unitPrice) : 1000000;
      return {
        category: item.category ? item.category.trim() : 'Belanja Operasional Riset',
        description: item.description ? item.description.trim() : 'Kebutuhan pelaksanaan riset',
        volume,
        unit: item.unit ? item.unit.trim() : 'Paket',
        unitPrice,
        totalPrice: volume * unitPrice,
      };
    });

    // Validasi selisih agar tidak overbudget
    let currentTotal = formattedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    if (currentTotal > budget) {
      // Skala proporsional ke bawah agar sesuai pagu
      const ratio = budget / currentTotal;
      formattedItems = formattedItems.map((item, idx) => {
        const adjustedUnitPrice = Math.floor((item.unitPrice * ratio) / 10000) * 10000;
        return {
          ...item,
          unitPrice: adjustedUnitPrice > 0 ? adjustedUnitPrice : item.unitPrice,
          totalPrice: item.volume * (adjustedUnitPrice > 0 ? adjustedUnitPrice : item.unitPrice),
        };
      });
    }

    return {
      title,
      background: aiResult.background || '',
      problemStatement: aiResult.problemStatement || '',
      objectives: aiResult.objectives || '',
      scopeAndMethodology: aiResult.scopeAndMethodology || '',
      targetOutput: aiResult.targetOutput || 'Policy Brief Rekomendasi Teknis',
      fiscalYear: new Date().getFullYear(),
      allocatedBudget: budget,
      executionScheme: aiResult.executionScheme || 'SWAKELOLA',
      rkaItems: formattedItems,
    };
  }

  /**
   * Fallback Template Cerdas jika OpenAI API tidak aktif
   */
  generateFallbackTemplate(proposal, customPrompt = '') {
    const title = proposal.title || 'Kajian Riset dan Inovasi Daerah';
    const opdName = proposal.opd?.name || proposal.opdName || 'Perangkat Daerah Kabupaten Mimika';
    const category = proposal.category || 'Ekonomi & Pembangunan';
    const problem = proposal.problemStatement || '';
    const urgency = proposal.urgencyReason || '';
    const strategicImpact = proposal.strategicImpact || '';
    const budget = Number(proposal.estimatedBudget || 100000000);

    const background = `1. LATAR BELAKANG

1.1 Konteks dan Urgensi Masalah
Kabupaten Mimika menghadapi dinamika pembangunan strategis yang menuntut perumusan kebijakan berbasis bukti ilmiah (evidence-based policy). Berdasarkan identifikasi lapangan bersama ${opdName}, permasalahan utama yang dihadapi adalah:
"${problem}"

Urgensi pelaksanaan kajian ini didasari oleh kebutuhan mendesak:
"${urgency || 'Penyelesaian hambatan teknis dan perumusan rekomendasi aksi yang aplikatif bagi pemerintah daerah.'}"
${strategicImpact ? `\n1.2 Dampak Strategis Daerah\nKajian ini secara langsung berkontribusi terhadap: ${strategicImpact}\nSerta mendukung pencapaian target prioritas RPJMD Kabupaten Mimika dalam klaster ${category}.` : ''}

1.3 Landasan Yuridis & Kebijakan
Pelaksanaan kajian ini berpedoman pada:
1. Undang-Undang Nomor 11 Tahun 2019 tentang Sistem Nasional Ilmu Pengetahuan dan Teknologi.
2. Peraturan Menteri Dalam Negeri Nomor 17 Tahun 2016 tentang Pedoman Penelitian dan Pengembangan di Kementerian Dalam Negeri dan Pemerintahan Daerah.
3. Peraturan Daerah Kabupaten Mimika tentang Rencana Pembangunan Jangka Menengah Daerah (RPJMD) yang berlaku.
4. Peraturan Bupati Mimika tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi BRIDA Kabupaten Mimika.`;

    const problemStatementFormatted = `2. PERMASALAHAN DAN RUANG LINGKUP

2.1 Rumusan Masalah
Berdasarkan telaah awal, rumusan pertanyaan penelitian yang akan dijawab melalui kajian ini adalah:
1. Bagaimana kondisi faktual, determinan utama, serta faktor penghambat dalam penanganan ${title}?
2. Bagaimana model intervensi kebijakan yang paling efektif, terukur, dan adaptif terhadap kondisi sosial-ekonomi serta geografis di Kabupaten Mimika?
3. Bagaimana skenario implementasi, pembagian peran lintas sektor antara BRIDA, ${opdName}, dan instansi terkait, serta mitigasi risiko pelaksanaannya?

2.2 Batasan Ruang Lingkup
Ruang lingkup kajian ini meliputi pengumpulan data primer dan sekunder pada distrik/lokasi prioritas di wilayah Kabupaten Mimika, analisis komparasi kebijakan, serta perumusan dokumen kebijakan teknis.`;

    const objectives = `3. MAKSUD, TUJUAN, DAN SASARAN

3.1 Maksud Kegiatan
Maksud dari pelaksanaan kajian ini adalah menyediakan kerangka analisis ilmiah yang komprehensif sebagai acuan formulasi kebijakan strategis bagi ${opdName} dan Pemerintah Kabupaten Mimika.

3.2 Tujuan Kegiatan
1. Mengidentifikasi akar masalah dan pemetaan data eksisting terkait ${title} di Kabupaten Mimika.
2. Menganalisis kelayakan opsi intervensi dan rekomendasi inovasi kebijakan yang relevan.
3. Menyusun dokumen rekomendasi kebijakan (Policy Brief) dan draf rancangan regulasi/SOP implementatif.

3.3 Sasaran
Terwujudnya dokumen rekomendasi kebijakan yang terverifikasi, aplikatif, dan dapat langsung diintegrasikan ke dalam Rencana Kerja (Renja) ${opdName} TA berikutnya.`;

    const scopeAndMethodology = `4. METODOLOGI DAN PENDEKATAN KERJA

4.1 Pendekatan Kajian
Kajian ini menggunakan pendekatan campuran (mixed-methods approach) yang mengombinasikan analisis kuantitatif dan kualitatif secara triangulatif.

4.2 Tahapan Pelaksanaan:
1. Tahap Persiapan: Telaah literatur regulasi, penyusunan instrumen kuesioner/panduan wawancara, dan koordinasi awal bersama ${opdName}.
2. Tahap Pengumpulan Data: Survei lapangan ke distrik sasaran, wawancara mendalam (in-depth interview), dan pengumpulan data statistik sektoral.
3. Tahap Analisis & FGD: Olah data statistik, pelaksanaan Focus Group Discussion (FGD) pakar, dan perumusan draf awal temuan.
4. Tahap Finalisasi: Penyusunan Laporan Akhir, Policy Brief, dan Uji Publik bersama pemangku kepentingan.`;

    const targetOutputFormatted = `5. TARGET OUTPUT / KELUARAN

Keluaran utama yang wajib dihasilkan dari kajian ini meliputi:
1. Laporan Akhir Hasil Riset yang memuat metodologi, analisis data, dan temuan kunci.
2. Dokumen Ringkasan Eksekutif Kebijakan (Policy Brief) untuk Bupati Mimika dan Kepala ${opdName}.
3. Matriks Inovasi & Rekomendasi Rencana Aksi Daerah.
4. Draf Rancangan Regulasi Teknis (Draf Peraturan Bupati / Surat Edaran / SOP Layanan Terpadu).`;

    const rkaItems = this.generateBalancedRkaItems(budget, opdName);

    return {
      title,
      category,
      background,
      problemStatement: problemStatementFormatted,
      objectives,
      scopeAndMethodology,
      targetOutput: targetOutputFormatted,
      fiscalYear: new Date().getFullYear(),
      executionScheme: 'SWAKELOLA',
      rkaItems,
    };
  }

  /**
   * Helper untuk menyusun rincian pos belanja RKA proporsional
   */
  generateBalancedRkaItems(totalBudget, opdName) {
    const budget = Number(totalBudget) > 0 ? Number(totalBudget) : 100000000;

    const honorBudget = Math.floor(budget * 0.35);
    const surveyBudget = Math.floor(budget * 0.30);
    const fgdBudget = Math.floor(budget * 0.20);
    const reportBudget = budget - honorBudget - surveyBudget - fgdBudget;

    const items = [
      {
        category: 'Honorarium Pakar & Tenaga Ahli',
        description: 'Honorarium Tenaga Ahli Utama Analisis Kebijakan Daerah (4 Bulan)',
        volume: 4,
        unit: 'OB',
        unitPrice: Math.floor(honorBudget * 0.6 / 4),
        totalPrice: Math.floor(honorBudget * 0.6),
      },
      {
        category: 'Honorarium Pakar & Tenaga Ahli',
        description: `Honorarium Asisten Peneliti / Narasumber Sektoral ${opdName} (4 Bulan)`,
        volume: 4,
        unit: 'OB',
        unitPrice: Math.floor(honorBudget * 0.4 / 4),
        totalPrice: Math.floor(honorBudget * 0.4),
      },
      {
        category: 'Belanja Survei & Pengumpulan Data Lapangan',
        description: 'Uang Harian & Transportasi Tim Surveyor Pengambilan Data Lapangan Distrik',
        volume: 20,
        unit: 'OH',
        unitPrice: Math.floor(surveyBudget * 0.7 / 20),
        totalPrice: Math.floor(surveyBudget * 0.7),
      },
      {
        category: 'Belanja Survei & Pengumpulan Data Lapangan',
        description: 'Penggandaan Kuesioner & Bahan Kontak Lapangan Responden',
        volume: 1,
        unit: 'Paket',
        unitPrice: Math.floor(surveyBudget * 0.3),
        totalPrice: Math.floor(surveyBudget * 0.3),
      },
      {
        category: 'Belanja Focus Group Discussion (FGD)',
        description: 'Konsumsi & Akomodasi Rapat FGD Konsultasi Publik Lintas Perangkat Daerah (2 Kali)',
        volume: 2,
        unit: 'Paket',
        unitPrice: Math.floor(fgdBudget * 0.7 / 2),
        totalPrice: Math.floor(fgdBudget * 0.7),
      },
      {
        category: 'Belanja Focus Group Discussion (FGD)',
        description: 'Honorarium Moderator & Notulensi FGD Ahli Kebijakan',
        volume: 2,
        unit: 'OK',
        unitPrice: Math.floor(fgdBudget * 0.3 / 2),
        totalPrice: Math.floor(fgdBudget * 0.3),
      },
      {
        category: 'Belanja Analisis Data & Pelaporan',
        description: 'Pencetakan & Penjilidan Dokumen Laporan Akhir, Policy Brief, dan Draf Regulasi',
        volume: 15,
        unit: 'Buku',
        unitPrice: Math.floor(reportBudget * 0.6 / 15),
        totalPrice: Math.floor(reportBudget * 0.6),
      },
      {
        category: 'Belanja Analisis Data & Pelaporan',
        description: 'Penyusunan Media Infografis & Digital Policy Brief untuk Eksekutif',
        volume: 1,
        unit: 'Paket',
        unitPrice: Math.floor(reportBudget * 0.4),
        totalPrice: Math.floor(reportBudget * 0.4),
      },
    ];

    return items;
  }
}

module.exports = new AiKakService();
