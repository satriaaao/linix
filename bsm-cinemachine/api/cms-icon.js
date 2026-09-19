module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101827"/><stop offset="1" stop-color="#1a2a42"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="256" cy="256" r="154" fill="#f26a21"/>
  <path d="M176 354V158h96c59 0 96 31 96 82 0 35-18 62-50 75l59 39h-75l-49-33h-15v33h-62zm62-87h30c26 0 40-10 40-29 0-18-14-28-40-28h-30v57z" fill="#fff"/>
</svg>`;
  res.statusCode=200;
  res.setHeader('content-type','image/svg+xml; charset=utf-8');
  res.setHeader('cache-control','public, max-age=86400');
  if(req.method==='HEAD')return res.end();
  return res.end(svg);
};