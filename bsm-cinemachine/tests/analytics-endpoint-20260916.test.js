const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/analytics-event.js');

function resMock(){return {statusCode:200,headers:{},body:'',setHeader(k,v){this.headers[String(k).toLowerCase()]=v},end(v=''){this.body=String(v)}}}

test('analytics endpoint rejects non-POST methods',async()=>{
  const res=resMock();
  await handler({method:'GET',headers:{},body:null},res);
  assert.equal(res.statusCode,405);
});

test('analytics endpoint rejects unknown event types',async()=>{
  const res=resMock();
  await handler({method:'POST',headers:{},body:{event_type:'secret_event',path:'/',session_id:'s1'}},res);
  assert.equal(res.statusCode,400);
});

test('analytics endpoint stores rounded geo and hash but never raw IP',async()=>{
  let insert=null;
  const oldFetch=global.fetch;
  global.fetch=async(url,opt)=>{insert=JSON.parse(opt.body);return {ok:true,status:201,text:async()=>''}};
  try{
    const req={method:'POST',headers:{
      'x-vercel-ip-city':'Jakarta',
      'x-vercel-ip-country-region':'JK',
      'x-vercel-ip-country':'ID',
      'x-vercel-ip-latitude':'-6.21462',
      'x-vercel-ip-longitude':'106.84513',
      'x-forwarded-for':'203.0.113.44',
      'user-agent':'Test Browser'
    },body:{event_type:'product_click',path:'/produk/sony-a7s3',product_id:'sony-a7s3',session_id:'session-random-123',meta:{ua:'client'}}};
    const res=resMock();
    await handler(req,res);
    assert.equal(res.statusCode,200);
    assert.equal(insert.meta.geo.city,'Jakarta');
    assert.equal(insert.meta.geo.latitude,-6.21);
    assert.equal(insert.meta.geo.longitude,106.85);
    assert.match(insert.meta.visitor_hash,/^[a-f0-9]{16}$/);
    assert.equal(JSON.stringify(insert).includes('203.0.113.44'),false);
  }finally{global.fetch=oldFetch}
});

test('analytics endpoint keeps missing coordinates null instead of zero',async()=>{
  let insert=null;const oldFetch=global.fetch;
  global.fetch=async(url,opt)=>{insert=JSON.parse(opt.body);return {ok:true,status:201,text:async()=>''}};
  try{
    const res=resMock();
    await handler({method:'POST',headers:{},body:{event_type:'page_view',path:'/',session_id:'session-no-geo'}},res);
    assert.equal(res.statusCode,200);
    assert.equal(insert.meta.geo.latitude,null);
    assert.equal(insert.meta.geo.longitude,null);
  }finally{global.fetch=oldFetch}
});
