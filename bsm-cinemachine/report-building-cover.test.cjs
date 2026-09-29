const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function readPart(n){
  const src=fs.readFileSync(__dirname+'/report-cover-building-'+n+'.js','utf8');
  const m=src.match(/='([^']*)';/s);
  assert(m,'building cover part '+n+' missing');
  return m[1];
}
const b64=readPart(1)+readPart(2);
const buf=Buffer.from(b64,'base64');
assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
assert(buf.length>15000,'building cover image is unexpectedly small');

const ctx={window:{__BSM_BUILDING_PARTS:[readPart(1),readPart(2)]}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/report-cover-building-loader.js','utf8'),ctx);
assert(ctx.window.BSM_BUILDING_COVER_DATA.startsWith('data:image/webp;base64,UklG'));

const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');
assert(html.includes('/report-cover-building-loader.js?v=73'));
assert(html.includes('report-gudang-build-v74-local-first-cache74'));
assert(html.includes('id="previewPeriodSearchB"'));
assert(html.includes('id="presentationPeriodSearchB"'));

const coverSrc=fs.readFileSync(__dirname+'/report-gudang-cover.js','utf8');
assert(coverSrc.includes('window.BSM_BUILDING_COVER_DATA'));
assert(coverSrc.includes('base.image==="/report-cover-studio.jpg"'));
console.log('Building cover, reference layout, dual month preview and migration wiring passed');
