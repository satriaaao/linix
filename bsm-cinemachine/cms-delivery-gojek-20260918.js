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
  let active=false, orders=[], filter='all', modal=null, loading=false, masterDrivers=[], masterVehicles=[];

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
    const [drivers,vehicles]=await Promise.all([
      adminRpc('rentcam_admin_driver_list'),
      adminRpc('rentcam_admin_vehicle_list')
    ]);
    masterDrivers=Array.isArray(drivers)?drivers:[];
    masterVehicles=Array.isArray(vehicles)?vehicles:[];
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
      '<div class="gd-route"><div class="gd-route-line"><span class="dot start"></span><span class="rail"></span><span class="dot end"></span></div><div class="gd-route-text"><div><small>DARI</small><b>'+E(j.origin||'-')+'</b></div><div><small>TUJUAN</small><b>'+E(j.destination||j.address||'-')+'</b></div></div></div>'+
      '<div class="gd-meta"><span>🕐 '+E(fmtDate(j.time))+'</span><span>📍 '+(j.distance_km?E(j.distance_km)+' km':'Jarak belum diisi')+'</span><span>💳 '+(j.fee?E(money(j.fee)):'Biaya belum diisi')+'</span></div>'+
      driverBlock(j)+
      (j.location?'<div class="gd-live"><span class="pulse"></span><div><b>Lokasi driver terakhir</b><small>'+E(fmtDate(j.location.updated_at))+'</small></div><a href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(j.location.lat+','+j.location.lng)+'" target="_blank" rel="noopener">Lihat</a></div>':'')+
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
      '<section class="gd-hero"><div><span class="gd-eyebrow">DISPATCH CENTER</span><h2>Antar–Jemput</h2><p>Kelola pengantaran dan penjemputan rental seperti aplikasi ride-hailing: assign driver, status perjalanan, ETA operasional, lokasi, dan komunikasi.</p></div><div class="gd-hero-actions"><button data-gd-action="new" class="primary">+ Buat tugas</button><button data-gd-action="refresh" class="secondary">Perbarui</button></div></section>'+
      '<section class="gd-stats"><button data-gd-filter="all" class="'+(filter==='all'?'on':'')+'"><small>Semua tugas</small><strong>'+c.total+'</strong></button><button data-gd-filter="unassigned" class="'+(filter==='unassigned'?'on':'')+'"><small>Perlu driver</small><strong>'+c.unassigned+'</strong></button><button data-gd-filter="moving" class="'+(filter==='moving'?'on':'')+'"><small>Dalam perjalanan</small><strong>'+c.moving+'</strong></button><button data-gd-filter="done" class="'+(filter==='done'?'on':'')+'"><small>Selesai</small><strong>'+c.done+'</strong></button></section>'+
      '<div class="gd-toolbar"><input data-gd-search placeholder="Cari order / customer / driver..." autocomplete="off"><span>'+list.length+' tugas</span></div>'+
      '<section class="gd-list" data-gd-list>'+ (list.map(jobCard).join('')||'<div class="gd-empty"><b>Belum ada tugas antar–jemput.</b><span>Klik “Buat tugas” atau aktifkan opsi antar/jemput pada order rental.</span></div>') +'</section>'+
      modalHtml()+
    '</div>';
  }
  function modalHtml(){
    if(!modal)return '';
    if(modal.type==='assign'){
      const j=makeJob(orders.find(o=>o.id===modal.id),modal.kind);
      return '<div class="gd-modal"><form class="gd-dialog" data-gd-form="assign"><div class="gd-dialog-head"><div><small>DRIVER & PERJALANAN</small><h3>'+E(j.order.order_number||'')+'</h3></div><button type="button" data-gd-action="close">×</button></div><div class="gd-form">'+
        '<label>Driver<select name="driver_id" required><option value="">Pilih driver…</option>'+masterDrivers.filter(x=>x.active).map(x=>'<option value="'+E(x.id)+'" '+(String(x.id)===String(j.driver_id)?'selected':'')+'>'+E(x.name)+' · @'+E(x.username)+'</option>').join('')+'</select></label>'+
        '<label>Kendaraan / Plat<select name="vehicle_id"><option value="">Tanpa kendaraan</option>'+masterVehicles.filter(x=>x.active).map(x=>'<option value="'+E(x.id)+'" '+(String(x.id)===String(j.vehicle_id)?'selected':'')+'>'+E(x.plate)+' · '+E(x.name)+'</option>').join('')+'</select></label>'+
        (!masterDrivers.some(x=>x.active)?'<div class="gd-master-warning">Belum ada akun driver aktif. Buat dulu di menu <b>Master Driver</b>.</div>':'')+
        '<div class="gd-two"><label>Jarak (km)<input name="distance_km" value="'+E(j.distance_km||'')+'" type="number" min="0" step="0.1"></label><label>Biaya antar/jemput<input name="fee" value="'+E(j.fee||'')+'" type="number" min="0" step="1000"></label></div>'+
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
  async function assign(form){
    const fd=Object.fromEntries(new FormData(form));
    const id=modal.id, kind=modal.kind;
    if(!fd.driver_id)throw new Error('Pilih driver dari Master Driver');
    const data=await adminRpc('rentcam_admin_assign_driver',{
      p_order:id,
      p_kind:kind,
      p_driver:fd.driver_id,
      p_vehicle:fd.vehicle_id||null,
      p_distance_km:Number(fd.distance_km||0),
      p_fee:Number(fd.fee||0),
      p_note:String(fd.note||'').trim()
    });
    if(!data?.ok)throw new Error(data?.message||'Gagal menugaskan driver');
    const o=getOrder(id);
    if(o&&data.delivery)o.delivery=data.delivery;
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
    .gd-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.gd-job{background:#fff;border:1px solid #e2e7ef;border-radius:22px;padding:20px;box-shadow:0 7px 24px rgba(25,39,58,.045)}.gd-jobtop{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.gd-kind{display:inline-flex;padding:5px 8px;border-radius:999px;background:#fff1e9;color:#c75b21;font-size:9px;font-weight:900;letter-spacing:.08em}.gd-kind.collect{background:#eef3ff;color:#4d69b8}.gd-job h3{margin:8px 0 3px;font-size:18px;color:#202d43}.gd-jobtop p{margin:0;color:#7d899b;font-size:11px}
    .gd-status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:850;background:#f3f5f8;color:#657286;white-space:nowrap}.gd-status i{width:7px;height:7px;border-radius:50%;background:#9ba5b3}.gd-status.assigned{background:#fff7e8;color:#9c6a12}.gd-status.assigned i{background:#efa520}.gd-status.moving{background:#eef4ff;color:#3e62b1}.gd-status.moving i{background:#4a74d8}.gd-status.arrived{background:#f1edff;color:#7655b4}.gd-status.arrived i{background:#8a69cf}.gd-status.done{background:#eaf8f2;color:#197c5d}.gd-status.done i{background:#1ea77b}.gd-status.cancelled{background:#fff0f1;color:#ac4550}.gd-status.cancelled i{background:#dc5965}
    .gd-route{display:grid;grid-template-columns:24px 1fr;gap:8px;margin:18px 0 15px;padding:15px;border-radius:16px;background:#f7f9fc}.gd-route-line{display:grid;grid-template-rows:12px 1fr 12px;justify-items:center;min-height:84px}.gd-route .dot{width:10px;height:10px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #f26a21;background:#f26a21}.gd-route .dot.end{box-shadow:0 0 0 2px #2f6ee5;background:#2f6ee5}.gd-route .rail{width:2px;background:repeating-linear-gradient(to bottom,#bbc5d3 0 4px,transparent 4px 8px)}.gd-route-text{display:flex;flex-direction:column;justify-content:space-between;gap:15px}.gd-route-text small{display:block;color:#97a1b0;font-size:8px;font-weight:850;letter-spacing:.08em}.gd-route-text b{display:block;margin-top:3px;color:#35445a;font-size:11px;line-height:1.4}
    .gd-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.gd-meta span{padding:7px 9px;background:#f7f9fb;border:1px solid #e9edf2;border-radius:10px;font-size:9px;color:#627087}
    .gd-driver{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #edf0f4;border-bottom:1px solid #edf0f4}.gd-avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#17243a;color:#fff;font-weight:900}.gd-driver>div:nth-child(2){min-width:0;flex:1}.gd-driver b{display:block;font-size:12px;color:#25334a}.gd-driver small{display:block;font-size:9px;color:#8894a6;margin-top:2px}.gd-driver.empty .gd-avatar{background:#eef1f5;color:#7d8998}.gd-round{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#eaf8f0;color:#1b8b5e;text-decoration:none;font-size:10px;font-weight:900}
    .gd-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.gd-actions button,.gd-actions .gd-button{min-height:38px;padding:0 11px;font-size:10px}.gd .track{background:#0f9d68;color:#fff}.gd-track{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:12px;padding:11px 12px;border:1px solid #dcece5;background:#f3faf7;border-radius:13px}.gd-track div{min-width:0}.gd-track small{display:block;font-size:8px;font-weight:900;letter-spacing:.08em;color:#2d7d60}.gd-track b{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:16px;letter-spacing:.12em;color:#263a31}.gd-track em{display:block;margin-top:3px;font-size:8px;font-style:normal;color:#7a8d84}.gd-track a{flex:0 0 auto;text-decoration:none;color:#0e855b;font-size:10px;font-weight:900}.gd-note{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#fff9f5;color:#7a5a48;font-size:10px;line-height:1.5}.gd-live{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border-radius:13px;background:#f0f8f5}.gd-live .pulse{width:9px;height:9px;border-radius:50%;background:#19a575;box-shadow:0 0 0 4px rgba(25,165,117,.12)}.gd-live div{flex:1}.gd-live b,.gd-live small{display:block}.gd-live b{font-size:10px}.gd-live small{font-size:8px;color:#7c8b84}.gd-live a{font-size:9px;font-weight:850;color:#18815e;text-decoration:none}
    .gd-empty,.gd-loading,.gd-error{grid-column:1/-1;padding:42px;border:1px dashed #d8dee8;border-radius:20px;text-align:center;background:#fff;color:#7b8798}.gd-empty b,.gd-empty span{display:block}.gd-empty span{font-size:11px;margin-top:7px}.gd-error{color:#b42318}
    .gd-modal{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:18px;background:rgba(7,13,23,.62);backdrop-filter:blur(8px)}.gd-dialog{width:min(620px,100%);max-height:92dvh;overflow:auto;background:#f7f9fb;border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.30)}.gd-dialog-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 21px;background:#fff;border-bottom:1px solid #e6eaf0}.gd-dialog-head small{font-size:8px;letter-spacing:.12em;color:#f26a21;font-weight:900}.gd-dialog-head h3{margin:3px 0 0;font-size:18px}.gd-dialog-head>button{width:38px;height:38px;padding:0;border-radius:50%;background:#f1f3f6;color:#334056;font-size:20px}.gd-form{padding:20px}.gd-form label{display:block;margin-bottom:13px;font-size:10px;color:#5c687a;font-weight:800}.gd-form input,.gd-form select,.gd-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #d9dfe8;border-radius:12px;background:#fff;padding:11px 12px;font:inherit;font-size:12px;color:#25334a;outline:none}.gd-form textarea{min-height:88px;resize:vertical}.gd-master-warning{margin:-2px 0 14px;padding:11px 12px;border-radius:12px;background:#fff6ed;color:#9a5a2a;font-size:10px;line-height:1.45}.gd-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gd-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
    @media(max-width:900px){.gd-list{grid-template-columns:1fr}.gd-hero{align-items:flex-start;flex-direction:column}.gd-stats{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.gd-hero{padding:20px;border-radius:19px}.gd-hero h2{font-size:24px}.gd-hero-actions{width:100%}.gd-hero-actions button{flex:1}.gd-stats{gap:8px}.gd-stats button{min-height:78px;padding:13px;border-radius:15px}.gd-stats strong{font-size:23px}.gd-toolbar{align-items:stretch;flex-direction:column}.gd-toolbar input{min-width:0;width:100%}.gd-job{padding:15px;border-radius:18px}.gd-jobtop{flex-direction:column}.gd-two{grid-template-columns:1fr}.gd-actions>*{flex:1 1 calc(50% - 8px)}}
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
    if(a==='new'){modal={type:'new'};render();return}
    if(a==='refresh'){await refresh();return}
    if(a==='assign'){modal={type:'assign',id:b.dataset.id,kind:b.dataset.kind};render();return}
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
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;navInject();if(active)setNavOn()});
    }).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
  }
  if(document.documentElement.dataset.cmsReady==='1')boot();
  else window.addEventListener('rentcam:cms-ready',boot,{once:true});
})();