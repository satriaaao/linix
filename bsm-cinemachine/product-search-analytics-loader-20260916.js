/* Preserve product search, then install geo analytics transport inline so browser document.write policies cannot block it. */
document.write('<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@46bde66fd10ce06d2ba9f0c1af67689bb43c5ba0/bsm-cinemachine/product-search-20260912.js"><\/script>');
(function(){
  if(location.pathname.startsWith('/cms')||window.__rentcamGeoAnalyticsFetch)return;
  const original=window.fetch.bind(window);
  const target='/rest/v1/rentcam_events';
  window.__rentcamGeoAnalyticsFetch=original;
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input?.url||'');
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(method!=='POST'||!url.includes(target))return original(input,init);
    let payload=null;
    try{payload=typeof init.body==='string'?JSON.parse(init.body):init.body}catch(_){payload=null}
    if(!payload||!payload.event_type||!payload.session_id)return original(input,init);
    try{
      const routed=await original('/api/analytics-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'same-origin'});
      if(routed.ok)return routed;
    }catch(_){/* fall through to legacy insert */}
    return original(input,init);
  };
})();
