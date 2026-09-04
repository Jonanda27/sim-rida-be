async function parseIpkd() {
  const res = await fetch('https://mimikakab.go.id/ipkd', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const regex = /previewPdf\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    console.log(`TITLE: "${m[1].trim()}" | URL: ${m[2]}`);
  }
}
parseIpkd();
