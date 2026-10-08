const CACHE='bsm-display-shell-v20261008-1';
const SHELL=['/display','/signage.webmanifest','/signage-icon-192.png','/signage-icon-512.png','/signage-icon-maskable-512.png','/signage-lib.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bsm-display-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/'))return;
  if(url.pathname==='/display' || url.pathname==='/display.html'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put('/display',copy));
      return res;
    }).catch(()=>caches.match('/display')));
    return;
  }
  if(SHELL.includes(url.pathname)){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
  }
});
