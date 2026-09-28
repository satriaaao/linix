const assert=require('node:assert/strict');
const fs=require('node:fs');
const styles=require('./report-excel-styles');
const manual=require('./report-manual-sheets');
global.BSMExcelStyles=styles;
const lighting=require('./report-lighting-reports');

assert.equal(styles.color({rgb:'FFFFC000'}),'#FFC000');
assert.equal(styles.color({theme:4,tint:.39997558519241921}),'#73A0B4');
assert(styles.css({backgroundColor:'#FFC000',color:'#000000',fontWeight:'700'}).includes('background-color:#FFC000'));

const store={},book=manual.ensureBook(store,'marketing',1,'2026-09');
manual.replaceSheetSchema(book,'marketing','campaign',['Nama','Status'],[['A','OK']],'2026-09',[[{backgroundColor:'#FFC000'},null]]);
const row=book.sheets.campaign.periodRows['2026-09'][0];
assert.equal(row.__excelStyles.nama.backgroundColor,'#FFC000');
const manualSlide=manual.buildSlides('marketing',book)[0];
assert(manual.renderSlide(manualSlide).includes('background-color:#FFC000'));

const parsed=lighting.parseWorkbookRows(
  [['No','Tanggal','Alat','QTY','Action','','Harga'],[1,'01-Aug-26','Lamp',1,'Vendor','','Rp. 1'],['Total','','',1,'','','Rp. 1']],
  [],[],
  [[null,null,null,null,null,null,null],[null,{backgroundColor:'#000000',color:'#FFFFFF'},null,null,null,null,null],[null,{backgroundColor:'#FFC000'},null,{backgroundColor:'#FFC000'},null,null,{backgroundColor:'#FFC000'}]],
  [],[]
);
const slide=lighting.createSlides(parsed,{period:'AGUSTUS 2026'})[0];
const rendered=lighting.renderVendorSlide(slide);
assert(rendered.includes('background-color:#000000'));
assert(rendered.includes('background-color:#FFC000'));

const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');
assert(html.includes('cellStyles:true'));
assert(html.includes('/report-excel-styles.js?v=71'));
assert(html.includes('report-gudang-build-v71-excel-color-fidelity-cache71'));
console.log('Excel values/styles fidelity regression passed');
