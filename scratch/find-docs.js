const fs = require('fs');

async function checkSite(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`[${res.status}] ${url}`);
    if (!res.ok) return [];
    const html = await res.text();
    const regex = /href=["']([^"']+)["']/gi;
    let m;
    const links = new Set();
    while ((m = regex.exec(html)) !== null) {
      const link = m[1];
      if (/pdf|dokumen|publikasi|rkpd|rpjmd|renstra|lkjip|profil|slhd|download|ipkd|bappeda/i.test(link)) {
        links.add(link);
      }
    }
    return Array.from(links);
  } catch (err) {
    console.error(`Error checking ${url}:`, err.message);
    return [];
  }
}

async function main() {
  const sites = [
    'https://bappeda.mimikakab.go.id',
    'https://bappeda.mimikakab.go.id/dokumen',
    'https://bappeda.mimikakab.go.id/publikasi',
    'https://bappeda.mimikakab.go.id/download',
    'https://mimikakab.go.id',
    'https://mimikakab.go.id/page/ipkd',
    'https://mimikakab.go.id/dokumen',
    'https://mimikakab.go.id/publikasi',
  ];

  const allLinks = new Set();
  for (const s of sites) {
    const found = await checkSite(s);
    found.forEach(l => allLinks.add(l));
  }

  console.log('\n--- FOUND LINKS ---');
  for (const l of allLinks) {
    console.log(l);
  }
}

main();
