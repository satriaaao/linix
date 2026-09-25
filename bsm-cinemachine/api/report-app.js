const TARGET='https://api-v2.appdeploy.ai/app/bsm-report-online-db-grm8vt/api/report-app';

module.exports=async function handler(req,res){
  try{
    const op=String(req.query&&req.query.op||'health');
    const headers={'content-type':'application/json'};
    const auth=String(req.headers&&req.headers.authorization||'');
    if(auth)headers.authorization=auth;
    const options={method:req.method||'GET',headers,cache:'no-store'};
    if(req.method!=='GET'&&req.method!=='HEAD'){
      options.body=JSON.stringify(req.body==null?{}:req.body);
    }
    const upstream=await fetch(TARGET+'?op='+encodeURIComponent(op),options);
    const body=await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type',upstream.headers.get('content-type')||'application/json; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    res.setHeader('x-content-type-options','nosniff');
    res.send(body);
  }catch(err){
    console.error('report-app proxy error',err&&err.message?err.message:err);
    res.status(502).json({ok:false,error:'Database online tidak dapat dihubungi'});
  }
};