/* Rentcam CMS — Gojek-style pickup & delivery dispatch */
(function(){
  if(!location.pathname.startsWith('/cms')) return;
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
  const fmtDate=v=>{
    if(!v)return 'Belum dijadwalkan';
    const d=new Date(v); if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  };
  const cleanPhone=v=>String(v||'').replace(/\D/g,'').replace(/^0/,'62');
  const statusInfo={
    waiting:['Mencari driver','waiting'],
    assigned:['Driver ditugaskan','assigned'],
    to_pickup:['Menuju lokasi jemput','moving'],
    picked_up:['Barang sudah diambil','moving'],
    on_the_way:['Dalam perjalanan','moving'],
    arrived:['Sudah tiba','arrived'],
    completed:['Selesai','done'],
    cancelled:['Dibatalkan','cancelled']
  };
  const nextStatus={
    waiting:['assigned','Tugaskan driver'],
    assigned:['to_pickup','Driver berangkat'],
    to_pickup:['picked_up','Sudah di lokasi / ambil barang'],
    picked_up:['on_the_way','Mulai perjalanan'],
    on_the_way:['arrived','Sudah tiba'],
    arrived:['completed','Selesaikan tugas']
  };
  let active=false, orders=[], filter='all', modal=null, loading=false, masterDrivers=[], masterVehicles=[], dispatchSettings={},livePollBusy=false,geoLabelCache=new Map(),dispatchMap=null,dispatchRouteLayers=[],routeGroupsCache=[];

  async function decode(r){
    const text=await r.text(); let data=null;
    try{data=text?JSON.parse(text):null}catch(_){data=text}
    if(!r.ok) throw new Error(data?.message||data||('Permintaan gagal ('+r.status+')'));
    return data;
  }
  async function loadOrders(){
    if(!window.RentcamRentalDesk) throw new Error('Rental Desk belum siap');
    return window.RentcamRentalDesk.request('rentcam_orders?select=*&order=created_at.desc');
  }
  async function patchDelivery(id,delivery){
    const r=await window.RentcamCmsAdmin.request(SB+'/rest/v1/rpc/rentcam_admin_delivery_patch',{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify({p_order:id,p_patch:delivery})
    });
    const data=await decode(r);
    if(!data?.ok)throw new Error('Gagal memperbarui antar-jemput');
    return data.delivery||delivery;
  }
  async function adminRpc(name,payload={}){
    const r=await window.RentcamCmsAdmin.request(SB+'/rest/v1/rpc/'+name,{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    return decode(r);
  }
  async function loadMasters(){
    const [drivers,vehicles,settings]=await Promise.all([
      adminRpc('rentcam_admin_driver_list'),
      adminRpc('rentcam_admin_vehicle_list'),
      adminRpc('rentcam_admin_dispatch_settings')
    ]);
    masterDrivers=Array.isArray(drivers)?drivers:[];
    masterVehicles=Array.isArray(vehicles)?vehicles:[];
    dispatchSettings=settings?.ok?settings.settings:{};
  }
  const PUBLIC_ORIGIN='https://rentalcamera.aiorbitlab.me';
  function trackingUrl(o){
    return o?.tracking_code?PUBLIC_ORIGIN+'/pantau':'';
  }
  function trackingCode(o){
    return String(o?.tracking_code||'').toUpperCase();
  }
  function jobs(){
    const out=[];
    orders.filter(o=>o.source!=='quotation').forEach(o=>{
      const d=o.delivery||{};
      if(d.deliver_at||d.mode==='delivery')out.push(makeJob(o,'deliver'));
      if(d.collect_at||d.return_mode==='collect')out.push(makeJob(o,'collect'));
    });
    return out.sort((a,b)=>(a.time||'9999').localeCompare(b.time||'9999'));
  }
  function makeJob(o,kind){
    const d=o.delivery||{};
    const isDeliver=kind==='deliver';
    let s=d[kind+'_trip_status']||'';
    if(!s){
      if(d[kind+'_status']==='completed')s='completed';
      else if(d.driver)s='assigned';
      else s='waiting';
    }
    return {
      id:o.id,order:o,kind,
      label:isDeliver?'Antar ke customer':'Jemput kembali',
      time:d[isDeliver?'deliver_at':'collect_at']||'',
      address:d.address||'',
      origin:isDeliver?(d.origin||'Rentcam'):d.address||'Lokasi customer',
      destination:isDeliver?(d.address||'Lokasi customer'):(d.return_address||'Rentcam'),
      driver_id:d.driver_id||'',
      driver:d.driver||'',
      driver_phone:d.driver_phone||'',
      vehicle_id:d.vehicle_id||'',
      vehicle:d.vehicle||'',
      plate:d.plate||'',
      distance_km:Number(d[kind+'_distance_km']||d.distance_km||0),
      fee:Number(d[kind+'_fee']||d.fee||0),
      note:d[kind+'_note']||d.note||'',
      status:s,
      location:d[kind+'_driver_location']||d.driver_location||null
    };
  }
  function coordFromJob(j){
    const d=j?.order?.delivery||{};
    const rawLat=d.latitude,rawLng=d.longitude;
    if(rawLat!==null&&rawLat!==undefined&&rawLat!==''&&rawLng!==null&&rawLng!==undefined&&rawLng!==''){
      const lat=Number(rawLat),lng=Number(rawLng);
      if(Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180)return{lat,lng};
    }
    return parseCoordsFromMapsUrl(d.maps_url);
  }
  function haversineKm(a,b){
    const R=6371,toRad=x=>x*Math.PI/180;
    const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
    const q=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }
  function bearingDeg(a,b){
    const r=x=>x*Math.PI/180,d=x=>x*180/Math.PI;
    const y=Math.sin(r(b.lng-a.lng))*Math.cos(r(b.lat));
    const x=Math.cos(r(a.lat))*Math.sin(r(b.lat))-Math.sin(r(a.lat))*Math.cos(r(b.lat))*Math.cos(r(b.lng-a.lng));
    return (d(Math.atan2(y,x))+360)%360;
  }
  function angleDiff(a,b){
    const d=Math.abs(a-b)%360;return d>180?360-d:d;
  }
  async function currentAdminGps(){
    if(!navigator.geolocation)return null;
    try{
      const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
        resolve,reject,{enableHighAccuracy:true,timeout:9000,maximumAge:5000}
      ));
      const lat=Number(pos.coords.latitude),lng=Number(pos.coords.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
      return{lat,lng,accuracy:Number(pos.coords.accuracy||0)};
    }catch(_){return null}
  }
  async function persistCurrentStart(p){
    try{
      const s=dispatchSettings||{};
      const rawLat=s.office_lat,rawLng=s.office_lng;
      if(rawLat!==null&&rawLat!==undefined&&rawLat!==''&&rawLng!==null&&rawLng!==undefined&&rawLng!==''){
        const oldLat=Number(rawLat),oldLng=Number(rawLng);
        if(Number.isFinite(oldLat)&&Number.isFinite(oldLng)&&!(Math.abs(oldLat)<0.000001&&Math.abs(oldLng)<0.000001)){
          if(haversineKm({lat:oldLat,lng:oldLng},p)<0.05)return;
        }
      }
      const address=await reverseDriverLabel(p.lat,p.lng);
      const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.lat+','+p.lng);
      const d=await adminRpc('rentcam_admin_dispatch_settings_save',{
        p_office_name:'Lokasi Saat Ini',
        p_office_address:address,
        p_office_maps_url:maps,
        p_office_lat:Number(p.lat.toFixed(6)),
        p_office_lng:Number(p.lng.toFixed(6))
      });
      if(d?.ok)dispatchSettings=d.settings||dispatchSettings;
    }catch(_){}
  }
  async function officePoint(){
    const gps=await currentAdminGps();
    if(gps){
      persistCurrentStart(gps);
      return{lat:gps.lat,lng:gps.lng,name:'Lokasi Saat Ini',accuracy:gps.accuracy};
    }
    const s=dispatchSettings||{};
    const rawLat=s.office_lat,rawLng=s.office_lng;
    if(rawLat!==null&&rawLat!==undefined&&rawLat!==''&&rawLng!==null&&rawLng!==undefined&&rawLng!==''){
      const lat=Number(rawLat),lng=Number(rawLng);
      if(Number.isFinite(lat)&&Number.isFinite(lng)&&!(Math.abs(lat)<0.000001&&Math.abs(lng)<0.000001))return{lat,lng,name:s.office_name||'Lokasi Saat Ini'};
    }
    const fromUrl=parseCoordsFromMapsUrl(s.office_maps_url);
    if(fromUrl&&!(Math.abs(fromUrl.lat)<0.000001&&Math.abs(fromUrl.lng)<0.000001))return{...fromUrl,name:s.office_name||'Lokasi Saat Ini'};
    const g=await geocodePlaceBrowser(s.office_address||'');
    return g?{...g,name:s.office_name||'Lokasi Saat Ini'}:null;
  }
  async function resolveJobCoords(j){
    const existing=coordFromJob(j);
    if(existing)return existing;
    const d=j?.order?.delivery||{};
    const candidates=[d.maps_url,j.address,j.destination].map(x=>String(x||'').trim()).filter(Boolean);
    for(const raw of candidates){
      if(/^https?:\/\//i.test(raw)){
        const resolved=await resolveMapsLink(raw);
        if(resolved&&Number.isFinite(resolved.lat)&&Number.isFinite(resolved.lng)){
          d.latitude=resolved.lat;d.longitude=resolved.lng;
          if(resolved.final_url)d.maps_url=resolved.final_url;
          return{lat:resolved.lat,lng:resolved.lng};
        }
      }else{
        const g=await geocodePlaceBrowser(raw);
        if(g){d.latitude=g.lat;d.longitude=g.lng;return{lat:g.lat,lng:g.lng}}
      }
    }
    return null;
  }
  async function hydrateCustomerCoords(){
    const active=jobs().filter(j=>j.status!=='completed'&&j.status!=='cancelled');
    await Promise.all(active.map(async j=>{
      if(coordFromJob(j))return;
      try{await resolveJobCoords(j)}catch(_){}
    }));
  }
  function greedyOrder(base,items){
    const rest=items.slice(),out=[];let current=base;
    while(rest.length){
      let bestIndex=0,best=Infinity;
      for(let i=0;i<rest.length;i++){
        const d=haversineKm(current,rest[i].coords);
        if(d<best){best=d;bestIndex=i}
      }
      const next=rest.splice(bestIndex,1)[0];
      out.push(next);current=next.coords;
    }
    return out;
  }
  function buildRouteGroups(base){
    const candidates=jobs()
      .filter(j=>j.status!=='completed'&&j.status!=='cancelled')
      .map(j=>({job:j,coords:coordFromJob(j)}))
      .filter(x=>x.coords)
      .map(x=>({...x,bearing:bearingDeg(base,x.coords),radius:haversineKm(base,x.coords)}));
    const groups=[];
    const seen=new Set();
    for(let i=0;i<candidates.length;i++){
      if(seen.has(i))continue;
      const queue=[i],items=[];seen.add(i);
      while(queue.length){
        const idx=queue.shift(),a=candidates[idx];items.push(a);
        for(let k=0;k<candidates.length;k++){
          if(seen.has(k))continue;
          const b=candidates[k];
          const between=haversineKm(a.coords,b.coords);
          const sameDirection=angleDiff(a.bearing,b.bearing)<=45;
          const nearEnough=between<=8 || (sameDirection&&between<=14);
          if(nearEnough){seen.add(k);queue.push(k)}
        }
      }
      const ordered=greedyOrder(base,items);
      const meanBearing=ordered.length?ordered.reduce((n,x)=>n+x.bearing,0)/ordered.length:0;
      groups.push({items:ordered,meanBearing});
    }
    return groups.sort((a,b)=>{
      const da=a.items[0]?haversineKm(base,a.items[0].coords):999;
      const db=b.items[0]?haversineKm(base,b.items[0].coords):999;
      return da-db;
    });
  }
  function directionLabel(b){
    const dirs=['Utara','Timur Laut','Timur','Tenggara','Selatan','Barat Daya','Barat','Barat Laut'];
    return dirs[Math.round(b/45)%8];
  }
  function routeGroupPanel(){
    return '<section class="gd-distribution"><div class="gd-dist-head"><div><small>PEMBAGIAN RUTE CUSTOMER</small><h3>Peta Lokasi Customer & Rekomendasi 1 Driver</h3><p>Lihat posisi customer, jarak dan waktu antar-stop, lalu gabungkan customer yang berdekatan ke satu driver.</p></div><button class="secondary" data-gd-action="rebuild-routes">Hitung Ulang</button></div><div class="gd-dist-body"><div id="gdDispatchMap" class="gd-dispatch-map"><div class="gd-map-loading">Memuat lokasi customer…</div></div><div id="gdRouteGroups" class="gd-route-groups"><div class="gd-map-loading">Menghitung jarak & waktu antar customer…</div></div></div></section>';
  }
  async function ensureLeaflet(){
    if(window.L)return window.L;
    if(!document.getElementById('gd-leaflet-css')){
      const l=document.createElement('link');l.id='gd-leaflet-css';l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l);
    }
    return new Promise((resolve,reject)=>{
      const existing=document.getElementById('gd-leaflet-js');
      if(existing){existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');s.id='gd-leaflet-js';s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>resolve(window.L);s.onerror=reject;document.head.appendChild(s);
    });
  }
  async function customerAreaLabel(item){
    if(item.areaLabel)return item.areaLabel;
    const lat=item.coords?.lat,lng=item.coords?.lng;
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return '';
    const key='area:'+Number(lat).toFixed(4)+','+Number(lng).toFixed(4);
    if(geoLabelCache.has(key)){item.areaLabel=geoLabelCache.get(key);return item.areaLabel}
    try{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
      const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&zoom=14&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lng),{headers:{Accept:'application/json'},signal:controller.signal});
      clearTimeout(timer);
      if(r.ok){
        const j=await r.json(),a=j.address||{};
        const district=a.city_district||a.suburb||a.village||a.town||'';
        const city=a.city||a.municipality||a.county||'';
        const label=[district,city].filter((v,i,arr)=>v&&arr.indexOf(v)===i).join(', ');
        if(label){geoLabelCache.set(key,label);item.areaLabel=label;return label}
      }
    }catch(_){}
    item.areaLabel=item.job.destination||item.job.address||'Lokasi customer';
    return item.areaLabel;
  }
  async function enrichAreaLabels(groups){
    await Promise.all(groups.flatMap(g=>g.items.map(x=>customerAreaLabel(x))));
  }
  function fmtMinutes(min){
    const m=Math.max(1,Math.round(Number(min)||0));
    if(m<60)return m+' menit';
    const h=Math.floor(m/60),r=m%60;
    return h+' jam'+(r?' '+r+' menit':'');
  }
  async function drawRoadGroup(L,map,base,g,color){
    const pts=[base,...g.items.map(x=>x.coords)];
    try{
      const path=pts.map(x=>x.lng+','+x.lat).join(';');
      const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+path+'?overview=full&geometries=geojson&steps=false');
      const j=await r.json(),route=j?.routes?.[0];
      if(!route)throw new Error('route');
      const latlngs=route.geometry.coordinates.map(x=>[x[1],x[0]]);
      const casing=L.polyline(latlngs,{weight:9,opacity:.95,color:'#fff',lineCap:'round',lineJoin:'round'});
      const main=L.polyline(latlngs,{weight:5,opacity:.95,color,lineCap:'round',lineJoin:'round'});
      const layer=L.layerGroup([casing,main]).addTo(map);dispatchRouteLayers.push(layer);
      g.roadKm=route.distance/1000;g.roadMin=Math.max(1,Math.round(route.duration/60));
      g.legs=(route.legs||[]).map((leg,idx)=>({
        distanceKm:Number(leg.distance||0)/1000,
        minutes:Math.max(1,Math.round(Number(leg.duration||0)/60)),
        from:idx===0?'Start':('Stop '+idx),
        to:'Stop '+(idx+1)
      }));
    }catch(_){
      const latlngs=pts.map(x=>[x.lat,x.lng]);
      const main=L.polyline(latlngs,{weight:4,opacity:.8,color,dashArray:'7 7'}).addTo(map);dispatchRouteLayers.push(main);
      g.legs=pts.slice(1).map((p,i)=>({distanceKm:haversineKm(pts[i],p),minutes:null,from:i===0?'Start':('Stop '+i),to:'Stop '+(i+1)}));
      g.roadKm=g.legs.reduce((n,x)=>n+x.distanceKm,0);
      g.roadMin=null;
    }
  }
  function groupCard(g,i,color){
    const letter=String.fromCharCode(65+i),count=g.items.length;
    const waiting=g.items.filter(x=>x.job.status==='waiting');
    const assigned=g.items.filter(x=>x.job.status!=='waiting');
    const assignedDriverIds=[...new Set(assigned.map(x=>x.job.driver_id).filter(Boolean))];
    const assignedNames=[...new Set(assigned.map(x=>x.job.driver).filter(Boolean))];
    const oneDriver=assignedDriverIds.length===1;
    const suitable=count>1 && (g.legs||[]).slice(1).every(x=>x.distanceKm<=10);
    let timeline='<div class="gd-trip-stop start"><span class="gd-trip-dot">S</span><div><b>BSM / Lokasi Saat Ini</b><small>Titik awal perjalanan</small></div></div>';
    g.items.forEach((x,idx)=>{
      const leg=g.legs?.[idx];
      if(leg){
        timeline+='<div class="gd-trip-leg"><i></i><b>'+leg.distanceKm.toFixed(1)+' km</b><span>· '+(leg.minutes?fmtMinutes(leg.minutes):'estimasi')+'</span></div>';
      }
      timeline+='<div class="gd-trip-stop"><span class="gd-trip-dot" style="background:'+color+'">'+(idx+1)+'</span><div><b>'+E(x.job.order.customer_name||'Customer')+' · '+E(x.areaLabel||'Lokasi customer')+'</b><small>'+E(x.job.order.order_number||'')+' · '+E(x.job.kind==='deliver'?'Antar':'Jemput')+(x.job.driver?' · Driver '+E(x.job.driver):' · Belum ada driver')+'</small></div></div>';
    });
    let action='';
    if(waiting.length){
      const label=oneDriver?('Gabungkan '+waiting.length+' stop ke '+E(assignedNames[0]||'driver')):('Tugaskan 1 Driver ke Rute '+letter);
      action='<button class="primary" data-gd-action="assign-route-group" data-group="'+i+'">'+label+'</button>';
    }else if(assignedNames.length===1){
      action='<div class="gd-route-assigned">Driver rute ini: <b>'+E(assignedNames[0])+'</b></div>';
    }else if(assignedNames.length>1){
      action='<div class="gd-route-assigned">Rute ini sedang ditangani beberapa driver.</div>';
    }
    return '<article class="gd-group-card gd-trip-card" style="--route-color:'+color+'"><div class="gd-group-top"><span class="gd-route-letter">'+letter+'</span><div><small>RUTE '+letter+' · '+E(directionLabel(g.meanBearing))+'</small><h4>'+count+' customer'+(suitable?' · Cocok 1 driver':'')+'</h4><p><b>'+((g.roadKm||0).toFixed(1))+' km</b>'+(g.roadMin?' · ±'+fmtMinutes(g.roadMin):'')+'</p></div></div><div class="gd-trip-timeline">'+timeline+'</div>'+action+'</article>';
  }
  async function initDistribution(){
    const mapEl=document.getElementById('gdDispatchMap'),groupEl=document.getElementById('gdRouteGroups');
    if(!mapEl||!groupEl)return;
    const base=await officePoint();
    if(!base){mapEl.innerHTML='<div class="gd-map-empty"><b>Lokasi saat ini belum siap</b><span>Tekan tombol “Lokasi Saat Ini” untuk mengambil GPS dan menghitung pembagian rute.</span></div>';groupEl.innerHTML='';return}
    hydrateCustomerCoords().catch(()=>{});
    routeGroupsCache=buildRouteGroups(base);
    routeGroupsCache.forEach(g=>g.items.forEach(x=>{
      const raw=String(x.job.destination||x.job.address||'').trim();
      if(raw&&!/^https?:\/\//i.test(raw))x.areaLabel=raw;
    }));
    if(!routeGroupsCache.length){groupEl.innerHTML='<div class="gd-map-empty"><b>Belum ada lokasi customer yang bisa dipetakan</b><span>Isi alamat atau Google Maps customer agar jarak dan waktu bisa dihitung.</span></div>'}
    const L=await ensureLeaflet();
    if(dispatchMap){dispatchMap.remove();dispatchMap=null}
    dispatchRouteLayers=[];
    dispatchMap=L.map(mapEl,{zoomControl:true,attributionControl:true});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(dispatchMap);
    const colors=['#f26a21','#2f6fe5','#16a36f','#8a5cf6','#d99a14','#e15462','#0f8b8d','#7d5a50'];
    const bounds=[[base.lat,base.lng]];
    const officeIcon=L.divIcon({className:'gd-map-div',html:'<div class="gd-map-pin office">S</div>',iconSize:[34,34],iconAnchor:[17,17]});
    L.marker([base.lat,base.lng],{icon:officeIcon}).addTo(dispatchMap).bindPopup('<b>'+E(base.name||'Lokasi Saat Ini')+'</b>');
    for(let i=0;i<routeGroupsCache.length;i++){
      const g=routeGroupsCache[i],color=colors[i%colors.length],letter=String.fromCharCode(65+i);
      g.items.forEach((x,idx)=>{
        bounds.push([x.coords.lat,x.coords.lng]);
        const icon=L.divIcon({className:'gd-map-div',html:'<div class="gd-map-pin" style="background:'+color+'">'+letter+(idx+1)+'</div>',iconSize:[34,34],iconAnchor:[17,17]});
        L.marker([x.coords.lat,x.coords.lng],{icon}).addTo(dispatchMap).bindPopup('<b>'+E(x.job.order.customer_name||'Customer')+'</b><br>'+E(x.areaLabel||x.job.destination||x.job.address||'')+'<br>'+E(x.job.order.order_number||'')+(x.job.driver?'<br>Driver: '+E(x.job.driver):''));
      });
      await drawRoadGroup(L,dispatchMap,base,g,color);
    }
    dispatchMap.fitBounds(bounds,{padding:[35,35],maxZoom:13});
    groupEl.innerHTML=routeGroupsCache.length?routeGroupsCache.map((g,i)=>groupCard(g,i,colors[i%colors.length])).join(''):'';
    setTimeout(()=>dispatchMap&&dispatchMap.invalidateSize(),150);
    enrichAreaLabels(routeGroupsCache).then(()=>{
      if(groupEl.isConnected)groupEl.innerHTML=routeGroupsCache.length?routeGroupsCache.map((g,i)=>groupCard(g,i,colors[i%colors.length])).join(''):'';
    }).catch(()=>{});
  }
  function counts(xs){
    return {
      total:xs.length,
      unassigned:xs.filter(x=>['waiting'].includes(x.status)).length,
      moving:xs.filter(x=>['assigned','to_pickup','picked_up','on_the_way','arrived'].includes(x.status)).length,
      done:xs.filter(x=>x.status==='completed').length
    };
  }
  function navInject(){
    const nav=document.querySelector('.v5-nav'); if(!nav)return;
    const old=nav.querySelector('[data-rental-nav="delivery"]'); if(old)old.style.display='none';
    if(nav.querySelector('[data-gojek-delivery]'))return;
    const b=document.createElement('button');
    b.type='button'; b.dataset.gojekDelivery='1';
    b.innerHTML='<svg class="v5-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 15V6h11v9M14 9h4l3 4v2h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3 15h2M9 15h7"/></svg><span>Antar–Jemput</span>';
    const anchor=nav.querySelector('[data-rental-nav="banks"]')||old?.nextSibling;
    if(old)old.insertAdjacentElement('afterend',b); else if(anchor)nav.insertBefore(b,anchor); else nav.appendChild(b);
  }
  function setNavOn(){
    document.querySelectorAll('.v5-nav button').forEach(b=>b.classList.toggle('on',b.hasAttribute('data-gojek-delivery')));
    const h=document.querySelector('.v5-top h1'); if(h)h.textContent='Antar–Jemput';
  }
  function visibleJobs(){
    const xs=jobs();
    if(filter==='unassigned')return xs.filter(x=>x.status==='waiting');
    if(filter==='moving')return xs.filter(x=>['assigned','to_pickup','picked_up','on_the_way','arrived'].includes(x.status));
    if(filter==='done')return xs.filter(x=>x.status==='completed');
    return xs;
  }
  function badge(status){
    const info=statusInfo[status]||[status,'waiting'];
    return '<span class="gd-status '+E(info[1])+'"><i></i>'+E(info[0])+'</span>';
  }
  function driverBlock(j){
    if(!j.driver)return '<div class="gd-driver empty"><div class="gd-avatar">?</div><div><b>Belum ada driver</b><small>Tugaskan petugas untuk mulai perjalanan</small></div></div>';
    return '<div class="gd-driver"><div class="gd-avatar">'+E(j.driver.slice(0,1).toUpperCase())+'</div><div><b>'+E(j.driver)+'</b><small>'+E([j.vehicle,j.plate].filter(Boolean).join(' · ')||'Driver antar–jemput')+'</small></div>'+(j.driver_phone?'<a class="gd-round" href="https://wa.me/'+E(cleanPhone(j.driver_phone))+'" target="_blank" rel="noopener" title="WhatsApp driver">WA</a>':'')+'</div>';
  }
  function jobCard(j){
    const nxt=nextStatus[j.status];
    const customerPhone=cleanPhone(j.order.phone);
    const mapDest=encodeURIComponent(j.destination||j.address||'');
    const trackUrl=trackingUrl(j.order);
    const trackCode=trackingCode(j.order);
    return '<article class="gd-job" data-job="'+E(j.id)+'" data-kind="'+E(j.kind)+'">'+
      '<div class="gd-jobtop"><div><span class="gd-kind '+j.kind+'">'+(j.kind==='deliver'?'ANTAR':'JEMPUT')+'</span><h3>'+E(j.order.order_number||j.id)+'</h3><p>'+E(j.order.customer_name||'-')+' · '+E(j.order.phone||'-')+'</p></div>'+badge(j.status)+'</div>'+
      '<div class="gd-route"><div class="gd-route-line"><span class="dot start"></span><span class="rail"></span><span class="dot end"></span></div><div class="gd-route-text">'+
        '<div class="gd-route-row"><div><small>LOKASI SAAT INI</small><b data-live-origin="'+E(j.id)+'" data-kind="'+E(j.kind)+'">'+E(j.location?('GPS '+Number(j.location.lat).toFixed(6)+', '+Number(j.location.lng).toFixed(6)):(j.origin||'-'))+'</b><em data-live-time="'+E(j.id)+'">'+(j.location?('Update '+E(fmtDate(j.location.updated_at))):'Menunggu GPS driver')+'</em></div></div>'+
        '<div class="gd-route-row"><div><small>TUJUAN</small><b data-destination-label="'+E(j.id)+'">'+E(j.destination||j.address||'-')+'</b></div><button type="button" class="gd-edit-dest" data-gd-action="edit-destination" data-id="'+E(j.id)+'" data-kind="'+E(j.kind)+'">Edit</button></div>'+
      '</div></div>'+
      '<div class="gd-meta"><span>🕐 '+E(fmtDate(j.time))+'</span><span>📍 '+(j.distance_km?E(j.distance_km)+' km':'Jarak belum diisi')+'</span><span>💳 '+(j.fee?E(money(j.fee)):'Biaya belum diisi')+'</span></div>'+
      driverBlock(j)+
      (j.location?'<div class="gd-live"><span class="pulse"></span><div><b>GPS driver realtime</b><small data-live-detail="'+E(j.id)+'">'+E(fmtDate(j.location.updated_at))+' · akurasi ±'+E(j.location.accuracy||0)+' m</small></div><a data-live-map="'+E(j.id)+'" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(j.location.lat+','+j.location.lng)+'" target="_blank" rel="noopener">Lihat</a></div>':'')+
      '<div class="gd-actions">'+
        '<button data-gd-action="assign" data-id="'+E(j.id)+'" data-kind="'+j.kind+'" class="secondary">'+(j.driver?'Edit driver':'Tugaskan driver')+'</button>'+
        (nxt?'<button data-gd-action="next" data-id="'+E(j.id)+'" data-kind="'+j.kind+'" data-next="'+E(nxt[0])+'" class="primary">'+E(nxt[1])+'</button>':'')+
        '<button data-gd-action="location" data-id="'+E(j.id)+'" data-kind="'+j.kind+'" class="secondary">Update lokasi</button>'+
        (mapDest?'<a class="gd-button ghost" href="https://www.google.com/maps/dir/?api=1&destination='+mapDest+'" target="_blank" rel="noopener">Navigasi</a>':'')+
        (customerPhone?'<a class="gd-button ghost" href="https://wa.me/'+E(customerPhone)+'" target="_blank" rel="noopener">Customer</a>':'')+
        (trackUrl&&trackCode?'<button data-gd-action="share-track" data-url="'+E(trackUrl)+'" data-code="'+E(trackCode)+'" class="track">Bagikan kode pantau</button>':'')+
      '</div>'+
      (trackUrl&&trackCode?'<div class="gd-track"><div><small>KODE PANTAU CUSTOMER</small><b>'+E(trackCode)+'</b><em>'+E(trackUrl.replace(/^https?:\/\//,''))+'</em></div><a href="'+E(trackUrl)+'" target="_blank" rel="noopener">Buka</a></div>':'')+
      (j.note?'<p class="gd-note">'+E(j.note)+'</p>':'')+
    '</article>';
  }
  function render(){
    if(!active)return;
    setNavOn();
    const host=document.querySelector('.v5-content'); if(!host)return;
    const all=jobs(), c=counts(all), list=visibleJobs();
    host.innerHTML='<div class="gd">'+
      '<section class="gd-hero"><div><span class="gd-eyebrow">DISPATCH CENTER</span><h2>Antar–Jemput</h2><p>Kelola pengantaran dan penjemputan rental seperti aplikasi ride-hailing: assign driver, status perjalanan, ETA operasional, lokasi, dan komunikasi.</p></div><div class="gd-hero-actions"><button data-gd-action="current-start" class="secondary">📍 Lokasi Saat Ini</button><button data-gd-action="new" class="primary">+ Buat tugas</button><button data-gd-action="refresh" class="secondary">Perbarui</button></div></section>'+
      '<section class="gd-stats"><button data-gd-filter="all" class="'+(filter==='all'?'on':'')+'"><small>Semua tugas</small><strong>'+c.total+'</strong></button><button data-gd-filter="unassigned" class="'+(filter==='unassigned'?'on':'')+'"><small>Perlu driver</small><strong>'+c.unassigned+'</strong></button><button data-gd-filter="moving" class="'+(filter==='moving'?'on':'')+'"><small>Dalam perjalanan</small><strong>'+c.moving+'</strong></button><button data-gd-filter="done" class="'+(filter==='done'?'on':'')+'"><small>Selesai</small><strong>'+c.done+'</strong></button></section>'+
      routeGroupPanel()+
      '<div class="gd-toolbar"><input data-gd-search placeholder="Cari order / customer / driver..." autocomplete="off"><span>'+list.length+' tugas</span></div>'+
      '<section class="gd-list" data-gd-list>'+ (list.map(jobCard).join('')||'<div class="gd-empty"><b>Belum ada tugas antar–jemput.</b><span>Klik “Buat tugas” atau aktifkan opsi antar/jemput pada order rental.</span></div>') +'</section>'+
      modalHtml()+
    '</div>';
    if(!modal)requestAnimationFrame(()=>initDistribution());
  }
  function modalHtml(){
    if(!modal)return '';
    if(modal.type==='route-group'){
      const g=routeGroupsCache[Number(modal.groupIndex)];
      if(!g)return '';
      const letter=String.fromCharCode(65+Number(modal.groupIndex));
      return '<div class="gd-modal"><form class="gd-dialog" data-gd-form="route-group"><div class="gd-dialog-head"><div><small>PEMBAGIAN DRIVER</small><h3>Rute '+letter+' · '+g.items.length+' stop</h3></div><button type="button" data-gd-action="close">×</button></div><div class="gd-form">'+
        '<div class="gd-route-summary">'+g.items.map((x,i)=>'<div><b>Stop '+(i+1)+' · '+E(x.job.order.order_number||'')+'</b><span>'+E(x.job.kind==='deliver'?'Antar':'Jemput')+' · '+E(x.job.destination||x.job.address||'')+'</span></div>').join('')+'</div>'+
        '<label>Driver<select name="driver_id" required><option value="">Pilih driver…</option>'+masterDrivers.filter(x=>x.active).map(x=>{const existing=[...new Set(g.items.map(y=>y.job.driver_id).filter(Boolean))];return '<option value="'+E(x.id)+'" '+(existing.length===1&&existing[0]===x.id?'selected':'')+'>'+E(x.name)+' · @'+E(x.username)+'</option>'}).join('')+'</select></label>'+
        '<label>Kendaraan / Plat<select name="vehicle_id"><option value="">Driver pilih kendaraan saat ambil kunci</option>'+masterVehicles.filter(x=>x.active).map(x=>'<option value="'+E(x.id)+'">'+E(x.plate)+' · '+E(x.name)+'</option>').join('')+'</select></label>'+
        '<div class="gd-master-warning">Semua stop dalam Rute '+letter+' akan ditugaskan ke driver yang sama. Urutan stop di portal driver mengikuti urutan rute ini.</div>'+
        '<div class="gd-dialog-actions"><button type="button" data-gd-action="close" class="secondary">Batal</button><button class="primary" type="submit">Tugaskan '+g.items.length+' Stop</button></div>'+
      '</div></form></div>';
    }
    if(modal.type==='office'){
      const s=dispatchSettings||{};
      return '<div class="gd-modal"><form class="gd-dialog" data-gd-form="office"><div class="gd-dialog-head"><div><small>TITIK AWAL RUTE</small><h3>Lokasi Awal Rute</h3></div><button type="button" data-gd-action="close">×</button></div><div class="gd-form">'+
        '<label>Nama titik awal<input name="office_name" value="'+E(s.office_name||'Kantor Rentcam')+'" required></label>'+
        '<label>Alamat titik awal<textarea name="office_address" required placeholder="Alamat lengkap kantor">'+E(s.office_address||'')+'</textarea></label>'+
        '<label>Link Google Maps titik awal<input name="office_maps_url" value="'+E(s.office_maps_url||'')+'" type="url" placeholder="https://maps.google.com/..."></label>'+
        '<div class="gd-two"><label>Latitude (opsional)<input name="office_lat" type="number" step="any" value="'+E(s.office_lat??'')+'" placeholder="-6.xxxxxx"></label><label>Longitude (opsional)<input name="office_lng" type="number" step="any" value="'+E(s.office_lng??'')+'" placeholder="106.xxxxxx"></label></div>'+
        '<div class="gd-master-warning">Peta driver memakai lokasi ini sebagai titik <b>S (Start)</b>. Tombol Lokasi Saat Ini akan mengisi titik ini otomatis dari GPS.</div>'+
        '<div class="gd-dialog-actions"><button type="button" data-gd-action="close" class="secondary">Batal</button><button class="primary" type="submit">Simpan Lokasi Kantor</button></div>'+
      '</div></form></div>';
    }
    if(modal.type==='destination'){
      const j=makeJob(orders.find(o=>String(o.id)===String(modal.id)),modal.kind);
      const d=j.order?.delivery||{};
      const isDeliver=modal.kind==='deliver';
      const currentAddress=isDeliver?(d.address||''):(d.return_address||d.address||'');
      return '<div class="gd-modal"><form class="gd-dialog" data-gd-form="destination"><div class="gd-dialog-head"><div><small>EDIT TUJUAN</small><h3>'+E(j.order.order_number||'')+'</h3></div><button type="button" data-gd-action="close">×</button></div><div class="gd-form">'+
        '<label>Alamat tujuan<textarea name="address" required placeholder="Alamat lengkap / patokan">'+E(currentAddress)+'</textarea></label>'+
        '<label>Link Google Maps<input name="maps_url" type="url" value="'+E(d.maps_url||'')+'" placeholder="https://maps.app.goo.gl/..."></label>'+
        '<div class="gd-two"><label>Latitude (opsional)<input name="latitude" type="number" step="any" value="'+E(d.latitude??'')+'" placeholder="-6.xxxxxx"></label><label>Longitude (opsional)<input name="longitude" type="number" step="any" value="'+E(d.longitude??'')+'" placeholder="106.xxxxxx"></label></div>'+
        '<div class="gd-master-warning">Boleh isi alamat saja, link Google Maps saja, atau koordinat. Setelah disimpan, peta driver dan pantau customer memakai tujuan baru.</div>'+
        '<div class="gd-dialog-actions"><button type="button" data-gd-action="close" class="secondary">Batal</button><button class="primary" type="submit">Simpan Tujuan</button></div>'+
      '</div></form></div>';
    }
    if(modal.type==='assign'){
      const j=makeJob(orders.find(o=>o.id===modal.id),modal.kind);
      return '<div class="gd-modal"><form class="gd-dialog" data-gd-form="assign"><div class="gd-dialog-head"><div><small>DRIVER & PERJALANAN</small><h3>'+E(j.order.order_number||'')+'</h3></div><button type="button" data-gd-action="close">×</button></div><div class="gd-form">'+
        '<label>Driver<select name="driver_id" required><option value="">Pilih driver…</option>'+masterDrivers.filter(x=>x.active).map(x=>'<option value="'+E(x.id)+'" '+(String(x.id)===String(j.driver_id)?'selected':'')+'>'+E(x.name)+' · @'+E(x.username)+'</option>').join('')+'</select></label>'+
        '<label>Kendaraan / Plat<select name="vehicle_id"><option value="">Tanpa kendaraan</option>'+masterVehicles.filter(x=>x.active).map(x=>'<option value="'+E(x.id)+'" '+(String(x.id)===String(j.vehicle_id)?'selected':'')+'>'+E(x.plate)+' · '+E(x.name)+'</option>').join('')+'</select></label>'+
        (!masterDrivers.some(x=>x.active)?'<div class="gd-master-warning">Belum ada akun driver aktif. Buat dulu di menu <b>Master Driver</b>.</div>':'')+
        '<div class="gd-two"><label>Jarak (km)<input name="distance_km" value="'+E(j.distance_km||'')+'" type="number" min="0" step="0.1"></label><label>Biaya (opsional)<input name="fee" value="'+E(j.fee||'')+'" type="number" min="0" step="1000" placeholder="Boleh dikosongkan"></label></div>'+
        '<label>Link Google Maps<input name="maps_url" value="'+E(j.order?.delivery?.maps_url||'')+'" type="url" placeholder="https://maps.google.com/..."></label>'+
        '<label>Catatan perjalanan<textarea name="note" placeholder="Patokan lokasi, kontak PIC, instruksi khusus...">'+E(j.note)+'</textarea></label>'+
        '<div class="gd-dialog-actions"><button type="button" data-gd-action="close" class="secondary">Batal</button><button class="primary" type="submit" '+(!masterDrivers.some(x=>x.active)?'disabled':'')+'>Tugaskan driver</button></div>'+
      '</div></form></div>';
    }
    if(modal.type==='new'){
      return '<div class="gd-modal"><form class="gd-dialog" data-gd-form="new"><div class="gd-dialog-head"><div><small>TUGAS BARU</small><h3>Buat antar / jemput</h3></div><button type="button" data-gd-action="close">×</button></div><div class="gd-form">'+
        '<label>Pilih order<select name="order_id" required><option value="">Pilih order…</option>'+orders.filter(o=>o.source!=='quotation'&&!['cancelled'].includes(o.rental_status)).map(o=>'<option value="'+E(o.id)+'">'+E(o.order_number||o.id)+' · '+E(o.customer_name||'-')+'</option>').join('')+'</select></label>'+
        '<div class="gd-two"><label>Jenis<select name="kind"><option value="deliver">Antar ke customer</option><option value="collect">Jemput kembali</option></select></label><label>Jadwal<input name="time" type="datetime-local" required></label></div>'+
        '<label>Alamat customer<textarea name="address" required placeholder="Alamat lengkap / patokan"></textarea></label>'+
        '<div class="gd-dialog-actions"><button type="button" data-gd-action="close" class="secondary">Batal</button><button class="primary" type="submit">Buat tugas</button></div>'+
      '</div></form></div>';
    }
    return '';
  }
  async function open(){
    active=true; filter='all'; modal=null; setNavOn();
    const host=document.querySelector('.v5-content'); if(host)host.innerHTML='<div class="gd-loading">Memuat dispatch antar–jemput…</div>';
    try{[orders]=await Promise.all([loadOrders(),loadMasters()]); render()}catch(e){if(host)host.innerHTML='<div class="gd-error">'+E(e.message)+'</div>'}
  }
  async function reverseDriverLabel(lat,lng){
    const key=Number(lat).toFixed(4)+','+Number(lng).toFixed(4);
    if(geoLabelCache.has(key))return geoLabelCache.get(key);
    try{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
      const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&zoom=18&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lng),{headers:{Accept:'application/json'},signal:controller.signal});
      clearTimeout(timer);
      if(r.ok){
        const j=await r.json();
        const label=String(j.display_name||'').trim();
        if(label){geoLabelCache.set(key,label);return label}
      }
    }catch(_){}
    return 'GPS '+Number(lat).toFixed(6)+', '+Number(lng).toFixed(6);
  }
  async function updateLiveDom(){
    const js=jobs();
    for(const j of js){
      if(!j.location)continue;
      const origin=document.querySelector('[data-live-origin="'+CSS.escape(String(j.id))+'"]');
      const time=document.querySelector('[data-live-time="'+CSS.escape(String(j.id))+'"]');
      const detail=document.querySelector('[data-live-detail="'+CSS.escape(String(j.id))+'"]');
      const link=document.querySelector('[data-live-map="'+CSS.escape(String(j.id))+'"]');
      if(origin){
        origin.textContent='GPS '+Number(j.location.lat).toFixed(6)+', '+Number(j.location.lng).toFixed(6);
        reverseDriverLabel(j.location.lat,j.location.lng).then(label=>{if(origin.isConnected)origin.textContent=label});
      }
      if(time)time.textContent='Update '+fmtDate(j.location.updated_at);
      if(detail)detail.textContent=fmtDate(j.location.updated_at)+' · akurasi ±'+Math.round(j.location.accuracy||0)+' m';
      if(link)link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(j.location.lat+','+j.location.lng);
    }
  }
  async function pollLive(){
    if(!active||modal||livePollBusy||document.hidden)return;
    livePollBusy=true;
    try{
      orders=await loadOrders();
      await updateLiveDom();
    }catch(_){}
    finally{livePollBusy=false}
  }
  async function refresh(){
    if(loading)return; loading=true;
    try{[orders]=await Promise.all([loadOrders(),loadMasters()]);render()}catch(e){alert(e.message)}finally{loading=false}
  }
  function getOrder(id){return orders.find(o=>String(o.id)===String(id))}
  async function updateDelivery(id,mutate){
    const o=getOrder(id); if(!o)throw new Error('Order tidak ditemukan');
    const d=JSON.parse(JSON.stringify(o.delivery||{}));
    mutate(d,o);
    const delivery=await patchDelivery(id,d);
    o.delivery=delivery;
    return o;
  }
  function parseCoordsFromMapsUrl(url){
    const s=String(url||'');
    let m=s.match(/[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?)[,%2C]+(-?\d+(?:\.\d+)?)/i);
    if(!m)m=s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if(!m)return null;
    const lat=Number(m[1]),lng=Number(m[2]);
    return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
  }
  async function geocodePlaceBrowser(query){
    const q=String(query||'').trim();if(!q)return null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    try{
      const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&q='+encodeURIComponent(q),{
        headers:{Accept:'application/json'},signal:controller.signal
      });
      if(!r.ok)return null;
      const j=await r.json(),x=j?.[0];
      const lat=Number(x?.lat),lng=Number(x?.lon);
      return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
    }catch(_){return null}finally{clearTimeout(timer)}
  }
  async function resolveMapsLink(raw){
    const url=String(raw||'').trim();if(!url)return null;
    const direct=parseCoordsFromMapsUrl(url);
    if(direct)return{...direct,final_url:url};
    try{
      const r=await fetch('/api/maps-resolve?url='+encodeURIComponent(url),{cache:'no-store'});
      const j=await r.json();
      const lat=Number(j?.lat),lng=Number(j?.lng);
      if(j?.ok){
        if(Number.isFinite(lat)&&Number.isFinite(lng)){
          return{final_url:j.final_url||url,lat,lng};
        }
        if(j?.place_query){
          const g=await geocodePlaceBrowser(j.place_query);
          if(g)return{final_url:j.final_url||url,lat:g.lat,lng:g.lng};
        }
        return{final_url:j.final_url||url,lat:null,lng:null};
      }
    }catch(_){}
    return{final_url:url,lat:null,lng:null};
  }
  async function saveDestination(form){
    const fd=Object.fromEntries(new FormData(form));
    const id=modal.id,kind=modal.kind;
    const address=String(fd.address||'').trim();
    let lat=fd.latitude!==''?Number(fd.latitude):null;
    let lng=fd.longitude!==''?Number(fd.longitude):null;
    let finalUrl=String(fd.maps_url||'').trim();
    if((!Number.isFinite(lat)||!Number.isFinite(lng))&&finalUrl){
      const resolved=await resolveMapsLink(finalUrl);
      if(resolved){
        finalUrl=String(resolved.final_url||finalUrl);
        if(Number.isFinite(resolved.lat)&&Number.isFinite(resolved.lng)){lat=resolved.lat;lng=resolved.lng}
      }
    }
    if((!Number.isFinite(lat)||!Number.isFinite(lng))&&address){
      const g=await geocodePlaceBrowser(address);
      if(g){lat=g.lat;lng=g.lng}
    }
    await updateDelivery(id,d=>{
      if(kind==='deliver')d.address=address;
      else d.return_address=address;
      d.maps_url=finalUrl;
      if(Number.isFinite(lat)&&Number.isFinite(lng)){d.latitude=lat;d.longitude=lng}
    });
    modal=null;
    render();
  }
  async function useCurrentStart(button){
    if(!navigator.geolocation)throw new Error('Browser tidak mendukung GPS');
    const old=button?.textContent||'📍 Lokasi Saat Ini';
    if(button){button.disabled=true;button.textContent='Mengambil GPS…'}
    try{
      const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
        resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:5000}
      ));
      const lat=Number(pos.coords.latitude.toFixed(6));
      const lng=Number(pos.coords.longitude.toFixed(6));
      const address=await reverseDriverLabel(lat,lng);
      const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(lat+','+lng);
      const d=await adminRpc('rentcam_admin_dispatch_settings_save',{
        p_office_name:'Lokasi Saat Ini',
        p_office_address:address,
        p_office_maps_url:maps,
        p_office_lat:lat,
        p_office_lng:lng
      });
      if(!d?.ok)throw new Error(d?.message||'Gagal menyimpan lokasi saat ini');
      dispatchSettings=d.settings||{
        office_name:'Lokasi Saat Ini',
        office_address:address,
        office_maps_url:maps,
        office_lat:lat,
        office_lng:lng
      };
      render();
    }finally{
      if(button&&button.isConnected){button.disabled=false;button.textContent=old}
    }
  }
  async function saveOffice(form){
    const fd=Object.fromEntries(new FormData(form));
    const resolved=await resolveMapsLink(fd.office_maps_url);
    const manualLat=fd.office_lat!==''?Number(fd.office_lat):null;
    const manualLng=fd.office_lng!==''?Number(fd.office_lng):null;
    const lat=Number.isFinite(manualLat)?manualLat:(resolved?.lat??null);
    const lng=Number.isFinite(manualLng)?manualLng:(resolved?.lng??null);
    const d=await adminRpc('rentcam_admin_dispatch_settings_save',{
      p_office_name:String(fd.office_name||'').trim(),
      p_office_address:String(fd.office_address||'').trim(),
      p_office_maps_url:String(resolved?.final_url||fd.office_maps_url||'').trim(),
      p_office_lat:Number.isFinite(lat)?lat:null,
      p_office_lng:Number.isFinite(lng)?lng:null
    });
    if(!d?.ok)throw new Error(d?.message||'Gagal menyimpan lokasi kantor');
    dispatchSettings=d.settings||{};
    modal=null;render();
  }
  async function assignRouteGroup(form){
    const g=routeGroupsCache[Number(modal.groupIndex)];
    if(!g||!g.items.length)throw new Error('Kelompok rute tidak ditemukan');
    const fd=Object.fromEntries(new FormData(form));
    if(!fd.driver_id)throw new Error('Pilih driver');
    const pendingItems=g.items.filter(x=>x.job.status==='waiting');
    if(!pendingItems.length)throw new Error('Semua stop di rute ini sudah punya driver');
    for(let i=0;i<pendingItems.length;i++){
      const j=pendingItems[i].job;
      const data=await adminRpc('rentcam_admin_assign_driver',{
        p_order:j.id,
        p_kind:j.kind,
        p_driver:fd.driver_id,
        p_vehicle:fd.vehicle_id||null,
        p_distance_km:0,
        p_fee:0,
        p_note:(j.note?j.note+' · ':'')+'Rute '+String.fromCharCode(65+Number(modal.groupIndex))+' · Stop '+(i+1)+'/'+pendingItems.length
      });
      if(!data?.ok)throw new Error('Gagal assign '+(j.order.order_number||j.id)+': '+(data?.message||''));
      const o=getOrder(j.id);if(o&&data.delivery)o.delivery=data.delivery;
    }
    modal=null;
    await refresh();
  }
  async function assign(form){
    const fd=Object.fromEntries(new FormData(form));
    const id=modal.id, kind=modal.kind;
    if(!fd.driver_id)throw new Error('Pilih driver dari Master Driver');
    const resolvedMap=await resolveMapsLink(fd.maps_url);
    const data=await adminRpc('rentcam_admin_assign_driver',{
      p_order:id,
      p_kind:kind,
      p_driver:fd.driver_id,
      p_vehicle:fd.vehicle_id||null,
      p_distance_km:Number(fd.distance_km||0),
      p_fee:fd.fee===''?0:Number(fd.fee||0),
      p_note:String(fd.note||'').trim()
    });
    if(!data?.ok)throw new Error(data?.message||'Gagal menugaskan driver');
    const o=getOrder(id);
    if(o&&data.delivery)o.delivery=data.delivery;
    await updateDelivery(id,d=>{
      d.maps_url=String(resolvedMap?.final_url||fd.maps_url||'').trim();
      if(Number.isFinite(resolvedMap?.lat)&&Number.isFinite(resolvedMap?.lng)){
        d.latitude=resolvedMap.lat;
        d.longitude=resolvedMap.lng;
      }
    });
    modal=null;render();
  }
  async function createTask(form){
    const fd=Object.fromEntries(new FormData(form));
    const o=getOrder(fd.order_id); if(!o)throw new Error('Pilih order');
    const kind=fd.kind==='collect'?'collect':'deliver';
    await updateDelivery(o.id,d=>{
      d.address=String(fd.address||'').trim();
      if(kind==='deliver'){d.mode='delivery';d.deliver_at=new Date(fd.time).toISOString()}
      else{d.return_mode='collect';d.collect_at=new Date(fd.time).toISOString()}
      d[kind+'_trip_status']='waiting';
    });
    modal=null;render();
  }
  async function moveStatus(id,kind,status){
    if(status==='assigned'){
      modal={type:'assign',id,kind};render();return;
    }
    await updateDelivery(id,d=>{
      d[kind+'_trip_status']=status;
      d[kind+'_status']=status==='completed'?'completed':status;
      d[kind+'_status_at']=new Date().toISOString();
    });
    render();
  }
  async function updateLocation(id,kind){
    if(!navigator.geolocation)throw new Error('Browser tidak mendukung lokasi');
    const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:30000}));
    await updateDelivery(id,d=>{
      d[kind+'_driver_location']={lat:Number(pos.coords.latitude.toFixed(6)),lng:Number(pos.coords.longitude.toFixed(6)),accuracy:Math.round(pos.coords.accuracy||0),updated_at:new Date().toISOString()};
    });
    render();
  }
  function injectCss(){
    if(document.getElementById('gd-style'))return;
    const s=document.createElement('style');s.id='gd-style';s.textContent=`
    [data-rental-nav="delivery"]{display:none!important}
    .gd{max-width:1280px;margin:0 auto}.gd *{box-sizing:border-box}.gd button,.gd .gd-button{font:inherit}
    .gd-hero{display:flex;justify-content:space-between;gap:22px;align-items:flex-end;padding:26px 28px;border-radius:24px;background:linear-gradient(135deg,#101927,#17253a);color:#fff;margin-bottom:18px;box-shadow:0 18px 45px rgba(13,25,43,.13)}
    .gd-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:900;color:#ff9b65}.gd-hero h2{font-size:30px;letter-spacing:-.04em;margin:5px 0 7px}.gd-hero p{max-width:720px;margin:0;color:#aab7ca;font-size:13px;line-height:1.6}.gd-hero-actions{display:flex;gap:8px;flex-shrink:0}
    .gd button,.gd-button{border:0;border-radius:12px;min-height:42px;padding:0 15px;font-size:12px;font-weight:850;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px}.gd .primary{background:linear-gradient(145deg,#ff8240,#f26a21);color:#fff;box-shadow:0 8px 18px rgba(242,106,33,.2)}.gd .secondary{background:#fff;color:#263248;border:1px solid #dde3eb}.gd .ghost{background:#f4f6f9;color:#405069;border:1px solid #e4e8ee}
    .gd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:17px}.gd-stats button{text-align:left;height:auto;min-height:92px;display:block;padding:18px;background:#fff;color:#1b283d;border:1px solid #e2e7ef;border-radius:18px;box-shadow:0 5px 18px rgba(25,39,58,.035)}.gd-stats button.on{border-color:#ff9d6a;box-shadow:0 0 0 3px rgba(242,106,33,.08)}.gd-stats small{display:block;color:#7a8799;font-size:11px;margin-bottom:8px}.gd-stats strong{font-size:28px;letter-spacing:-.04em}
    .gd-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}.gd-toolbar input{height:44px;min-width:320px;width:min(520px,100%);border:1px solid #dce2eb;border-radius:13px;background:#fff;padding:0 14px;font-size:13px;outline:none}.gd-toolbar input:focus{border-color:#f58a50;box-shadow:0 0 0 3px rgba(242,106,33,.1)}.gd-toolbar span{font-size:11px;color:#8390a2}
    .gd-distribution{background:#fff;border:1px solid #e2e7ef;border-radius:22px;overflow:hidden;margin-bottom:18px;box-shadow:0 7px 24px rgba(25,39,58,.045)}.gd-dist-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid #edf0f4}.gd-dist-head small{display:block;color:#f26a21;font-size:9px;font-weight:900;letter-spacing:.12em}.gd-dist-head h3{margin:4px 0 3px;font-size:18px;color:#223149}.gd-dist-head p{margin:0;color:#8792a3;font-size:10px}.gd-dist-body{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(320px,.8fr);min-height:430px}.gd-dispatch-map{min-height:430px;background:#e9eef4}.gd-route-groups{padding:14px;display:grid;align-content:start;gap:10px;max-height:560px;overflow:auto;background:#f8fafc;border-left:1px solid #edf0f4}.gd-map-loading,.gd-map-empty{min-height:180px;display:grid;place-items:center;text-align:center;padding:22px;color:#7c899a;font-size:10px}.gd-map-empty b,.gd-map-empty span{display:block}.gd-map-empty b{font-size:12px;color:#33445a}.gd-map-empty span{margin-top:5px}.gd-group-card{background:#fff;border:1px solid #e1e6ee;border-radius:15px;padding:13px;box-shadow:inset 4px 0 0 var(--route-color)}.gd-group-top{display:flex;gap:10px;align-items:flex-start}.gd-route-letter{width:36px;height:36px;border-radius:11px;background:var(--route-color);color:#fff;display:grid;place-items:center;font-weight:950}.gd-group-top>div{min-width:0;flex:1}.gd-group-top small{display:block;color:#8390a1;font-size:8px;font-weight:900}.gd-group-top h4{margin:3px 0;font-size:12px;color:#293a52}.gd-group-top p{margin:0;color:#718096;font-size:9px}.gd-group-card ol{list-style:none;margin:10px 0;padding:0;border-top:1px solid #edf0f4}.gd-group-card li{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:9px 0;border-bottom:1px solid #edf0f4}.gd-group-card li span{min-width:0}.gd-group-card li b,.gd-group-card li small{display:block}.gd-group-card li b{font-size:9px;color:#34455c}.gd-group-card li small{margin-top:2px;color:#8b96a6;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}.gd-group-card li em{font-size:8px;font-style:normal;color:#7f8b9c;white-space:nowrap}.gd-group-card>button{width:100%;min-height:36px!important;font-size:9px!important}.gd-trip-card{padding:14px}.gd-trip-timeline{margin:12px 0 14px;padding:10px 0;border-top:1px solid #edf0f4;border-bottom:1px solid #edf0f4}.gd-trip-stop{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center}.gd-trip-stop+.gd-trip-stop{margin-top:4px}.gd-trip-stop b,.gd-trip-stop small{display:block}.gd-trip-stop b{font-size:9px;color:#304158;line-height:1.35}.gd-trip-stop small{margin-top:2px;font-size:8px;color:#8a96a7;line-height:1.35}.gd-trip-dot{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#17243a;color:#fff;border:3px solid #fff;box-shadow:0 2px 7px rgba(24,36,55,.18);font-size:8px;font-weight:950}.gd-trip-leg{display:flex;align-items:center;gap:5px;min-height:34px;margin-left:14px;padding-left:30px;position:relative;color:#6d7b8e;font-size:8px}.gd-trip-leg:before{content:'';position:absolute;left:0;top:0;bottom:0;border-left:2px dashed #cbd4e0}.gd-trip-leg i{width:15px;height:1px;background:#cbd4e0}.gd-trip-leg b{color:#2f4057;font-size:9px}.gd-route-assigned{padding:10px 11px;border-radius:10px;background:#edf8f3;color:#28735b;font-size:9px;text-align:center}.gd-route-assigned b{font-weight:950}.gd-map-div{background:transparent;border:0}.gd-map-pin{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;border:3px solid #fff;box-shadow:0 4px 14px rgba(25,39,58,.25);font-size:9px;font-weight:950}.gd-map-pin.office{background:#17243a}.gd-map-pin.assigned{background:#7d8998}.gd-route-summary{display:grid;gap:8px;margin-bottom:14px}.gd-route-summary>div{padding:10px 11px;border-radius:11px;background:#f7f9fb;border:1px solid #e8ecf1}.gd-route-summary b,.gd-route-summary span{display:block}.gd-route-summary b{font-size:10px;color:#304158}.gd-route-summary span{margin-top:2px;font-size:8px;color:#8591a2}
    .gd-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.gd-job{background:#fff;border:1px solid #e2e7ef;border-radius:22px;padding:20px;box-shadow:0 7px 24px rgba(25,39,58,.045)}.gd-jobtop{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.gd-kind{display:inline-flex;padding:5px 8px;border-radius:999px;background:#fff1e9;color:#c75b21;font-size:9px;font-weight:900;letter-spacing:.08em}.gd-kind.collect{background:#eef3ff;color:#4d69b8}.gd-job h3{margin:8px 0 3px;font-size:18px;color:#202d43}.gd-jobtop p{margin:0;color:#7d899b;font-size:11px}
    .gd-status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:850;background:#f3f5f8;color:#657286;white-space:nowrap}.gd-status i{width:7px;height:7px;border-radius:50%;background:#9ba5b3}.gd-status.assigned{background:#fff7e8;color:#9c6a12}.gd-status.assigned i{background:#efa520}.gd-status.moving{background:#eef4ff;color:#3e62b1}.gd-status.moving i{background:#4a74d8}.gd-status.arrived{background:#f1edff;color:#7655b4}.gd-status.arrived i{background:#8a69cf}.gd-status.done{background:#eaf8f2;color:#197c5d}.gd-status.done i{background:#1ea77b}.gd-status.cancelled{background:#fff0f1;color:#ac4550}.gd-status.cancelled i{background:#dc5965}
    .gd-route{display:grid;grid-template-columns:24px 1fr;gap:8px;margin:18px 0 15px;padding:15px;border-radius:16px;background:#f7f9fc}.gd-route-line{display:grid;grid-template-rows:12px 1fr 12px;justify-items:center;min-height:84px}.gd-route .dot{width:10px;height:10px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #f26a21;background:#f26a21}.gd-route .dot.end{box-shadow:0 0 0 2px #2f6ee5;background:#2f6ee5}.gd-route .rail{width:2px;background:repeating-linear-gradient(to bottom,#bbc5d3 0 4px,transparent 4px 8px)}.gd-route-text{display:flex;flex-direction:column;justify-content:space-between;gap:15px}.gd-route-text small{display:block;color:#97a1b0;font-size:8px;font-weight:850;letter-spacing:.08em}.gd-route-text b{display:block;margin-top:3px;color:#35445a;font-size:11px;line-height:1.4}
    .gd-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.gd-meta span{padding:7px 9px;background:#f7f9fb;border:1px solid #e9edf2;border-radius:10px;font-size:9px;color:#627087}
    .gd-driver{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #edf0f4;border-bottom:1px solid #edf0f4}.gd-avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#17243a;color:#fff;font-weight:900}.gd-driver>div:nth-child(2){min-width:0;flex:1}.gd-driver b{display:block;font-size:12px;color:#25334a}.gd-driver small{display:block;font-size:9px;color:#8894a6;margin-top:2px}.gd-driver.empty .gd-avatar{background:#eef1f5;color:#7d8998}.gd-round{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#eaf8f0;color:#1b8b5e;text-decoration:none;font-size:10px;font-weight:900}
    .gd-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.gd-actions button,.gd-actions .gd-button{min-height:38px;padding:0 11px;font-size:10px}.gd .track{background:#0f9d68;color:#fff}.gd-track{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:12px;padding:11px 12px;border:1px solid #dcece5;background:#f3faf7;border-radius:13px}.gd-track div{min-width:0}.gd-track small{display:block;font-size:8px;font-weight:900;letter-spacing:.08em;color:#2d7d60}.gd-track b{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:16px;letter-spacing:.12em;color:#263a31}.gd-track em{display:block;margin-top:3px;font-size:8px;font-style:normal;color:#7a8d84}.gd-track a{flex:0 0 auto;text-decoration:none;color:#0e855b;font-size:10px;font-weight:900}.gd-note{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#fff9f5;color:#7a5a48;font-size:10px;line-height:1.5}.gd-live{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border-radius:13px;background:#f0f8f5}.gd-live .pulse{width:9px;height:9px;border-radius:50%;background:#19a575;box-shadow:0 0 0 4px rgba(25,165,117,.12)}.gd-live div{flex:1}.gd-live b,.gd-live small{display:block}.gd-live b{font-size:10px}.gd-live small{font-size:8px;color:#7c8b84}.gd-live a{font-size:9px;font-weight:850;color:#18815e;text-decoration:none}
    .gd-empty,.gd-loading,.gd-error{grid-column:1/-1;padding:42px;border:1px dashed #d8dee8;border-radius:20px;text-align:center;background:#fff;color:#7b8798}.gd-empty b,.gd-empty span{display:block}.gd-empty span{font-size:11px;margin-top:7px}.gd-error{color:#b42318}
    .gd-modal{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:18px;background:rgba(7,13,23,.62);backdrop-filter:blur(8px)}.gd-dialog{width:min(620px,100%);max-height:92dvh;overflow:auto;background:#f7f9fb;border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.30)}.gd-dialog-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 21px;background:#fff;border-bottom:1px solid #e6eaf0}.gd-dialog-head small{font-size:8px;letter-spacing:.12em;color:#f26a21;font-weight:900}.gd-dialog-head h3{margin:3px 0 0;font-size:18px}.gd-dialog-head>button{width:38px;height:38px;padding:0;border-radius:50%;background:#f1f3f6;color:#334056;font-size:20px}.gd-form{padding:20px}.gd-form label{display:block;margin-bottom:13px;font-size:10px;color:#5c687a;font-weight:800}.gd-form input,.gd-form select,.gd-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #d9dfe8;border-radius:12px;background:#fff;padding:11px 12px;font:inherit;font-size:12px;color:#25334a;outline:none}.gd-form textarea{min-height:88px;resize:vertical}.gd-master-warning{margin:-2px 0 14px;padding:11px 12px;border-radius:12px;background:#fff6ed;color:#9a5a2a;font-size:10px;line-height:1.45}.gd-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gd-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
    @media(max-width:900px){.gd-list{grid-template-columns:1fr}.gd-hero{align-items:flex-start;flex-direction:column}.gd-stats{grid-template-columns:1fr 1fr}.gd-dist-body{grid-template-columns:1fr}.gd-route-groups{border-left:0;border-top:1px solid #edf0f4;max-height:none}.gd-dispatch-map{min-height:360px}}
    @media(max-width:620px){.gd-dist-head{align-items:flex-start;flex-direction:column}.gd-dist-head button{width:100%}.gd-dispatch-map{min-height:300px}.gd-hero{padding:20px;border-radius:19px}.gd-hero h2{font-size:24px}.gd-hero-actions{width:100%}.gd-hero-actions button{flex:1}.gd-stats{gap:8px}.gd-stats button{min-height:78px;padding:13px;border-radius:15px}.gd-stats strong{font-size:23px}.gd-toolbar{align-items:stretch;flex-direction:column}.gd-toolbar input{min-width:0;width:100%}.gd-job{padding:15px;border-radius:18px}.gd-jobtop{flex-direction:column}.gd-two{grid-template-columns:1fr}.gd-actions>*{flex:1 1 calc(50% - 8px)}}
    `;document.head.appendChild(s);
  }

  document.addEventListener('click',async e=>{
    const nav=e.target.closest('[data-gojek-delivery]');
    if(nav){e.preventDefault();e.stopPropagation();open();return}
    if(active&&e.target.closest('.v5-nav button')&&!nav){active=false;modal=null;return}
    if(!active)return;
    const f=e.target.closest('[data-gd-filter]');
    if(f){filter=f.dataset.gdFilter;render();return}
    const b=e.target.closest('[data-gd-action]'); if(!b)return;
    const a=b.dataset.gdAction;
    if(a==='close'){modal=null;render();return}
    if(a==='office'){modal={type:'office'};render();return}
    if(a==='current-start'){
      try{await useCurrentStart(b)}catch(err){alert(err.message||'Gagal mengambil lokasi saat ini')}
      return;
    }
    if(a==='new'){modal={type:'new'};render();return}
    if(a==='refresh'){await refresh();return}
    if(a==='rebuild-routes'){await initDistribution();return}
    if(a==='assign-route-group'){modal={type:'route-group',groupIndex:Number(b.dataset.group)};render();return}
    if(a==='assign'){modal={type:'assign',id:b.dataset.id,kind:b.dataset.kind};render();return}
    if(a==='edit-destination'){modal={type:'destination',id:b.dataset.id,kind:b.dataset.kind};render();return}
    if(a==='next'){
      b.disabled=true;
      try{await moveStatus(b.dataset.id,b.dataset.kind,b.dataset.next)}catch(err){alert(err.message)}finally{b.disabled=false}
      return;
    }
    if(a==='share-track'){
      const url=b.dataset.url||'';
      const code=b.dataset.code||'';
      const shareText='Pantau antar–jemput Rentcam\n\nBuka: '+url+'\nKode Pantau: '+code;
      try{
        if(navigator.share)await navigator.share({title:'Pantau Antar–Jemput Rentcam',text:shareText});
        else if(navigator.clipboard){await navigator.clipboard.writeText(shareText);const old=b.textContent;b.textContent='Kode disalin ✓';setTimeout(()=>b.textContent=old,1500)}
        else prompt('Salin kode pantau customer:',shareText);
      }catch(err){if(err?.name!=='AbortError')prompt('Salin kode pantau customer:',shareText)}
      return;
    }
    if(a==='location'){
      b.disabled=true;b.textContent='Mengambil lokasi…';
      try{await updateLocation(b.dataset.id,b.dataset.kind)}catch(err){alert(err.message||'Gagal mengambil lokasi')}finally{b.disabled=false}
    }
  },true);

  document.addEventListener('submit',async e=>{
    if(!active)return;
    const f=e.target.closest('[data-gd-form]');if(!f)return;
    e.preventDefault();
    const submit=f.querySelector('[type="submit"]');if(submit)submit.disabled=true;
    try{
      if(f.dataset.gdForm==='office')await saveOffice(f);
      if(f.dataset.gdForm==='destination')await saveDestination(f);
      if(f.dataset.gdForm==='route-group')await assignRouteGroup(f);
      if(f.dataset.gdForm==='assign')await assign(f);
      if(f.dataset.gdForm==='new')await createTask(f);
    }catch(err){alert(err.message)}finally{if(submit)submit.disabled=false}
  },true);

  document.addEventListener('input',e=>{
    if(!active||!e.target.matches('[data-gd-search]'))return;
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('.gd-job').forEach(card=>{
      card.hidden=!card.textContent.toLowerCase().includes(q);
    });
  });

  function boot(){
    injectCss();navInject();
    setInterval(()=>pollLive(),5000);
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;navInject();if(active)setNavOn()});
    }).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
  }
  if(document.documentElement.dataset.cmsReady==='1')boot();
  else window.addEventListener('rentcam:cms-ready',boot,{once:true});
})();