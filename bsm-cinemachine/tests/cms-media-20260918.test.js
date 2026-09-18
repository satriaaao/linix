const assert=require('node:assert/strict');
const lib=require('../cms-media-20260918.js');

assert.equal(lib.validate({type:'image/png',size:100,name:'A B.png'}).name,'a-b.png');
assert.throws(()=>lib.validate({type:'application/pdf',size:100,name:'x.pdf'}),/JPG/);

const cfg={media:[]};let saves=0,calls=[];
const store={get:()=>cfg,save:async()=>{saves++;return cfg}};
const response=data=>({ok:true,status:200,text:async()=>typeof data==='string'?data:JSON.stringify(data)});
const admin={request:async(url,init)=>{calls.push(url);if(url.includes('issue_upload_token'))return response('tok');return response({ok:true})}};
const root={fetch(){throw new Error('native fetch')},crypto:{randomUUID:()=> 'u1'}};

(async()=>{
  const media=lib.create(root,store,admin);
  const row=await media.upload({type:'image/png',size:100,name:'Foto 1.png'},'product');
  assert.match(row.url,/cms-media\/tok\/product/);
  assert.equal(cfg.media.length,1);
  assert.equal(cfg.media[0].folder,'product');
  media.remove(0);
  assert.equal(cfg.media.length,0);
  await media.save();
  assert.equal(saves,1);
  console.log('cms-media tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});