/* Rentalcamera CMS integrity fixes: quotation products, dynamic tax, legacy logo cleanup, real-data-only reports. */
(()=>{
  if(!location.pathname.startsWith('/cms'))return;
  const I=window.RentcamIntegrity;
  if(!I){console.error('RentcamIntegrity belum dimuat');return;}
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  window.quotePrice=product=>Math.max(0,Number(product?.price??product?.price_per_day??0)||0);

  async function getStock(form){
    const start=form?.elements?.start?.value,end=form?.elements?.end?.value;
    if(!start||!end)throw new Error('Pilih tanggal sewa terlebih dahulu.');
    const r=await fetch(SB+'/rest/v1/rpc/rentcam_admin_stock',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_start:start,p_end:end,p_exclude:null})});
    const data=await r.json().catch(()=>[]);
    if(!r.ok)throw new Error(data?.message||'Produk tidak dapat dimuat.');
    return Array.isArray(data)?data:[];
  }

  function rowHtml(products,selectedId){
    const options=products.map(p=>`<option value="${esc(p.id)}"${String(p.id)===String(selectedId)?' selected':''}>${esc(p.name)}${p.brand?' · '+esc(p.brand):''} · tersedia ${Number(p.available||0)}</option>`).join('');
    return `<tr class="pro-item-row"><td data-row-number></td><td><select data-item required><option value="">Pilih produk dari master</option>${options}</select><small data-row-stock></small></td><td><input data-quantity type="number" min="1" max="100" value="1" required></td><td data-row-days>1</td><td data-row-price>Rp0</td><td><strong data-row-amount>Rp0</strong><label class="quote-item-discount" hidden><span><input data-discount-check type="checkbox"> Diskon</span><input data-item-discount type="number" min="0" max="100" value="0" disabled> %</label><label class="bsm-tentative"><input data-tentative type="checkbox"> Tentatif <input data-tentative-date type="date" disabled></label></td><td><button type="button" data-pro-action="remove-item" aria-label="Hapus produk">×</button></td></tr>`;
  }

  function renderPicker(products){
    document.getElementById('quotePicker')?.remove();
    const categories=[...new Set(products.map(p=>p.category||p.main_category||p.mainCategory).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'id'));
    const modal=document.createElement('div');
    modal.id='quotePicker';
    modal.innerHTML=`<section class="qp-panel" role="dialog" aria-modal="true" aria-labelledby="qpTitle"><header><div><h2 id="qpTitle">Pilih Produk Rental</h2><p>Cari produk lalu tambahkan ke penawaran.</p></div><button type="button" data-qp-close>✕ Tutup</button></header><div class="qp-search"><input id="qpSearch" type="search" placeholder="Cari nama atau brand..." autocomplete="off"><select id="qpCategory"><option value="">Semua kategori</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div><div id="qpGrid"></div><footer><span id="qpCount"></span><button type="button" data-qp-close>Selesai</button></footer></section>`;
    document.body.append(modal);
    const search=modal.querySelector('#qpSearch'),category=modal.querySelector('#qpCategory'),grid=modal.querySelector('#qpGrid'),count=modal.querySelector('#qpCount');
    const draw=()=>{
      const q=search.value.trim().toLowerCase(),cat=category.value;
      const filtered=products.filter(p=>{const hay=(String(p.name||'')+' '+String(p.brand||'')).toLowerCase(),pcat=String(p.category||p.main_category||p.mainCategory||'');return(!q||hay.includes(q))&&(!cat||pcat===cat)});
      count.textContent=`${filtered.length} produk`;
      grid.innerHTML=filtered.map(p=>`<article><small>${esc(p.category||p.main_category||p.mainCategory||'Produk Rental')}</small><h3>${esc(p.name||'Tanpa nama')}</h3><p>${esc(p.brand||'')} · stok tersedia <b>${Number(p.available||0)}</b></p><b>${I.money(window.quotePrice(p))} / hari</b><button type="button" data-qp-add="${esc(p.id)}" ${Number(p.available||0)<=0?'disabled':''}>${Number(p.available||0)>0?'Tambah':'Stok habis'}</button></article>`).join('')||'<p style="padding:24px">Produk tidak ditemukan.</p>';
    };
    search.addEventListener('input',draw);category.addEventListener('change',draw);
    modal.addEventListener('click',e=>{
      if(e.target===modal||e.target.closest('[data-qp-close]')){modal.remove();return;}
      const add=e.target.closest('[data-qp-add]');if(!add)return;
      const body=document.querySelector('#proItemRows');if(!body)return;
      body.insertAdjacentHTML('beforeend',rowHtml(products,add.dataset.qpAdd));
      body.lastElementChild?.querySelector('[data-item]')?.dispatchEvent(new Event('change',{bubbles:true}));
      modal.remove();
    });
    draw();setTimeout(()=>search.focus(),0);
  }

  window.productPicker=async()=>{
    const form=document.querySelector('#proDirectForm');if(!form)return;
    const button=document.querySelector('[data-pro-action="add-item"]'),message=form.querySelector('[data-msg]');
    try{
      if(button)button.disabled=true;
      if(message)message.textContent='Memuat produk...';
      const products=await getStock(form);
      if(!products.length)throw new Error('Belum ada produk aktif untuk periode ini.');
      if(message)message.textContent='';
      renderPicker(products);
    }catch(err){if(message)message.textContent=err.message||'Produk tidak dapat dimuat.'}
    finally{if(button)button.disabled=false;}
  };

  function taxCfg(){return I.taxConfig(window.RENTCAM_CMS_CONFIG||{});}
  function ensureTaxInputs(form){
    const t=taxCfg();
    for(const [name,value] of [['tax_rate',t.rate],['tax_label',t.label]]){
      let input=form.querySelector(`input[name="${name}"]`);
      if(!input){input=document.createElement('input');input.type='hidden';input.name=name;form.append(input);}
      input.value=String(value);
    }
  }
  function renameTaxLabel(rate,label){
    const taxValue=document.querySelector('#quoteTaxValue');if(!taxValue)return;
    const row=taxValue.closest('tr,div');if(!row)return;
    const expected=`${label}${rate>0?' '+rate+'%':''}`;
    const walker=document.createTreeWalker(row,NodeFilter.SHOW_TEXT);
    let n;while((n=walker.nextNode())){const s=n.nodeValue.trim();if(/^PPN(?:\s+\d+(?:[.,]\d+)?%)?$/i.test(s)||/^PAJAK(?:\s+\d+(?:[.,]\d+)?%)?$/i.test(s)){n.nodeValue=n.nodeValue.replace(s,expected);break;}}
  }
  function syncTax(){
    const form=document.querySelector('#proDirectForm');if(!form)return;
    ensureTaxInputs(form);
    const t=taxCfg(),after=I.parseMoney(document.querySelector('#quoteAfterDiscount')?.textContent),enabled=Boolean(form.elements.tax_enabled?.checked)&&t.enabled;
    const tax=enabled?I.quoteTax(after,{tax:{enabled:true,rate:t.rate,label:t.label}}):0;
    const taxValue=document.querySelector('#quoteTaxValue'),finalValue=document.querySelector('#quoteFinalValue');
    if(taxValue)taxValue.textContent=I.money(tax);
    if(finalValue)finalValue.textContent=I.money(after+tax);
    renameTaxLabel(enabled?t.rate:0,t.label);
  }
  const scheduleTax=()=>setTimeout(syncTax,0);
  document.addEventListener('input',e=>{if(e.target.closest?.('#proDirectForm'))scheduleTax();});
  document.addEventListener('change',e=>{if(e.target.closest?.('#proDirectForm'))scheduleTax();});
  document.addEventListener('submit',e=>{if(e.target.matches?.('#proDirectForm')){ensureTaxInputs(e.target);syncTax();}},true);

  function removeLegacyBrand(){document.querySelectorAll('.bsm-logo-letters').forEach(el=>el.remove());}
  function removeFakeReports(){
    const system=document.querySelector('.pro-system');if(!system)return;
    const text=system.textContent||'';
    const isInstallment=text.includes('Cicilan & Pembiayaan')&&text.includes('ARRI Alexa Mini LF')&&text.includes('Lighting package');
    const isDepreciation=text.includes('Penyusutan Aset')&&text.includes('ARRI Alexa 35')&&text.includes('Sigma lens set');
    if(!isInstallment&&!isDepreciation)return;
    const title=isInstallment?'Cicilan & Pembiayaan':'Penyusutan Aset';
    const desc=isInstallment?'Belum ada sumber data cicilan riil yang tersambung. Data contoh sudah dihapus agar laporan tidak menyesatkan.':'Belum ada data harga perolehan dan umur aset riil yang tersambung. Data contoh sudah dihapus agar laporan tidak menyesatkan.';
    system.innerHTML=`<div class="pro-card pro-report-hero"><div><small>DATA RIIL SAJA</small><h2>${title}</h2><p>${desc}</p></div></div><div class="pro-card"><h3>Belum ada data</h3><p>Tambahkan sumber data riil terlebih dahulu sebelum laporan ini dihitung.</p></div>`;
  }

  const style=document.createElement('style');
  style.id='rentalIntegrityFix20260916';
  style.textContent=`.bsm-logo-letters{display:none!important}#quotePicker{position:fixed;inset:0;z-index:99999;background:#0f172a66;display:grid;place-items:center;padding:20px}#quotePicker .qp-panel{width:min(980px,96vw);max-height:92dvh;overflow:hidden;background:#fff;border-radius:18px;display:grid;grid-template-rows:auto auto 1fr auto;box-shadow:0 28px 80px rgba(15,23,42,.24)}#quotePicker header,#quotePicker footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid #e5e7eb}#quotePicker footer{border-top:1px solid #e5e7eb;border-bottom:0}#quotePicker .qp-search{display:grid;grid-template-columns:1fr 220px;gap:10px;padding:14px 18px}#quotePicker .qp-search input,#quotePicker .qp-search select{width:100%;padding:11px;border:1px solid #dbe1e8;border-radius:10px}#quotePicker #qpGrid{overflow:auto;padding:8px 18px 18px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#quotePicker #qpGrid article{border:1px solid #e5e7eb;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:7px}#quotePicker #qpGrid article p{font-size:11px;color:#64748b;margin:0 0 10px}#quotePicker #qpGrid article button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:760px){#quotePicker .qp-panel{height:92dvh}#quotePicker .qp-search{grid-template-columns:1fr}#quotePicker #qpGrid{grid-template-columns:1fr 1fr}}`;
  document.head.append(style);

  const observer=new MutationObserver(()=>{removeLegacyBrand();removeFakeReports();scheduleTax();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  removeLegacyBrand();removeFakeReports();scheduleTax();
})();
