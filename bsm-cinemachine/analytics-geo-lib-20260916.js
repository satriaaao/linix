(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RentcamAnalyticsGeo=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function roundCoord(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.round(n*100)/100:null;
  }
  function clean(value){return String(value??'').trim()}
  function normalizeGeo(input={}){
    const g=input?.geo||input||{};
    return {
      city:clean(g.city)||'Tidak diketahui',
      region:clean(g.region)||'',
      country:clean(g.country)||'',
      latitude:roundCoord(g.latitude),
      longitude:roundCoord(g.longitude)
    };
  }
  function locationLabel(input={}){
    const g=normalizeGeo(input);
    const parts=[g.city,g.region,g.country].filter((x,i,a)=>x&&x!=='Tidak diketahui'&&a.indexOf(x)===i);
    return parts.length?parts.join(', '):'Tidak diketahui';
  }
  function productName(id,products=[],cfg={}){
    const key=String(id??'').trim();
    if(!key)return '-';
    const override=cfg?.productOverrides?.[key];
    if(override?.name)return String(override.name);
    const custom=(cfg?.customProducts||[]).find(x=>String(x?.id)===key);
    if(custom?.name)return String(custom.name);
    const base=(products||[]).find(x=>String(x?.id)===key);
    return String(base?.name||base?.title||key);
  }
  function summarize(events=[],products=[],cfg={}){
    const productMap=new Map(),locationMap=new Map(),visitors=new Set();
    for(const event of events||[]){
      const meta=event?.meta&&typeof event.meta==='object'?event.meta:{};
      if(meta.visitor_hash)visitors.add(String(meta.visitor_hash));
      if(event?.event_type==='product_click'&&event?.product_id){
        const id=String(event.product_id);
        const row=productMap.get(id)||{id,name:productName(id,products,cfg),count:0};
        row.count+=1;productMap.set(id,row);
      }
      const g=normalizeGeo(meta.geo||{});
      if(g.city==='Tidak diketahui'&&g.latitude===null&&g.longitude===null)continue;
      const key=[g.city,g.region,g.country,g.latitude??'',g.longitude??''].join('|');
      const row=locationMap.get(key)||{...g,label:locationLabel(g),events:0,clicks:0,views:0};
      row.events+=1;
      if(event?.event_type==='product_click')row.clicks+=1;
      if(event?.event_type==='page_view')row.views+=1;
      locationMap.set(key,row);
    }
    return {
      topProducts:[...productMap.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),
      locations:[...locationMap.values()].sort((a,b)=>b.events-a.events||a.label.localeCompare(b.label)),
      uniqueVisitors:visitors.size
    };
  }
  return {roundCoord,normalizeGeo,locationLabel,productName,summarize};
});
