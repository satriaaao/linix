/* Rentcam CMS Inventory — serial units, dispatch snapshot and actions behind one seam. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsInventory=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const PAGE_SIZE=1000;
  const TABLES={
    units:'rentcam_units?select=*&order=serial.asc',
    dispatches:'rentcam_dispatches?select=*&order=created_at.desc',
    assigned:'rentcam_dispatch_units?select=*',
    orders:'rentcam_orders?select=*&order=created_at.desc'
  };

  function appendPage(path,offset,size=PAGE_SIZE){
    const p=String(path||'');
    if(/[?&]limit=\d+/i.test(p)||/[?&]offset=\d+/i.test(p))return p;
    return p+(p.includes('?')?'&':'?')+'limit='+size+'&offset='+offset;
  }
  async function decode(response){
    const text=await response.text();let data=null;
    try{data=text?JSON.parse(text):null}catch(_){data=text}
    if(!response.ok)throw new Error(data?.message||data||('Inventory gagal ('+(response.status||0)+')'));
    return data;
  }
  function normalizeSerials(value){
    const xs=Array.isArray(value)?value:String(value||'').split(/[\n,;]+/);
    return [...new Set(xs.map(x=>String(x).trim()).filter(Boolean))];
  }
  function create(transport,configStore){
    if(typeof transport!=='function')throw new Error('Inventory transport diperlukan');
    let cache={units:[],dispatches:[],assigned:[],orders:[]};

    async function request(path,body){
      const post=body!==undefined&&body!==null;
      if(post){
        return decode(await transport(String(path||''),{
          method:'POST',
          headers:{apikey:KEY,'Content-Type':'application/json'},
          body:JSON.stringify(body)
        }));
      }
      const raw=String(path||'');
      if(/[?&]limit=\d+/i.test(raw)||/[?&]offset=\d+/i.test(raw)){
        return decode(await transport(raw,{method:'GET',headers:{apikey:KEY,'Content-Type':'application/json'}}));
      }
      let all=[],offset=0;
      while(true){
        const page=await decode(await transport(appendPage(raw,offset),{method:'GET',headers:{apikey:KEY,'Content-Type':'application/json'}}));
        if(!Array.isArray(page))return page;
        all.push(...page);
        if(page.length<PAGE_SIZE)return all;
        offset+=PAGE_SIZE;
      }
    }
    async function load(){
      const [units,dispatches,assigned,orders]=await Promise.all([
        request(TABLES.units),request(TABLES.dispatches),request(TABLES.assigned),request(TABLES.orders)
      ]);
      cache={units,dispatches,assigned,orders};
      return snapshot();
    }
    function snapshot(){
      return {units:cache.units,dispatches:cache.dispatches,assigned:cache.assigned,orders:cache.orders};
    }
    async function action(name,data={}){
      const result=await request('rpc/rentcam_serial_action',{p_action:String(name||''),p_data:data||{}});
      return result;
    }
    function unitsForProduct(productId,onlyActive=false){
      const key=String(productId);
      return cache.units.filter(u=>String(u.product_id)===key&&(!onlyActive||u.active));
    }
    function activeQty(productId){return unitsForProduct(productId,true).length}
    function syncStock(productId,persist=false){
      const store=configStore;
      const cfg=store?.get?.();
      if(!cfg)return null;
      cfg.productOverrides??={};
      cfg.productOverrides[productId]={...(cfg.productOverrides[productId]||{}),stock:activeQty(productId),serialManaged:true};
      if(persist&&store?.save)return store.save(cfg).then(()=>cfg.productOverrides[productId]);
      return cfg.productOverrides[productId];
    }
    return Object.freeze({request,load,snapshot,action,unitsForProduct,activeQty,syncStock,normalizeSerials});
  }
  function install(root){
    const transport=(path,init)=>{
      const url=SB+'/rest/v1/'+String(path||'').replace(/^\/+/, '');
      if(root.RentcamCmsAdmin?.request)return root.RentcamCmsAdmin.request(url,init);
      return root.fetch(url,init);
    };
    return create(transport,root.RentcamCmsConfig);
  }
  return {SB,KEY,PAGE_SIZE,TABLES,appendPage,decode,normalizeSerials,create,install};
});