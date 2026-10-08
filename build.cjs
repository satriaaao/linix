const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'bsm-cinemachine');
const out = path.join(root, 'dist');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'qr-code'), { recursive: true });

function copy(name, target = name) {
  fs.copyFileSync(path.join(src, name), path.join(out, target));
}

copy('public-v5.html', 'index.html');
copy('cms-v5.html', 'cms.html');
copy('qr.html', path.join('qr-code', 'index.html'));
copy('report-gudang.html', 'report-gudang');
copy('report-gudang.html', 'report-gudang.html');
copy('signage-cms.html', 'signage.html');
copy('signage-display.html', 'display.html');
copy('signage-lib.js');
copy('signage.webmanifest');
copy('signage-sw.js', 'sw.js');
copy('signage-icon-192.png');
copy('signage-icon-512.png');
copy('signage-icon-maskable-512.png');

for (const name of fs.readdirSync(src)) {
  if (name.endsWith('.js') || name.endsWith('.css')) {
    fs.copyFileSync(path.join(src, name), path.join(out, name));
  }
}

console.log('BSM static build ready:', out);
