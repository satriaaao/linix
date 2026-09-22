/* Rentcam public order + delivery tracking */
(function(){
  'use strict';

  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const PATH='/cek-order';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=v=>{
    if(!v)return '-';
    try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(String(v).length===10?v+'T00:00:00':v))}
    catch(_){return String(v)}
  };
  const fmtDateTime=v=>{
    if(!v)return '-';
    try{return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}
    catch(_){return String(v)}
  };

  const orderStatus={
    new:'Pesanan masuk',
    requested:'Menunggu konfirmasi',
    approved:'Disetujui',
    confirmed:'Dikonfirmasi',
    active:'Sedang berjalan',
    ongoing:'Sedang disewa',
    completed:'Selesai',
    cancelled:'Dibatalkan'
  };
  const paymentStatus={
    paid:'Lunas',lunas:'Lunas',
    unpaid:'Belum bayar','belum bayar':'Belum bayar','belum_bayar':'Belum bayar',
    partial:'Cicilan',cicilan:'Cicilan'
  };
  const tripStatus={
    pending:'Menunggu driver',
    waiting:'Menunggu driver',
    waiting_driver:'Menunggu driver',
    assigned:'Driver ditugaskan',
    to_pickup:'Menuju lokasi jemput',
    picked_up:'Barang sudah diambil',
    on_the_way:'Dalam perjalanan',
    arrived:'Driver sudah tiba',
    completed:'Selesai',
    cancelled:'Dibatalkan'
  };
  const tripRank={
    waiting:0,waiting_driver:0,
    assigned:1,
    to_pickup:2,
    picked_up:3,
    on_the_way:4,
    arrived:5,
    completed:6
  };

  function label(map,v,fallback='-'){
    const key=String(v||'').trim().toLowerCase();
    return map[key]||v||fallback;
  }

  function style(){
    if(document.getElementById('rentcam-public-track-style'))return;
    const st=document.createElement('style');
    st.id='rentcam-public-track-style';
    st.textContent=`
      #app .track-page{padding:38px 0 70px;background:#fff;min-height:72vh}
      #app .track-shell{max-width:760px;margin:0 auto}
      #app .track-head{margin-bottom:22px}
      #app .track-head small{display:block;color:#f26a21;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;margin-bottom:7px}
      #app .track-head h1{font-size:34px;line-height:1.08;margin:0 0 9px;color:#111}
      #app .track-head p{margin:0;color:#68717e;font-size:14px;line-height:1.55}
      #app .track-search{display:flex;gap:9px;padding:10px;background:#f5f6f8;border:1px solid #e6e8eb;border-radius:17px;margin:22px 0}
      #app .track-search input{flex:1;min-width:0;height:48px;border:1px solid #dfe2e6;border-radius:12px;background:#fff;padding:0 15px;font-size:16px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;outline:none}
      #app .track-search input:focus{border-color:#111}
      #app .track-search button{height:48px;border:0;border-radius:12px;background:#111;color:#fff;padding:0 20px;font-weight:850;font-size:13px;white-space:nowrap}
      #app .track-hint{font-size:11px;color:#8a919b;margin-top:-12px;margin-bottom:19px}
      #app .track-loading,#app .track-empty,#app .track-error{border:1px solid #e5e7eb;border-radius:17px;padding:22px;text-align:center;color:#68717e;background:#fff}
      #app .track-page,#app .track-shell,#app .track-result{min-width:0;max-width:100%}
      #app .track-page{overflow-x:hidden}
      #app .track-result{display:grid;gap:14px;width:100%;min-width:0}
      #app .track-card{min-width:0;max-width:100%;width:100%;overflow:hidden;border:1px solid #e5e7eb;border-radius:18px;background:#fff;padding:18px;box-shadow:0 7px 22px rgba(18,27,40,.04)}
      #app .track-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:15px}
      #app .track-card-head h2{margin:0;font-size:18px;color:#111}
      #app .track-card-head p{margin:4px 0 0;color:#818895;font-size:11px}
      #app .track-badge{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#eef8f3;color:#167653;font-size:10px;font-weight:900;white-space:nowrap}
      #app .track-badge.cancel{background:#fff0f0;color:#b3261e}
      #app .track-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      #app .track-info{padding:12px;background:#f7f8fa;border-radius:12px}
      #app .track-info span{display:block;color:#8a919b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
      #app .track-info b{display:block;color:#17191c;font-size:13px;line-height:1.35;overflow-wrap:anywhere}
      #app .track-products{min-width:0;max-width:100%;width:100%;margin-top:14px;border:1px solid #e6e9ed;border-radius:14px;overflow:hidden;background:#fff}
      #app .track-products-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px;background:#f7f8fa;border-bottom:1px solid #e6e9ed}
      #app .track-products-head h3{margin:0;font-size:13px;color:#17191c}
      #app .track-products-head span{font-size:9px;font-weight:850;color:#7d8591}
      #app .track-products-scroll{display:block;width:100%;max-width:100%;min-width:0;overflow-x:auto!important;overflow-y:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-x pan-y;scrollbar-width:thin;position:relative}
      #app .track-products-table{width:max-content;min-width:560px;max-width:none;border-collapse:collapse;table-layout:auto}
      #app .track-products-table th{padding:9px 11px;text-align:left;background:#fbfcfd;color:#8a919b;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #eceff2;white-space:nowrap}
      #app .track-products-table td{padding:11px;border-bottom:1px solid #edf0f3;color:#2a3038;font-size:10px;vertical-align:middle}
      #app .track-products-table tbody tr:last-child td{border-bottom:0}
      #app .track-products-table td:first-child{font-weight:850;color:#15181c;width:260px;min-width:260px;max-width:260px;white-space:normal;overflow-wrap:anywhere}
      #app .track-products-table td:not(:first-child){white-space:nowrap}
      #app .track-products-table .num{text-align:right}
      #app .track-trip-note{margin-top:12px;padding:10px 11px;border-radius:11px;background:#f8fafc;color:#77808c;font-size:9px;line-height:1.5}
      #app .track-card.trip-card{border-color:#e2e7ec}
      #app .track-card.trip-card.delivery{box-shadow:inset 3px 0 0 #f26a21,0 7px 22px rgba(18,27,40,.04)}
      #app .track-card.trip-card.collect{box-shadow:inset 3px 0 0 #2f6fe5,0 7px 22px rgba(18,27,40,.04)}

      #app .track-timeline{display:grid;gap:0;margin-top:4px}
      #app .track-step{display:grid;grid-template-columns:28px 1fr;gap:10px;min-height:50px;position:relative}
      #app .track-step:before{content:'';position:absolute;left:13px;top:25px;bottom:-4px;width:2px;background:#e6e8eb}
      #app .track-step:last-child:before{display:none}
      #app .track-dot{width:28px;height:28px;border-radius:50%;background:#f0f2f5;border:2px solid #d9dde2;display:grid;place-items:center;color:#929aa5;font-size:11px;font-weight:900;z-index:1}
      #app .track-step.done .track-dot{background:#111;border-color:#111;color:#fff}
      #app .track-step.current .track-dot{background:#f26a21;border-color:#f26a21;color:#fff;box-shadow:0 0 0 5px rgba(242,106,33,.11)}
      #app .track-step.done:before{background:#111}
      #app .track-step-body{padding:4px 0 14px}
      #app .track-step-body b{display:block;font-size:12px;color:#17191c}
      #app .track-step-body small{display:block;color:#8a919b;margin-top:3px;font-size:10px}
      #app .track-driver{display:flex;gap:10px;align-items:center;padding:13px;border-radius:13px;background:#111;color:#fff;margin-top:14px}
      #app .track-driver-icon{width:38px;height:38px;border-radius:11px;background:#fff1e9;color:#f26a21;display:grid;place-items:center;font-size:18px}
      #app .track-driver b{display:block;font-size:13px}
      #app .track-driver small{display:block;color:#aeb4bd;font-size:10px;margin-top:3px}
      #app .track-back{display:inline-flex;align-items:center;gap:6px;border:0;background:none;padding:0;margin-bottom:18px;color:#626a76;font-size:11px;font-weight:800;cursor:pointer}
      #drawer .drawer-link[data-track-menu]{display:flex!important}
      .header .nav [data-track-desktop]{display:inline-flex!important;align-items:center;gap:7px;min-height:38px;padding:0 12px!important;border-radius:11px;background:#111;color:#fff!important;font-size:12px!important;font-weight:850!important;text-decoration:none!important;white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.08);transition:transform .16s ease,background .16s ease}
      .header .nav [data-track-desktop]:hover{background:#f26a21!important;transform:translateY(-1px)}
      .header .nav [data-track-desktop] svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      @media(max-width:900px){.header .nav [data-track-desktop]{display:none!important}}
      @media(max-width:620px){
        #app .track-page{padding:24px 0 54px}
        #app .track-shell{padding:0 18px}
        #app .track-head h1{font-size:27px}
        #app .track-search{gap:7px;padding:7px;border-radius:14px}
        #app .track-search input{height:45px;font-size:15px;padding:0 12px}
        #app .track-search button{height:45px;padding:0 14px}
        #app .track-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;min-width:0;width:100%}
        #app .track-info{min-width:0;overflow:hidden}
        #app .track-info b{font-size:12px;overflow-wrap:anywhere}
        #app .track-card{padding:15px;border-radius:16px}
        #app .track-card-head{flex-direction:column}
        #app .track-products{border-radius:12px}
        #app .track-products-head{padding:10px 11px}
        #app .track-products-head:after{content:"Geser →";font-size:8px;font-weight:900;color:#f26a21;margin-left:auto}
        #app .track-products-head>span{display:none}
        #app .track-products-scroll{width:100%;max-width:100%;overflow-x:auto!important;touch-action:pan-x pan-y}
        #app .track-products-table{width:560px;min-width:560px}
        #app .track-products-table th{padding:8px 9px}
        #app .track-products-table td{padding:10px 9px;font-size:9.5px}

      }
    `;
    document.head.appendChild(st);
  }

  function menuMarkup(){
    return `<a class="drawer-link" data-go="${PATH}" data-track-menu>
      <span class="drawer-link-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4M16 15l2 2 3-4"/>
        </svg>
      </span>
      <span><b>Cek Order / Antar Jemput</b><small>Pakai nomor order</small></span>
      <svg class="drawer-arrow" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
    </a>`;
  }

  function desktopMenuMarkup(){
    return `<a data-go="${PATH}" data-track-desktop>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4M16 15l2 2 3-4"/>
      </svg>
      <span>Cek Order / Antar Jemput</span>
    </a>`;
  }

  function ensureDesktopMenu(){
    const nav=document.querySelector('.header .nav');
    if(!nav||nav.querySelector('[data-track-desktop]'))return;
    nav.insertAdjacentHTML('beforeend',desktopMenuMarkup());
  }

  function ensureMenu(){
    const nav=document.querySelector('#drawer .rc-drawer-nav');
    if(!nav||nav.querySelector('[data-track-menu]'))return;
    const cart=nav.querySelector('[data-go="/cart"]');
    if(cart)cart.insertAdjacentHTML('beforebegin',menuMarkup());
    else nav.insertAdjacentHTML('beforeend',menuMarkup());
  }

  function pageMarkup(){
    return `<section class="track-page">
      <div class="container track-shell">
        <button class="track-back" type="button" data-go="/">← Kembali</button>
        <div class="track-head">
          <small>Customer Tracking</small>
          <h1>Cek Order & Antar Jemput</h1>
          <p>Masukkan nomor order. Nomor ini sama dengan nomor antar/jemput.</p>
        </div>
        <form class="track-search" id="rentcamTrackForm">
          <input id="rentcamTrackCode" name="code" inputmode="text" autocomplete="off" maxlength="40" placeholder="CONTOH: RC-XXXXXXXXXXXX" aria-label="Nomor order">
          <button type="submit">Cek Status</button>
        </form>
        <div class="track-hint">Gunakan nomor order yang sama dengan nomor antar/jemput.</div>
        <div id="rentcamTrackResult" class="track-empty">Masukkan nomor order untuk mulai mengecek.</div>
      </div>
    </section>`;
  }

  function money(v){
    return 'Rp'+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(Number(v)||0);
  }

  function productsTable(items){
    const list=Array.isArray(items)?items:[];
    if(!list.length)return '';
    const rows=list.map((x,i)=>{
      const qty=Math.max(1,Number(x?.quantity||x?.qty||1));
      const days=Math.max(1,Number(x?.days||1));
      const price=Number(x?.price_per_day||x?.price||0);
      const total=Number(x?.amount||price*qty*days);
      return `<tr>
        <td>${esc(x?.name||x?.product_name||x?.id||('Produk '+(i+1)))}</td>
        <td>${qty}</td>
        <td>${days} hari</td>
        <td class="num">${esc(money(price))}</td>
        <td class="num"><b>${esc(money(total))}</b></td>
      </tr>`;
    }).join('');
    return `<div class="track-products">
      <div class="track-products-head"><h3>Daftar Produk</h3><span>${list.length} produk</span></div>
      <div class="track-products-scroll">
        <table class="track-products-table">
          <thead><tr><th>Produk</th><th>Qty</th><th>Durasi</th><th class="num">Harga / Hari</th><th class="num">Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  function tripCard(kind,trip,delivery,orderNumber){
    const isCollect=kind==='collect';
    const title=isCollect?'Status Penjemputan':'Status Pengantaran';
    const fallbackStatus=isCollect?delivery?.collect_status:delivery?.deliver_status;
    const t=trip&&typeof trip==='object'?trip:{};
    const status=String(t.status||fallbackStatus||'pending').toLowerCase();
    const merged={...delivery,...t,status};
    const driver=(t.driver_name||t.plate)?`<div class="track-driver">
      <div class="track-driver-icon">🚚</div>
      <div><b>${esc(t.driver_name||'Driver ditugaskan')}</b><small>${t.plate?'Kendaraan '+esc(t.plate):'Driver sudah ditugaskan'}</small></div>
    </div>`:'';
    const schedule=t.scheduled_at?`<div class="track-trip-note">Jadwal: <b>${esc(fmtDateTime(t.scheduled_at))}</b></div>`:'';
    return `<div class="track-card trip-card ${isCollect?'collect':'delivery'}">
      <div class="track-card-head">
        <div><h2>${title}</h2><p>No. Order / Antar Jemput: <b>${esc(orderNumber||'-')}</b></p></div>
        <span class="track-badge">${esc(label(tripStatus,status,'Menunggu driver'))}</span>
      </div>
      ${t.queue_position?`<div class="track-info" style="margin-bottom:13px"><span>Antrean Driver</span><b>Urutan #${esc(t.queue_position)}</b></div>`:''}
      ${schedule}
      ${stages(merged)}
      ${driver}
    </div>`;
  }

  function stages(delivery){
    const raw=String(delivery?.status||delivery?.deliver_status||delivery?.collect_status||'waiting').toLowerCase();
    const currentRank=tripRank[raw]??0;
    const cancelled=raw==='cancelled';
    const list=[
      ['waiting','Menunggu driver'],
      ['assigned','Driver ditugaskan'],
      ['to_pickup','Menuju lokasi jemput'],
      ['picked_up','Barang sudah diambil'],
      ['on_the_way','Dalam perjalanan'],
      ['arrived','Driver sudah tiba'],
      ['completed','Selesai']
    ];
    if(cancelled)return `<div class="track-error">Antar-jemput dibatalkan.</div>`;
    return `<div class="track-timeline">${list.map(([key,name])=>{
      const rank=tripRank[key]??0;
      const cls=rank<currentRank?'done':rank===currentRank?'current':'';
      const detail=rank===currentRank?(delivery?.updated_at?'Update '+fmtDateTime(delivery.updated_at):'Status saat ini'):'';
      return `<div class="track-step ${cls}">
        <div class="track-dot">${rank<currentRank?'✓':rank+1}</div>
        <div class="track-step-body"><b>${name}</b>${detail?`<small>${esc(detail)}</small>`:''}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function resultMarkup(data){
    const o=data.order||{},d=data.delivery||{},trips=data.trips||{};
    const orderState=o.rental_status||o.status||'new';
    const cancelled=String(orderState).toLowerCase()==='cancelled';
    const items=Array.isArray(o.items)?o.items:[];
    const deliveryMode=String(d.mode||'').toLowerCase();
    const returnMode=String(d.return_mode||'').toLowerCase();
    const hasDelivery=deliveryMode==='delivery';
    const hasCollect=returnMode==='collect';

    let tripCards='';
    if(hasDelivery)tripCards+=tripCard('deliver',trips.deliver,d,o.order_number);
    if(hasCollect)tripCards+=tripCard('collect',trips.collect,d,o.order_number);

    return `<div class="track-result">
      <div class="track-card">
        <div class="track-card-head">
          <div><h2>Order ${esc(o.order_number||'-')}</h2><p>${o.customer_name?'Atas nama '+esc(o.customer_name):'Status pesanan rental'}</p></div>
          <span class="track-badge ${cancelled?'cancel':''}">${esc(label(orderStatus,orderState))}</span>
        </div>
        <div class="track-grid">
          <div class="track-info"><span>Mulai Rental</span><b>${esc(fmtDate(o.start_date))}</b></div>
          <div class="track-info"><span>Selesai Rental</span><b>${esc(fmtDate(o.end_date))}</b></div>
          <div class="track-info"><span>Status Order</span><b>${esc(label(orderStatus,o.status))}</b></div>
          <div class="track-info"><span>Pembayaran</span><b>${esc(label(paymentStatus,o.payment_status,'Belum ada status'))}</b></div>
        </div>
        ${productsTable(items)}
      </div>
      ${tripCards}
    </div>`;
  }

  async function lookup(code){
    const result=document.getElementById('rentcamTrackResult');
    if(!result)return;
    const normalized=String(code||'').trim().toUpperCase();
    if(!/^[A-Z0-9-]{5,40}$/.test(normalized)){
      result.className='track-error';
      result.textContent='Nomor order tidak valid. Gunakan nomor order seperti RC-XXXXXXXXXXXX.';
      return;
    }

    result.className='track-loading';
    result.textContent='Mengecek status pesanan…';

    try{
      const r=await fetch(SB+'/rest/v1/rpc/rentcam_public_track_order',{
        method:'POST',
        headers:{apikey:KEY,'Content-Type':'application/json'},
        body:JSON.stringify({p_code:normalized})
      });
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();
      if(!data?.found){
        result.className='track-error';
        result.textContent='Nomor order tidak ditemukan. Pastikan nomor order sudah benar.';
        return;
      }
      result.className='';
      result.innerHTML=resultMarkup(data);
      try{
        const u=new URL(location.href);
        u.searchParams.set('code',normalized);
        history.replaceState({},'',u.pathname+u.search);
      }catch(_){}
    }catch(err){
      console.warn('Rentcam tracking',err);
      result.className='track-error';
      result.textContent='Status belum bisa dimuat. Coba lagi beberapa saat.';
    }
  }

  function bindPage(){
    const form=document.getElementById('rentcamTrackForm');
    if(!form||form.dataset.bound==='1')return;
    form.dataset.bound='1';
    const input=document.getElementById('rentcamTrackCode');
    input?.addEventListener('input',()=>{input.value=input.value.toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,40)});
    form.addEventListener('submit',e=>{e.preventDefault();lookup(input?.value||'')});
    const code=new URLSearchParams(location.search).get('code');
    if(code&&input){input.value=code.toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,40);lookup(input.value)}
  }

  function renderTracking(){
    if(location.pathname!==PATH)return false;
    const app=document.getElementById('app');
    if(!app)return false;
    if(app.dataset.trackPage!=='1'){
      app.dataset.trackPage='1';
      app.innerHTML=pageMarkup();
      scrollTo(0,0);
    }
    bindPage();
    return true;
  }

  function sync(){
    style();
    ensureMenu();
    ensureDesktopMenu();
    const app=document.getElementById('app');
    if(location.pathname!==PATH&&app?.dataset.trackPage==='1')delete app.dataset.trackPage;
    renderTracking();
  }

  const nativeGo=window.go;
  if(typeof nativeGo==='function'){
    window.go=function(path){
      nativeGo(path);
      setTimeout(sync,0);
    };
  }

  const nativeRender=window.render;
  if(typeof nativeRender==='function'){
    window.render=function(){
      nativeRender();
      setTimeout(sync,0);
    };
  }

  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-track-menu]');
    if(!link)return;
    setTimeout(sync,0);
  },true);

  addEventListener('popstate',()=>setTimeout(sync,0));
  document.addEventListener('rentcam-route-change',()=>setTimeout(sync,0));

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;sync()});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);
  else sync();
})();