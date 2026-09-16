/* Rentcam analytics transport interceptor — keeps public UI unchanged. */
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
