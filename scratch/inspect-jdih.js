async function inspectJdih() {
  const res = await fetch('https://jdih.mimikakab.go.id', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let m;
  const links = new Set();
  while ((m = hrefRegex.exec(html)) !== null) {
    if (/perda|perbup|dokumen|produk|download|\.pdf/i.test(m[1])) {
      links.add(m[1]);
    }
  }
  console.log('JDIH links:', Array.from(links).slice(0, 30));
}
inspectJdih();
