const assert=require('node:assert/strict');
const {test}=require('node:test');
const maps=require('../api/maps-resolve');
test('Maps accepts approved HTTPS origins only',()=>{
 for(const u of ['http://maps.google.com','https://maps.google.com:8443','https://user:pass@maps.google.com','https://localhost','https://169.254.169.254','https://google.com.attacker.example'])assert.throws(()=>maps._safeMapUrl(u));
 assert.equal(maps._safeMapUrl('https://maps.app.goo.gl/example').hostname,'maps.app.goo.gl');
});
test('Maps validates every redirect before fetching target',async()=>{
 const original=global.fetch;const calls=[];
 global.fetch=async url=>{calls.push(url);return new Response(null,{status:302,headers:{location:'http://169.254.169.254/latest/meta-data'}})};
 try{await assert.rejects(maps._fetchMap('https://maps.app.goo.gl/example',AbortSignal.timeout(1000)));assert.equal(calls.length,1)}finally{global.fetch=original}
});
test('CMS refuses cross-site logout and oversized requests before processing',async()=>{
 const cms=require('../api/cms');for(const [headers,status] of [[{origin:'https://attacker.example',host:'rentalcamera.aiorbitlab.me'},403],[{'content-length':2000000},413]]){
 let body='';const res={setHeader(){},end(x){body=x}};await cms({method:'POST',query:{asset:'signage-logout'},headers},res);assert.equal(res.statusCode,status);assert(JSON.parse(body).ok===false);
 }
});
test('Presence writes via dedicated RPC instead of exposing table',async()=>{
 const handler=require('../analytics-presence-20260930');const original=global.fetch;let called=false;
 global.fetch=async(url,opts)=>{assert(url.endsWith('/rpc/rentcam_record_presence'));assert.equal(JSON.parse(opts.body).p_path,'/produk');called=true;return new Response('true')};
 try{const res={setHeader(){},end(){}};await handler({method:'POST',body:{session_id:'security-test-session',path:'/produk'}},res);assert(called);assert.equal(res.statusCode,200)}finally{global.fetch=original}
});
