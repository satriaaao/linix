/* Rentcam quotation hotfix: remove legacy BSM fallback and restore product picker. */
(()=>{
  if(typeof window==='undefined') return;
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money=value=>'Rp'+Number(value||0).toLocaleString('id-ID');
  window.quotePrice=product=>Math.max(0,Number(product?.price??product?.price_per_day??0)||0);

  async function getStock(form){
    const start=form?.elements?.start?.value,end=form?.elements?.end?.value;
    if(!start||!end)throw new Error('Pilih tanggal sewa terlebih dahulu.');
    const r=await fetch(SB+'/rest/v1/rpc/rentcam_admin_stock',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_start:start,p_end:end,p_exclude:null})});
    const data=await r.json();
    if(!r.ok)throw new Error(data?.message||'Produk tidak dapat dimuat.');
    return Array.isArray(data)?data:[];
  }

  function rowHtml(products,selectedId){
    const options=products.map(p=>`<option value="${esc(p.id)}"${p.id===selectedId?' selected':''}>${esc(p.name)}${p.brand?' · '+esc(p.brand):''} · tersedia ${Number(p.available||0)}</option>`).join('');
    return `<tr class="pro-item-row"><td data-row-number></td><td><select data-item required><option value="">Pilih produk dari master</option>${options}</select><small data-row-stock></small></td><td><input data-quantity type="number" min="1" max="100" value="1" required></td><td data-row-days>1</td><td data-row-price>Rp0</td><td><strong data-row-amount>Rp0</strong><label class="quote-item-discount" hidden><span><input data-discount-check type="checkbox"> Diskon</span><input data-item-discount type="number" min="0" max="100" value="0" disabled> %</label><label class="bsm-tentative"><input data-tentative type="checkbox"> Tentatif <input data-tentative-date type="date" disabled></label></td><td><button type="button" data-pro-action="remove-item" aria-label="Hapus produk">×</button></td></tr>`;
  }

  function renderPicker(products){
    document.getElementById('quotePicker')?.remove();
    const categories=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'id'));
    const modal=document.createElement('div');
    modal.id='quotePicker';
    modal.innerHTML=`<section class="qp-panel" role="dialog" aria-modal="true" aria-labelledby="qpTitle"><header><div><h2 id="qpTitle">Pilih Produk Rental</h2><p>Cari produk lalu tambahkan ke penawaran.</p></div><button type="button" data-qp-close>✕ Tutup</button></header><div class="qp-search"><input id="qpSearch" type="search" placeholder="Cari nama atau brand..." autocomplete="off"><select id="qpCategory"><option value="">Semua kategori</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div><div id="qpGrid"></div><footer><span id="qpCount"></span><button type="button" data-qp-close>Selesai</button></footer></section>`;
    document.body.append(modal);
    const search=modal.querySelector('#qpSearch'),category=modal.querySelector('#qpCategory'),grid=modal.querySelector('#qpGrid'),count=modal.querySelector('#qpCount');
    const draw=()=>{
      const q=search.value.trim().toLowerCase(),cat=category.value;
      const filtered=products.filter(p=>{const hay=(String(p.name||'')+' '+String(p.brand||'')).toLowerCase();return(!q||hay.includes(q))&&(!cat||String(p.category||'')===cat)});
      count.textContent=`${filtered.length} produk`;
      grid.innerHTML=filtered.map(p=>`<article><small>${esc(p.category||'Produk Rental')}</small><h3>${esc(p.name||'Tanpa nama')}</h3><p>${esc(p.brand||'')} · stok tersedia <b>${Number(p.available||0)}</b></p><b>${money(window.quotePrice(p))} / hari</b><button type="button" data-qp-add="${esc(p.id)}" ${Number(p.available||0)<=0?'disabled':''}>${Number(p.available||0)>0?'Tambah':'Stok habis'}</button></article>`).join('')||'<p style="padding:24px">Produk tidak ditemukan.</p>';
    };
    search.addEventListener('input',draw);category.addEventListener('change',draw);
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-qp-close]')){modal.remove();return}const add=e.target.closest('[data-qp-add]');if(!add)return;const body=document.querySelector('#proItemRows');if(!body)return;body.insertAdjacentHTML('beforeend',rowHtml(products,add.dataset.qpAdd));body.lastElementChild?.querySelector('[data-item]')?.dispatchEvent(new Event('change',{bubbles:true}));modal.remove()});
    draw();setTimeout(()=>search.focus(),0);
  }

  window.productPicker=async()=>{
    const form=document.querySelector('#proDirectForm');if(!form)return;
    const button=document.querySelector('[data-pro-action="add-item"]'),message=form.querySelector('[data-msg]');
    try{if(button)button.disabled=true;if(message)message.textContent='Memuat produk...';const products=await getStock(form);if(!products.length)throw new Error('Belum ada produk aktif untuk periode ini.');if(message)message.textContent='';renderPicker(products)}catch(err){if(message)message.textContent=err.message||'Produk tidak dapat dimuat.'}finally{if(button)button.disabled=false}
  };

  if(typeof document==='undefined')return;
  const style=document.createElement('style');style.id='quotationProductFix20260915';style.textContent=`.bsm-logo-letters{display:none!important}.bsm-company-head:has(.bsm-logo-letters){justify-content:flex-end!important}#quotePicker .qp-panel{box-shadow:0 28px 80px rgba(15,23,42,.24)}#quotePicker #qpGrid article p{font-size:11px!important;color:#64748b!important;margin:0 0 10px!important}#quotePicker #qpGrid article button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:760px){#quotePicker .qp-panel{height:92dvh}#quotePicker #qpGrid{grid-template-columns:1fr 1fr}}`;document.head.append(style);
})();
