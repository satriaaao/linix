const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('signage-display.html','utf8');
const manifest=JSON.parse(fs.readFileSync('signage.webmanifest','utf8'));

assert.ok(html.includes('id="videoA"'),'player harus punya videoA untuk double buffer');
assert.ok(html.includes('id="videoB"'),'player harus punya videoB untuk double buffer');
assert.ok(!html.includes('BSM Signage'),'badge BSM Signage harus dihapus');
assert.ok(!html.includes('Memuat video'),'overlay loading tidak boleh tampil di player');
assert.ok(html.includes('apple-mobile-web-app-capable'),'mode standalone iPhone harus aktif');
assert.equal(manifest.display,'standalone');
assert.equal(manifest.orientation,'portrait');
assert.ok(html.includes('preload="auto"'),'video harus preload untuk transisi cepat');
assert.ok(html.includes('preloadNext()'),'video berikutnya harus dipreload');
assert.ok(html.includes('signage-config'),'monitor harus membaca playlist dari database');
assert.ok(html.includes('setInterval'),'monitor harus sinkron otomatis saat database berubah');
console.log('signage display seamless tests passed');
