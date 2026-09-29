const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');
const crew=require('./report-crew-reports.js');

function source(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));}
const ctx={
  emptyReport:()=>({department:'LIGHTING',month:6,year:2026,subtitle:'',groups:[]}),
  clone:v=>JSON.parse(JSON.stringify(v)),
  uid:()=> 'id'
};
const normalize=new Function('emptyReport','clone','uid',source('function normalizeReport(', 'function loadState(')+';return normalizeReport;')(ctx.emptyReport,ctx.clone,ctx.uid);

const input={
  template:'crew-matrix',
  reportType:'koordinator-crew',
  matrixType:'crew',
  period:'Juli 2026',
  pageNo:1,
  pageTotal:2,
  block:{
    name:'NAMA CREW BSM',
    days:['26','27','28','29','30','1'],
    totals:['Total Jalan','Total Kontrak','Total Harian'],
    rows:[
      {name:'ADNIN',days:['','J','','','','J'],totals:['2','','2']},
      {name:'ALLE',days:['K','K','K','K','K','K'],totals:['21','7','14']}
    ]
  },
  target:[{no:'1',name:'ALLE',value:'21'}],
  contracts:[{no:'1',name:'ALLE'}],
  inactive:[{no:'1',name:'ALDI'}]
};
const out=normalize(input);
assert.equal(out.matrixType,'crew');
assert.deepEqual(out.block,input.block);
assert.deepEqual(out.target,input.target);
assert.deepEqual(out.contracts,input.contracts);
assert.deepEqual(out.inactive,input.inactive);

const rendered=crew.renderMatrixSlide(out);
assert(rendered.includes('ADNIN'));
assert(rendered.includes('ALLE'));
assert(!rendered.includes('54'), 'must not inject SAMPLE totals when imported Crew data exists');

const empty=crew.renderMatrixSlide({template:'crew-matrix',matrixType:'crew',period:'Juli 2026',block:{name:'NAMA CREW BSM',days:[],totals:[],rows:[]}});
assert(!empty.includes('ALPAN'), 'empty matrix must not inject SAMPLE crew names');

const summary=crew.renderSummarySlide({template:'crew-summary',period:'Juli 2026',target:[],contracts:[],inactive:[]});
assert(!summary.includes('AJI'), 'empty summary must not inject SAMPLE target rows');

console.log('Crew normalization preserves imported Excel data and never falls back to SAMPLE');
