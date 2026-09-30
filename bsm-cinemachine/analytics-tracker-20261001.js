/* First-party route analytics: deduplicated views, retryable delivery, visible-page presence. */
(function(root,factory){const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;if(root&&!root.location.pathname.startsWith('/cms'))root.RentcamAnalytics=lib.install(root)})(typeof window!=='undefined'?window:null,function(){
 const productId=path=>{const m=String(path||'').match(/^\/produk\/([^/?#]+)/);try{return m?decodeURIComponent(m[1]):null}catch(_){return null}};
 function install(root){
  if(root.RentcamAnalytics)return root.RentcamAnalytics;
  const key='rentcam_analytics_pending_v1';let session,lastPath=null,queue=[],sending=false,lastProduct={id:null,time:0};
  try{session=root.sessionStorage.getItem('rentcam_sid');if(!session){session=root.crypto.randomUUID();root.sessionStorage.setItem('rentcam_sid',session)}}catch(_){session=Date.now()+'-'+Math.random().toString(36).slice(2)}
  try{queue=JSON.parse(root.localStorage.getItem(key)||'[]').filter(e=>e.at>Date.now()-86400000).slice(-100)}catch(_){queue=[]}
  const persist=()=>{try{root.localStorage.setItem(key,JSON.stringify(queue.slice(-100)))}catch(_){}};
  async function flush(){if(sending||!queue.length||root.navigator.onLine===false)return;sending=true;try{while(queue.length){const item=queue[0];const r=await root.fetch('/api/analytics-event',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify(item.data),signal:root.AbortSignal.timeout(10000)});if(!r.ok){if(r.status===400){queue.shift();persist();continue}break}queue.shift();persist()}}catch(_){/* Retain unsent records for the next online/retry cycle. */}finally{sending=false}}
  function enqueue(type,path,id=null){queue.push({at:Date.now(),data:{event_type:type,path,product_id:id,session_id:session,meta:{ua:root.navigator.userAgent.slice(0,160)}}});queue=queue.slice(-100);persist();void flush()}
  function product(path){const id=productId(path);if(!id)return;const now=Date.now();if(lastProduct.id===id&&now-lastProduct.time<1000)return;lastProduct={id,time:now};enqueue('product_click',path,id)}
  function observe(){const path=root.location.pathname;if(path.startsWith('/cms')||path===lastPath)return;lastPath=path;enqueue('page_view',path);product(path)}
  async function ping(){if(root.document.hidden)return;try{await root.fetch('/api/analytics-presence',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({session_id:session,path:root.location.pathname}),signal:root.AbortSignal.timeout(10000)})}catch(_){}}
  for(const name of ['pushState','replaceState']){const original=root.history[name].bind(root.history);root.history[name]=function(...args){const result=original(...args);observe();return result}}
  root.addEventListener('popstate',observe);root.addEventListener('pageshow',()=>{observe();void flush();void ping()});root.addEventListener('online',()=>{void flush();void ping()});
  root.document.addEventListener('rentcam-route-change',observe);
  root.document.addEventListener('click',e=>{const node=e.target.closest?.('[data-go],[data-cms-go],a[href],[onclick]');if(!node)return;const value=node.dataset.go||node.dataset.cmsGo||node.getAttribute('href')||node.getAttribute('onclick')?.match(/go\(['"]([^'"]+)/)?.[1];if(!value)return;try{const target=new URL(value,root.location.href);if(target.origin!==root.location.origin||!productId(target.pathname))return;root.setTimeout(()=>{observe();if(root.location.pathname===target.pathname)product(target.pathname)},0)}catch(_){}} ,true);
  root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden){observe();void flush();void ping()}});
  root.setInterval(()=>{observe();void flush()},15000);root.setInterval(()=>{void ping()},30000);observe();void ping();
  return {observe,flush,session:()=>session,pending:()=>queue.length};
 }
 return {productId,install};
});
