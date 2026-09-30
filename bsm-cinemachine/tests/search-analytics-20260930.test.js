const assert=require('node:assert/strict');
const {content}=require('../search-content-20260930');
const {buildSeo,routeForPath}=require('../search-seo-20260930');
const analytics=require('../cms-analytics-20260918');
const {normalize}=require('../catalog-public-20260917');
const data=content({general:{siteName:'Test Rental',seoTitle:'Rental equipment',seoDescription:'Published description'},business:{city:'Bandung',streetAddress:'Jalan Studio 1'},productOverrides:{p1:{name:'Edited product',price:900,seoTitle:'Custom product title',aeoQuestion:'Included?',aeoAnswer:'Body and battery.',geoSummary:'Rental summary',geoEntities:'Camera, Full frame',seoKeywords:'rental camera'}},customProducts:[{id:'hidden',name:'Hidden',active:false}],articles:[{id:'draft',title:'Draft',active:false}]},[normalize({id:'p1',product:{name:'Original',price:1000,stock:null,img:'https://example.com/photo.jpg',inc:['Battery'],spec:[['Weight','1 kg']]}})]);
assert.equal(normalize({id:'x',product:{price:null,stock:null}}).price,null);
assert.equal(data.products.length,1);assert.equal(data.articles.length,0);
const seo=buildSeo({kind:'product',slug:'p1'},data);
assert.equal(seo.title,'Custom product title');assert.equal(seo.schema.find(x=>x['@type']==='WebPage').keywords,'rental camera');assert.deepEqual(seo.schema.find(x=>x['@type']==='WebPage').about,[{'@type':'Thing',name:'Camera'},{'@type':'Thing',name:'Full frame'}]);assert.equal(seo.schema.find(x=>x['@type']==='Product').offers.price,'900');assert.equal(seo.schema.find(x=>x['@type']==='Product').offers.availability,undefined);assert.match(seo.body,/Battery/);assert.match(seo.body,/Included\?/);assert.match(seo.body,/Body and battery/);assert.equal(seo.schema[0].address.addressLocality,'Bandung');assert.equal(buildSeo({kind:'product',slug:'missing'},data).status,404);
assert.equal(buildSeo({kind:'tracking'},data).robots,'noindex,nofollow');assert.deepEqual(routeForPath('/produk/sony%20camera'),{kind:'product',slug:'sony camera'});
assert.equal(buildSeo({kind:'home'},content({general:{siteName:'Local Rental'}},[])).schema[0].areaServed,undefined);
assert.throws(()=>analytics.isoBounds('2026-02-30','2026-03-02'));
assert.equal(analytics.summarize([{event_type:'page_view',session_id:'legacy'},{event_type:'product_click',session_id:'legacy',meta:{visitor_hash:'new-hash'}}]).uniqueVisitors,1);
const { _patchPublicHtml:patch}=require('../api/site');const html=patch('<head><title>Old</title></head><body><main id="app"></main><script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@aaa/bsm-cinemachine/cms-public-runtime-v8-20260912.js"></script></body>',seo);
assert.match(html,/src="\/cms-public-runtime-v8-20260912.js"/);assert.match(html,/data-search-schema/);assert.match(html,/Body and battery/);assert.match(html,/seo-runtime-20260930.js/);
async function verify(){
 let calls=[];const client=analytics.createClient({RentcamCmsAdmin:{session:()=>({token:'fixture-only'}),request:async(url)=>{calls.push(url);return {ok:true,text:async()=>JSON.stringify(url.includes('presence')?[{session_id:'s1'}]:[{event_type:'page_view',session_id:'s1'}])}}}});const loaded=await client.load(analytics.last30());assert.equal(loaded.events.length,1);assert.equal(loaded.presence.length,1);assert.equal(calls.length,2);
 await assert.rejects(analytics.createClient({RentcamCmsAdmin:{session:()=>null}}).load(analytics.last30()),/Sesi admin/);
 const handler=require('../analytics-presence-20260930');const old=global.fetch;let record;global.fetch=async(url,opt)=>{record=JSON.parse(opt.body);return {ok:true}};
 const res={setHeader(){},end(text){this.body=text}};try{await handler({method:'POST',body:{session_id:'fixture',path:'/',last_seen:'1900-01-01'}},res);assert.equal(res.statusCode,200);assert.notEqual(record.last_seen,'1900-01-01');await handler({method:'POST',body:{session_id:'',path:'/'}},res);assert.equal(res.statusCode,400)}finally{global.fetch=old}
 console.log('Search and Analytics: published content, accurate schema, SSR, legacy sessions, authenticated queries and presence validated.');
}verify().catch(e=>{console.error(e);process.exitCode=1});
