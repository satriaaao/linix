const assert=require('node:assert/strict');
const crew=require('./report-crew-reports.js');

assert.equal(crew.periodKeyFromFileName('DATA MBR CO.CREW AGUSTUS 2026(1).xlsx',2025),'2026-08');
assert.equal(crew.periodKeyFromFileName('data mbr c.o crew juli(2).xlsx',2026),'2026-07');
assert.equal(crew.periodKeyFromFileName('MBR crew SEPTEMBER 2027.xlsx',2026),'2027-09');

const augustHeader=['Nama CREW BSM',26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,'Total Jalan','Total Kontrak','Total Harian'];
const augustCrew=['ANGGI','K','K','K','K','K','K','K','K','K','K','','J','J','','','','','J','J','','J','','','K','K','K','K','K','K','K','K',23,18,5];
const augustDriverHeader=['Nama Driver Logistik',...augustHeader.slice(1)];
const augustDriver=['ADIT','J','J','','','','','J','J','J','J','J','J','','J','','J','J','J','J','','','J','','','J','J','J','J','J','J','',20,'',20];
const rows=[
  augustHeader,augustCrew,[],
  augustDriverHeader,augustDriver,[],
  ['', 'CREW CAPAI TARGET','','','','','','','','','CREW KONTRAK','','','','','','','','CREW YANG NONAKTIF'],
  ['', 'NO','NAMA','','','','X','','','','NO','NAMA','','','','','','','NO','NAMA'],
  ['',1,'ANGGI','','','',23,'','','',1,'ANGGI','','','','','','',1,'AGIEL']
];
const parsed=crew.parseRows(rows,{period:'Agustus 2026'},null);
assert.equal(parsed.crew.days.length,31);
assert.deepEqual(parsed.crew.rows[0].totals,['23','18','5']);
assert.deepEqual(parsed.driver.rows[0].totals,['20','','20']);
assert.equal(parsed.inactive[0].name,'AGIEL');

const julyHeader=['NAMA CREW BSM',26,27,28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,'Total Jalan','Total Kontrak','Total Harian'];
const julyDriverHeader=['NAMA DRIVER LOGISTIC',...julyHeader.slice(1)];
const julyRows=[
  julyHeader,['ALLE','K','K','K','K','K','K','K','J','J','J','J','','','','J','','J','J','J','J','','','J','','','J','J','','J','J',21,7,14],[],
  julyDriverHeader,['ADIT','J','J','','J','J','J','J','J','J','','J','J','J','J','','','J','J','','J','J','J','J','J','J','','J','J','J','J',24,'',23],[],
  ['', 'CREW CAPAI TARGET','','','','','','','','','CREW KONTRAK','','','','','','','','CREW YANG NONAKTIF'],
  ['', 'NO','NAMA','','','','X','','','','NO','NAMA','','','','','','','NO','NAMA'],
  ['',1,'ALLE','','','',21,'','','',1,'ALLE','','','','','','',1,'ALDI']
];
const july=crew.parseRows(julyRows,{period:'Juli 2026'},null);
assert.equal(july.crew.days.length,30);
assert.deepEqual(july.driver.rows[0].totals,['24','','23']);
assert.equal(july.inactive[0].name,'ALDI');

console.log('Koordinator Crew filename period + Excel fidelity regression passed');
