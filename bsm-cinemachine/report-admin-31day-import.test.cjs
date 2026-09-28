const assert=require('node:assert/strict');
const admin=require('./report-admin-matrix');
const d=Array.from({length:31},(_,i)=>String(i+1));
const data={
  title:'DATA MBR ADMIN',
  period:'AGUSTUS 2026',
  delivery:[
    {shift:'MALAM',time:'1:00',days:d},
    {shift:'',time:'2:00',days:d},
    {shift:'',time:'GOJEK ANTARAN',days:d},
    {shift:'PAGI',time:'7:00',days:d}
  ],
  deliveryTotal:d,
  jemputan:[{shift:'SIANG',days:d},{shift:'MALAM',days:d}],
  jemputanTotal:d,
  suratJalan:d,
  totals:{delivery:'1',jemputan:'2',combined:'3',suratJalan:'4'},
  notes:[]
};
const html=admin.renderSlide(data,s=>String(s));
assert(html.includes('<th class="admin-day-head">31</th>'),'31st day header missing');
assert.equal((html.match(/<th class="admin-day-head">/g)||[]).length,31,'admin matrix must render exactly 31 day headers');
assert(html.includes('rowspan="3">MALAM</td>'),'night shift span must follow imported shift boundaries');
assert(html.includes('rowspan="1">PAGI</td>'),'morning shift boundary missing');
assert(html.includes('<strong>// AGUSTUS 2026</strong>'),'footer must use imported period');
assert(!html.includes('<strong>// JUNI 2026</strong>'),'footer must not be hardcoded to June');
console.log('Admin imported July/August 31-day matrix rendering passed');
