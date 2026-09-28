const assert=require('node:assert/strict');
const crew=require('./report-crew-reports');
const bulk=require('./report-bulk-router');

let rows=[['NAMA CREW BSM','26','27','28','29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','Total Jalan','Total Kontrak','Total Harian'],['A','J','','','','','','','','','','','','','','','','','','','','','','','','','','','','','1','','1'],['NAMA DRIVER LOGISTIC','26','27','28','29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','Total Jalan','Total Kontrak','Total Harian'],['D','J','','','','','','','','','','','','','','','','','','','','','','','','','','','','','1','','1'],['CREW CAPAI TARGET']];
let d=crew.parseRows(rows,{period:'JULI 2026'});
assert.equal(d.crew.days.length,30);
assert.equal(d.crew.totals[0],'Total Jalan');
assert(d.driver,'LOGISTIC spelling should be recognized');
assert.equal(d.driver.days.length,30);

let head=['DELIVERY','MALAM','JAM/TANGGAL'];for(let i=1;i<=31;i++)head.push(String(i));head.push('TOTAL','KET');
let detail=['DELIVERY','MALAM','1:00'];for(let i=1;i<=31;i++)detail.push('1');detail.push('31','');
let total=['TOTAL','',''];for(let i=1;i<=31;i++)total.push('1');total.push('31','');
let text=[head,detail,total].map(r=>r.join('\t')).join('\n');
let a=bulk.parseAdmin(text,{period:'JULI 2026'}).slides[0].matrix;
assert.equal(a.deliveryTotal.length,31);
assert.equal(a.delivery[0].days.length,31);
console.log('30/31-day Admin and Crew parsing passed');
