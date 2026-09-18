const assert=require('node:assert/strict');
const lib=require('../cms-inventory-20260918.js');

assert.deepEqual(lib.normalizeSerials('A1\nA2,A1; A3'),['A1','A2','A3']);
assert.equal(lib.appendPage('rentcam_units?select=*',0),'rentcam_units?select=*&limit=1000&offset=0');

function response(data,{ok=true,status=200}={}){return {ok,status,text:async()=>JSON.stringify(data)}}
const transport=async(path,init)=>{
  if(init.method==='POST')return response({ok:true,path,body:JSON.parse(init.body)});
  const off=Number((path.match(/[?&]offset=(\d+)/)||[])[1]||0);
  if(path.startsWith('rentcam_units')){
    if(off===0)return response(Array.from({length:1000},(_,i)=>({id:'u'+i,product_id:i%2?'p1':'p2',active:true})));
    if(off===1000)return response([{id:'u1000',product_id:'p1',active:false},{id:'u1001',product_id:'p1',active:true}]);
  }
  if(path.startsWith('rentcam_dispatches'))return response([{id:'d1'}]);
  if(path.startsWith('rentcam_dispatch_units'))return response([{dispatch_id:'d1',unit_id:'u1'}]);
  if(path.startsWith('rentcam_orders'))return response([{id:'o1'}]);
  return response([]);
};
const cfg={productOverrides:{}};
let saves=0;
const store={get:()=>cfg,save:async()=>{saves++;return cfg}};

(async()=>{
  const inv=lib.create(transport,store);
  const snap=await inv.load();
  assert.equal(snap.units.length,1002);
  assert.equal(snap.dispatches.length,1);
  assert.equal(snap.assigned.length,1);
  assert.equal(snap.orders.length,1);
  assert.equal(inv.unitsForProduct('p1').length,502);
  assert.equal(inv.activeQty('p1'),501);
  inv.syncStock('p1');
  assert.equal(cfg.productOverrides.p1.stock,501);
  assert.equal(cfg.productOverrides.p1.serialManaged,true);
  const out=await inv.action('scan',{dispatch_id:'d1',barcode:'A1'});
  assert.equal(out.body.p_action,'scan');
  await inv.syncStock('p1',true);
  assert.equal(saves,1);
  console.log('cms-inventory tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
