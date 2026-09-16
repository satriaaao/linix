const crypto=require('node:crypto');

const SB=process.env.RENTCAM_SUPABASE_URL||'https://xleceiffuopioeguniwj.supabase.co';
const KEY=process.env.RENTCAM_SUPABASE_ANON_KEY||'sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
const ALLOWED=new Set(['page_view','product_click']);

function header(req,name){
  const h=req?.headers||{};
  return h[name]??h[name.toLowerCase()]??h[name.toUpperCase()]??'';
}
function decoded(value){try{return decodeURIComponent(String(value||''))}catch(_){return String(value||'')}}
function roundCoord(value){if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?Math.round(n*100)/100:null}
function json(res,status,payload){res.statusCode=status;res.setHeader?.('content-type','application/json; charset=utf-8');res.setHeader?.('cache-control','no-store');res.end(JSON.stringify(payload))}
function bodyObject(req){if(req?.body&&typeof req.body==='object')return req.body;try{return JSON.parse(req?.body||'{}')}catch(_){return {}}}
function visitorHash(req,sessionId){
  const rawIp=String(header(req,'x-forwarded-for')||'').split(',')[0].trim();
  const salt=process.env.RENTCAM_ANALYTICS_SALT||process.env.VERCEL_URL||'rentcam-analytics-v1';
  return crypto.createHash('sha256').update(`${rawIp}|${sessionId}|${salt}`).digest('hex').slice(0,16);
}
function geoFromHeaders(req){
  return {
    city:decoded(header(req,'x-vercel-ip-city')).slice(0,120),
    region:decoded(header(req,'x-vercel-ip-country-region')).slice(0,16),
    country:String(header(req,'x-vercel-ip-country')||'').slice(0,8),
    latitude:roundCoord(header(req,'x-vercel-ip-latitude')),
    longitude:roundCoord(header(req,'x-vercel-ip-longitude'))
  };
}

async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
  const b=bodyObject(req);
  const eventType=String(b.event_type||'');
  const path=String(b.path||'/').slice(0,500);
  const productId=b.product_id==null?null:String(b.product_id).slice(0,200);
  const sessionId=String(b.session_id||'').slice(0,200);
  if(!ALLOWED.has(eventType)||!sessionId||!path.startsWith('/'))return json(res,400,{ok:false,error:'Invalid analytics event'});
  const ua=String(b?.meta?.ua||header(req,'user-agent')||'').slice(0,180);
  const event={
    event_type:eventType,
    path,
    product_id:productId,
    session_id:sessionId,
    meta:{ua,geo:geoFromHeaders(req),visitor_hash:visitorHash(req,sessionId)}
  };
  try{
    const r=await fetch(SB+'/rest/v1/rentcam_events',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(event)});
    if(!r.ok){await r.text().catch(()=>null);return json(res,502,{ok:false,error:'Analytics storage unavailable'})}
    return json(res,200,{ok:true});
  }catch(_){return json(res,502,{ok:false,error:'Analytics storage unavailable'})}
}

module.exports=handler;
module.exports._geoFromHeaders=geoFromHeaders;
module.exports._visitorHash=visitorHash;
