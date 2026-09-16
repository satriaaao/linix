/* Stable analytics dashboard for Rentcam CMS — no destructive interval refresh. */
(function(){
  if(!location.pathname.startsWith('/cms'))return;
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const lib=window.RentcamAnalyticsGeo;
  let timer=null,map=null,leafletPromise=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const baseProducts=()=>{try{return Array.isArray(P)?P:[]}catch(_){return []}};
  async function api(path){const r=await fetch(SB+path,{headers:{apikey:KEY,'Content-Type':'application/json'},cache:'no-store'});if(!r.ok)throw new Error('Analytics '+r.status);return r.json()}
  function style(){if(document.getElementById('rc-geo-analytics-style'))return;const s=document.createElement('style');s.id='rc-geo-analytics-style';s.textContent=`
    #v5report .rca-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    #v5report .rca-refresh{border:1px solid #dfe3e8;background:#fff;border-radius:10px;padding:8px 12px;font-size:10px;font-weight:800;cursor:pointer}
    #v5report .rca-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
    #v5report .rca-metric{border:1px solid #e5e7ea;border-radius:14px;padding:15px;background:#fff}
    #v5report .rca-metric small{display:block;color:#78808d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    #v5report .rca-metric strong{display:block;font-size:25px;margin-top:8px}
    #v5report .rca-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
    #v5report .rca-card{border:1px solid #e5e7ea;border-radius:14px;padding:15px;background:#fff;min-width:0}
    #v5report .rca-card h3{font-size:13px;margin:0 0 11px}
    #v5report .rca-scroll{overflow:auto}
    #v5report .rca-table{width:100%;border-collapse:collapse;min-width:680px;font-size:10px}
    #v5report .rca-table th{padding:9px;text-align:left;background:#f7f8fa;color:#667085;font-size:8px;text-transform:uppercase;letter-spacing:.05em}
    #v5report .rca-table td{padding:10px 9px;border-top:1px solid #edf0f2;vertical-align:top}
    #v5report .rca-table b{display:block;font-size:10px}.rca-muted{display:block;color:#8b93a0;font-size:9px;margin-top:2px}
    #v5report #rcAnalyticsMap{height:380px;border-radius:12px;overflow:hidden;background:#eef1f4}
    #v5report .leaflet-container{font:11px/1.4 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    @media(max-width:800px){#v5report .rca-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#v5report .rca-grid{grid-template-columns:1fr}#v5report #rcAnalyticsMap{height:330px}}
  `;document.head.appendChild(s)}
  async function ensureLeaflet(){
    if(window.L)return window.L;if(leafletPromise)return leafletPromise;
    leafletPromise=new Promise((resolve,reject)=>{
      if(!document.querySelector('link[data-rc-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';l.dataset.rcLeaflet='1';document.head.appendChild(l)}
      const old=document.querySelector('script[data-rc-leaflet]');if(old){if(window.L)return resolve(window.L);old.addEventListener('load',()=>resolve(window.L),{once:true});old.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';s.dataset.rcLeaflet='1';s.onload=()=>resolve(window.L);s.onerror=reject;document.head.appendChild(s);
    });return leafletPromise;
  }
  function productLabel(e,products,cfg){
    if(e.product_id)return lib.productName(e.product_id,products,cfg);
    const m=String(e.path||'').match(/^\/produk\/([^/?#]+)/);
    return m?lib.productName(decodeURIComponent(m[1]),products,cfg):(e.path||'-');
  }
  function locationText(e){return lib.locationLabel(e?.meta?.geo||{})}
  async function loadData(){
    const d7=new Date(Date.now()-7*864e5).toISOString(),cut=new Date(Date.now()-2*60000).toISOString();
    const [events,presence]=await Promise.all([
      api('/rest/v1/rentcam_events?select=event_type,path,product_id,session_id,meta,created_at&created_at=gte.'+encodeURIComponent(d7)+'&order=created_at.desc&limit=3000'),
      api('/rest/v1/rentcam_presence?select=session_id,last_seen&last_seen=gte.'+encodeURIComponent(cut)+'&limit=1000').catch(()=>[])
    ]);
    return {events,presence};
  }
  async function renderMap(locations){
    const host=document.getElementById('rcAnalyticsMap');if(!host)return;
    try{
      const L=await ensureLeaflet();if(!document.getElementById('rcAnalyticsMap'))return;
      if(map){map.remove();map=null}
      map=L.map(host,{scrollWheelZoom:false}).setView([-2.5,118],4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
      const bounds=[];
      locations.filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)).forEach(x=>{
        const p=[x.latitude,x.longitude];bounds.push(p);
        L.marker(p).addTo(map).bindPopup(`<b>${esc(x.label)}</b><br>${x.events} event · ${x.clicks} klik produk · ${x.views} page view`);
      });
      if(bounds.length)map.fitBounds(bounds,{padding:[24,24],maxZoom:10});
      setTimeout(()=>map?.invalidateSize(),80);
    }catch(_){host.innerHTML='<div style="padding:18px">Peta tidak dapat dimuat. Data lokasi tetap tersedia di tabel.</div>'}
  }
  async function upgrade(force=false){
    const host=document.getElementById('v5report');if(!host||host.dataset.geoLoading==='1')return;
    if(!force&&host.querySelector('[data-geo-analytics]'))return;
    host.dataset.geoLoading='1';style();
    try{
      const {events,presence}=await loadData(),cfg=window.RENTCAM_CMS_CONFIG||{},products=baseProducts(),sum=lib.summarize(events,products,cfg);
      const views=events.filter(x=>x.event_type==='page_view').length,clicks=events.filter(x=>x.event_type==='product_click').length;
      const recent=events.slice(0,40);
      host.innerHTML=`<div data-geo-analytics="1">
        <div class="rca-toolbar"><span class="rca-muted">Data 7 hari terakhir</span><button class="rca-refresh" type="button" id="rcAnalyticsRefresh">Refresh</button></div>
        <div class="rca-metrics">
          <div class="rca-metric"><small>Online sekarang</small><strong>${new Set(presence.map(x=>x.session_id)).size}</strong></div>
          <div class="rca-metric"><small>Views 7 hari</small><strong>${views}</strong></div>
          <div class="rca-metric"><small>Klik produk 7 hari</small><strong>${clicks}</strong></div>
          <div class="rca-metric"><small>Visitor anonim</small><strong>${sum.uniqueVisitors}</strong></div>
        </div>
        <div class="rca-grid">
          <div class="rca-card"><h3>Top Produk — Klik 7 Hari</h3><div class="rca-scroll"><table class="rca-table"><thead><tr><th>Nama Produk</th><th>ID</th><th>Klik</th></tr></thead><tbody>${sum.topProducts.slice(0,20).map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.id)}</td><td><b>${x.count}</b></td></tr>`).join('')||'<tr><td colspan="3">Belum ada klik produk.</td></tr>'}</tbody></table></div></div>
          <div class="rca-card"><h3>Top Lokasi</h3><div class="rca-scroll"><table class="rca-table"><thead><tr><th>Lokasi</th><th>Event</th><th>Klik</th><th>Views</th></tr></thead><tbody>${sum.locations.slice(0,20).map(x=>`<tr><td><b>${esc(x.label)}</b><span class="rca-muted">${x.latitude??'-'}, ${x.longitude??'-'}</span></td><td>${x.events}</td><td>${x.clicks}</td><td>${x.views}</td></tr>`).join('')||'<tr><td colspan="4">Belum ada data lokasi.</td></tr>'}</tbody></table></div></div>
        </div>
        <div class="rca-card" style="margin-bottom:14px"><h3>Peta Lokasi Pengunjung</h3><div id="rcAnalyticsMap"></div><p class="rca-muted">Lokasi dari geolocation jaringan Vercel. IP ditampilkan dalam bentuk disamarkan.</p></div>
        <div class="rca-card"><h3>Aktivitas Terbaru</h3><div class="rca-scroll"><table class="rca-table"><thead><tr><th>Event</th><th>Nama Produk / Halaman</th><th>Lokasi</th><th>IP</th><th>Visitor ID</th><th>Waktu</th></tr></thead><tbody>${recent.map(e=>`<tr><td>${esc(e.event_type)}</td><td><b>${esc(productLabel(e,products,cfg))}</b>${e.product_id?`<span class="rca-muted">${esc(e.product_id)}</span>`:''}</td><td>${esc(locationText(e))}</td><td>${esc(e?.meta?.ip_masked||'-')}</td><td>${esc(e?.meta?.visitor_hash?String(e.meta.visitor_hash).slice(0,12):'-')}</td><td>${new Date(e.created_at).toLocaleString('id-ID')}</td></tr>`).join('')||'<tr><td colspan="6">Belum ada aktivitas.</td></tr>'}</tbody></table></div></div>
      </div>`;
      document.getElementById('rcAnalyticsRefresh')?.addEventListener('click',()=>upgrade(true));
      await renderMap(sum.locations);
    }catch(err){host.innerHTML=`<div data-geo-analytics="1">Gagal memuat analytics: ${esc(err.message)}</div>`}
    finally{delete host.dataset.geoLoading}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{const h=document.getElementById('v5report');if(h&&!h.querySelector('[data-geo-analytics]'))upgrade()},120)}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-nav="analytics"]'))setTimeout(schedule,80)},true);
  schedule();
})();