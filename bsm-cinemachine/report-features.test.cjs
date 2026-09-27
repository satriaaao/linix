const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sheets=require('./report-manual-sheets'),cover=require('./report-gudang-cover');
const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');
const store={};
for(const type of Object.keys(sheets.TYPES)){
 const book=sheets.ensureBook(store,type,1,'2026-01'),def=sheets.allSheetDefs(type,book)[0];
 for(let month=1;month<=12;month++){
  const key='2026-'+String(month).padStart(2,'0');sheets.setPeriod(book,type,key,1);
  const row=book.sheets[def.id].rows[0];row[def.columns[0][0]]=type+' '+month;
  if(def.columns.some(c=>c[0]==='qty')){row.namaAlat='Camera';row.qty=String(month);}
 }
 assert.equal(sheets.periodKeys(book,type).length,12);
 const slides=sheets.buildSlides(type,book);assert.equal(new Set(slides.map(s=>s.manualPeriodKey)).size,12);
 for(const s of slides)assert(sheets.renderSlide(s).includes('manual-grid-slide'));
 assert.equal(sheets.dataRows(book,type,def.id,'2026-01')[0][def.columns[0][0]],type+' 1');
}
const c={window:{BSMManualSheets:sheets},Number,Math};vm.createContext(c);
vm.runInContext(html.slice(html.indexOf('      function compareTextKey('),html.indexOf('      function openManualComparison(')),c);
assert.equal(c.previousManualPeriodKey('2026-01'),'2025-12');
assert.equal(c.compareNumericValue('Rp1.250.000,50'),1250000.5);
assert.equal(c.compareNumericValue('Belum'),null);
assert.equal(c.compareNumericValue('—'),null);
assert.equal(c.aggregateCompareColumn([{qty:'2'},{qty:'3'}],['qty','QTY']).value,5);
assert.equal(c.compareTextKey('  Sony   FX3 '),'sony fx3');
const logo={image:'data:image/png;base64,test',width:160};
assert.deepEqual(cover.normalizeCover({logo}).logo,logo);
assert.equal(cover.normalizeCover({image:''}).image,'/report-cover-studio.jpg');
assert.equal(cover.normalizeCover({image:'https://www.arri.com/resource/image/78390/old.jpg'}).image,'/report-cover-studio.jpg');
assert.equal(cover.normalizeCover({image:'data:image/jpeg;base64,user'}).image,'data:image/jpeg;base64,user');
assert(html.includes('c[this.dataset.coverField]=this.value'));
assert(html.includes('var compareEnabled=compareType;'));
assert(html.includes('data-compare-period'));
assert(html.includes('page.typeId===typeId&&pagePeriodKey(page)===key'));
assert(fs.statSync(__dirname+'/report-cover-studio.jpg').size>10000);
console.log('8 divisions × 12 months: data isolation, slides, numeric comparisons, year boundary and cover assets passed');

const master=require('./report-gudang-master');
const sections=master.normalizeSections({},cover.defaultCover());
assert.equal(new Set(Object.values(sections).map(s=>s.cover.image)).size,8);
for(const section of Object.values(sections))assert(fs.statSync(__dirname+section.cover.image).size>10000);
assert.equal(master.normalizeSections({it:{cover:{image:'data:image/png;base64,custom'},slides:[]}},cover.defaultCover()).it.cover.image,'data:image/png;base64,custom');
console.log('Eight distinct themed cover assets and custom upload preservation passed');
