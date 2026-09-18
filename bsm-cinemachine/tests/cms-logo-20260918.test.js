const assert=require('node:assert/strict');
const lib=require('../cms-logo-20260918.js');

assert.equal(lib.normalizeSize('mobile',10),60);
assert.equal(lib.normalizeSize('mobile',999),190);
assert.equal(lib.normalizeSize('desktop',10),80);
assert.equal(lib.normalizeSize('desktop',999),280);
assert.throws(()=>lib.validateFile({type:'image/gif',size:10}),/PNG/);
assert.throws(()=>lib.validateFile({type:'image/png',size:6*1024*1024}),/5 MB/);

const cfg={general:{siteName:'Rentcam',logoUrl:'old.png',logoMobileWidth:145,logoDesktopWidth:170}};
let saves=0,uploadUrl='';
const store={get:()=>cfg,save:async()=>{saves++;return cfg}};
const response=(body,{ok=true,status=200}={})=>({ok,status,text:async()=>typeof body==='string'?body:JSON.stringify(body)});
const request=async(url,init)=>{
  if(url.includes('/rpc/rentcam_issue_upload_token'))return response('tok123');
  if(url.includes('/storage/v1/object/cms-media/')){uploadUrl=url;return response({ok:true})}
  return response({}, {ok:false,status:404});
};

(async()=>{
  const logo=lib.create({request,store,now:()=>12345,uuid:()=> 'uuid-1'});
  assert.equal(logo.get().logoUrl,'old.png');
  logo.setUrl(' next.png ');
  assert.equal(cfg.general.logoUrl,'next.png');
  logo.setSize('mobile',999);
  assert.equal(cfg.general.logoMobileWidth,190);
  logo.resetSizes();
  assert.equal(cfg.general.logoMobileWidth,145);
  assert.equal(cfg.general.logoDesktopWidth,170);
  const url=await logo.upload({type:'image/png',size:1024});
  assert.match(url,/public\/cms-media\/tok123\/website-logo\/12345-uuid-1\.png$/);
  assert.match(uploadUrl,/cms-media\/tok123\/website-logo\/12345-uuid-1\.png$/);
  logo.remove();
  assert.equal(cfg.general.logoUrl,'');
  await logo.save();
  assert.equal(saves,1);
  console.log('cms-logo tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
