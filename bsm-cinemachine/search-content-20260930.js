/* Published storefront data shared by HTML, sitemap and AI discovery. */
const seed=require('./search-editorial-seed-20260930.json');
const {listCatalog}=require('./catalog-public-20260917');
const SB='https://xleceiffuopioeguniwj.supabase.co',KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
const active=x=>x&&x.active!==false&&x.deleted!==true;
async function loadConfig(){const r=await fetch(SB+'/rest/v1/rentcam_cms_config?id=eq.1&select=config',{headers:{apikey:KEY},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('Website configuration unavailable');return (await r.json())[0]?.config||{}}
function content(cfg={},catalog=[]){
 const map=new Map(catalog.map(p=>[String(p.id),{...p}]));
 for(const p of cfg.customProducts||[])if(p.id)map.set(String(p.id),{...p,description:p.description||p.desc,image:p.images?.[0]||p.image||p.img,category:p.category||p.cat||p.mainCategory});
 for(const [id,override] of Object.entries(cfg.productOverrides||{})){if(map.has(id))map.set(id,{...map.get(id),...override,image:override.images?.[0]||override.image||map.get(id).image})}
 const products=[...map.values()].filter(active).map(p=>({...p,description:p.description||p.desc||'',price:p.price==null||p.price===''?null:Number(p.price),stock:p.stock==null||p.stock===''?null:Number(p.stock)}));
 const rows=key=>((cfg[key]||[]).length?cfg[key]:seed[key]).filter(active);
 return {cfg,products,articles:rows('articles'),portfolio:rows('portfolio')};
}
async function loadContent(){
 const [config,catalog]=await Promise.allSettled([loadConfig(),listCatalog()]);
 if(config.status==='rejected')throw config.reason;
 // Catalog outages must not fabricate prices or publish stale product listings.
 if(catalog.status==='rejected')throw catalog.reason;
 return content(config.value,catalog.value);
}
module.exports={loadContent,loadConfig,content,active};
