const ALLOWED=new Set([
  'maps.app.goo.gl','share.google','goo.gl',
  'google.com','www.google.com','maps.google.com'
]);

function coordsFromText(input=''){
  let s=String(input||'');
  try{s=decodeURIComponent(s)}catch(_){}
  let m=s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if(!m)m=s.match(/[?&](?:q|query|destination|center)=(-?\d+(?:\.\d+)?)[, ]+(-?\d+(?:\.\d+)?)/i);
  if(!m)m=s.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);
  if(!m)return null;
  const lat=Number(m[1]),lng=Number(m[2]);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)return null;
  return {lat,lng};
}

module.exports=async function handler(req,res){
  res.setHeader('cache-control','no-store, max-age=0');
  if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({ok:false,message:'Method not allowed'}))}
  const raw=String(req.query?.url||'').trim();
  if(!raw){res.statusCode=400;res.setHeader('content-type','application/json');return res.end(JSON.stringify({ok:false,message:'URL wajib'}))}
  let u;
  try{u=new URL(raw)}catch(_){res.statusCode=400;res.setHeader('content-type','application/json');return res.end(JSON.stringify({ok:false,message:'URL tidak valid'}))}
  if(u.protocol!=='https:'||!ALLOWED.has(u.hostname.toLowerCase())){
    res.statusCode=400;res.setHeader('content-type','application/json');return res.end(JSON.stringify({ok:false,message:'Hanya link Google Maps yang didukung'}));
  }

  const direct=coordsFromText(raw);
  if(direct){
    res.statusCode=200;res.setHeader('content-type','application/json');
    return res.end(JSON.stringify({ok:true,final_url:raw,...direct}));
  }

  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    const r=await fetch(raw,{
      method:'GET',
      redirect:'follow',
      signal:controller.signal,
      headers:{'user-agent':'Mozilla/5.0 RentcamMapsResolver/1.0','accept':'text/html,*/*'}
    });
    clearTimeout(timer);
    const finalUrl=r.url||raw;
    let coords=coordsFromText(finalUrl);
    let html='';
    if(!coords){
      html=await r.text();
      coords=coordsFromText(html);
      if(!coords){
        const m=html.match(/https:\/\/www\.google\.com\/maps[^"'<> ]+/);
        if(m)coords=coordsFromText(m[0]);
      }
    }
    res.statusCode=200;res.setHeader('content-type','application/json');
    return res.end(JSON.stringify({ok:true,final_url:finalUrl,lat:coords?.lat??null,lng:coords?.lng??null}));
  }catch(e){
    res.statusCode=502;res.setHeader('content-type','application/json');
    return res.end(JSON.stringify({ok:false,message:'Link Google Maps tidak bisa di-resolve',detail:String(e?.message||e)}));
  }
};