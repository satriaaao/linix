const assert = require('assert');
const exp = require('./report-gudang-export.js');

const report = {
  groups: [{
    name: 'Spotlight 36"',
    rows: [
      {date:'2026-06-01',qty:1,action:'DS',price:133200},
      {date:'2026-06-22',qty:1,action:'GEN',price:166500}
    ]
  }]
};
const rows = exp.buildReportRows(report);
assert.deepStrictEqual(rows[0], ['No','Tanggal','Nama Alat','QTY','Action / Vendor','Harga Sewa']);
assert.deepStrictEqual(rows[1], [1,'2026-06-01','Spotlight 36"',1,'DS',133200]);
assert.strictEqual(rows.length, 3);

const csv = exp.csvString([['Nama','Harga'],['A, B',133200]]);
assert(csv.includes('"A, B"'));
assert(csv.startsWith('Nama,Harga'));
assert.strictEqual(exp.safeFilename('Report Gudang JUNI 2026','csv'),'report-gudang-juni-2026.csv');
assert.strictEqual(exp.safeFilename('Report Gudang JUNI 2026','xlsx'),'report-gudang-juni-2026.xlsx');
assert.strictEqual(exp.buildReportRows({groups:[]}).length,1);

const state = {
  activeView:1,
  slides:[{department:'LIGHTING',month:6,year:2026,groups:[]}],
  cover:{mainTitle2:'GUDANG LIGHTING',period:'JULI 2026',logo:{image:'',width:180,x:0,y:0}}
};
const slideRows=exp.buildSlideRows(state);
assert.deepStrictEqual(slideRows[0],['No','Tipe','Nama','Periode']);
assert.strictEqual(slideRows[1][1],'Cover');
assert.strictEqual(slideRows[2][1],'Report');
const coverRows=exp.buildCoverRows(state.cover);
assert.deepStrictEqual(coverRows[0],['Field','Value']);
assert(coverRows.some(row=>row[0]==='Judul Utama'&&row[1]==='GUDANG LIGHTING'));

console.log('report export tests passed');
