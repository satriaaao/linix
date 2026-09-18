const assert=require('node:assert/strict');
const lib=require('../cms-branding-20260918.js');

assert.equal(lib.clampSize('mobile',10),60);
assert.equal(lib.clampSize('mobile',999),190);
assert.equal(lib.clampSize('desktop',10),80);
assert.equal(lib.clampSize('desktop',999),280);
assert.throws(()=>lib.validateFile({type:'image/gif',size:100}),/PNG/);
assert.throws(()=>lib.validateFile({type:'image/png',size:6*1024*1024}),/5 MB/);

const cfg={general:{siteName:'Rentcam',logoUrl:'old.png',logoMobileWidth:145,logoDesktopWidth:170}};
let saves=0,calls=[];
const store={get:()=>cfg,save:async()=>{saves++;return cfg}};
const response=data=>({ok:true,status:200,text:async()=>typeof data==='string'?data:JSON.stringify(data)});
const admin={request:async(url,init)=>{calls.push({url,init});if(url.includes('rentcam_issue_upload_token'))return response('tok123');return response({ok:true})}};
const root={fetch(){throw new Error('native fetch should not run')},crypto:{randomUUID:()=> 'uuid1'}};

(async()=>{
  const b=lib.create(root,store,admin);
  b.setSize('mobile',999);
  assert.equal(cfg.general.logoMobileWidth,190);
  b.resetSizes();
  assert.equal(cfg.general.logoMobileWidth,145);
  assert.equal(cfg.general.logoDesktopWidth,170);
  b.remove();
  assert.equal(cfg.general.logoUrl,'');
  const url=await b.upload({type:'image/png',size:1000});
  assert.match(url,/cms-media\/tok123\/website-logo/);
  assert.equal(cfg.general.logoUrl,url);
  assert.equal(calls.length,2);
  await b.save();
  assert.equal(saves,1);
  console.log('cms-branding tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
