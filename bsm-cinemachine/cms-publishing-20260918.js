/* Rentcam CMS Publishing — one seam for CMS content mutations and persistence. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsPublishing=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const clone=v=>JSON.parse(JSON.stringify(v));
  const slug=s=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  function normalizeProduct(p={},i=0){
    const main=slug(p.mainCategory||p.cat||p.category||'catalog')||'catalog';
    const images=Array.isArray(p.images)&&p.images.length?p.images.filter(Boolean):[p.image||p.img].filter(Boolean);
    return {
      id:String(p.id||slug(p.name)||('produk-'+i)),
      name:p.name||'Produk',
      brand:p.brand||'',
      mainCategory:main,
      subCategory:p.subCategory||'',
      category:p.category||p.cat||main,
      price:Number(p.price)||0,
      stock:Number(p.stock)||0,
      description:p.description||`${p.name||'Produk'} siap diedit dari CMS.`,
      included:Array.isArray(p.included)?clone(p.included):(Array.isArray(p.inc)?clone(p.inc):[]),
      accessories:Array.isArray(p.accessories)?clone(p.accessories):[],
      spec:Array.isArray(p.spec)?clone(p.spec):[],
      images:clone(images),
      image:images[0]||'',
      placement:p.placement||'catalog',
      sortOrder:Number(p.sortOrder)||((i+1)*10),
      active:p.active!==false,
      deleted:false
    };
  }
  function create(store){
    if(!store?.get||!store?.save)throw new Error('CMS Config Store diperlukan');
    const get=()=>store.get();

    function product(id,create=false){
      const c=get(),key=String(id);
      const custom=(c.customProducts||[]).find(x=>String(x.id)===key);
      if(custom)return custom;
      const ov=(c.productOverrides||{})[key];
      if(ov||!create)return ov||null;
      c.productOverrides=c.productOverrides||{};
      return c.productOverrides[key]={};
    }
    function isProductActive(id){
      const x=product(id,false);
      return !x||x.active!==false&&x.deleted!==true;
    }
    function setProductActive(id,active){
      const c=get(),key=String(id),custom=(c.customProducts||[]).find(x=>String(x.id)===key);
      if(custom){
        custom.active=!!active;
        if(active)custom.deleted=false;
        return custom;
      }
      c.productOverrides=c.productOverrides||{};
      const x=c.productOverrides[key]={...(c.productOverrides[key]||{}),active:!!active};
      if(active)x.deleted=false;
      return x;
    }
    function toggleProduct(id){
      return setProductActive(id,!isProductActive(id));
    }
    function deleteProduct(id,now=new Date()){
      const c=get(),key=String(id),custom=(c.customProducts||[]).find(x=>String(x.id)===key);
      if(custom){
        c.customProducts=(c.customProducts||[]).filter(p=>String(p.id)!==key);
        if(c.productOverrides)delete c.productOverrides[key];
        return {kind:'custom',id:key};
      }
      c.productOverrides=c.productOverrides||{};
      c.productOverrides[key]={...(c.productOverrides[key]||{}),active:false,deleted:true,deletedAt:now.toISOString()};
      return {kind:'base',id:key};
    }
    function collection(kind){
      const c=get();
      return kind==='footer'?(c.footer?.columns||[]):(c[kind]||[]);
    }
    function isCollectionActive(kind,index){
      const x=collection(kind)[Number(index)];
      if(!x)return false;
      return kind==='navigation'?x.enabled!==false:x.active!==false;
    }
    function toggleCollection(kind,index){
      const x=collection(kind)[Number(index)];
      if(!x)return null;
      if(kind==='navigation')x.enabled=x.enabled===false;
      else x.active=x.active===false;
      return x;
    }
    function deleteCollection(kind,index){
      const a=collection(kind),i=Number(index);
      if(!Number.isInteger(i)||i<0||i>=a.length)return null;
      return a.splice(i,1)[0]||null;
    }
    function patchProductSchedule(id,patch={}){
      const x=product(id,true);
      Object.keys(patch).forEach(k=>x[k]=patch[k]);
      return x;
    }
    function patchBannerSchedule(index,patch={}){
      const x=collection('banners')[Number(index)];
      if(!x)return null;
      Object.keys(patch).forEach(k=>x[k]=patch[k]);
      return x;
    }
    function syncWebsiteContent(products=[],banners=[]){
      const c=get();
      c.tax={enabled:false,rate:11,label:'PPN',...(c.tax||{})};
      const normalized=(products||[]).map(normalizeProduct),ids=new Set();
      c.customProducts=[...(c.customProducts||[])];
      normalized.forEach(p=>{
        if(ids.has(p.id))return;
        ids.add(p.id);
        const i=c.customProducts.findIndex(x=>String(x.id)===p.id);
        if(i>=0)c.customProducts[i]={...p,...c.customProducts[i],id:p.id};
        else c.customProducts.push(p);
      });
      const cats=[...new Map(c.customProducts.map(p=>[p.mainCategory,{id:p.mainCategory,name:p.category||p.mainCategory,sort:p.sortOrder||999,active:true}])).values()];
      store.ensureCategories?.();
      c.mainCategories=[...(c.mainCategories||[])];
      cats.forEach(cat=>{if(!c.mainCategories.some(x=>String(x.id)===String(cat.id)))c.mainCategories.push(cat)});
      const brands=[...new Set(c.customProducts.map(p=>p.brand).filter(Boolean))];
      store.addBrands?.(brands);
      store.ensureProductLabels?.();
      const normalizedBanners=(banners||[]).map((b,i)=>({id:b.id||'banner-'+(i+1),ey:b.ey||'PROMO',title:b.t||b.title||'',text:b.p||b.text||'',image:b.img||b.image||'',active:true}));
      if(normalizedBanners.length){
        c.banners=[...(c.banners||[])];
        normalizedBanners.forEach(b=>{const i=c.banners.findIndex(x=>String(x.id)===String(b.id));if(i>=0)c.banners[i]={...b,...c.banners[i]};else c.banners.push(b)});
      }
      c.popup=c.popup||{};
      c.popup={enabled:true,type:c.popup.type||'promo',labels:c.popup.labels?.length?c.popup.labels:['PROMO','NEW','DISKON'],floatLabel:c.popup.floatLabel||'',eyebrow:c.popup.eyebrow||'PROMO',title:c.popup.title||'Promo Rental Hari Ini',text:c.popup.text||'Cek promo dan produk terbaru. Klik untuk langsung masuk ke halaman produk.',buttonLabel:c.popup.buttonLabel||'Lihat produk',productId:c.popup.productId||'',buttonLink:c.popup.buttonLink||'',image:c.popup.image||normalizedBanners[0]?.image||'',reappearSeconds:c.popup.reappearSeconds||8,version:c.popup.version||'promo-live-1'};
      return c;
    }
    function save(){return store.save(get())}
    return Object.freeze({get,save,product,isProductActive,setProductActive,toggleProduct,deleteProduct,collection,isCollectionActive,toggleCollection,deleteCollection,patchProductSchedule,patchBannerSchedule,syncWebsiteContent});
  }
  function install(root){
    if(!root.RentcamCmsConfig)throw new Error('RentcamCmsConfig belum dimuat');
    return create(root.RentcamCmsConfig);
  }
  return {clone,slug,normalizeProduct,create,install};
});