const SB='https://xleceiffuopioeguniwj.supabase.co';
const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';

function normalize(record){
  const p=record?.product&&typeof record.product==='object'?record.product:{};
  const id=String(record?.id||p.id||'').trim();
  const name=String(p.name||id.replace(/[-_]+/g,' ')).trim();
  const price=Number(p.price);
  const stock=Number(p.stock);
  return {
    id,
    name,
    brand:String(p.brand||'Rentcam').trim(),
    category:String(p.cat||p.category||'Rental Equipment').trim(),
    price:Number.isFinite(price)&&price>=0?price:null,
    stock:Number.isFinite(stock)?stock:null,
    image:String(p.img||'').trim(),
    description:String(p.desc||p.description||`Sewa ${name} untuk kebutuhan produksi profesional di Jakarta.`).trim()
  };
}
async function request(path){
  const r=await fetch(SB+path,{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'});
  if(!r.ok)throw new Error('catalog '+r.status);
  return r.json();
}
async function listCatalog(){
  const rows=await request('/rest/v1/rentcam_order_catalog?select=id,product&order=id.asc&limit=2000');
  return (Array.isArray(rows)?rows:[]).map(normalize).filter(p=>p.id&&p.name);
}
async function getCatalogProduct(id){
  const safe=encodeURIComponent(String(id||''));
  if(!safe)return null;
  const rows=await request('/rest/v1/rentcam_order_catalog?select=id,product&id=eq.'+safe+'&limit=1');
  return Array.isArray(rows)&&rows[0]?normalize(rows[0]):null;
}
module.exports={listCatalog,getCatalogProduct,normalize};