/* Rentcam CMS Config — deep module for config state, persistence, templates and master defaults. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsConfig=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const VERSION_KEY='rentcam_cms_version';
  const ALL_RENTAL_CATEGORIES=[
    ['camera','Kamera',10],['lens','Lensa',20],['lighting','Lighting',30],['audio','Audio',40],
    ['camping','Alat Camping',50],['tent','Tenda',60],['car','Rental Mobil',70],
    ['motorbike','Rental Motor',80],['playstation','Rental PS',90],['iphone','Rental iPhone',100],
    ['food','Makanan UMKM',110],['accessories','Aksesori',120]
  ];
  const DEFAULT_LABELS=[
    {id:'new',name:'NEW',active:true,sort:10},
    {id:'promo',name:'PROMO',active:true,sort:20},
    {id:'diskon',name:'DISKON',active:true,sort:30},
    {id:'barang-baru',name:'BARANG BARU',active:true,sort:40}
  ];
  const TEMPLATES={
    camera:{
      name:'Rental Kamera / Production',
      general:{siteName:'Rentcam',tagline:'Motion Picture Equipment Rentals',seoTitle:'Rentcam - Rental Kamera dan Production Equipment'},
      mainCategories:[
        ['camera','Kamera',10],['lens','Lensa',20],['lighting','Lighting',30],['audio','Audio',40],
        ['package','Paket',50],['monitor','Monitor & Wireless',60],['grip','Grip & Support',70],['accessories','Aksesori',80]
      ],
      brands:['ARRI','Sony','RED','Canon','Sigma','Aputure','Sennheiser','Teradek','SmallHD'],
      copy:{catalogTitle:'Semua Produk',catalogSubtitle:'Cari kamera, lensa, lighting, audio, paket dan equipment produksi.',catalogSearchPlaceholder:'Cari produk, brand, atau SKU...',catalogFilterLabel:'Kategori & brand'},
      homepage:{cameraTitle:'Kamera',lensTitle:'Lensa',lightingTitle:'Lighting',audioTitle:'Audio'}
    },
    allRental:{
      name:'All Rental',
      general:{siteName:'Rental All',tagline:'Sewa kebutuhan acara, produksi, perjalanan dan outdoor',seoTitle:'Rental All - Sewa Barang Harian'},
      mainCategories:ALL_RENTAL_CATEGORIES,
      brands:['Rentcam','Rentcam Outdoor','Rentcam Transport','Rentcam Game','Rentcam Gadget','Rentcam UMKM','ARRI','Sony','Sigma','Aputure'],
      copy:{catalogTitle:'Semua Produk',catalogSubtitle:'Pilih kategori dan brand untuk semua kebutuhan rental.',catalogSearchPlaceholder:'Cari mobil, motor, PS, tenda, iPhone, makanan...',catalogFilterLabel:'Semua produk, kategori & brand'},
      homepage:{generalTitle:'Rental Lainnya',generalSubtitle:'Produk tambahan untuk event, perjalanan, outdoor, gadget dan UMKM.'}
    },
    food:{
      name:'Jual Makanan / UMKM',
      general:{siteName:'UMKM Food',tagline:'Katalog makanan dan paket acara',seoTitle:'UMKM Food - Katalog Makanan dan Paket Acara'},
      mainCategories:[
        ['food','Makanan',10],['snack','Snack',20],['drink','Minuman',30],['ricebox','Rice Box',40],
        ['catering','Catering',50],['package','Paket Acara',60],['frozen','Frozen Food',70],['accessories','Perlengkapan',80]
      ],
      brands:['Dapur UMKM','Snack Lokal','Kopi Lokal','Catering Partner','Paket Event'],
      copy:{catalogTitle:'Semua Menu',catalogSubtitle:'Cari makanan, paket acara, snack, minuman dan catering.',catalogSearchPlaceholder:'Cari nasi box, snack, minuman, paket...',catalogFilterLabel:'Menu, kategori & brand'},
      homepage:{generalTitle:'Menu Pilihan',generalSubtitle:'Produk makanan dan paket UMKM siap pesan.'}
    }
  };

  const clone=v=>JSON.parse(JSON.stringify(v));
  const slug=s=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function merge(a,b){
    if(Array.isArray(a))return Array.isArray(b)?clone(b):clone(a||[]);
    const out={...(a||{})};
    Object.keys(b||{}).forEach(k=>{
      const av=a?.[k],bv=b[k];
      out[k]=(av&&typeof av==='object'&&!Array.isArray(av)&&bv&&typeof bv==='object'&&!Array.isArray(bv))?merge(av,bv):clone(bv);
    });
    return out;
  }
  function ensureLabels(config){
    const c=config||{};
    c.productLabels=[...(c.productLabels||[])];
    DEFAULT_LABELS.forEach(label=>{
      if(!c.productLabels.some(x=>String(x.name||'').toLowerCase()===label.name.toLowerCase()))c.productLabels.push({...label});
    });
    c.popup=c.popup||{};
    if(!Array.isArray(c.popup.labels)||!c.popup.labels.length)c.popup.labels=['PROMO','NEW','DISKON'];
    return c;
  }
  function ensureAllRentalCategories(config){
    const c=config||{};
    c.mainCategories=[...(c.mainCategories||[])];
    c.subCategories=[...(c.subCategories||[])];
    ALL_RENTAL_CATEGORIES.forEach(([id,name,sort])=>{
      if(!c.mainCategories.some(x=>String(x.id)===id))c.mainCategories.push({id,name,sort,active:true});
      if(!c.subCategories.some(x=>String(x.mainCategory)===id))c.subCategories.push({id:id+'-utama',name:name+' Utama',mainCategory:id,sort:10,active:true});
    });
    return c;
  }
  function ensureBrands(config,names=[]){
    const c=config||{};
    c.brands=[...(c.brands||[])];
    names.filter(Boolean).forEach((name,i)=>{
      if(!c.brands.some(b=>String(b.name||'').toLowerCase()===String(name).toLowerCase())){
        c.brands.push({id:slug(name),name:String(name),logo:'',sort:100+i,active:true});
      }
    });
    return c;
  }
  function applyTemplateTo(config,key){
    const t=TEMPLATES[key];
    if(!t)throw new Error('Template tidak ditemukan');
    const c=config||{};
    c.general={...(c.general||{}),...(t.general||{})};
    c.copy={...(c.copy||{}),...(t.copy||{})};
    c.homepage={...(c.homepage||{}),...(t.homepage||{})};
    c.mainCategories=t.mainCategories.map(([id,name,sort])=>({id,name,sort,active:true}));
    c.subCategories=c.mainCategories.map(x=>({id:x.id+'-utama',name:x.name+' Utama',mainCategory:x.id,sort:10,active:true}));
    c.brands=t.brands.map((name,i)=>({id:slug(name),name,logo:'',sort:(i+1)*10,active:true}));
    c.footer={...(c.footer||{}),description:c.general.tagline||'',columns:[
      {title:'Katalog',links:c.mainCategories.slice(0,6).map(x=>({label:x.name,path:'/produk?cat='+x.id,active:true}))},
      {title:'Bantuan',links:[{label:'WhatsApp',path:'#whatsapp',active:true},{label:'Keranjang',path:'/cart',active:true}]}
    ]};
    ensureLabels(c);
    return c;
  }
  async function decode(response){
    const text=await response.text();let data=null;
    try{data=text?JSON.parse(text):null}catch(_){data=text}
    if(!response.ok)throw new Error(data?.message||data||'Gagal memproses konfigurasi CMS');
    return data;
  }
  function create(root){
    let current=root.RENTCAM_CMS_CONFIG||{};
    const admin=()=>root.RentcamCmsAdmin;
    async function request(url,init={}){
      if(admin()?.request)return admin().request(url,init);
      return root.fetch(url,init);
    }
    function use(config){
      current=config||{};
      root.RENTCAM_CMS_CONFIG=current;
      return current;
    }
    function get(){return current}
    async function load(defaults={}){
      const r=await request(SB+'/rest/v1/rentcam_cms_config?id=eq.1&select=config',{headers:{apikey:KEY,'Content-Type':'application/json'},cache:'no-store'});
      const rows=await decode(r);
      return use(merge(defaults,rows?.[0]?.config||{}));
    }
    function broadcast(){
      const version=String(Date.now());
      try{root.localStorage.setItem(VERSION_KEY,version)}catch(_){}
      try{const bc=new root.BroadcastChannel('rentcam-cms');bc.postMessage({type:'config-updated',version});bc.close()}catch(_){}
      return version;
    }
    async function save(config=current){
      use(config||{});
      const r=await request(SB+'/rest/v1/rentcam_cms_config?id=eq.1',{
        method:'PATCH',
        headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=minimal'},
        body:JSON.stringify({config:current})
      });
      await decode(r);
      broadcast();
      return current;
    }
    function applyTemplate(key){return use(applyTemplateTo(current,key))}
    function ensureCategories(){ensureAllRentalCategories(current);return use(current)}
    function ensureProductLabels(){ensureLabels(current);return use(current)}
    function addBrands(names){ensureBrands(current,names);return use(current)}
    return Object.freeze({
      get,use,load,save,broadcast,applyTemplate,ensureCategories,ensureProductLabels,addBrands,
      slug,templates:TEMPLATES,allRentalCategories:ALL_RENTAL_CATEGORIES,defaultLabels:DEFAULT_LABELS
    });
  }
  function install(root){return create(root)}
  return {
    SB,KEY,VERSION_KEY,ALL_RENTAL_CATEGORIES,DEFAULT_LABELS,TEMPLATES,
    clone,slug,merge,ensureLabels,ensureAllRentalCategories,ensureBrands,applyTemplateTo,decode,create,install
  };
});