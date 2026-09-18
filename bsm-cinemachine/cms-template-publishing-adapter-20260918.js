/* Rentcam CMS template + editable website text + promo popup */
(function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store=()=>window.RentcamCmsConfig;
  const publishing=()=>window.RentcamCmsPublishing;
  const slug=s=>store().slug(s);
  const getCfg=()=>store().get();
  const allRentalCategories=store().allRentalCategories;
  const defaultLabels=store().defaultLabels;
  const toast=(msg,bad=false)=>{
    const n=document.createElement('div');
    n.className='v5-toast '+(bad?'bad':'ok');
    n.textContent=msg;
    document.body.append(n);
    setTimeout(()=>n.classList.add('show'),20);
    setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),220)},1900);
  };
  async function saveConfig(){return store().save(getCfg())}
  const templates=store().templates;
  function mergeTemplate(key){store().applyTemplate(key)}
  function field(label,path,type='text',placeholder=''){
    const parts=path.split('.');
    let v=getCfg();
    for(const p of parts) v=v?.[p];
    const val=E(v??'');
    if(type==='checkbox') return `<label class="tpl-check"><input data-tpl-field="${E(path)}" type="checkbox" ${v!==false?'checked':''}> ${E(label)}</label>`;
    if(type==='textarea') return `<label>${E(label)}<textarea data-tpl-field="${E(path)}" placeholder="${E(placeholder)}">${val}</textarea></label>`;
    return `<label>${E(label)}<input data-tpl-field="${E(path)}" type="${E(type||'text')}" value="${val}" placeholder="${E(placeholder)}"></label>`;
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
  function syncWebsiteContent(){return publishing().syncWebsiteContent(baseProducts(),baseBanners())}
  function ensureProductLabels(){return store().ensureProductLabels()}
  function ensureAllRentalCategories(){return store().ensureCategories()}
  function categoryManager(){
    const cats=[...(getCfg().mainCategories||[])].sort((a,b)=>(a.sort||999)-(b.sort||999));
    return `<section class="tpl-card">
      <div class="tpl-card-head"><div><h3>Kategori All Rental di CMS</h3><p>Kategori ini muncul di dropdown website dan Master Data. Semua tetap bisa diedit, dinonaktifkan, atau dihapus dari menu Kategori & Brand.</p></div><button data-tpl-action="ensure-categories">Isi kategori all rental</button></div>
      <div class="tpl-cat-list">${cats.map(c=>`<span class="${c.active===false?'off':''}">${E(c.name||c.id)}</span>`).join('')||'<p>Belum ada kategori.</p>'}</div>
    </section>`;
  }
  function labelManager(){
    ensureProductLabels();
    const c=getCfg();
    const labels=[...(c.productLabels||[])].sort((a,b)=>(a.sort||999)-(b.sort||999));
    const selected=new Set((c.popup?.labels||[]).map(x=>String(x).toLowerCase()));
    return `<section class="tpl-card">
      <div class="tpl-card-head"><div><h3>Master Label Produk</h3><p>Label ini muncul di form produk dan bisa dipilih banyak untuk popup. Tombol Lihat produk akan membuka katalog berisi produk dengan label tersebut saja.</p></div><button data-tpl-action="add-label">+ Tambah label</button></div>
      <div class="tpl-label-list">${labels.map((l,i)=>`<div class="tpl-label-row ${l.active===false?'off':''}">
        <label><input type="checkbox" data-popup-label="${E(l.name||l.id)}" ${selected.has(String(l.name||l.id).toLowerCase())?'checked':''}> <strong>${E(l.name||l.id)}</strong><small>${l.active===false?'Hidden':'Aktif'}</small></label>
        <span><button data-tpl-action="edit-label" data-label-name="${E(l.name||l.id)}">Edit</button><button data-tpl-action="toggle-label" data-label-name="${E(l.name||l.id)}">${l.active===false?'Aktifkan':'Hide'}</button><button data-tpl-action="delete-label" data-label-name="${E(l.name||l.id)}">Hapus</button></span>
      </div>`).join('')}</div>
    </section>`;
  }
  function findLabel(name){
    const labels=getCfg().productLabels||[];
    return labels.findIndex(x=>String(x.name||x.id).toLowerCase()===String(name||'').toLowerCase());
  }
  function updatePopupLabelsFromChecks(){
    const c=getCfg();
    c.popup=c.popup||{};
    c.popup.labels=[...document.querySelectorAll('[data-popup-label]:checked')].map(x=>x.dataset.popupLabel).filter(Boolean);
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
      ${categoryManager()}
      ${labelManager()}
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
        <h3>Pajak & Checkout</h3>
        <p>Atur PPN yang dipakai di keranjang, order CMS, dan teks WhatsApp.</p>
        <div class="tpl-fields">
          ${field('Aktifkan PPN','tax.enabled','checkbox')}
          ${field('Persentase PPN (%)','tax.rate','number','11')}
          ${field('Nama label pajak','tax.label','text','PPN')}
        </div>
      </section>
      <section class="tpl-card">
        <h3>Popup Promo / Produk Baru</h3>
        <div class="tpl-fields">
          ${field('Tampilkan popup di website','popup.enabled','checkbox')}
          ${selectField('Mode lama popup','popup.type',[['promo','Promo'],['new','Barang baru']])}
          ${field('Label tombol pinggir','popup.floatLabel','text','PROMO / NEW / DISKON')}
          ${field('Label kecil','popup.eyebrow')}
          ${field('Judul','popup.title')}
          ${field('Deskripsi','popup.text','textarea')}
          ${field('Nama tombol bawah','popup.buttonLabel','text','Lihat produk')}
          ${field('ID produk tujuan manual','popup.productId','text','Kosongkan agar otomatis ikut promo/new pertama')}
          ${field('Link tombol manual','popup.buttonLink','text','Kosongkan agar otomatis ke detail produk')}
          ${field('URL gambar popup','popup.image')}
          ${field('Muncul lagi setelah detik','popup.reappearSeconds','number','8')}
          ${field('Kode versi popup','popup.version','text','promo-1')}
        </div>
        <p class="tpl-note">Tombol pinggir bisa digeser. Kalau pengunjung sembunyikan, tombol muncul lagi sesuai detik di atas.</p>
      </section>
    </div>`;
  }
  function style(){
    if(document.getElementById('tpl-cms-style')) return;
    const s=document.createElement('style');
    s.id='tpl-cms-style';
    s.textContent=`
      .tpl-system{max-width:1240px}.tpl-hero,.tpl-card{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:22px;margin-bottom:16px;box-shadow:0 10px 28px rgba(24,38,57,.04)}.tpl-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,#101827,#17324f);color:#fff}.tpl-hero small{letter-spacing:.14em;color:#9bc1ff;font-weight:800}.tpl-hero h2{font-size:28px;line-height:1.06;margin:8px 0}.tpl-hero p{color:#d8e5f8;max-width:620px}.tpl-hero button,.tpl-card button{border:0;border-radius:12px;background:#f26a21;color:#fff;font-weight:850;padding:13px 16px;cursor:pointer}.tpl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.tpl-sync-card,.tpl-card-head{display:flex;align-items:center;justify-content:space-between;gap:18px}.tpl-sync-card{background:#f8fbff}.tpl-card h3{margin:0 0 8px;font-size:20px}.tpl-card p,.tpl-note{color:#6d7888;font-size:13px;line-height:1.55}.tpl-cat-list{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.tpl-cat-list span{border:1px solid #dce5ef;background:#f6f9fc;border-radius:999px;padding:9px 12px;font-size:13px;font-weight:800;color:#26354a}.tpl-cat-list span.off{opacity:.45;text-decoration:line-through}.tpl-label-list{display:grid;gap:10px;margin-top:14px}.tpl-label-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e3e8ef;border-radius:14px;padding:12px;background:#fbfcfe}.tpl-label-row label{display:flex;align-items:center;gap:10px;margin:0}.tpl-label-row small{margin-left:8px;color:#7a8797;font-size:11px}.tpl-label-row span{display:flex;gap:6px;flex-wrap:wrap}.tpl-label-row button{padding:8px 10px!important;font-size:11px!important;border-radius:9px!important;background:#111!important}.tpl-label-row button:last-child{background:#fff0f0!important;color:#b52e2e!important;border:1px solid #ffd1d1!important}.tpl-label-row.off{opacity:.55}.tpl-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.tpl-fields label{display:block;font-size:12px;font-weight:800;color:#3f4b5d}.tpl-fields input,.tpl-fields textarea,.tpl-fields select{display:block;width:100%;margin-top:7px;border:1px solid #dbe2eb;border-radius:11px;padding:11px 12px;font:inherit;font-size:13px;background:#fff}.tpl-fields textarea{min-height:88px}.tpl-check{display:flex!important;align-items:center;gap:9px;background:#f6f8fb;border:1px solid #e1e7ef;border-radius:12px;padding:13px}.tpl-check input{width:auto!important;margin:0!important}@media(max-width:850px){.tpl-hero,.tpl-sync-card,.tpl-card-head,.tpl-label-row{display:block}.tpl-label-row span{margin-top:10px}.tpl-grid,.tpl-fields{grid-template-columns:1fr}.tpl-hero h2{font-size:23px}.tpl-card button{margin-top:8px}}
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
      if(btn.dataset.tplAction==='ensure-categories'){
        ensureAllRentalCategories();
        render();
        await saveConfig();
        toast('Kategori all rental sudah masuk ke CMS.');
      }
      if(btn.dataset.tplAction==='add-label'){
        ensureProductLabels();
        const name=prompt('Nama label baru, contoh: FLASH SALE, BEST SELLER, DISKON 50%');
        if(!name)return;
        const c=getCfg();
        if(c.productLabels.some(x=>String(x.name||'').toLowerCase()===String(name).toLowerCase()))return toast('Label sudah ada.',true);
        c.productLabels.push({id:slug(name),name:String(name).trim().toUpperCase(),active:true,sort:(c.productLabels.length+1)*10});
        render();
        await saveConfig();
        toast('Label baru tersimpan.');
      }
      if(btn.dataset.tplAction==='edit-label'){
        const c=getCfg(),i=findLabel(btn.dataset.labelName);
        if(i<0)return;
        const name=prompt('Ubah nama label',c.productLabels[i].name||'');
        if(!name)return;
        const old=c.productLabels[i].name;
        c.productLabels[i].name=String(name).trim().toUpperCase();
        c.productLabels[i].id=slug(name);
        if(c.popup?.labels)c.popup.labels=c.popup.labels.map(x=>String(x).toLowerCase()===String(old).toLowerCase()?c.productLabels[i].name:x);
        render();
        await saveConfig();
        toast('Label diperbarui.');
      }
      if(btn.dataset.tplAction==='toggle-label'){
        const c=getCfg(),i=findLabel(btn.dataset.labelName);
        if(i<0)return;
        c.productLabels[i].active=c.productLabels[i].active===false;
        render();
        await saveConfig();
        toast('Status label diperbarui.');
      }
      if(btn.dataset.tplAction==='delete-label'){
        const c=getCfg(),i=findLabel(btn.dataset.labelName);
        if(i<0)return;
        const name=c.productLabels[i].name;
        c.productLabels.splice(i,1);
        if(c.popup?.labels)c.popup.labels=c.popup.labels.filter(x=>String(x).toLowerCase()!==String(name).toLowerCase());
        render();
        await saveConfig();
        toast('Label dihapus.');
      }
      if(btn.dataset.tplAction==='save'){
        updatePopupLabelsFromChecks();
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
  document.addEventListener('change',e=>{
    if(!e.target.matches?.('[data-popup-label]')) return;
    updatePopupLabelsFromChecks();
  });
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true});
  install();
})();
