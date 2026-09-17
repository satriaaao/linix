/* Rentcam — general rental products + live catalog/cart integrity */
(function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rupiah=n=>'Rp'+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(Number(n)||0);
  const img={
    camping:'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=82',
    car:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=82',
    motorbike:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=82',
    playstation:'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1000&q=82',
    tent:'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=82',
    iphone:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=82',
    food:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=82'
  };
  const labels={camping:'Alat Camping',car:'Rental Mobil',motorbike:'Rental Motor',playstation:'Rental PS',tent:'Tenda',iphone:'Rental iPhone',food:'Makanan UMKM'};
  function item(id,name,brand,cat,price,image,sort,description){
    return {id,name,brand,cat:labels[cat]||cat,category:labels[cat]||cat,mainCategory:cat,subCategory:'',price,priceAud:price,img:image,image,images:[image],stock:1,sku:id,placement:'catalog',sortOrder:sort,active:true,description,spec:[['Kategori',labels[cat]||cat],['Tipe','Rental harian'],['Status','Data dummy siap diedit']],inc:['Unit sesuai pesanan','Pengecekan kondisi sebelum serah terima','Konfirmasi stok oleh admin'],included:['Unit sesuai pesanan','Pengecekan kondisi sebelum serah terima','Konfirmasi stok oleh admin'],accessories:['Opsi antar jemput sesuai area','Bisa ditambahkan catatan kebutuhan saat checkout'],_generalRental:true};
  }
  const products=[
    item('camping-set-family','Paket Camping Family Set','Rentcam Outdoor','camping',350000,img.camping,700,'Paket camping untuk keluarga kecil, cocok untuk liburan singkat dan acara outdoor.'),
    item('rental-mobil-avanza','Rental Mobil Avanza Harian','Rentcam Transport','car',450000,img.car,710,'Rental mobil harian untuk operasional produksi, perjalanan tim, atau kebutuhan acara.'),
    item('rental-motor-vario','Rental Motor Vario Harian','Rentcam Transport','motorbike',125000,img.motorbike,720,'Motor harian untuk kebutuhan mobilitas cepat, kurir produksi, atau transport lokal.'),
    item('rental-ps5-set','Rental PlayStation 5 Set','Rentcam Game','playstation',250000,img.playstation,730,'Paket rental PS untuk event, gathering, waiting room, atau hiburan harian.'),
    item('tenda-camping-4p','Tenda Camping 4 Orang','Rentcam Outdoor','tent',150000,img.tent,740,'Tenda kapasitas empat orang dengan setup praktis untuk camping dan acara outdoor.'),
    item('rental-iphone-15-pro','Rental iPhone 15 Pro','Rentcam Gadget','iphone',300000,img.iphone,750,'Rental iPhone untuk kebutuhan konten, dokumentasi, livestream, atau testing aplikasi.'),
    item('paket-makanan-umkm','Paket Makanan UMKM Event','Rentcam UMKM','food',50000,img.food,760,'Paket makanan UMKM untuk produksi, acara komunitas, meeting, atau kebutuhan crew.')
  ];
  const aliases={camping:['camping','alat camping','camp'],car:['car','mobil','rental mobil'],motorbike:['motorbike','motor','rental motor'],playstation:['playstation','ps','rental ps','rental playstation'],tent:['tent','tenda'],iphone:['iphone','rental iphone'],food:['food','makanan','umkm','makanan umkm']};
  window.RENTCAM_GENERAL_PRODUCTS=products;
  let liveRows=[];
  let livePromise=null;
  function currentProducts(){try{return Array.isArray(P)?P:null}catch(e){return null}}
  function overrides(){return window.RENTCAM_CMS_CONFIG?.productOverrides||{}}
  function inferBrand(name,brand){if(brand)return brand;const n=String(name||'');if(/^ARRI\b/i.test(n))return 'ARRI';if(/^Sony\b/i.test(n))return 'Sony';if(/^RED\b/i.test(n))return 'RED';return 'Rentcam'}
  function mergeLiveRows(){
    const list=currentProducts();if(!list||!liveRows.length)return false;
    const ids=new Set(list.map(p=>String(p.id))),ov=overrides();let added=0;
    liveRows.forEach(row=>{
      const raw=row?.product||{},id=String(row?.id||raw.id||'').trim();if(!id||ids.has(id))return;
      const x=ov[id]||{},name=String(x.name||raw.name||id),brand=inferBrand(name,x.brand||raw.brand),category=String(x.category||raw.category||raw.cat||'Accessories'),main=String(x.mainCategory||raw.mainCategory||category.toLowerCase()),image=x.image||x.img||raw.image||raw.img||'',images=(Array.isArray(x.images)&&x.images.length?x.images:(Array.isArray(raw.images)&&raw.images.length?raw.images:[image])).filter(Boolean);
      list.push({id,name,brand,cat:category,category,mainCategory:main,subCategory:x.subCategory||'',price:Number(x.price??raw.price)||0,priceAud:Number(x.price??raw.price)||0,img:images[0]||'',image:images[0]||'',images,stock:Number(x.stock??raw.stock??1)||0,sku:x.sku||raw.sku||id,placement:x.placement||raw.placement||'catalog',sortOrder:Number(x.sortOrder??raw.sortOrder??999),active:x.active!==false&&raw.active!==false,deleted:x.deleted===true||raw.deleted===true,description:x.description||raw.description||'',spec:Array.isArray(x.spec)?x.spec:[],inc:Array.isArray(x.included)?x.included:[],included:Array.isArray(x.included)?x.included:[],accessories:Array.isArray(x.accessories)?x.accessories:[]});
      ids.add(id);added++;
    });
    return added>0;
  }
  async function syncLiveCatalog(){
    if(livePromise)return livePromise;
    livePromise=fetch(SB+'/rest/v1/rentcam_order_catalog?select=id,product&order=id.asc&limit=2000',{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'}).then(r=>{if(!r.ok)throw Error('catalog '+r.status);return r.json()}).then(rows=>{liveRows=Array.isArray(rows)?rows:[];return mergeLiveRows()}).catch(()=>false).finally(()=>{livePromise=null});
    return livePromise;
  }
  function ensureProducts(){
    const list=currentProducts();if(!list)return false;const cms=window.RENTCAM_CMS_CONFIG;let added=0;
    if(cms?.generalProductsEnabled){const ids=new Set(list.map(p=>String(p.id)));products.forEach(p=>{if(!ids.has(p.id)){list.push({...p});ids.add(p.id);added++}})}
    return mergeLiveRows()||added>0;
  }
  const originalGroup=window.rentcamCatalogGroup;
  window.rentcamCatalogGroup=function(p){const c=String(p?.mainCategory||p?.cat||p?.category||'').toLowerCase();for(const [key,vals] of Object.entries(aliases)){if(vals.includes(c))return key}return originalGroup?originalGroup(p):'accessories'};
  if(typeof window.rentcamSyncProductsFromCMS==='function'){
    const originalSync=window.rentcamSyncProductsFromCMS;
    window.rentcamSyncProductsFromCMS=function(){const result=originalSync.apply(this,arguments);ensureProducts();return result};
  }
  const cartIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L21 8H7"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>';
  window.rentcamAddToCart=function(id){
    if(typeof window.add==='function')return window.add(id,1);
    let c=[];try{c=JSON.parse(localStorage.getItem('bsm_cart_cm')||'[]')}catch(_){};const hit=c.find(x=>String(x.id)===String(id));hit?hit.q=(Number(hit.q)||0)+1:c.push({id,q:1});localStorage.setItem('bsm_cart_cm',JSON.stringify(c));const count=document.getElementById('count');if(count)count.textContent=c.reduce((s,x)=>s+(Number(x.q)||0),0);
  };
  function installFinalCardRenderer(){
    if(window.pc?.__rentcamLiveCart)return false;
    window.pc=function(p){
      if(p?._cmsActive===false||p?.active===false||p?.deleted===true)return '';
      const image=p?.images?.[0]||p?.img||'';
      return `<article class="pcard" data-product-id="${esc(p.id)}" onclick="go('/produk/${esc(p.id)}')"><div class="pimg" style="position:relative"><span class="arri-source-badge">${esc(p.brand||'RENTCAM')}</span><img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy"><div class="hoverBtns"><button type="button" onclick="event.stopPropagation();go('/produk/${esc(p.id)}')">Quick view</button></div></div><div class="pbrand">${esc(p.brand||'')} · ${esc(p.cat||p.category||'')}</div><div class="pname">${esc(p.name||'')}</div><div class="price"><span class="cms-product-price">${rupiah(p.price)}</span></div><button type="button" class="product-card-cart-btn" onclick="event.preventDefault();event.stopPropagation();rentcamAddToCart('${esc(p.id)}')">${cartIcon}<span class="cart-desktop-label">Tambah ke Keranjang</span><span class="cart-mobile-label">Tambah</span></button></article>`;
    };
    window.pc.__rentcamLiveCart=true;return true;
  }
  function hardenHeaderCart(){const b=document.querySelector('.rc-cart-button');if(!b)return;b.disabled=false;b.style.pointerEvents='auto';b.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.go==='function')window.go('/cart');else location.assign('/cart')}}
  function addStyle(){
    if(document.getElementById('rentcam-general-products-style'))return;
    const s=document.createElement('style');s.id='rentcam-general-products-style';s.textContent=`#app .general-rental-section{border-top:1px solid #e6e6e3!important;margin-top:24px!important;padding-top:24px!important}#app .general-rental-section .home-product-head p{max-width:520px!important}.rc-cart-button{pointer-events:auto!important}@media(max-width:620px){#app .general-rental-section{margin-top:18px!important;padding-top:20px!important}}`;document.head.appendChild(s);
  }
  function card(p){return `<article class="home-category-card" data-product-id="${esc(p.id)}" role="link" tabindex="0" onclick="go('/produk/${esc(p.id)}')" onkeydown="if(event.key==='Enter'){go('/produk/${esc(p.id)}')}"><div class="home-category-image"><span class="home-category-badge">${esc(p.brand)}</span><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"></div><div class="home-category-body"><div class="home-category-brand">${esc(p.brand)} · ${esc(p.cat)}</div><div class="home-category-name">${esc(p.name)}</div><div class="home-category-actions"><button type="button" class="home-add-cart" onclick="event.stopPropagation();rentcamAddToCart('${esc(p.id)}')">${cartIcon}<span>Tambah</span></button><button type="button" class="home-open-cart" aria-label="Buka keranjang" onclick="event.stopPropagation();go('/cart')">${cartIcon}</button></div></div></article>`}
  function mountHome(){
    if(location.pathname!=='/'||!document.querySelector('#app .home-product-sections'))return;addStyle();const host=document.querySelector('#rentcam-home-product-sections .container,#app .home-product-sections .container');if(!host)return;let section=document.getElementById('rentcam-general-rental-section');const html=`<div class="home-product-head"><div><h2>Rental Lainnya</h2><p>Produk tambahan untuk kebutuhan event, perjalanan, outdoor, gadget dan UMKM.</p></div><button class="home-product-view" onclick="go('/produk')">Lihat semua →</button></div><div class="home-product-grid">${products.map(card).join('')}</div>`;if(!section){section=document.createElement('section');section.id='rentcam-general-rental-section';section.className='home-product-section general-rental-section';section.innerHTML=html;const article=host.querySelector('.home-journal');if(article)article.insertAdjacentElement('beforebegin',section);else host.appendChild(section)}else if(section.innerHTML!==html)section.innerHTML=html;
  }
  function tick(forceRender=false){const rendererChanged=installFinalCardRenderer(),changed=ensureProducts();hardenHeaderCart();mountHome();if((changed||rendererChanged||forceRender)&&location.pathname.startsWith('/produk')&&typeof render==='function'){try{render()}catch(e){}}}
  async function boot(force=false){await syncLiveCatalog();tick(force)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(true));else boot(true);
  document.addEventListener('rentcam-route-change',()=>setTimeout(()=>tick(false),0));
  document.addEventListener('rentcam-cms-updated',()=>setTimeout(()=>{mergeLiveRows();tick(false)},0));
  setTimeout(()=>tick(false),500);setTimeout(()=>tick(false),1200);
})();
