async function searchJdih(query) {
  try {
    const res = await fetch(`https://jdih.mimikakab.go.id/dokumen-hukum?judul=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    const results = [];
    while ((m = regex.exec(html)) !== null) {
      const link = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      if (title.toLowerCase().includes(query.toLowerCase()) || link.includes('detail')) {
        results.push({ title, link });
      }
    }
    console.log(`\nQuery: "${query}" found ${results.length} items`);
    results.slice(0, 5).forEach(r => console.log(`- ${r.title} (${r.link})`));
  } catch (e) {
    console.error(`Error searching "${query}":`, e.message);
  }
}

async function main() {
  await searchJdih('renstra');
  await searchJdih('kesehatan');
  await searchJdih('komunikasi');
  await searchJdih('lingkungan');
  await searchJdih('iptek');
}

main();
