const assert=require('node:assert/strict');
global.BSMExcelStyles=require('./report-excel-styles');
const admin=require('./report-admin-matrix');
const crew=require('./report-crew-reports');
const audio=require('./report-audio-reports');
const fs=require('node:fs');

let ad=JSON.parse(JSON.stringify(admin.DATA));
ad.delivery[0].excelStyles={days:[{backgroundColor:'#FF9900'}]};
assert(admin.renderSlide(ad).includes('background-color:#FF9900'));

const cr={template:'crew-matrix',matrixType:'crew',period:'JULI 2026',pageNo:1,pageTotal:1,block:{name:'Nama CREW BSM',days:['26'],totals:['Total'],headerStyles:{days:[{backgroundColor:'#FFC000'}]},rows:[{name:'A',days:['J'],totals:['1'],excelStyles:{days:[{backgroundColor:'#92D050'}]}}]}};
assert(crew.renderMatrixSlide(cr).includes('background-color:#92D050'));

const ar={template:'audio-service',serviceCenter:'TEST',audioHeaderStyles:[],audioServiceRows:[{no:1,date:'1',item:'Mic',damage:'X',qty:'1',sn:'A',caseId:'B',takenDate:'',note:'',excelStyles:{item:{backgroundColor:'#FFFF00'}}}],period:'2026'};
assert(audio.renderServiceSlide(ar).includes('background-color:#FFFF00'));

const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');
assert(html.includes('function excelClipboardBundle'));
assert(html.includes('Paste Excel terbaca • warna cell ikut disimpan'));
assert(html.includes('report-gudang-build-v73-excel-accuracy-cache73'));
console.log('Admin, Crew, Audio and clipboard Excel color fidelity passed');
