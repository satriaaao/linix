/* Rentcam CMS template + editable website text + promo popup */
(function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug=s=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const getCfg=()=>window.RENTCAM_CMS_CONFIG||(window.RENTCAM_CMS_CONFIG={});
  const toast=(msg,bad=false)=>{
    const n=document.createElement('div');
    n.className='v5-toast '+(bad?'bad':'ok');
    n.textContent=msg;
    document.body.append(n);
    setTimeout(()=>n.classList.add('show'),20);
    setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),220)},1900);
  };
  async function saveConfig(){
    const r=await fetch(SB+'/rest/v1/rentcam_cms_config?id=eq.1',{
      method:'PATCH',
      headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({config:getCfg()})
    });
    if(!r.ok) throw new Error(await r.text()||'Gagal menyimpan');
    try{localStorage.setItem('rentcam_cms_version',String(Date.now()))}catch(e){}
    try{new BroadcastChannel('rentcam-cms').postMessage({type:'config-updated'})}catch(e){}
  }
  const templates={
    camera:{
      name:'Rental Kamera / Production',
      general:{siteName:'Rentcam',tagline:'Motion Picture Equipment Rentals',seoTitle:'Rentcam - Rental Kamera dan Production Equipment'},
      mainCategories:[
        ['camera','Kamera',10],['lens','Lensa',20],['lighting','Lighting',30],['audio','Audio',40],['package','Paket',50],['monitor','Monitor & Wireless',60],['grip','Grip & Support',70],['accessories','Aksesori',80]
      ],
      brands:['ARRI','Sony','RED','Canon','Sigma','Aputure','Sennheiser','Teradek','SmallHD'],
      copy:{catalogTitle:'Semua Produk',catalogSubtitle:'Cari kamera, lensa, lighting, audio, paket dan equipment produksi.',catalogSearchPlaceholder:'Cari produk, brand, atau SKU...',catalogFilterLabel:'Kategori & brand'},
      homepage:{cameraTitle:'Kamera',lensTitle:'Lensa',lightingTitle:'Lighting',audioTitle:'Audio'}
    },
    allRental:{
      name:'All Rental',
      general:{siteName:'Rental All',tagline:'Sewa kebutuhan acara, produksi, perjalanan dan outdoor',seoTitle:'Rental All - Sewa Barang Harian'},
      mainCategories:[
        ['camera','Kamera',10],['lens','Lensa',20],['lighting','Lighting',30],['audio','Audio',40],['camping','Alat Camping',50],['tent','Tenda',60],['car','Rental Mobil',70],['motorbike','Rental Motor',80],['playstation','Rental PS',90],['iphone','Rental iPhone',100],['food','Makanan UMKM',110],['accessories','Aksesori',120]
      ],
      brands:['Rentcam','Rentcam Outdoor','Rentcam Transport','Rentcam Game','Rentcam Gadget','Rentcam UMKM','ARRI','Sony','Sigma','Aputure'],
      copy:{catalogTitle:'Semua Produk',catalogSubtitle:'Pilih kategori dan brand untuk semua kebutuhan rental.',catalogSearchPlaceholder:'Cari mobil, motor, PS, tenda, iPhone, makanan...',catalogFilterLabel:'Semua produk, kategori & brand'},
      homepage:{generalTitle:'Rental Lainnya',generalSubtitle:'Produk tambahan untuk event, perjalanan, outdoor, gadget dan UMKM.'}
    },
    food:{
      name:'Jual Makanan / UMKM',
      general:{siteName:'UMKM Food',tagline:'Katalog makanan dan paket acara',seoTitle:'UMKM Food - Katalog Makanan dan Paket Acara'},
      mainCategories:[
        ['food','Makanan',10],['snack','Snack',20],['drink','Minuman',30],['ricebox','Rice Box',40],['catering','Catering',50],['package','Paket Acara',60],['frozen','Frozen Food',70],['accessories','Perlengkapan',80]
      ],
      brands:['Dapur UMKM','Snack Lokal','Kopi Lokal','Catering Partner','Paket Event'],
      copy:{catalogTitle:'Semua Menu',catalogSubtitle:'Cari makanan, paket acara, snack, minuman dan catering.',catalogSearchPlaceholder:'Cari nasi box, snack, minuman, paket...',catalogFilterLabel:'Menu, kategori & brand'},
      homepage:{generalTitle:'Menu Pilihan',generalSubtitle:'Produk makanan dan paket UMKM siap pesan.'}
    }
  };
  function mergeTemplate(key){
    const t=templates[key],cfg=getCfg();
    cfg.general={...(cfg.general||{}),...(t.general||{})};
    cfg.copy={...(cfg.copy||{}),...(t.copy||{})};
    cfg.homepage={...(cfg.homepage||{}),...(t.homepage||{})};
    cfg.mainCategories=t.mainCategories.map(([id,name,sort])=>({id,name,sort,active:true}));
    cfg.subCategories=cfg.mainCategories.map(c=>({id:c.id+'-utama',name:c.name+' Utama',mainCategory:c.id,sort:10,active:true}));
    cfg.brands=t.brands.map((name,i)=>({id:slug(name),name,logo:'',sort:(i+1)*10,active:true}));
    cfg.footer={...(cfg.footer||{}),description:cfg.general.tagline||'',columns:[
      {title:'Katalog',links:cfg.mainCategories.slice(0,6).map(c=>({label:c.name,path:'/produk?cat='+c.id,active:true}))},
      {title:'Bantuan',links:[{label:'WhatsApp',path:'#whatsapp',active:true},{label:'Keranjang',path:'/cart',active:true}]}
    ]};
  }
  function field(label,path,type='text',placeholder=''){
    const parts=path.split('.');
    let v=getCfg();
    for(const p of parts) v=v?.[p];
    const val=E(v??'');
    if(type==='checkbox') return `<label class="tpl-check"><input data-tpl-field="${E(path)}" type="checkbox" ${v!==false?'checked':''}> ${E(label)}</label>`;
    if(type==='textarea') return `<label>${E(label)}<textarea data-tpl-field="${E(path)}" placeholder="${E(placeholder)}">${val}</textarea></label>`;
    return `<label>${E(label)}<input data-tpl-field="${E(path)}" value="${val}" placeholder="${E(placeholder)}"></label>`;
  }
  function setPath(path,value){
    const parts=path.split('.');
    let obj=getCfg();
    for(let i=0;i<parts.length-1;i++) obj=obj[parts[i]]||(obj[parts[i]]={});
    obj[parts.at(-1)]=value;
  }
  function baseProducts(){
    try{return Array.isArray(P)?P:[]}catch(e){return []}
  }
  function baseBanners(){
    try{return Array.isArray(SL)?SL:[]}catch(e){return []}
  }
  function normalizedProduct(p,i){
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
      included:Array.isArray(p.included)?p.included:(Array.isArray(p.inc)?p.inc:[]),
      accessories:Array.isArray(p.accessories)?p.accessories:[],
      spec:Array.isArray(p.spec)?p.spec:[],
      images,
      image:images[0]||'',
      placement:p.placement||'catalog',
      sortOrder:Number(p.sortOrder)||((i+1)*10),
      active:p.active!==false,
      deleted:false
    };
  }
  function syncWebsiteContent(){
    const c=getCfg();
    const products=baseProducts().map(normalizedProduct);
    const ids=new Set();
    c.customProducts=[...(c.customProducts||[])];
    products.forEach(p=>{
      if(ids.has(p.id))return;
      ids.add(p.id);
      const i=c.customProducts.findIndex(x=>String(x.id)===p.id);
      if(i>=0)c.customProducts[i]={...p,...c.customProducts[i],id:p.id};
      else c.customProducts.push(p);
    });
    const cats=[...new Map(c.customProducts.map(p=>[p.mainCategory,{id:p.mainCategory,name:p.category||p.mainCategory,sort:p.sortOrder||999,active:true}])).values()];
    c.mainCategories=[...(c.mainCategories||[])];
    cats.forEach(cat=>{if(!c.mainCategories.some(x=>String(x.id)===String(cat.id)))c.mainCategories.push(cat)});
    const brands=[...new Set(c.customProducts.map(p=>p.brand).filter(Boolean))];
    c.brands=[...(c.brands||[])];
    brands.forEach((name,i)=>{if(!c.brands.some(b=>String(b.name).toLowerCase()===String(name).toLowerCase()))c.brands.push({id:slug(name),name,logo:'',sort:100+i,active:true})});
    const banners=baseBanners().map((b,i)=>({id:b.id||'banner-'+(i+1),ey:b.ey||'PROMO',title:b.t||b.title||'',text:b.p||b.text||'',image:b.img||b.image||'',active:true}));
    if(banners.length){
      c.banners=[...(c.banners||[])];
      banners.forEach(b=>{const i=c.banners.findIndex(x=>String(x.id)===String(b.id));if(i>=0)c.banners[i]={...b,...c.banners[i]};else c.banners.push(b)});
    }
    if(!c.popup)c.popup={};
    c.popup={enabled:true,type:c.popup.type||'promo',floatLabel:c.popup.floatLabel||'',eyebrow:c.popup.eyebrow||'PROMO',title:c.popup.title||'Promo Rental Hari Ini',text:c.popup.text||'Cek promo dan produk terbaru. Klik untuk langsung masuk ke halaman produk.',buttonLabel:c.popup.buttonLabel||'Lihat produk',productId:c.popup.productId||'',buttonLink:c.popup.buttonLink||'',image:c.popup.image||banners[0]?.image||'',version:c.popup.version||'promo-live-1'};
  }
  function selectField(label,path,options){
    const parts=path.split('.');
    let v=getCfg();
    for(const p of parts) v=v?.[p];
    return `<label>${E(label)}<select data-tpl-field="${E(path)}">${options.map(x=>`<option value="${E(x[0])}" ${String(v??'')===String(x[0])?'selected':''}>${E(x[1])}</option>`).join('')}</select></label>`;
  }
  function render(){
    const host=document.querySelector('.v5-content');
    if(!host) return;
    host.innerHTML=`<div class="tpl-system">
      <section class="tpl-hero">
        <div><small>TEMPLATE SISTEM</small><h2>Siapkan website untuk bisnis rental atau jual makanan.</h2><p>Pilih template kategori, edit teks website, lalu atur popup promo dari satu halaman.</p></div>
        <button data-tpl-action="save">Simpan semua</button>
      </section>
      <section class="tpl-grid">
        ${Object.entries(templates).map(([key,t])=>`<article class="tpl-card"><small>Template</small><h3>${E(t.name)}</h3><p>Isi otomatis kategori, brand, footer dan copy dasar.</p><button data-tpl-action="apply" data-template="${key}">Pakai template</button></article>`).join('')}
      </section>
      <section class="tpl-card tpl-sync-card">
        <div><h3>Sinkron konten website ke CMS</h3><p>Masukkan semua produk, kategori, brand dan banner yang sedang tampil di website ke data CMS agar bisa diedit, dinonaktifkan, atau dihapus.</p></div>
        <button data-tpl-action="sync-content">Sinkronkan produk & banner</button>
      </section>
      <section class="tpl-card">
        <h3>Teks Website</h3>
        <p>Semua teks utama katalog dan homepage bisa diganti dari sini.</p>
        <div class="tpl-fields">
          ${field('Judul katalog','copy.catalogTitle')}
          ${field('Subjudul katalog','copy.catalogSubtitle','textarea')}
          ${field('Placeholder pencarian','copy.catalogSearchPlaceholder')}
          ${field('Label dropdown kategori','copy.catalogFilterLabel')}
          ${field('Judul rental lainnya','homepage.generalTitle')}
          ${field('Subjudul rental lainnya','homepage.generalSubtitle','textarea')}
          ${field('Judul popup default','popup.title')}
          ${field('Isi popup','popup.text','textarea')}
        </div>
      </section>
      <section class="tpl-card">
        <h3>Popup Promo / Produk Baru</h3>
        <div class="tpl-fields">
          ${field('Tampilkan popup di website','popup.enabled','checkbox')}
          ${selectField('Kategori popup','popup.type',[['promo','Promo'],['new','Barang baru']])}
          ${field('Label tombol pinggir','popup.floatLabel','text','PROMO / NEW / DISKON')}
          ${field('Label kecil','popup.eyebrow')}
          ${field('Judul','popup.title')}
          ${field('Deskripsi','popup.text','textarea')}
          ${field('Nama tombol bawah','popup.buttonLabel','text','Lihat produk')}
          ${field('ID produk tujuan manual','popup.productId','text','Kosongkan agar otomatis ikut promo/new pertama')}
          ${field('Link tombol manual','popup.buttonLink','text','Kosongkan agar otomatis ke detail produk')}
          ${field('URL gambar popup','popup.image')}
          ${field('Kode versi popup','popup.version','text','promo-1')}
        </div>
        <p class="tpl-note">Kalau ingin popup tampil lagi ke pengunjung yang sudah pernah menutup, ubah Kode versi popup.</p>
      </section>
    </div>`;
  }
  function style(){
    if(document.getElementById('tpl-cms-style')) return;
    const s=document.createElement('style');
    s.id='tpl-cms-style';
    s.textContent=`
      .tpl-system{max-width:1240px}.tpl-hero,.tpl-card{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:22px;margin-bottom:16px;box-shadow:0 10px 28px rgba(24,38,57,.04)}.tpl-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,#101827,#17324f);color:#fff}.tpl-hero small{letter-spacing:.14em;color:#9bc1ff;font-weight:800}.tpl-hero h2{font-size:28px;line-height:1.06;margin:8px 0}.tpl-hero p{color:#d8e5f8;max-width:620px}.tpl-hero button,.tpl-card button{border:0;border-radius:12px;background:#f26a21;color:#fff;font-weight:850;padding:13px 16px;cursor:pointer}.tpl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.tpl-sync-card{display:flex;align-items:center;justify-content:space-between;gap:18px;background:#f8fbff}.tpl-card h3{margin:0 0 8px;font-size:20px}.tpl-card p,.tpl-note{color:#6d7888;font-size:13px;line-height:1.55}.tpl-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.tpl-fields label{display:block;font-size:12px;font-weight:800;color:#3f4b5d}.tpl-fields input,.tpl-fields textarea,.tpl-fields select{display:block;width:100%;margin-top:7px;border:1px solid #dbe2eb;border-radius:11px;padding:11px 12px;font:inherit;font-size:13px;background:#fff}.tpl-fields textarea{min-height:88px}.tpl-check{display:flex!important;align-items:center;gap:9px;background:#f6f8fb;border:1px solid #e1e7ef;border-radius:12px;padding:13px}.tpl-check input{width:auto!important;margin:0!important}@media(max-width:850px){.tpl-hero,.tpl-sync-card{display:block}.tpl-grid,.tpl-fields{grid-template-columns:1fr}.tpl-hero h2{font-size:23px}}
    `;
    document.head.append(s);
  }
  function install(){
    if(!location.pathname.startsWith('/cms')) return;
    style();
    const nav=document.querySelector('.v5-nav');
    if(nav&&!nav.querySelector('[data-tpl-nav]')){
      nav.insertAdjacentHTML('beforeend','<button data-tpl-nav><svg class="v5-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 4h16v5H4zM4 13h7v7H4zM15 13h5v7h-5z"/></svg><span>Template & Popup</span></button>');
    }
  }
  document.addEventListener('click',async e=>{
    const nav=e.target.closest?.('[data-tpl-nav]');
    if(nav){
      e.preventDefault();e.stopImmediatePropagation();
      document.querySelector('.v5-top h1').textContent='Template & Popup';
      document.querySelectorAll('.v5-nav button').forEach(b=>b.classList.toggle('on',b===nav));
      render();
      return;
    }
    const btn=e.target.closest?.('[data-tpl-action]');
    if(!btn) return;
    e.preventDefault();
    try{
      if(btn.dataset.tplAction==='apply'){
        mergeTemplate(btn.dataset.template);
        render();
        toast('Template diterapkan. Klik Simpan semua.');
      }
      if(btn.dataset.tplAction==='sync-content'){
        syncWebsiteContent();
        render();
        await saveConfig();
        toast('Produk, kategori, brand dan banner sudah masuk ke CMS.');
      }
      if(btn.dataset.tplAction==='save'){
        document.querySelectorAll('[data-tpl-field]').forEach(el=>setPath(el.dataset.tplField,el.type==='checkbox'?el.checked:el.value));
        await saveConfig();
        toast('Template, teks dan popup tersimpan.');
      }
    }catch(err){toast(err.message,true)}
  },true);
  document.addEventListener('input',e=>{
    if(!e.target.matches?.('[data-tpl-field]')) return;
    setPath(e.target.dataset.tplField,e.target.type==='checkbox'?e.target.checked:e.target.value);
  });
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true});
  install();
})();
