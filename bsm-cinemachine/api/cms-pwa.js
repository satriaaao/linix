const SCRIPT=String.raw`(function(){
'use strict';
if(!location.pathname.startsWith('/cms'))return;

var SB='https://xleceiffuopioeguniwj.supabase.co';
var KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
var PUSH_URL='https://xleceiffuopioeguniwj.supabase.co/functions/v1/rentcam-order-push';
var AUTH='rentcam_cms_auth';
var SEEN='rentcam_cms_last_order_seen_v1';
var NOTIFY='rentcam_cms_notifications_v1';
var PUSHED='rentcam_cms_push_registered_v1';
var POLL_MS=10000;
var pollTimer=null;
var polling=false;
var swReg=null;

function session(){
  try{return JSON.parse(localStorage.getItem(AUTH)||'null')||null}catch(_){return null}
}
function logged(){return !!session()?.access_token}
function token(){return session()?.access_token||''}
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function standalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rp(n){try{return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)}catch(_){return 'Rp'+(Number(n)||0)}}
function notifySupport(){return 'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window}

async function api(path){
  var r=await fetch(SB+path,{headers:{apikey:KEY},cache:'no-store'});
  if(!r.ok)throw new Error('Gagal membaca order');
  return r.json();
}
async function registerSW(){
  if(!('serviceWorker' in navigator))return null;
  try{
    swReg=await navigator.serviceWorker.register('/api/cms-sw',{scope:'/cms'});
    await navigator.serviceWorker.ready;
    return swReg;
  }catch(e){console.warn('CMS service worker gagal',e);return null}
}
function b64ToU8(base64String){
  var padding='='.repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  var rawData=atob(base64);
  var outputArray=new Uint8Array(rawData.length);
  for(var i=0;i<rawData.length;i++)outputArray[i]=rawData.charCodeAt(i);
  return outputArray;
}
async function publicPushKey(){
  var r=await fetch(PUSH_URL,{cache:'no-store'});
  if(!r.ok)throw new Error('Gagal mengambil push key');
  var j=await r.json();
  if(!j?.publicKey)throw new Error('Push key belum tersedia');
  return j.publicKey;
}
async function syncPushSubscription(){
  if(!logged()||!notifySupport()||window.Notification.permission!=='granted')return false;
  var reg=swReg||await registerSW();
  if(!reg||!reg.pushManager)return false;
  var sub=await reg.pushManager.getSubscription();
  if(!sub){
    var publicKey=await publicPushKey();
    sub=await reg.pushManager.subscribe({
      userVisibleOnly:true,
      applicationServerKey:b64ToU8(publicKey)
    });
  }
  var j=sub.toJSON();
  var authToken=token();
  if(!authToken)throw new Error('Sesi admin belum aktif');
  var r=await fetch(SB+'/rest/v1/rpc/rentcam_push_subscribe',{
    method:'POST',
    headers:{
      apikey:KEY,
      Authorization:'Bearer '+authToken,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      p_endpoint:j.endpoint,
      p_p256dh:j.keys?.p256dh||'',
      p_auth:j.keys?.auth||'',
      p_user_agent:navigator.userAgent
    })
  });
  if(!r.ok)throw new Error('Gagal mendaftarkan push iPhone');
  localStorage.setItem(PUSHED,'1');
  return true;
}

function css(){
  if(document.getElementById('cms-pwa-style'))return;
  var s=document.createElement('style');s.id='cms-pwa-style';
  s.textContent='#cmsPwaDock{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:120;display:flex;gap:8px;align-items:center;padding:8px;border:1px solid #dfe5ec;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 14px 40px rgba(17,24,39,.16);backdrop-filter:blur(14px)}#cmsPwaDock button{height:38px;border:0;border-radius:11px;padding:0 12px;font:800 11px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}#cmsPwaInstall{background:#111318;color:#fff}#cmsPwaNotify{background:#f26a21;color:#fff}#cmsPwaNotify.on{background:#16805b}.cmsPwaModal{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:18px;background:rgba(6,12,21,.68);backdrop-filter:blur(8px)}.cmsPwaCard{width:min(430px,100%);background:#fff;border-radius:22px;padding:22px;box-shadow:0 30px 90px rgba(0,0,0,.3)}.cmsPwaCard h3{margin:0 0 8px;font-size:21px}.cmsPwaCard p{margin:0;color:#647184;font-size:13px;line-height:1.6}.cmsPwaSteps{margin:15px 0;padding:13px;border-radius:13px;background:#f5f7fa;color:#344258;font-size:13px;line-height:1.75}.cmsPwaCard button{width:100%;height:43px;border:0;border-radius:12px;background:#111318;color:#fff;font-weight:850}@media(max-width:600px){#cmsPwaDock{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));justify-content:center}#cmsPwaDock button{flex:1}}';
  document.head.appendChild(s);
}
function modal(title,text,steps){
  var old=document.querySelector('.cmsPwaModal');if(old)old.remove();
  var el=document.createElement('div');el.className='cmsPwaModal';
  el.innerHTML='<div class="cmsPwaCard"><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p><div class="cmsPwaSteps">'+steps+'</div><button data-cms-pwa-close>Tutup</button></div>';
  document.body.appendChild(el);
  el.addEventListener('click',function(e){if(e.target===el||e.target.closest('[data-cms-pwa-close]'))el.remove()});
}
function notifyButtonLabel(){
  if(!notifySupport())return 'Notifikasi tidak didukung';
  if(window.Notification.permission==='granted')return '✓ Notifikasi Aktif';
  if(window.Notification.permission==='denied')return 'Notifikasi Diblokir';
  return 'Aktifkan Notifikasi';
}
function ensureDock(){
  if(!document.body)return;
  css();
  var needInstall=!standalone();
  var dock=document.getElementById('cmsPwaDock');
  if(!dock){
    dock=document.createElement('div');dock.id='cmsPwaDock';
    document.body.appendChild(dock);
  }
  dock.innerHTML=(needInstall?'<button id="cmsPwaInstall">Pasang App iPhone</button>':'')+
    '<button id="cmsPwaNotify" class="'+(notifySupport()&&window.Notification.permission==='granted'?'on':'')+'">'+esc(notifyButtonLabel())+'</button>';
  var install=dock.querySelector('#cmsPwaInstall');
  if(install)install.onclick=function(){
    if(isIOS())modal('Pasang Rentcam CMS','Jadikan CMS seperti aplikasi iPhone tanpa App Store.','1. Buka halaman ini di <b>Safari</b><br>2. Tekan tombol <b>Bagikan</b><br>3. Pilih <b>Tambahkan ke Layar Utama</b><br>4. Tekan <b>Tambah</b>');
    else modal('Pasang Rentcam CMS','Pasang CMS sebagai aplikasi dari browser.','Gunakan menu browser lalu pilih <b>Install app</b> / <b>Add to Home Screen</b>.');
  };
  var notifyBtn=dock.querySelector('#cmsPwaNotify');
  if(notifyBtn)notifyBtn.onclick=enableNotifications;
  if(standalone()&&notifySupport()&&window.Notification.permission==='granted'){
    setTimeout(function(){var d=document.getElementById('cmsPwaDock');if(d)d.style.display='none'},1800);
  }
}
async function enableNotifications(){
  if(!notifySupport()){
    modal('Notifikasi belum tersedia','Browser ini belum mendukung notifikasi web app.','Gunakan Safari terbaru dan pasang CMS ke Home Screen.');
    return;
  }
  if(isIOS()&&!standalone()){
    modal('Pasang App dulu','Di iPhone, push notification digunakan melalui web app yang sudah dipasang ke Home Screen.','Safari → <b>Bagikan</b> → <b>Tambahkan ke Layar Utama</b>. Setelah membuka app dari Home Screen, tekan Aktifkan Notifikasi.');
    return;
  }
  if(window.Notification.permission==='denied'){
    modal('Notifikasi diblokir','Izinkan notifikasi Rentcam CMS dari Settings iPhone.','Settings → Notifications → <b>Rentcam CMS</b> → Allow Notifications.');
    return;
  }
  try{
    var p=await window.Notification.requestPermission();
    if(p==='granted'){
      localStorage.setItem(NOTIFY,'1');
      await registerSW();
      var pushed=false;
      try{pushed=await syncPushSubscription()}catch(e){console.warn('background push:',e)}
      await showSystemNotification({order_number:'TEST',customer_name:'Notifikasi order aktif',total:0,items:[]},true);
      modal('Notifikasi aktif',pushed?'Push order baru sudah terhubung ke iPhone.':'Notifikasi aktif, tetapi background push belum terdaftar.','Kalau belum terhubung penuh, tutup lalu buka kembali app CMS dan tekan Aktifkan Notifikasi sekali lagi.');
    }
  }catch(e){console.warn(e)}
  ensureDock();
}
async function showSystemNotification(order,test){
  if(!notifySupport()||window.Notification.permission!=='granted')return;
  var reg=swReg||await navigator.serviceWorker.ready;
  var items=Array.isArray(order.items)?order.items:[];
  var title=test?'Rentcam CMS':'Order Baru • '+String(order.order_number||'Rentcam');
  var body=test?'Notifikasi sudah aktif. Order baru akan muncul di iPhone.':String(order.customer_name||'Customer')+' • '+rp(order.total)+' • '+items.length+' jenis barang';
  var payload={type:'SHOW_ORDER_NOTIFICATION',title:title,body:body,tag:test?'rentcam-test':'rentcam-order-'+String(order.id||order.order_number||Date.now()),url:'/cms'};
  if(navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage(payload);
  else await reg.showNotification(title,{body:body,icon:'/api/cms-icon',badge:'/api/cms-icon',tag:payload.tag,renotify:true,silent:false,data:{url:'/cms'}});
}
async function updateBadge(){
  if(!logged())return;
  try{
    var rows=await api('/rest/v1/rentcam_orders?select=id&status=eq.new&limit=200');
    var n=Array.isArray(rows)?rows.length:0;
    if('setAppBadge' in navigator){if(n)await navigator.setAppBadge(n);else if('clearAppBadge' in navigator)await navigator.clearAppBadge()}
  }catch(_){}
}
async function pollOrders(){
  if(polling||!logged())return;
  polling=true;
  try{
    var rows=await api('/rest/v1/rentcam_orders?select=id,order_number,customer_name,total,status,created_at,items&order=created_at.desc&limit=1');
    var latest=rows&&rows[0];
    if(!latest)return;
    var seen=null;try{seen=JSON.parse(localStorage.getItem(SEEN)||'null')}catch(_){}
    if(!seen){
      localStorage.setItem(SEEN,JSON.stringify({id:latest.id,created_at:latest.created_at}));
    }else if(String(seen.id)!==String(latest.id)&&String(latest.created_at)>=String(seen.created_at||'')){
      localStorage.setItem(SEEN,JSON.stringify({id:latest.id,created_at:latest.created_at}));
      if(
        notifySupport()&&
        window.Notification.permission==='granted'&&
        localStorage.getItem(NOTIFY)==='1'&&
        localStorage.getItem(PUSHED)!=='1'
      ){
        await showSystemNotification(latest,false);
      }
      try{window.dispatchEvent(new CustomEvent('rentcam:new-order',{detail:latest}))}catch(_){}
    }
    await updateBadge();
  }catch(e){console.warn('Order watcher:',e.message||e)}
  finally{polling=false}
}
function startPolling(){
  if(pollTimer)clearInterval(pollTimer);
  pollOrders();
  pollTimer=setInterval(pollOrders,POLL_MS);
}

document.addEventListener('visibilitychange',function(){if(!document.hidden)pollOrders()});
window.addEventListener('focus',pollOrders);
window.addEventListener('storage',function(e){if(e.key===AUTH&&logged())startPolling()});
new MutationObserver(ensureDock).observe(document.documentElement,{childList:true,subtree:true});

registerSW().finally(async function(){
  ensureDock();
  if(logged()&&notifySupport()&&window.Notification.permission==='granted'){
    localStorage.setItem(NOTIFY,'1');
    try{await syncPushSubscription()}catch(e){console.warn('push resync:',e)}
  }
  startPolling();
});
})();`;

module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  res.statusCode=200;
  res.setHeader('content-type','application/javascript; charset=utf-8');
  res.setHeader('cache-control','no-cache, no-store, must-revalidate');
  if(req.method==='HEAD')return res.end();
  return res.end(SCRIPT);
};