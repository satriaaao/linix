/* Rentcam CMS — Driver & Vehicle Master */
(function(){
  if(!location.pathname.startsWith('/cms'))return;
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active='',drivers=[],vehicles=[],activity={active:[],recent:[],fuel:[]},modal=null;

  async function decode(r){
    const t=await r.text();let d=null;
    try{d=t?JSON.parse(t):null}catch(_){d=t}
    if(!r.ok)throw new Error(d?.message||d||('Gagal ('+r.status+')'));
    return d;
  }
  async function rpc(name,payload={}){
    const r=await window.RentcamCmsAdmin.request(SB+'/rest/v1/rpc/'+name,{
      method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)
    });
    return decode(r);
  }
  async function load(){
    const [d,v,a]=await Promise.all([
      rpc('rentcam_admin_driver_list'),
      rpc('rentcam_admin_vehicle_list'),
      rpc('rentcam_admin_vehicle_activity')
    ]);
    drivers=Array.isArray(d)?d:[];
    vehicles=Array.isArray(v)?v:[];
    activity=a?.ok?a:{active:[],recent:[],fuel:[]};
  }
  function navInject(){
    const nav=document.querySelector('.v5-nav');if(!nav)return;
    if(!nav.querySelector('[data-driver-master]')){
      const b=document.createElement('button');b.type='button';b.dataset.driverMaster='1';
      b.innerHTML='<svg class="v5-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/><path d="M18 5h3M19.5 3.5v3"/></svg><span>Master Driver</span>';
      const after=nav.querySelector('[data-gojek-delivery]');
      if(after)after.insertAdjacentElement('afterend',b);else nav.appendChild(b);
    }
    if(!nav.querySelector('[data-vehicle-master]')){
      const b=document.createElement('button');b.type='button';b.dataset.vehicleMaster='1';
      b.innerHTML='<svg class="v5-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 15l1.5-5h13L20 15"/><path d="M3 15h18v4H3z"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg><span>Master Kendaraan</span>';
      const after=nav.querySelector('[data-driver-master]');
      if(after)after.insertAdjacentElement('afterend',b);else nav.appendChild(b);
    }
  }
  function setNav(){
    document.querySelectorAll('.v5-nav button').forEach(b=>b.classList.toggle('on',
      (active==='drivers'&&b.hasAttribute('data-driver-master'))||(active==='vehicles'&&b.hasAttribute('data-vehicle-master'))
    ));
    const h=document.querySelector('.v5-top h1');if(h)h.textContent=active==='drivers'?'Master Driver':'Master Kendaraan';
  }
  function stats(){
    return '<div class="dm-stats"><div><small>Total driver</small><b>'+drivers.length+'</b></div><div><small>Driver aktif</small><b>'+drivers.filter(x=>x.active).length+'</b></div><div><small>Total kendaraan</small><b>'+vehicles.length+'</b></div><div><small>Kendaraan aktif</small><b>'+vehicles.filter(x=>x.active).length+'</b></div></div>';
  }
  function driverRows(){
    if(!drivers.length)return '<div class="dm-empty">Belum ada driver. Klik <b>+ Tambah Driver</b>.</div>';
    return '<div class="dm-grid">'+drivers.map(d=>'<article class="dm-card">'+
      '<div class="dm-cardtop"><div class="dm-avatar">'+E((d.name||'?').slice(0,1).toUpperCase())+'</div><div><h3>'+E(d.name)+'</h3><p>@'+E(d.username)+'</p></div><span class="dm-badge '+(d.active?'on':'off')+'">'+(d.active?'Aktif':'Nonaktif')+'</span></div>'+
      '<div class="dm-info"><span>WhatsApp</span><b>'+E(d.phone||'-')+'</b></div>'+
      '<div class="dm-actions"><button data-dm-action="edit-driver" data-id="'+E(d.id)+'">Edit akun</button></div>'+
    '</article>').join('')+'</div>';
  }
  function vehicleRows(){
    if(!vehicles.length)return '<div class="dm-empty">Belum ada kendaraan. Klik <b>+ Tambah Kendaraan</b>.</div>';
    const activeKeys=Array.isArray(activity.active)?activity.active:[];
    return '<div class="dm-grid">'+vehicles.map(v=>{
      const k=activeKeys.find(x=>String(x.vehicle_id)===String(v.id));
      return '<article class="dm-card">'+
      '<div class="dm-cardtop"><div class="dm-avatar vehicle">🚘</div><div><h3>'+E(v.plate)+'</h3><p>'+E(v.name)+'</p></div><span class="dm-badge '+(k?'busy':v.active?'on':'off')+'">'+(k?'Kunci keluar':v.active?'Tersedia':'Nonaktif')+'</span></div>'+
      '<div class="dm-info"><span>Tipe</span><b>'+E(v.vehicle_type||'-')+'</b></div>'+
      (k?'<div class="dm-keyholder"><small>DIBAWA DRIVER</small><b>'+E(k.driver)+'</b><span>'+E(new Date(k.checked_out_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}))+' · '+E(k.odometer)+' km · BBM '+E(k.fuel_level)+'%</span><div><a href="'+E(k.condition_photo)+'" target="_blank" rel="noopener">Foto kondisi</a><a href="'+E(k.odometer_photo)+'" target="_blank" rel="noopener">Foto spidometer</a></div></div>':'')+
      (v.notes?'<div class="dm-note">'+E(v.notes)+'</div>':'')+
      '<div class="dm-actions"><button data-dm-action="edit-vehicle" data-id="'+E(v.id)+'">Edit kendaraan</button></div>'+
    '</article>'}).join('')+'</div>';
  }
  function fmtDate(v){
    if(!v)return '-';
    try{return new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(_){return String(v)}
  }
  function vehicleOps(){
    const fuel=Array.isArray(activity.fuel)?activity.fuel:[];
    const recent=Array.isArray(activity.recent)?activity.recent:[];
    return '<section class="dm-ops"><div class="dm-section-head"><div><small>LOG OPERASIONAL</small><h3>Riwayat Kendaraan & BBM</h3></div><span>'+fuel.length+' catatan BBM</span></div>'+
      '<div class="dm-op-grid">'+
        '<div class="dm-op-card"><h4>Pengembalian Terbaru</h4>'+(recent.slice(0,12).map((x,i)=>'<div class="dm-log-row"><div><b>'+E(x.plate)+' · '+E(x.driver)+'</b><span>'+E(fmtDate(x.checked_out_at))+(x.returned_at?' → '+E(fmtDate(x.returned_at)):' · masih dipakai')+'</span></div><div class="dm-log-actions">'+(x.checkout_condition_photo?'<a href="'+E(x.checkout_condition_photo)+'" target="_blank" rel="noopener">Foto</a>':'')+'<button data-dm-action="detail-shift" data-index="'+i+'">Detail</button></div></div>').join('')||'<p>Belum ada log kendaraan.</p>')+'</div>'+
        '<div class="dm-op-card"><h4>Isi BBM Terbaru</h4>'+(fuel.slice(0,12).map((x,i)=>'<div class="dm-log-row"><div><b>'+E(x.plate)+' · Rp'+Number(x.amount||0).toLocaleString('id-ID')+'</b><span>'+E(x.driver)+' · '+E(x.odometer)+' km · BBM '+E(x.fuel_level_after)+'%</span></div><div class="dm-log-actions"><a href="'+E(x.receipt_photo)+'" target="_blank" rel="noopener">Struk</a><button data-dm-action="detail-fuel" data-index="'+i+'">Detail</button></div></div>').join('')||'<p>Belum ada catatan BBM.</p>')+'</div>'+
      '</div></section>';
  }
  function modalHtml(){
    if(!modal)return '';
    if(modal.type==='shift-detail'){
      const x=(activity.recent||[])[modal.index];
      if(!x)return '';
      const distance=(x.return_odometer!=null&&x.checkout_odometer!=null)?Math.max(0,Number(x.return_odometer)-Number(x.checkout_odometer)).toLocaleString('id-ID')+' km':'-';
      return '<div class="dm-modal"><div class="dm-dialog dm-detail-dialog">'+
        '<div class="dm-head"><div><small>DETAIL RIWAYAT KENDARAAN</small><h3>'+E(x.plate)+' · '+E(x.driver)+'</h3></div><button type="button" data-dm-action="close">×</button></div>'+
        '<div class="dm-detail-body">'+
          '<div class="dm-detail-grid">'+
            '<div><small>Driver yang ambil kunci</small><b>'+E(x.driver||'-')+'</b></div>'+
            '<div><small>Kendaraan</small><b>'+E(x.vehicle_name||'-')+' · '+E(x.plate||'-')+'</b></div>'+
            '<div><small>Waktu ambil kunci</small><b>'+E(fmtDate(x.checked_out_at))+'</b></div>'+
            '<div><small>Waktu pulang kunci</small><b>'+E(fmtDate(x.returned_at))+'</b></div>'+
            '<div><small>Odometer awal</small><b>'+E(x.checkout_odometer??'-')+' km</b></div>'+
            '<div><small>Odometer akhir</small><b>'+E(x.return_odometer??'-')+' km</b></div>'+
            '<div><small>Jarak pemakaian</small><b>'+E(distance)+'</b></div>'+
            '<div><small>BBM awal</small><b>'+E(x.checkout_fuel_level??'-')+'%</b></div>'+
            '<div><small>BBM akhir</small><b>'+E(x.return_fuel_level??'-')+'%</b></div>'+
            '<div><small>Tipe kendaraan</small><b>'+E(x.vehicle_type||'-')+'</b></div>'+
          '</div>'+
          '<div class="dm-notes"><div><small>Catatan awal</small><p>'+E(x.checkout_notes||'-')+'</p></div><div><small>Catatan akhir</small><p>'+E(x.return_notes||'-')+'</p></div></div>'+
          '<div class="dm-photo-grid">'+
            (x.checkout_condition_photo?'<a href="'+E(x.checkout_condition_photo)+'" target="_blank" rel="noopener"><span>Kondisi awal</span><img src="'+E(x.checkout_condition_photo)+'" alt="Kondisi awal"></a>':'')+
            (x.checkout_odometer_photo?'<a href="'+E(x.checkout_odometer_photo)+'" target="_blank" rel="noopener"><span>Spidometer awal</span><img src="'+E(x.checkout_odometer_photo)+'" alt="Spidometer awal"></a>':'')+
            (x.return_condition_photo?'<a href="'+E(x.return_condition_photo)+'" target="_blank" rel="noopener"><span>Kondisi akhir</span><img src="'+E(x.return_condition_photo)+'" alt="Kondisi akhir"></a>':'')+
            (x.return_odometer_photo?'<a href="'+E(x.return_odometer_photo)+'" target="_blank" rel="noopener"><span>Spidometer akhir</span><img src="'+E(x.return_odometer_photo)+'" alt="Spidometer akhir"></a>':'')+
          '</div>'+
        '</div></div></div>';
    }
    if(modal.type==='fuel-detail'){
      const x=(activity.fuel||[])[modal.index];
      if(!x)return '';
      return '<div class="dm-modal"><div class="dm-dialog dm-detail-dialog">'+
        '<div class="dm-head"><div><small>DETAIL ISI BBM</small><h3>'+E(x.plate)+' · '+E(x.driver)+'</h3></div><button type="button" data-dm-action="close">×</button></div>'+
        '<div class="dm-detail-body">'+
          '<div class="dm-detail-grid">'+
            '<div><small>Nama driver</small><b>'+E(x.driver||'-')+'</b></div>'+
            '<div><small>Kendaraan</small><b>'+E(x.vehicle_name||'-')+' · '+E(x.plate||'-')+'</b></div>'+
            '<div><small>Waktu isi BBM</small><b>'+E(fmtDate(x.filled_at))+'</b></div>'+
            '<div><small>Odometer</small><b>'+E(x.odometer??'-')+' km</b></div>'+
            '<div><small>Nominal</small><b>Rp'+Number(x.amount||0).toLocaleString('id-ID')+'</b></div>'+
            '<div><small>Liter</small><b>'+E(x.liters??'-')+' L</b></div>'+
            '<div><small>BBM setelah isi</small><b>'+E(x.fuel_level_after??'-')+'%</b></div>'+
            '<div><small>Tipe kendaraan</small><b>'+E(x.vehicle_type||'-')+'</b></div>'+
          '</div>'+
          '<div class="dm-notes"><div><small>Catatan BBM</small><p>'+E(x.notes||'-')+'</p></div></div>'+
          '<div class="dm-photo-grid">'+
            (x.receipt_photo?'<a href="'+E(x.receipt_photo)+'" target="_blank" rel="noopener"><span>Foto struk BBM</span><img src="'+E(x.receipt_photo)+'" alt="Struk BBM"></a>':'')+
            (x.odometer_photo?'<a href="'+E(x.odometer_photo)+'" target="_blank" rel="noopener"><span>Foto spidometer</span><img src="'+E(x.odometer_photo)+'" alt="Spidometer"></a>':'')+
          '</div>'+
        '</div></div></div>';
    }
    if(modal.type==='driver'){
      const d=modal.id?drivers.find(x=>String(x.id)===String(modal.id)):null;
      return '<div class="dm-modal"><form class="dm-dialog" data-dm-form="driver">'+
       '<div class="dm-head"><div><small>AKUN DRIVER</small><h3>'+(d?'Edit Driver':'Tambah Driver')+'</h3></div><button type="button" data-dm-action="close">×</button></div>'+
       '<div class="dm-form">'+
        '<input type="hidden" name="id" value="'+E(d?.id||'')+'">'+
        '<label>Nama driver<input name="name" required value="'+E(d?.name||'')+'" placeholder="Nama lengkap"></label>'+
        '<label>Username login<input name="username" required value="'+E(d?.username||'')+'" placeholder="contoh: budi.driver" autocapitalize="none"></label>'+
        '<label>Password '+(d?'<small>(kosongkan jika tidak diubah)</small>':'')+'<input name="password" type="password" '+(d?'':'required')+' minlength="6" placeholder="Minimal 6 karakter"></label>'+
        '<label>No. WhatsApp<input name="phone" inputmode="tel" value="'+E(d?.phone||'')+'" placeholder="08xxxxxxxxxx"></label>'+
        '<label class="dm-switch"><input name="active" type="checkbox" '+(!d||d.active?'checked':'')+'><span>Driver aktif</span></label>'+
        '<div class="dm-dialog-actions"><button type="button" data-dm-action="close" class="ghost">Batal</button><button type="submit" class="primary">Simpan</button></div>'+
       '</div></form></div>';
    }
    if(modal.type==='vehicle'){
      const v=modal.id?vehicles.find(x=>String(x.id)===String(modal.id)):null;
      return '<div class="dm-modal"><form class="dm-dialog" data-dm-form="vehicle">'+
       '<div class="dm-head"><div><small>MASTER KENDARAAN</small><h3>'+(v?'Edit Kendaraan':'Tambah Kendaraan')+'</h3></div><button type="button" data-dm-action="close">×</button></div>'+
       '<div class="dm-form">'+
        '<input type="hidden" name="id" value="'+E(v?.id||'')+'">'+
        '<label>Plat nomor<input name="plate" required value="'+E(v?.plate||'')+'" placeholder="B 1234 XYZ"></label>'+
        '<label>Nama kendaraan<input name="name" required value="'+E(v?.name||'')+'" placeholder="Avanza Operasional"></label>'+
        '<label>Tipe<select name="vehicle_type"><option '+(v?.vehicle_type==='Motor'?'selected':'')+'>Motor</option><option '+(!v||v?.vehicle_type==='Mobil'?'selected':'')+'>Mobil</option><option '+(v?.vehicle_type==='Van'?'selected':'')+'>Van</option><option '+(v?.vehicle_type==='Pickup'?'selected':'')+'>Pickup</option></select></label>'+
        '<label>Catatan<textarea name="notes" placeholder="Warna, unit, PIC, dll">'+E(v?.notes||'')+'</textarea></label>'+
        '<label class="dm-switch"><input name="active" type="checkbox" '+(!v||v.active?'checked':'')+'><span>Kendaraan aktif</span></label>'+
        '<div class="dm-dialog-actions"><button type="button" data-dm-action="close" class="ghost">Batal</button><button type="submit" class="primary">Simpan</button></div>'+
       '</div></form></div>';
    }
    return '';
  }
  function render(){
    if(!active)return;setNav();
    const host=document.querySelector('.v5-content');if(!host)return;
    const isDriver=active==='drivers';
    host.innerHTML='<div class="dm">'+
      '<section class="dm-hero"><div><span>OPERASIONAL ANTAR–JEMPUT</span><h2>'+(isDriver?'Master Driver':'Master Kendaraan')+'</h2><p>'+(isDriver?'Kelola akun driver yang bisa login ke portal driver dan menerima jadwal tugas.':'Kelola data kendaraan dan plat yang dipakai untuk tugas antar–jemput.')+'</p></div>'+
      '<div class="dm-hero-actions"><a href="/driver" target="_blank" rel="noopener">Portal Driver ↗</a><button data-dm-action="'+(isDriver?'new-driver':'new-vehicle')+'">+ '+(isDriver?'Tambah Driver':'Tambah Kendaraan')+'</button></div></section>'+
      stats()+
      (isDriver?driverRows():(vehicleRows()+vehicleOps()))+
      modalHtml()+
    '</div>';
  }
  async function open(which){
    active=which;modal=null;setNav();
    const host=document.querySelector('.v5-content');if(host)host.innerHTML='<div class="dm-loading">Memuat master data…</div>';
    try{await load();render()}catch(e){if(host)host.innerHTML='<div class="dm-error">'+E(e.message)+'</div>'}
  }
  async function saveDriver(form){
    const fd=new FormData(form);
    const data=await rpc('rentcam_admin_driver_save',{
      p_id:fd.get('id')||null,
      p_name:String(fd.get('name')||'').trim(),
      p_username:String(fd.get('username')||'').trim(),
      p_password:String(fd.get('password')||''),
      p_phone:String(fd.get('phone')||'').trim(),
      p_active:fd.get('active')==='on'
    });
    if(!data?.ok)throw new Error(data?.message||'Gagal menyimpan driver');
  }
  async function saveVehicle(form){
    const fd=new FormData(form);
    const data=await rpc('rentcam_admin_vehicle_save',{
      p_id:fd.get('id')||null,
      p_plate:String(fd.get('plate')||'').trim(),
      p_name:String(fd.get('name')||'').trim(),
      p_vehicle_type:String(fd.get('vehicle_type')||'Mobil'),
      p_notes:String(fd.get('notes')||'').trim(),
      p_active:fd.get('active')==='on'
    });
    if(!data?.ok)throw new Error(data?.message||'Gagal menyimpan kendaraan');
  }
  function injectCss(){
    if(document.getElementById('dm-style'))return;
    const s=document.createElement('style');s.id='dm-style';s.textContent=`
    .dm{max-width:1280px;margin:0 auto}.dm *{box-sizing:border-box}.dm button,.dm input,.dm select,.dm textarea{font:inherit}
    .dm-hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;padding:25px 27px;border-radius:24px;background:linear-gradient(135deg,#101927,#1a2a41);color:#fff;margin-bottom:16px;box-shadow:0 18px 45px rgba(13,25,43,.13)}.dm-hero span{font-size:9px;letter-spacing:.15em;font-weight:900;color:#ff9c68}.dm-hero h2{margin:5px 0 6px;font-size:29px;letter-spacing:-.04em}.dm-hero p{margin:0;color:#aab7ca;font-size:12px;line-height:1.55}.dm-hero-actions{display:flex;gap:8px}.dm-hero-actions a,.dm-hero-actions button{height:42px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);display:inline-flex;align-items:center;text-decoration:none;font-size:10px;font-weight:900}.dm-hero-actions a{color:#fff;background:rgba(255,255,255,.06)}.dm-hero-actions button{border:0;background:#f26a21;color:#fff}
    .dm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:15px}.dm-stats div{background:#fff;border:1px solid #e2e7ef;border-radius:17px;padding:15px}.dm-stats small{display:block;color:#8390a2;font-size:9px}.dm-stats b{display:block;margin-top:5px;font-size:22px;color:#1c2a40}
    .dm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.dm-card{background:#fff;border:1px solid #e2e7ef;border-radius:20px;padding:17px;box-shadow:0 6px 20px rgba(25,39,58,.04)}.dm-cardtop{display:flex;align-items:center;gap:10px}.dm-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#17243a;color:#fff;font-weight:900;font-size:16px}.dm-avatar.vehicle{border-radius:14px;background:#eef4ff}.dm-cardtop>div:nth-child(2){min-width:0;flex:1}.dm-card h3{margin:0;font-size:14px;color:#243149}.dm-card p{margin:3px 0 0;color:#8793a4;font-size:9px}.dm-badge{padding:6px 8px;border-radius:999px;font-size:8px;font-weight:900}.dm-badge.on{background:#eaf8f2;color:#187d5d}.dm-badge.off{background:#f1f3f6;color:#7e8998}.dm-badge.busy{background:#fff0e8;color:#b35a22}.dm-info{display:flex;justify-content:space-between;gap:10px;padding:13px 0;margin-top:12px;border-top:1px solid #edf0f4;border-bottom:1px solid #edf0f4;font-size:9px}.dm-info span{color:#8b96a6}.dm-info b{color:#37455a}.dm-note{margin-top:10px;padding:9px 10px;border-radius:10px;background:#f7f9fb;color:#6e7a8c;font-size:9px}.dm-keyholder{margin-top:10px;padding:11px;border-radius:12px;background:#fff7f1;border:1px solid #f7e3d6}.dm-keyholder small{display:block;font-size:7px;font-weight:900;letter-spacing:.1em;color:#f26a21}.dm-keyholder b{display:block;margin-top:3px;font-size:11px}.dm-keyholder span{display:block;margin-top:3px;font-size:8px;color:#7e8998}.dm-keyholder div{display:flex;gap:7px;margin-top:8px}.dm-keyholder a,.dm-photo-links a{font-size:8px;font-weight:900;color:#4265ae;text-decoration:none}.dm-log-actions{display:flex;gap:7px;align-items:center}.dm-log-actions a,.dm-log-actions button{height:30px;padding:0 9px;border-radius:9px;border:1px solid #dfe5ed;background:#fff;color:#4265ae;text-decoration:none;font-size:8px;font-weight:900;display:inline-flex;align-items:center}.dm-log-actions button{cursor:pointer}.dm-ops{margin-top:18px}.dm-section-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.dm-section-head small{display:block;font-size:8px;letter-spacing:.12em;color:#f26a21;font-weight:900}.dm-section-head h3{margin:3px 0 0}.dm-section-head>span{font-size:9px;color:#8793a4}.dm-op-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dm-op-card{background:#fff;border:1px solid #e2e7ef;border-radius:18px;padding:15px}.dm-op-card h4{margin:0 0 8px;font-size:12px}.dm-op-card>p{font-size:9px;color:#8a95a5}.dm-log-row{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #edf0f4}.dm-log-row:first-of-type{border-top:0}.dm-log-row b,.dm-log-row span{display:block}.dm-log-row b{font-size:9px}.dm-log-row span{margin-top:2px;font-size:8px;color:#8a95a5}.dm-photo-links{display:flex;gap:7px;align-items:center}.dm-actions{margin-top:12px}.dm-actions button{width:100%;height:38px;border:1px solid #dfe4eb;border-radius:11px;background:#fff;color:#314057;font-size:10px;font-weight:900}.dm-empty,.dm-loading,.dm-error{padding:38px;border:1px dashed #d8dee7;border-radius:19px;background:#fff;text-align:center;color:#7e8999}.dm-error{color:#b13f4a}
    .dm-modal{position:fixed;inset:0;z-index:650;display:grid;place-items:center;padding:16px;background:rgba(7,13,23,.62);backdrop-filter:blur(7px)}.dm-dialog{width:min(560px,100%);max-height:92dvh;overflow:auto;background:#f7f9fb;border-radius:23px;box-shadow:0 28px 90px rgba(0,0,0,.30)}.dm-head{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;background:#fff;border-bottom:1px solid #e6eaf0}.dm-head small{font-size:8px;letter-spacing:.12em;font-weight:900;color:#f26a21}.dm-head h3{margin:3px 0 0;font-size:17px}.dm-head button{width:38px;height:38px;border:0;border-radius:50%;background:#f1f3f6;font-size:20px}.dm-form{padding:18px}.dm-form label{display:block;margin-bottom:12px;font-size:10px;font-weight:800;color:#5e6a7c}.dm-form label small{font-weight:500;color:#9aa4b1}.dm-form input,.dm-form select,.dm-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #d9dfe8;border-radius:12px;background:#fff;padding:11px 12px;font-size:12px;color:#25334a;outline:none}.dm-form textarea{min-height:80px;resize:vertical}.dm-switch{display:flex!important;align-items:center;gap:8px}.dm-switch input{width:18px!important;margin:0!important}.dm-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}.dm-dialog-actions button{height:41px;padding:0 14px;border-radius:11px;font-size:10px;font-weight:900}.dm-dialog-actions .ghost{border:1px solid #dce2ea;background:#fff;color:#3a485c}.dm-dialog-actions .primary{border:0;background:#f26a21;color:#fff}.dm-detail-dialog{width:min(760px,100%)}.dm-detail-body{padding:18px}.dm-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.dm-detail-grid>div{padding:11px 12px;border-radius:12px;background:#fff;border:1px solid #e4e9f0}.dm-detail-grid small{display:block;color:#8995a6;font-size:8px}.dm-detail-grid b{display:block;margin-top:4px;color:#26354a;font-size:10px}.dm-notes{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.dm-notes>div{padding:11px 12px;border-radius:12px;background:#fff8f3;border:1px solid #f4e4d8}.dm-notes small{font-size:8px;color:#9a6a45;font-weight:900}.dm-notes p{margin:5px 0 0;color:#6f5a4b;font-size:9px;line-height:1.5}.dm-photo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.dm-photo-grid a{display:block;text-decoration:none;border:1px solid #dfe5ed;border-radius:14px;overflow:hidden;background:#fff}.dm-photo-grid span{display:block;padding:9px 10px;color:#33445b;font-size:9px;font-weight:900}.dm-photo-grid img{display:block;width:100%;height:220px;object-fit:cover;background:#eef2f6}
    @media(max-width:1000px){.dm-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-op-grid{grid-template-columns:1fr}}@media(max-width:700px){.dm-hero{align-items:flex-start;flex-direction:column}.dm-hero-actions{width:100%}.dm-hero-actions>*{flex:1;justify-content:center}.dm-stats{grid-template-columns:1fr 1fr}.dm-grid{grid-template-columns:1fr}.dm-detail-grid,.dm-notes,.dm-photo-grid{grid-template-columns:1fr}.dm-photo-grid img{height:190px}}
    `;document.head.appendChild(s);
  }

  document.addEventListener('click',async e=>{
    const d=e.target.closest('[data-driver-master]');
    const v=e.target.closest('[data-vehicle-master]');
    if(d){e.preventDefault();e.stopPropagation();open('drivers');return}
    if(v){e.preventDefault();e.stopPropagation();open('vehicles');return}
    if(active&&e.target.closest('.v5-nav button')&&!d&&!v){active='';modal=null;return}
    if(!active)return;
    const b=e.target.closest('[data-dm-action]');if(!b)return;
    const a=b.dataset.dmAction;
    if(a==='close'){modal=null;render();return}
    if(a==='new-driver'){modal={type:'driver'};render();return}
    if(a==='new-vehicle'){modal={type:'vehicle'};render();return}
    if(a==='edit-driver'){modal={type:'driver',id:b.dataset.id};render();return}
    if(a==='edit-vehicle'){modal={type:'vehicle',id:b.dataset.id};render();return}
    if(a==='detail-shift'){modal={type:'shift-detail',index:Number(b.dataset.index)};render();return}
    if(a==='detail-fuel'){modal={type:'fuel-detail',index:Number(b.dataset.index)};render();return}
  },true);

  document.addEventListener('submit',async e=>{
    if(!active)return;
    const f=e.target.closest('[data-dm-form]');if(!f)return;
    e.preventDefault();
    const btn=f.querySelector('[type="submit"]');if(btn)btn.disabled=true;
    try{
      if(f.dataset.dmForm==='driver')await saveDriver(f);else await saveVehicle(f);
      await load();modal=null;render();
    }catch(err){alert(err.message)}finally{if(btn)btn.disabled=false}
  },true);

  function boot(){
    injectCss();navInject();
    let q=false;
    new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;navInject();if(active)setNav()})})
      .observe(document.querySelector('#app')||document.body,{subtree:true,childList:true});
  }
  if(document.documentElement.dataset.cmsReady==='1')boot();
  else window.addEventListener('rentcam:cms-ready',boot,{once:true});
})();