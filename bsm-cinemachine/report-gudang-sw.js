const CACHE='bsm-report-gudang-v3';
const SHELL=[
  '/report-gudang.html',
  '/report-gudang.webmanifest',
  '/report-gudang-icon.svg',
  '/report-gudang-cloud.js',
  '/report-gudang-ui.js',
  '/report-gudang-master.js',
  '/report-gudang-cover.js',
  '/report-gudang-editor.js',
  '/report-gudang-parser.js',
  '/report-gudang-export.js',
  '/report-live-edit.js',
  '/report-slide-fit.js',
  '/report-it-products.js',
  '/report-it-omset.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('bsm-report-gudang-')).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/'))return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put('/report-gudang.html',copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match('/report-gudang.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(res=>{
        if(res&&res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone())).catch(()=>{});
        return res;
      }).catch(()=>cached);
      return cached||network;
    })
  );
});
