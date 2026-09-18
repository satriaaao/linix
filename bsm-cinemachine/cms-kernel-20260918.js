/* Rentcam CMS Runtime Kernel — deterministic boot for CMS-only modules. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsKernel=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const MANIFEST=[
    {id:'app',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@8d9f04d1b7649dec4f515338bbe01e9ed48947d8/bsm-cinemachine/app.js'},
    {id:'live-base',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@003200da1b76e901196fd1a56eacebadfab3a89c/bsm-cinemachine/rentcam-live-v2.js',after:['app']},
    {id:'admin-client',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@02cdcdd03f01434bc0158276e6da31e2f23f1b1e/bsm-cinemachine/cms-admin-client-20260918.js',after:['live-base']},
    {id:'config-store',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@d2236e85fc9009396e4e98b1f7280c1ba826f042/bsm-cinemachine/cms-config-store-20260918.js',after:['admin-client']},
    {id:'media',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@5594ada689dba66ac285d271f4bfd383c58dd4e8/bsm-cinemachine/cms-media-20260918.js',after:['admin-client','config-store']},
    {id:'data-tables',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@cf75d3e38eda2ca803f7ee55e2617a019f29db1c/bsm-cinemachine/cms-data-tables-20260918.js',after:['admin-client']},
    {id:'publishing',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@0a88133a8e4fe4852a54cf4a9edfa9c6e57c29c4/bsm-cinemachine/cms-publishing-20260918.js',after:['config-store']},
    {id:'cms-ui',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@81eb7a8963c3ad50dd93daded6003f3825bb1739/bsm-cinemachine/cms-admin-all-tables-adapter-20260918.js',after:['config-store','media','data-tables']},
    {id:'promo-schedule',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@509c90dfb8cfaa3c0f6564cafdd27555dad2388e/bsm-cinemachine/cms-promo-publishing-adapter-20260918.js',after:['cms-ui','publishing']},
    {id:'global-status',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@2d79b380805c155f0bf7b6f8a63480729c0e4e0c/bsm-cinemachine/cms-global-status-publishing-adapter-20260918.js',after:['cms-ui','publishing']},
    {id:'product-sync',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@9e74e816c0c8887553503244ec7e87c04fcfa347/bsm-cinemachine/cms-product-publishing-adapter-20260918.js',after:['cms-ui','publishing']},
    {id:'rental-desk',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@9b65e9329ae2dd033cf3a8ea535133080e812a06/bsm-cinemachine/cms-rental-desk-20260918.js',after:['admin-client','config-store']},
    {id:'rental-management',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@9fc86ef98d904636ab279a14d5d6a6e66474762d/bsm-cinemachine/rental-management-table-adapter-20260918.js',after:['rental-desk','cms-ui']},
    {id:'rental-professional',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@3d265f6b649b776965d91adf9698219b2ff85ead/bsm-cinemachine/rental-professional-adapter-20260918.js',after:['rental-management']},
    {id:'quotation-fix',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@cebdf67bbe40807a403649ecedbac62391609abc/bsm-cinemachine/quotation-product-fix-20260915.js',after:['rental-professional']},
    {id:'rental-insights',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@46bde66fd10ce06d2ba9f0c1af67689bb43c5ba0/bsm-cinemachine/rental-insights-20260913.js',after:['rental-professional']},
    {id:'integrity-lib',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@636f895753b457a401c8357dc24e485795d28454/bsm-cinemachine/rental-integrity-lib-20260916.js',after:['rental-professional']},
    {id:'integrity-fix',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@636f895753b457a401c8357dc24e485795d28454/bsm-cinemachine/cms-integrity-fix-20260916.js',after:['integrity-lib','rental-professional']},
    {id:'analytics',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@7e4a56377b145bea226dc0f08c35637e5ac34978/bsm-cinemachine/cms-analytics-20260918.js',after:['cms-ui','config-store','admin-client']},
    {id:'inventory',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@bdad3ed3f5a7985c252a87d49bb23669d0cd9f20/bsm-cinemachine/cms-inventory-20260918.js',after:['admin-client','config-store']},
    {id:'serial-dispatch',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@26aedf2dffb5f4ab0f3c7db14605760087054de1/bsm-cinemachine/cms-serial-dispatch-adapter-20260918.js',after:['cms-ui','inventory']},
    {id:'logo',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@b64ae20a31d2e6ddb08a3aade3f6d5f8c5f401d4/bsm-cinemachine/cms-logo-20260918.js',after:['admin-client','config-store']},
    {id:'logo-ui',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@39342bb6b56fe05e3bf8bf61e086dd6b019c2a1c/bsm-cinemachine/cms-logo-adapter-20260918.js',after:['cms-ui','logo']},
    {id:'template-settings',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@3d7613c90fb618ca29466ccb98da4e32bf2460e8/bsm-cinemachine/cms-template-publishing-adapter-20260918.js',after:['config-store','publishing','cms-ui']}
  ];

  function validateManifest(manifest=MANIFEST){
    const ids=new Set(),seen=new Set();
    for(const item of manifest){
      if(!item?.id||!item?.src)throw new Error('Kernel manifest tidak valid');
      if(ids.has(item.id))throw new Error('Duplikat module CMS: '+item.id);
      ids.add(item.id);
    }
    for(const item of manifest){
      for(const dep of item.after||[]){
        if(!ids.has(dep))throw new Error('Dependency CMS tidak ditemukan: '+item.id+' -> '+dep);
        if(!seen.has(dep))throw new Error('Urutan CMS tidak valid: '+item.id+' harus setelah '+dep);
      }
      seen.add(item.id);
    }
    return true;
  }
  function createLoader(root,manifest=MANIFEST){
    validateManifest(manifest);
    const state={status:'idle',current:null,loaded:[],failed:null,startedAt:null,finishedAt:null};
    function snapshot(){return {...state,loaded:[...state.loaded]}}
    function showFailure(error){
      const host=root.document?.getElementById('app');
      if(!host)return;
      host.innerHTML='<div style="max-width:720px;margin:70px auto;padding:24px;border:1px solid #f1c5c5;border-radius:16px;background:#fff7f7;font:14px/1.5 system-ui;color:#7b2222"><h2 style="margin:0 0 8px">CMS gagal dimuat</h2><p style="margin:0">Module <b>'+String(state.current||'-').replace(/[<>&"]/g,'')+'</b> gagal dimuat. Muat ulang halaman atau periksa deployment CMS.</p></div>';
    }
    function load(item){
      return new Promise((resolve,reject)=>{
        const existing=root.document.querySelector('script[data-cms-kernel="'+item.id+'"]');
        if(existing){
          if(existing.dataset.loaded==='1')return resolve();
          existing.addEventListener('load',resolve,{once:true});
          existing.addEventListener('error',()=>reject(new Error('Gagal memuat '+item.id)),{once:true});
          return;
        }
        const s=root.document.createElement('script');
        s.src=item.src;s.async=false;s.dataset.cmsKernel=item.id;
        s.onload=()=>{s.dataset.loaded='1';resolve()};
        s.onerror=()=>reject(new Error('Gagal memuat '+item.id));
        (root.document.head||root.document.documentElement).appendChild(s);
      });
    }
    let bootPromise=null;
    function start(){
      if(state.status==='ready')return Promise.resolve(snapshot());
      if(bootPromise)return bootPromise;
      bootPromise=(async()=>{
        state.status='loading';state.startedAt=Date.now();state.failed=null;
        try{
          for(const item of manifest){
            state.current=item.id;
            await load(item);
            state.loaded.push(item.id);
          }
          state.current=null;state.status='ready';state.finishedAt=Date.now();
          try{root.document.documentElement.dataset.cmsReady='1'}catch(_){}
          try{root.dispatchEvent(new root.CustomEvent('rentcam:cms-ready',{detail:snapshot()}))}catch(_){}
          return snapshot();
        }catch(error){
          state.status='failed';state.failed=state.current;state.finishedAt=Date.now();
          try{console.error('Rentcam CMS Kernel failed',state.current,error)}catch(_){}
          showFailure(error);
          throw error;
        }
      })();
      return bootPromise;
    }
    return Object.freeze({start,status:snapshot,manifest:manifest.map(x=>({...x,after:[...(x.after||[])]}))});
  }
  function install(root){
    const kernel=createLoader(root);
    Promise.resolve().then(()=>kernel.start()).catch(()=>{});
    return kernel;
  }
  return {MANIFEST,validateManifest,createLoader,install};
});