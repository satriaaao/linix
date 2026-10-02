const SB=process.env.RENTCAM_SUPABASE_URL||'https://xleceiffuopioeguniwj.supabase.co';
const KEY=process.env.RENTCAM_SUPABASE_ANON_KEY||'sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
module.exports=async(req,res)=>{
 res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
 const end=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data))};
 if(req.method!=='POST')return end(405,{ok:false,error:'Method not allowed'});
 let b=req.body;try{if(typeof b==='string')b=JSON.parse(b)}catch(_){b=null}
 const session=String(b?.session_id||''),path=String(b?.path||'/');
 if(!session||session.length<16||session.length>200||!path.startsWith('/')||path.length>500)return end(400,{ok:false,error:'Invalid presence'});
 try{
  const r=await fetch(SB+'/rest/v1/rpc/rentcam_record_presence',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({p_session:session,p_path:path}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('storage');return end(200,{ok:true});
 }catch(_){return end(502,{ok:false,error:'Presence storage unavailable'})}
};
