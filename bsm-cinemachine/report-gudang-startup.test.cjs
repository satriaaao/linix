const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'report-gudang.html'), 'utf8');
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  const src = match[1].match(/src="([^"]+)"/);
  if (src && src[1].startsWith('https:')) continue;
  const filename = src ? path.join(__dirname, src[1]) : 'report-gudang.html inline script';
  const source = src ? fs.readFileSync(filename, 'utf8') : match[2];
  new vm.Script(source, { filename });
}
console.log('Report startup scripts compile successfully');
