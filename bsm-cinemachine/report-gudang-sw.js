const CACHE='bsm-report-gudang-v33';
const SHELL=[
  '/report-gudang.html',
  '/report-gudang.webmanifest',
  '/report-gudang-icon.svg',
  '/report-gudang-cloud.js',
  '/report-gudang-realtime.js',
  '/report-gudang-ui.js',
  '/report-gudang-master.js',
  '/report-gudang-cover.js',
  '/report-gudang-editor.js',
  '/report-gudang-parser.js',
  '/report-gudang-export.js',
  '/report-live-edit.js',
  '/report-slide-fit.js',
  '/report-it-products.js',
  '/report-it-omset.js',
  '/report-manual-sheets.js',
  '/report-lighting-reports.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('bsm-report-gudang-')).map(k=>caches.delete(k)));
    await self.clients.claim();
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    await Promise.all(windows.map(async client=>{
      try{
        const url=new URL(client.url);
        if(url.origin!==self.location.origin)return;
        if(url.pathname!=='/report-gudang'&&url.pathname!=='/report-gudang.html')return;
        if(url.searchParams.get('__appv')==='33')return;
        url.searchParams.set('__appv','33');
        await client.navigate(url.href);
      }catch(_){}
    }));
  })());
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

  if(url.pathname.endsWith('.js')||url.pathname.endsWith('.css')){
    event.respondWith(
      fetch(req).then(res=>{
        if(res&&res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone())).catch(()=>{});
        return res;
      }).catch(()=>caches.match(req))
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
