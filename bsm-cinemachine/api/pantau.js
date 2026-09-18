const SB='https://xleceiffuopioeguniwj.supabase.co';
const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';

module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  const html=String.raw`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0f1724">
<meta name="robots" content="noindex,nofollow">
<title>Pantau Antar–Jemput | Rentcam</title>
<style>
*{box-sizing:border-box}html,body{margin:0;background:#f3f5f8;color:#162033;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{min-height:100vh;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.wrap{width:min(760px,100%);margin:auto;padding:18px}
.hero{background:linear-gradient(145deg,#111b2a,#19283e);color:#fff;border-radius:25px;padding:24px;box-shadow:0 18px 45px rgba(13,25,43,.16)}
.brand{display:flex;align-items:center;gap:10px;font-weight:900;font-size:17px}.mark{width:38px;height:38px;border-radius:12px;background:#f26a21;display:grid;place-items:center}.hero h1{font-size:28px;letter-spacing:-.04em;margin:23px 0 6px}.hero p{margin:0;color:#aeb9c9;font-size:13px;line-height:1.55}
.card{background:#fff;border:1px solid #e1e6ee;border-radius:22px;padding:20px;margin-top:14px;box-shadow:0 7px 24px rgba(25,39,58,.05)}
.top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.ey{font-size:9px;font-weight:900;letter-spacing:.13em;color:#f26a21}.order{font-size:19px;font-weight:900;margin:5px 0 2px}.customer{font-size:11px;color:#7c8899}
.status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:8px 11px;background:#fff7e8;color:#9d6d17;font-size:10px;font-weight:900;white-space:nowrap}.status i{width:8px;height:8px;border-radius:50%;background:#e0a126}.status.moving{background:#eef4ff;color:#4768b2}.status.moving i{background:#4d74d6}.status.done{background:#eaf8f2;color:#187d5d}.status.done i{background:#1ea77b}.status.cancelled{background:#fff0f1;color:#a94a55}.status.cancelled i{background:#d65d68}
.route{display:grid;grid-template-columns:24px 1fr;gap:9px;padding:16px;background:#f7f9fc;border-radius:17px;margin:18px 0}.line{display:grid;grid-template-rows:12px 1fr 12px;justify-items:center;min-height:90px}.dot{width:10px;height:10px;border-radius:50%;background:#f26a21;box-shadow:0 0 0 3px #fff,0 0 0 5px rgba(242,106,33,.25)}.dot.end{background:#2e6fe8;box-shadow:0 0 0 3px #fff,0 0 0 5px rgba(46,111,232,.2)}.rail{width:2px;background:repeating-linear-gradient(to bottom,#b8c2d0 0 4px,transparent 4px 8px)}.routeText{display:flex;flex-direction:column;justify-content:space-between;gap:18px}.routeText small{font-size:8px;letter-spacing:.11em;font-weight:900;color:#98a2b1}.routeText b{display:block;margin-top:4px;font-size:12px;line-height:1.45;color:#33445b}
.driver{display:flex;align-items:center;gap:11px;padding:14px 0;border-top:1px solid #edf0f4;border-bottom:1px solid #edf0f4}.avatar{width:44px;height:44px;border-radius:50%;background:#17243a;color:#fff;display:grid;place-items:center;font-weight:900;font-size:17px}.driverText{min-width:0;flex:1}.driverText b{display:block;font-size:13px}.driverText small{display:block;color:#8793a4;margin-top:3px;font-size:10px}.wa,.map{height:40px;padding:0 13px;border-radius:12px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}.wa{background:#eaf8f1;color:#15845b}.map{background:#eef4ff;color:#3c62b3}
.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.meta span{padding:8px 10px;border:1px solid #e8ecf2;background:#f8f9fb;border-radius:11px;color:#657187;font-size:9px}
.live{display:flex;align-items:center;gap:10px;margin-top:13px;padding:12px;background:#f0f8f5;border-radius:14px}.pulse{width:9px;height:9px;border-radius:50%;background:#19a575;box-shadow:0 0 0 4px rgba(25,165,117,.13)}.live div{flex:1}.live b,.live small{display:block}.live b{font-size:10px}.live small{font-size:8px;color:#7f8d86;margin-top:2px}
.timeline{display:grid;gap:10px;margin-top:14px}.step{display:flex;gap:10px;align-items:center;color:#98a1ae;font-size:10px}.step i{width:10px;height:10px;border-radius:50%;background:#d9dee6}.step.on{color:#34445b;font-weight:800}.step.on i{background:#f26a21;box-shadow:0 0 0 4px rgba(242,106,33,.1)}
.note{padding:12px 13px;background:#fff8f3;color:#795d4d;border-radius:13px;font-size:10px;line-height:1.55;margin-top:13px}
.loading,.error{background:#fff;border:1px solid #e0e6ee;border-radius:22px;padding:34px;text-align:center;color:#7f8a9a;margin-top:14px}.error{color:#a63b45}.refresh{margin:14px auto 2px;display:block;border:0;background:transparent;color:#758297;font-size:10px}.foot{text-align:center;color:#9aa4b2;font-size:9px;padding:18px 0 8px}
@media(max-width:520px){.wrap{padding:12px}.hero{padding:20px;border-radius:21px}.hero h1{font-size:24px}.card{padding:16px;border-radius:19px}.top{flex-direction:column}.status{align-self:flex-start}}
</style>
</head>
<body>
<div class="wrap">
  <section class="hero">
    <div class="brand"><span class="mark">R</span> Rentcam</div>
    <h1>Pantau Antar–Jemput</h1>
    <p>Status perjalanan rental Anda diperbarui dari dashboard operasional Rentcam.</p>
  </section>
  <main id="app"><div class="loading">Memuat status perjalanan…</div></main>
  <button class="refresh" id="refresh">Perbarui sekarang</button>
  <div class="foot">Halaman pantau bersifat pribadi. Jangan bagikan link ini ke orang lain.</div>
</div>
<script>
const SB='https://xleceiffuopioeguniwj.supabase.co';
const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
const token=new URLSearchParams(location.search).get('token')||'';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return 'Belum dijadwalkan';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})};
const clean=v=>String(v||'').replace(/\\D/g,'').replace(/^0/,'62');
const labels={waiting:'Mencari driver',assigned:'Driver ditugaskan',to_pickup:'Menuju lokasi jemput',picked_up:'Barang sudah diambil',on_the_way:'Dalam perjalanan',arrived:'Sudah tiba',completed:'Selesai',cancelled:'Dibatalkan'};
const steps=['waiting','assigned','to_pickup','picked_up','on_the_way','arrived','completed'];
function kindStatus(d,kind){let s=d?.[kind+'_trip_status']||'';if(!s&&d?.[kind+'_status']==='completed')s='completed';if(!s&&d?.driver)s='assigned';return s||'waiting'}
function statusClass(s){if(s==='completed')return'done';if(s==='cancelled')return'cancelled';if(['to_pickup','picked_up','on_the_way','arrived'].includes(s))return'moving';return''}
function trip(data,kind){
 const d=data.delivery||{},deliver=kind==='deliver';
 const status=kindStatus(d,kind),idx=steps.indexOf(status);
 const origin=deliver?(d.origin||'Rentcam'):(d.address||'Lokasi customer');
 const dest=deliver?(d.address||'Lokasi customer'):(d.return_address||'Rentcam');
 const time=d[deliver?'deliver_at':'collect_at'];
 const distance=Number(d[kind+'_distance_km']||0),fee=Number(d[kind+'_fee']||0);
 const loc=d[kind+'_driver_location']||null;
 const phone=clean(d.driver_phone);
 return '<section class="card">'+
  '<div class="top"><div><div class="ey">'+(deliver?'ANTAR KE CUSTOMER':'JEMPUT KEMBALI')+'</div><div class="order">'+E(data.order_number||'-')+'</div><div class="customer">'+E(data.customer_name||'Customer')+'</div></div><span class="status '+statusClass(status)+'"><i></i>'+E(labels[status]||status)+'</span></div>'+
  '<div class="route"><div class="line"><span class="dot"></span><span class="rail"></span><span class="dot end"></span></div><div class="routeText"><div><small>DARI</small><b>'+E(origin)+'</b></div><div><small>TUJUAN</small><b>'+E(dest)+'</b></div></div></div>'+
  '<div class="driver"><div class="avatar">'+E((d.driver||'?').slice(0,1).toUpperCase())+'</div><div class="driverText"><b>'+E(d.driver||'Belum ada driver')+'</b><small>'+E([d.vehicle,d.plate].filter(Boolean).join(' · ')||'Petugas antar–jemput')+'</small></div>'+(phone?'<a class="wa" href="https://wa.me/'+E(phone)+'" target="_blank" rel="noopener">WhatsApp</a>':'')+'</div>'+
  '<div class="meta"><span>🕐 '+E(fmt(time))+'</span><span>📍 '+(distance?E(distance)+' km':'Jarak belum tersedia')+'</span><span>💳 '+(fee?'Rp'+Number(fee).toLocaleString('id-ID'):'Biaya belum tersedia')+'</span></div>'+
  (loc?'<div class="live"><span class="pulse"></span><div><b>Lokasi driver terakhir</b><small>'+E(fmt(loc.updated_at))+'</small></div><a class="map" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(loc.lat+','+loc.lng)+'" target="_blank" rel="noopener">Lihat peta</a></div>':'')+
  '<div class="timeline">'+steps.map((x,i)=>'<div class="step '+(i<=idx?'on':'')+'"><i></i><span>'+E(labels[x])+'</span></div>').join('')+'</div>'+
  (d[kind+'_note']?'<div class="note">'+E(d[kind+'_note'])+'</div>':'')+
 '</section>';
}
async function load(){
 const app=document.getElementById('app');
 if(!token){app.innerHTML='<div class="error">Link pantau tidak valid.</div>';return}
 try{
  const r=await fetch(SB+'/rest/v1/rpc/rentcam_customer_tracking',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_token:token}),cache:'no-store'});
  const data=await r.json();
  if(!r.ok)throw new Error(data?.message||'Gagal memuat');
  if(!data?.order_number){app.innerHTML='<div class="error">Link pantau tidak ditemukan atau sudah tidak berlaku.</div>';return}
  const d=data.delivery||{},parts=[];
  if(d.deliver_at||d.mode==='delivery')parts.push(trip(data,'deliver'));
  if(d.collect_at||d.return_mode==='collect')parts.push(trip(data,'collect'));
  app.innerHTML=parts.join('')||'<div class="loading">Belum ada jadwal antar–jemput untuk order ini.</div>';
 }catch(e){app.innerHTML='<div class="error">Status belum bisa dimuat. Coba beberapa saat lagi.</div>'}
}
document.getElementById('refresh').onclick=load;
load();setInterval(()=>{if(!document.hidden)load()},10000);
</script>
</body>
</html>`;
  res.statusCode=200;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.setHeader('cache-control','no-store, max-age=0');
  res.setHeader('x-robots-tag','noindex, nofollow');
  if(req.method==='HEAD')return res.end();
  res.end(html);
};