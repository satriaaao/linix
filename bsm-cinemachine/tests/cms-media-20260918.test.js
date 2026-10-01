const assert=require('node:assert/strict');
const lib=require('../cms-media-20260918.js');

assert.equal(lib.validate({type:'image/png',size:100,name:'A B.png'}).name,'a-b.png');
assert.throws(()=>lib.validate({type:'application/pdf',size:100,name:'x.pdf'}),/JPG/);

const cfg={media:[]};let saves=0,calls=[],uploaded=[],processing=[];
const store={get:()=>cfg,save:async()=>{saves++;return cfg}};
const response=data=>({ok:true,status:200,text:async()=>typeof data==='string'?data:JSON.stringify(data)});
const admin={request:async(url,init)=>{calls.push(url);if(url.includes('/storage/'))uploaded.push(init);if(url.includes('issue_upload_token'))return response('tok');return response({ok:true})}};
const root={fetch(){throw new Error('native fetch')},crypto:{randomUUID:()=> 'u1'},RentcamProductPhoto:{prepare:async(file,options)=>{processing.push(options);return {type:'image/png',size:90,name:'cutout.png'};}}};

(async()=>{
  const media=lib.create(root,store,admin);
  const row=await media.upload({type:'image/jpeg',size:100,name:'Foto 1.jpg'},'product');
  assert.match(row.url,/cms-media\/tok\/product/);
  assert.equal(cfg.media.length,1);assert.equal(uploaded[0].headers['Content-Type'],'image/png');assert.equal(uploaded[0].body.name,'cutout.png');assert.equal(processing.length,1);assert.equal(processing[0].removeBackground,true);
  assert.equal(cfg.media[0].folder,'product');
  media.remove(0);
  assert.equal(cfg.media.length,0);
  await media.save();
  assert.equal(saves,1);
  await media.upload({type:'image/jpeg',size:100,name:'banner.jpg'},'website-banner');assert.equal(processing.length,1,'only product photos are processed');
  root.document={querySelector:selector=>selector==='[data-photo-remove-background]'?{checked:false}:null};
  await media.upload({type:'image/jpeg',size:100,name:'original.jpg'},'product');assert.equal(processing[1].removeBackground,false);
  root.document={querySelector:selector=>selector==='[data-photo-output]'?{value:'original'}:null};await media.upload({type:'image/jpeg',size:100,name:'original-selection.jpg'},'product');assert.equal(processing[2].removeBackground,false);
  root.RentcamProductPhoto.prepare=async()=>{throw Error('Model unavailable')};const before=calls.length;
  await assert.rejects(media.upload({type:'image/jpeg',size:100,name:'fail.jpg'},'product'),/Model unavailable/);assert.equal(calls.length,before,'failed processing must not upload an untreated photo');
  console.log('cms-media tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});