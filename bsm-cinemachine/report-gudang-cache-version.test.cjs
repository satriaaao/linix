const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'report-gudang.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'report-gudang-sw.js'), 'utf8');

function expectText(source, value, label) {
  if (!source.includes(value)) throw new Error(label + ': missing ' + value);
}

expectText(sw, "const CACHE='bsm-report-gudang-v71';", 'service worker cache version');
expectText(sw, "url.searchParams.get('__appv')==='71'", 'service worker app version check');
expectText(sw, "url.searchParams.set('__appv','71')", 'service worker app version navigation');
expectText(html, '/report-gudang-sw.js?v=71', 'service worker registration version');
expectText(html, 'report-gudang-build-v71-cloud-hydration-guard-cache70', 'HTML build/cache marker');

if (html.includes('?v=35')) throw new Error('HTML still contains stale ?v=35 asset query');
if (sw.includes('bsm-report-gudang-v35') || sw.includes("'__appv','35'")) {
  throw new Error('Service worker still contains stale v35 cache/app version');
}

console.log('Report Gudang cache version is synchronized at v71');
