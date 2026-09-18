/* Rentcam CMS Analytics — one deep module for range, queries, aggregation and dashboard rendering. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsAnalytics=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const PAGE_SIZE=1000,MAX_EVENTS=20000;
  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  function last30(now=new Date()){
    const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const start=new Date(end);start.setDate(start.getDate()-29);
    return {start:ymd(start),end:ymd(end),mode:'month'};
  }
  function thisMonth(now=new Date()){
    const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const start=new Date(now.getFullYear(),now.getMonth(),1);
    return {start:ymd(start),end:ymd(end),mode:'thisMonth'};
  }
  function isoBounds(start,end){
    const [sy,sm,sd]=String(start).split('-').map(Number),[ey,em,ed]=String(end).split('-').map(Number);
    if(!sy||!sm||!sd||!ey||!em||!ed)throw new Error('Rentang tanggal tidak valid');
    const a=new Date(sy,sm-1,sd,0,0,0,0),b=new Date(ey,em-1,ed+1,0,0,0,0);
    if(a>=b)throw new Error('Rentang tanggal tidak valid');
    return {start:a.toISOString(),endExclusive:b.toISOString()};
  }
  const clean=v=>String(v??'').trim();
  function roundCoord(v){
    if(v===null||v===undefined||clean(v)==='')return null;
    const n=Number(v);return Number.isFinite(n)?Math.round(n*100)/100:null;
  }
  function normalizeGeo(input={}){
    const g=input?.geo||input||{};
    return {city:clean(g.city)||'Tidak diketahui',region:clean(g.region),country:clean(g.country),latitude:roundCoord(g.latitude),longitude:roundCoord(g.longitude)};
  }
  function locationLabel(input={}){
    const g=normalizeGeo(input);
    const parts=[g.city,g.region,g.country].filter((x,i,a)=>x&&x!=='Tidak diketahui'&&a.indexOf(x)===i);
    return parts.length?parts.join(', '):'Tidak diketahui';
  }
  function productName(id,products=[],cfg={}){
    const key=clean(id);if(!key)return '-';
    const ov=cfg?.productOverrides?.[key];if(ov?.name)return String(ov.name);
    const custom=(cfg?.customProducts||[]).find(x=>String(x?.id)===key);if(custom?.name)return String(custom.name);
    const base=(products||[]).find(x=>String(x?.id)===key);
    return String(base?.name||base?.title||key);
  }
  function summarize(events=[],products=[],cfg={}){
    const productMap=new Map(),locationMap=new Map(),visitors=new Set();
    for(const event of events||[]){
      const meta=event?.meta&&typeof event.meta==='object'?event.meta:{};
      if(meta.visitor_hash)visitors.add(String(meta.visitor_hash));
      if(event?.event_type==='product_click'&&event?.product_id){
        const id=String(event.product_id),row=productMap.get(id)||{id,name:productName(id,products,cfg),count:0};
        row.count++;productMap.set(id,row);
      }
      const g=normalizeGeo(meta.geo||{});
      if(g.city==='Tidak diketahui'&&g.latitude===null&&g.longitude===null)continue;
      const key=[g.city,g.region,g.country,g.latitude??'',g.longitude??''].join('|');
      const row=locationMap.get(key)||{...g,label:locationLabel(g),events:0,clicks:0,views:0};
      row.events++;
      if(event?.event_type==='product_click')row.clicks++;
      if(event?.event_type==='page_view')row.views++;
      locationMap.set(key,row);
    }
    return {
      topProducts:[...productMap.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),
      locations:[...locationMap.values()].sort((a,b)=>b.events-a.events||a.label.localeCompare(b.label)),
      uniqueVisitors:visitors.size
    };
  }
  function rangeTitle(range){
    if(range.mode==='month')return '1 Bulan Terakhir';
    if(range.mode==='thisMonth')return 'Bulan Ini';
    return `${range.start} – ${range.end}`;
  }
  function eventPath(range,limit=PAGE_SIZE,offset=0){
    const b=isoBounds(range.start,range.end),enc=encodeURIComponent;
    return '/rest/v1/rentcam_events?select='+enc('event_type,path,product_id,session_id,meta,created_at')+
      '&created_at='+enc('gte.'+b.start)+'&created_at='+enc('lt.'+b.endExclusive)+
      '&order='+enc('created_at.desc')+'&limit='+enc(String(limit))+'&offset='+enc(String(offset));
  }
  function createClient(root){
    const request=async(path,init={})=>{
      const url=SB+path;
      const r=root.RentcamCmsAdmin?.request
        ?await root.RentcamCmsAdmin.request(url,{...init,headers:{apikey:KEY,'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'})
        :await root.fetch(url,{...init,headers:{apikey:KEY,'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'});
      const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=text}
      if(!r.ok)throw new Error(data?.message||data||('Analytics '+r.status));
      return data;
    };
    async function load(range,onlineMinutes=2){
      let events=[],offset=0,truncated=false;
      while(offset<MAX_EVENTS){
        const page=await request(eventPath(range,PAGE_SIZE,offset));
        if(!Array.isArray(page))break;
        events.push(...page);
        if(page.length<PAGE_SIZE)break;
        offset+=PAGE_SIZE;
      }
      if(events.length>=MAX_EVENTS)truncated=true;
      const cut=new Date(Date.now()-Math.max(1,Number(onlineMinutes)||2)*60000).toISOString();
      const presence=await request('/rest/v1/rentcam_presence?select=session_id,last_seen&last_seen=gte.'+encodeURIComponent(cut)+'&limit=1000').catch(()=>[]);
      return {events,presence:Array.isArray(presence)?presence:[],truncated};
    }
    return {load,request};
  }
  function install(root){
    let range=last30(),map=null,leafletPromise=null,busy=false;
    const client=createClient(root);
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const products=()=>{try{return Array.isArray(root.P)?root.P:[]}catch(_){return []}};
    const config=()=>root.RentcamCmsConfig?.get?.()||root.RENTCAM_CMS_CONFIG||{};
    function setRange(start,end,mode='custom'){
      if(!start||!end||start>end)throw new Error('Pilih rentang tanggal yang benar.');
      isoBounds(start,end);range={start,end,mode};return {...range};
    }
    function style(){
      if(root.document.getElementById('rc-cms-analytics-style'))return;
      const s=root.document.createElement('style');s.id='rc-cms-analytics-style';s.textContent=`
        #v5report .rca-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
        #v5report .rca-refresh,#v5report .rca-range-btn{height:38px;border:1px solid #dfe3e8;background:#fff;border-radius:10px;padding:0 12px;font-size:10px;font-weight:800;cursor:pointer}
        #v5report .rca-range-btn.primary{background:#111;color:#fff;border-color:#111}
        #v5report .rca-range-wrap{display:flex;align-items:end;gap:8px;flex-wrap:wrap;width:100%;padding:8px 0 2px}
        #v5report .rca-range-field{display:grid;gap:4px;min-width:135px}
        #v5report .rca-range-field label{font-size:9px;font-weight:800;color:#667085;text-transform:uppercase}
        #v5report .rca-date{height:38px;border:1px solid #dfe3e8;border-radius:10px;padding:0 10px;background:#fff;color:#182230;font:inherit;font-size:11px}
        #v5report .rca-range-label{font-size:10px;color:#667085;font-weight:700;margin-right:auto}
        #v5report .rca-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
        #v5report .rca-metric,#v5report .rca-card{border:1px solid #e5e7ea;border-radius:14px;padding:15px;background:#fff;min-width:0}
        #v5report .rca-metric small{display:block;color:#78808d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
        #v5report .rca-metric strong{display:block;font-size:25px;margin-top:8px}
        #v5report .rca-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
        #v5report .rca-card h3{font-size:13px;margin:0 0 11px}
        #v5report .rca-scroll{overflow:auto}.rca-muted{display:block;color:#8b93a0;font-size:9px;margin-top:2px}
        #v5report .rca-table{width:100%;border-collapse:collapse;min-width:680px;font-size:10px}
        #v5report .rca-table th{padding:9px;text-align:left;background:#f7f8fa;color:#667085;font-size:8px;text-transform:uppercase}
        #v5report .rca-table td{padding:10px 9px;border-top:1px solid #edf0f2;vertical-align:top}
        #v5report #rcAnalyticsMap{height:380px;border-radius:12px;overflow:hidden;background:#eef1f4}
        @media(max-width:800px){#v5report .rca-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#v5report .rca-grid{grid-template-columns:1fr}#v5report #rcAnalyticsMap{height:330px}}
        @media(max-width:600px){#v5report .rca-range-wrap{display:grid;grid-template-columns:1fr 1fr}#v5report .rca-range-field{min-width:0}#v5report .rca-date,#v5report .rca-range-btn{width:100%}#v5report .rca-range-label{grid-column:1/-1}}
      `;root.document.head.appendChild(s);
    }
    async function ensureLeaflet(){
      if(root.L)return root.L;if(leafletPromise)return leafletPromise;
      leafletPromise=new Promise((resolve,reject)=>{
        if(!root.document.querySelector('link[data-rc-leaflet]')){const l=root.document.createElement('link');l.rel='stylesheet';l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';l.dataset.rcLeaflet='1';root.document.head.appendChild(l)}
        const old=root.document.querySelector('script[data-rc-leaflet]');
        if(old){if(root.L)return resolve(root.L);old.addEventListener('load',()=>resolve(root.L),{once:true});old.addEventListener('error',reject,{once:true});return}
        const s=root.document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';s.dataset.rcLeaflet='1';s.onload=()=>resolve(root.L);s.onerror=reject;root.document.head.appendChild(s);
      });return leafletPromise;
    }
    async function renderMap(locations){
      const host=root.document.getElementById('rcAnalyticsMap');if(!host)return;
      try{
        const L=await ensureLeaflet();if(!root.document.getElementById('rcAnalyticsMap'))return;
        if(map){map.remove();map=null}
        map=L.map(host,{scrollWheelZoom:false}).setView([-2.5,118],4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
        const bounds=[];
        locations.filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)).forEach(x=>{
          const p=[x.latitude,x.longitude];bounds.push(p);
          L.marker(p).addTo(map).bindPopup(`<b>${esc(x.label)}</b><br>${x.events} event · ${x.clicks} klik · ${x.views} views`);
        });
        if(bounds.length)map.fitBounds(bounds,{padding:[24,24],maxZoom:10});
        setTimeout(()=>map?.invalidateSize(),80);
      }catch(_){host.innerHTML='<div style="padding:18px">Peta tidak dapat dimuat. Data lokasi tetap tersedia.</div>'}
    }
    function productLabel(e,ps,cfg){
      if(e.product_id)return productName(e.product_id,ps,cfg);
      const m=String(e.path||'').match(/^\/produk\/([^/?#]+)/);
      return m?productName(decodeURIComponent(m[1]),ps,cfg):(e.path||'-');
    }
    async function render(){
      const host=root.document.getElementById('v5report');if(!host||busy)return;
      busy=true;style();host.innerHTML='<p>Memuat analytics…</p>';
      try{
        const cfg=config(),ps=products(),minutes=Number(cfg.report?.onlineWindowMinutes)||2;
        const {events,presence,truncated}=await client.load(range,minutes);
        if(!host.isConnected)return;
        const sum=summarize(events,ps,cfg),views=events.filter(x=>x.event_type==='page_view').length,clicks=events.filter(x=>x.event_type==='product_click').length;
        const recent=events.slice(0,40),custom=range.mode==='custom';
        host.innerHTML=`<div data-cms-analytics="1">
          <div class="rca-toolbar"><span class="rca-muted">Data ${esc(rangeTitle(range))}</span><button class="rca-refresh" type="button" id="rcAnalyticsRefresh">Refresh</button>
            <div class="rca-range-wrap"><div class="rca-range-label">Periode: ${esc(rangeTitle(range))}${truncated?' · maksimal '+MAX_EVENTS.toLocaleString('id-ID')+' event':''}</div>
              <div class="rca-range-field"><label>Dari</label><input class="rca-date" type="date" id="rcaDateStart" value="${esc(range.start)}"></div>
              <div class="rca-range-field"><label>Sampai</label><input class="rca-date" type="date" id="rcaDateEnd" value="${esc(range.end)}"></div>
              <button class="rca-range-btn primary" type="button" id="rcaApplyRange">Terapkan</button>
              <button class="rca-range-btn" type="button" id="rcaMonthNow">Bulan Ini</button>
              <button class="rca-range-btn" type="button" id="rcaLast30">30 Hari</button>
            </div>
          </div>
          <div class="rca-metrics">
            <div class="rca-metric"><small>Online sekarang</small><strong>${new Set(presence.map(x=>x.session_id)).size}</strong></div>
            <div class="rca-metric"><small>${custom?'Views Periode':'Views 1 Bulan'}</small><strong>${views}</strong></div>
            <div class="rca-metric"><small>${custom?'Klik Produk Periode':'Klik Produk 1 Bulan'}</small><strong>${clicks}</strong></div>
            <div class="rca-metric"><small>Visitor anonim</small><strong>${sum.uniqueVisitors}</strong></div>
          </div>
          <div class="rca-grid">
            <div class="rca-card"><h3>${custom?'Top Produk — Klik Periode':'Top Produk — Klik 1 Bulan'}</h3><div class="rca-scroll"><table class="rca-table"><thead><tr><th>Nama Produk</th><th>ID</th><th>Klik</th></tr></thead><tbody>${sum.topProducts.slice(0,20).map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.id)}</td><td><b>${x.count}</b></td></tr>`).join('')||'<tr><td colspan="3">Belum ada klik produk.</td></tr>'}</tbody></table></div></div>
            <div class="rca-card"><h3>Top Lokasi</h3><div class="rca-scroll"><table class="rca-table"><thead><tr><th>Lokasi</th><th>Event</th><th>Klik</th><th>Views</th></tr></thead><tbody>${sum.locations.slice(0,20).map(x=>`<tr><td><b>${esc(x.label)}</b><span class="rca-muted">${x.latitude??'-'}, ${x.longitude??'-'}</span></td><td>${x.events}</td><td>${x.clicks}</td><td>${x.views}</td></tr>`).join('')||'<tr><td colspan="4">Belum ada data lokasi.</td></tr>'}</tbody></table></div></div>
          </div>
          <div class="rca-card" style="margin-bottom:14px"><h3>Peta Lokasi Pengunjung</h3><div id="rcAnalyticsMap"></div><p class="rca-muted">Lokasi jaringan bersifat perkiraan. IP hanya ditampilkan dalam bentuk disamarkan.</p></div>
          <div class="rca-card"><h3>Aktivitas Terbaru</h3><div class="rca-scroll"><table class="rca-table"><thead><tr><th>Event</th><th>Nama Produk / Halaman</th><th>Lokasi</th><th>IP</th><th>Visitor ID</th><th>Waktu</th></tr></thead><tbody>${recent.map(e=>`<tr><td>${esc(e.event_type)}</td><td><b>${esc(productLabel(e,ps,cfg))}</b>${e.product_id?`<span class="rca-muted">${esc(e.product_id)}</span>`:''}</td><td>${esc(locationLabel(e?.meta?.geo||{}))}</td><td>${esc(e?.meta?.ip_masked||'-')}</td><td>${esc(e?.meta?.visitor_hash?String(e.meta.visitor_hash).slice(0,12):'-')}</td><td>${new Date(e.created_at).toLocaleString('id-ID')}</td></tr>`).join('')||'<tr><td colspan="6">Belum ada aktivitas.</td></tr>'}</tbody></table></div></div>
        </div>`;
        root.document.getElementById('rcAnalyticsRefresh')?.addEventListener('click',render);
        root.document.getElementById('rcaApplyRange')?.addEventListener('click',()=>{try{setRange(root.document.getElementById('rcaDateStart')?.value,root.document.getElementById('rcaDateEnd')?.value,'custom');render()}catch(e){root.alert(e.message)}});
        root.document.getElementById('rcaMonthNow')?.addEventListener('click',()=>{range=thisMonth();render()});
        root.document.getElementById('rcaLast30')?.addEventListener('click',()=>{range=last30();render()});
        await renderMap(sum.locations);
      }catch(e){if(host.isConnected)host.innerHTML='<div data-cms-analytics="1">Gagal memuat analytics: '+esc(e.message)+'</div>'}
      finally{busy=false}
    }
    return Object.freeze({render,getRange:()=>({...range}),setRange,last30:()=>last30(),thisMonth:()=>thisMonth()});
  }
  return {SB,KEY,PAGE_SIZE,MAX_EVENTS,ymd,last30,thisMonth,isoBounds,roundCoord,normalizeGeo,locationLabel,productName,summarize,rangeTitle,eventPath,createClient,install};
});