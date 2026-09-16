const test=require('node:test');
const assert=require('node:assert/strict');
const geo=require('../analytics-geo-lib-20260916.js');

test('roundCoord rounds coordinates to two decimals',()=>{
  assert.equal(geo.roundCoord(-6.21462),-6.21);
  assert.equal(geo.roundCoord(106.84513),106.85);
  assert.equal(geo.roundCoord('bad'),null);
});

test('productName resolves overrides, custom products, then base products',()=>{
  const products=[{id:'sony-a7s3',name:'Sony A7S III'}];
  const cfg={productOverrides:{'sony-a7s3':{name:'Sony A7S III Cinema Kit'}},customProducts:[{id:'custom-1',name:'Custom Camera'}]};
  assert.equal(geo.productName('sony-a7s3',products,cfg),'Sony A7S III Cinema Kit');
  assert.equal(geo.productName('custom-1',products,cfg),'Custom Camera');
  assert.equal(geo.productName('missing',products,cfg),'missing');
});

test('summarize groups product clicks, locations and unique anonymous visitors',()=>{
  const events=[
    {event_type:'product_click',product_id:'sony-a7s3',meta:{visitor_hash:'v1',geo:{city:'Jakarta',region:'Jakarta',country:'ID',latitude:-6.21,longitude:106.85}}},
    {event_type:'product_click',product_id:'sony-a7s3',meta:{visitor_hash:'v2',geo:{city:'Jakarta',region:'Jakarta',country:'ID',latitude:-6.21,longitude:106.85}}},
    {event_type:'page_view',path:'/produk',meta:{visitor_hash:'v1',geo:{city:'Bandung',region:'West Java',country:'ID',latitude:-6.91,longitude:107.61}}},
    {event_type:'page_view',path:'/',meta:{}}
  ];
  const result=geo.summarize(events,[{id:'sony-a7s3',name:'Sony A7S III'}],{});
  assert.equal(result.topProducts[0].name,'Sony A7S III');
  assert.equal(result.topProducts[0].count,2);
  assert.equal(result.uniqueVisitors,2);
  assert.equal(result.locations.find(x=>x.city==='Jakarta').clicks,2);
  assert.equal(result.locations.find(x=>x.city==='Bandung').views,1);
});
