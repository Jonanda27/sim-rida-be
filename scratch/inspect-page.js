async function inspectPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`\n=== URL: ${url} (${res.status}) ===`);
    const html = await res.text();
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let m;
    const links = [];
    while ((m = hrefRegex.exec(html)) !== null) {
      if (/drive\.google\.com|dropbox|\.pdf|download|mediafire|bps\.go\.id/i.test(m[1])) {
        links.push(m[1]);
      }
    }
    console.log('Document / Download links found:', links);
  } catch (e) {
    console.error(`Error on ${url}:`, e.message);
  }
}

async function main() {
  await inspectPage('https://bappeda.mimikakab.go.id/p/rpjmd-mimika-2025-2029.html');
  await inspectPage('https://bappeda.mimikakab.go.id/p/rkpdp-mimika-2025.html');
  await inspectPage('https://bappeda.mimikakab.go.id/p/rencana-kerja-perangkat-daerah-mimika.html');
  await inspectPage('https://mimikakab.go.id/ipkd');
}

main();
