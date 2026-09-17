const assert=require('node:assert/strict');
const lib=require('../cms-rental-desk-20260918.js');

assert.equal(lib.appendPage('rentcam_orders?select=*',0),'rentcam_orders?select=*&limit=1000&offset=0');
assert.equal(lib.appendPage('rentcam_orders?select=*&limit=10',50),'rentcam_orders?select=*&limit=10');

function response(data,{ok=true,status=200}={}){
  return {ok,status,text:async()=>data===null?'':JSON.stringify(data)};
}

(async()=>{
  const calls=[];
  const transport=async(path,init)=>{
    calls.push({path,init});
    if(init.method==='POST')return response({ok:true,path});
    const m=path.match(/[?&]offset=(\d+)/);
    const offset=m?Number(m[1]):0;
    if(path.includes('rentcam_orders')&&offset===0)return response(Array.from({length:1000},(_,i)=>({id:i})));
    if(path.includes('rentcam_orders')&&offset===1000)return response([{id:1000},{id:1001}]);
    return response([]);
  };
  const client=lib.createClient(transport);
  const rows=await client.request('rentcam_orders?select=*');
  assert.equal(rows.length,1002);
  assert.equal(calls.filter(x=>x.path.includes('rentcam_orders')).length,2);

  const before=calls.length;
  const result=await client.rpc('rentcam_pro_action',{p_action:'test'});
  assert.equal(result.ok,true);
  assert.equal(calls.length,before+1);
  assert.equal(calls.at(-1).path,'rpc/rentcam_pro_action');
  assert.equal(calls.at(-1).init.method,'POST');
  assert.match(calls.at(-1).init.body,/p_action/);

  const snap=await client.snapshot('operations');
  assert.equal(snap.length,4);
  assert.ok(Array.isArray(snap[0]));

  console.log('cms-rental-desk tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
