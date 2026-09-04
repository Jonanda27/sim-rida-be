async function parseIpkd() {
  const res = await fetch('https://mimikakab.go.id/ipkd', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  const pdfRegex = /([^\n<>]{5,100})[\s\S]{0,200}href=["']([^"']+\.pdf)["']/gi;
  let m;
  while ((m = pdfRegex.exec(html)) !== null) {
    const title = m[1].replace(/<[^>]+>/g, '').trim();
    const url = m[2];
    console.log(`TITLE: ${title} | URL: ${url}`);
  }
}

parseIpkd();
