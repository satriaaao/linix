const assert=require('node:assert/strict');
const lib=require('../cms-analytics-20260918.js');

const now=new Date(2026,8,18,10,0,0);
assert.deepEqual(lib.last30(now),{start:'2026-08-20',end:'2026-09-18',mode:'month'});
assert.deepEqual(lib.thisMonth(now),{start:'2026-09-01',end:'2026-09-18',mode:'thisMonth'});
const bounds=lib.isoBounds('2026-09-01','2026-09-18');
assert.equal(new Date(bounds.endExclusive)-new Date(bounds.start),18*86400000);

const cfg={productOverrides:{p1:{name:'Override One'}},customProducts:[{id:'p2',name:'Custom Two'}]};
const events=[
  {event_type:'product_click',product_id:'p1',meta:{visitor_hash:'a',geo:{city:'Jakarta',country:'ID',latitude:'-6.2',longitude:'106.8'}}},
  {event_type:'product_click',product_id:'p1',meta:{visitor_hash:'b',geo:{city:'Jakarta',country:'ID',latitude:'-6.2',longitude:'106.8'}}},
  {event_type:'page_view',path:'/produk/p2',meta:{visitor_hash:'a',geo:{city:'Bandung',country:'ID'}}}
];
const sum=lib.summarize(events,[],cfg);
assert.equal(sum.topProducts[0].name,'Override One');
assert.equal(sum.topProducts[0].count,2);
assert.equal(sum.uniqueVisitors,2);
assert.equal(sum.locations[0].events,2);

const path=decodeURIComponent(lib.eventPath(lib.last30(now),1000,0));
assert.match(path,/created_at=gte\./);
assert.match(path,/created_at=lt\./);
assert.match(path,/limit=1000/);

console.log('cms-analytics tests: PASS');
