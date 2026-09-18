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
    {id:'cms-ui',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@25792315d5cecb5f03d23159364cbe3613857143/bsm-cinemachine/cms-admin-analytics-adapter-20260918.js',after:['config-store']},
    {id:'promo-schedule',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@9f5b3ea84805c43291ac5c400f90cd84c965ffab/bsm-cinemachine/cms-promo-schedule-v6-20260912.js',after:['cms-ui']},
    {id:'global-status',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@798eefb2d04f662939661a6feae7fb0c5dd92160/bsm-cinemachine/cms-global-status-v6-20260912.js',after:['cms-ui']},
    {id:'product-sync',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@368c88ed340fdf957c604d45fa3c3bd400ae25f2/bsm-cinemachine/cms-product-sync-v10-20260912.js',after:['cms-ui']},
    {id:'rental-desk',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@9b65e9329ae2dd033cf3a8ea535133080e812a06/bsm-cinemachine/cms-rental-desk-20260918.js',after:['admin-client','config-store']},
    {id:'rental-management',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@287028b4c57f9b1e3f98dec4935edc04e2f35beb/bsm-cinemachine/rental-management-adapter-20260918.js',after:['rental-desk','cms-ui']},
    {id:'rental-professional',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@3d265f6b649b776965d91adf9698219b2ff85ead/bsm-cinemachine/rental-professional-adapter-20260918.js',after:['rental-management']},
    {id:'quotation-fix',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@cebdf67bbe40807a403649ecedbac62391609abc/bsm-cinemachine/quotation-product-fix-20260915.js',after:['rental-professional']},
    {id:'rental-insights',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@46bde66fd10ce06d2ba9f0c1af67689bb43c5ba0/bsm-cinemachine/rental-insights-20260913.js',after:['rental-professional']},
    {id:'integrity-lib',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@636f895753b457a401c8357dc24e485795d28454/bsm-cinemachine/rental-integrity-lib-20260916.js',after:['rental-professional']},
    {id:'integrity-fix',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@636f895753b457a401c8357dc24e485795d28454/bsm-cinemachine/cms-integrity-fix-20260916.js',after:['integrity-lib','rental-professional']},
    {id:'analytics',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@7e4a56377b145bea226dc0f08c35637e5ac34978/bsm-cinemachine/cms-analytics-20260918.js',after:['cms-ui','config-store','admin-client']},
    {id:'serial-dispatch',src:'/serial-dispatch-20260913.js',after:['cms-ui']},
    {id:'site-logo',src:'/site-logo-20260913.js',after:['cms-ui']},
    {id:'template-settings',src:'https://cdn.jsdelivr.net/gh/satriaaao/linix@47339560b914ab53ca4d037452783d7020b91204/bsm-cinemachine/cms-template-settings-adapter-20260918.js',after:['config-store','cms-ui']}
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