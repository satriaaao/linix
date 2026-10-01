const assert=require('node:assert/strict');
const admin=require('../cms-admin-client-secure-20260922');
const analytics=require('../cms-analytics-20260918');
const tracker=require('../analytics-tracker-20261001');
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
async function main(){
 const local=store();local.setItem(admin.DEFAULTS.authKey,JSON.stringify({access_token:'old-supabase-token'}));const env={localStorage:local,sessionStorage:store(),fetch:async()=>new Response('false')};admin.create(env);assert.equal(local.getItem(admin.DEFAULTS.authKey),null,'legacy auth without a valid CMS session must return to login');
 const paths=[];await assert.rejects(analytics.createClient({RentcamCmsAdmin:{session:()=>({token:'local-only'}),request:async url=>{paths.push(url);return new Response('false')}}}).load(analytics.last30()),e=>e.code==='ANALYTICS_AUTH_EXPIRED');assert.equal(paths.length,1);assert(paths[0].includes('/rpc/rentcam_is_admin'),'verify the server-side session before querying private events');
 const freshLocal=store();freshLocal.setItem(admin.DEFAULTS.authKey,JSON.stringify({access_token:'stale-token'}));
 const privateEvent={event_type:'product_click',product_id:'camera-one',session_id:'visitor-one',meta:{geo:{latitude:-6.2,longitude:106.8,city:'Jakarta',country:'ID'}},created_at:new Date().toISOString()};
 const authEnv={localStorage:freshLocal,sessionStorage:store(),fetch:async(url,init={})=>{
  const headers=new Headers(init.headers);
  if(url.includes('rentcam_admin_check'))return new Response(JSON.stringify(headers.get('x-rentcam-admin')==='fixture-password'));
  if(url.includes('rentcam_issue_admin_session'))return new Response(JSON.stringify({token:'fixture-session-token',expires_at:new Date(Date.now()+3600000).toISOString()}));
  const authorized=headers.get('x-rentcam-session')==='fixture-session-token';
  if(url.includes('rentcam_is_admin'))return new Response(JSON.stringify(authorized));
  if(url.includes('rentcam_events')){assert(authorized,'private events require the new session header');return new Response(JSON.stringify([privateEvent]));}
  return new Response('[]');
 }};
 const freshAdmin=admin.create(authEnv),report=analytics.createClient({RentcamCmsAdmin:freshAdmin});
 await assert.rejects(report.load(analytics.last30()),e=>e.code==='ANALYTICS_AUTH_EXPIRED');
 await assert.rejects(freshAdmin.login(admin.DEFAULTS.adminEmail,'wrong-password'),/Password admin salah/);
 assert.equal(freshAdmin.session(),null);
 await freshAdmin.login(admin.DEFAULTS.adminEmail,'fixture-password');
 const restored=await report.load(analytics.last30());assert.equal(restored.events.length,1);const mapped=analytics.summarize(restored.events);assert.equal(mapped.topProducts[0].count,1);assert.equal(mapped.locations[0].latitude,-6.2);
 assert.equal(analytics.summarize([{event_type:'page_view',meta:{geo:{country:'ID'}}}]).locations[0].label,'ID');
 assert.equal(tracker.productId('/produk/a%20camera'),'a camera');assert.equal(tracker.productId('/produk'),null);assert.equal(tracker.productId('/produk/%bad'),null);
 const callbacks={},documentCallbacks={},records=[];let fail=true;
 const root={location:{pathname:'/produk/first',origin:'https://example.com',href:'https://example.com/produk/first'},document:{hidden:false,addEventListener:(key,fn)=>documentCallbacks[key]=fn},navigator:{onLine:true,userAgent:'Fixture browser'},localStorage:store(),sessionStorage:store(),crypto:{randomUUID:()=> 'fixture-session'},AbortSignal,addEventListener:(key,fn)=>callbacks[key]=fn,setInterval:()=>1,setTimeout:fn=>fn(),fetch:async(url,opt)=>{if(url.endsWith('analytics-event')){if(fail){fail=false;throw Error('temporary network loss')}records.push(JSON.parse(opt.body))}return {ok:true,status:200}},history:{}};
 for(const method of ['pushState','replaceState'])root.history[method]=(_a,_b,path)=>{root.location.pathname=new URL(path,root.location.href).pathname};
 const client=tracker.install(root);await new Promise(r=>setImmediate(r));assert.equal(client.pending(),2);await client.flush();assert.equal(client.pending(),0);assert.deepEqual(records.map(x=>x.event_type),['page_view','product_click']);root.history.pushState({},'','/produk/second');await new Promise(r=>setImmediate(r));documentCallbacks['rentcam-route-change']();callbacks.pageshow();await new Promise(r=>setImmediate(r));assert.equal(records.filter(x=>x.product_id==='second').length,1,'one product opening must not be counted by both route listeners');root.history.replaceState({},'','/produk/third');await new Promise(r=>setImmediate(r));assert.equal(records.filter(x=>x.product_id==='third').length,1);assert(records.every(x=>x.session_id==='fixture-session'));
 console.log('Live Analytics regression: expired legacy login, server auth gate, geo without city, route tracking, duplicate suppression and network retry passed.');
}main().catch(e=>{console.error(e);process.exitCode=1});
