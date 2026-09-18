/* Rentcam CMS Branding panel — CMS-only adapter. */
(function(){
  if(!location.pathname.startsWith('/cms'))return;
  const branding=()=>window.RentcamCmsBranding;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon='<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 14l2.5-3 2 2 2.5-3 3 4"/></svg>';

  function style(){
    if(document.getElementById('cms-branding-style'))return;
    const s=document.createElement('style');s.id='cms-branding-style';s.textContent=`
      .site-logo-panel{margin:0 0 20px;padding:20px;border:1px solid #e2e8f0;border-radius:16px;background:linear-gradient(145deg,#fff,#f8fafc)}
      .site-logo-panel h3{margin:0 0 5px;font-size:19px}.site-logo-panel>p{margin:0 0 16px;color:#64748b}
      .site-logo-grid{display:grid;grid-template-columns:220px minmax(0,1fr);gap:20px;align-items:center}
      .site-logo-preview{display:grid;place-items:center;min-height:118px;padding:15px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff}
      .site-logo-preview img{max-width:180px;max-height:82px;object-fit:contain}
      .site-logo-placeholder{display:grid;place-items:center;gap:8px;color:#94a3b8;text-align:center}
      .site-logo-placeholder svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:1.7}
      .site-logo-actions{display:flex;flex-wrap:wrap;gap:10px}
      .site-logo-upload,.site-logo-remove{display:inline-flex;align-items:center;gap:8px;padding:11px 15px;border-radius:11px;font-weight:700;cursor:pointer}
      .site-logo-upload{background:#111827;color:#fff}.site-logo-remove{border:1px solid #fecaca;background:#fff;color:#dc2626}
      .site-logo-upload svg,.site-logo-remove svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}
      .site-logo-size-controls{display:grid;gap:12px;margin-top:18px;padding:14px;border-radius:13px;background:#fff;border:1px solid #e2e8f0}
      .site-logo-size-row{display:grid;grid-template-columns:120px minmax(100px,1fr) 58px;align-items:center;gap:10px}
      .site-logo-size-row b{font-size:13px}.site-logo-size-row input{width:100%;accent-color:#111827}
      .site-logo-size-value{text-align:center;padding:6px;border-radius:8px;background:#f1f5f9;font-size:12px;font-weight:800}
      .site-logo-size-reset{justify-self:start;border:0;background:none;color:#2563eb;font-weight:700;padding:2px 0;cursor:pointer}
      .site-logo-help,.site-logo-status{display:block;margin-top:10px;font-size:12px;color:#64748b}
      .site-logo-status.ok{color:#15803d}.site-logo-status.bad{color:#dc2626}
      @media(max-width:760px){.site-logo-grid{grid-template-columns:1fr}.site-logo-preview{min-height:105px}.site-logo-size-row{grid-template-columns:100px minmax(80px,1fr) 54px}}
    `;document.head.appendChild(s);
  }
  function setStatus(panel,msg,type=''){
    const el=panel?.querySelector('.site-logo-status');if(!el)return;
    el.className='site-logo-status '+type;el.textContent=msg;
  }
  function refreshPreview(panel,url){
    const host=panel?.querySelector('.site-logo-preview');if(!host)return;
    host.innerHTML=url?'<img src="'+esc(url)+'" alt="Preview logo website">':'<div class="site-logo-placeholder">'+icon+'<span>Belum ada logo website</span></div>';
  }
  function syncField(path,value){
    const input=document.querySelector('[data-field="'+path+'"]');if(!input)return;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function install(){
    style();
    if(!branding())return;
    const urlInput=document.querySelector('.v5-content [data-field="general.logoUrl"]');
    if(!urlInput)return;
    const card=urlInput.closest('.v5-card');
    if(!card||card.querySelector('.site-logo-panel'))return;
    const state=branding().state();
    card.querySelector('.v5-head')?.insertAdjacentHTML('afterend',
      '<section class="site-logo-panel"><h3>Logo Website</h3><p>Logo ini tampil di header website pada HP dan komputer.</p>'+
      '<div class="site-logo-grid"><div class="site-logo-preview"></div><div>'+
      '<div class="site-logo-actions"><label class="site-logo-upload"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>Upload logo<input type="file" data-site-logo-file accept="image/png,image/jpeg,image/webp" hidden></label>'+
      '<button type="button" class="site-logo-remove" data-site-logo-remove><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>Hapus</button></div>'+
      '<div class="site-logo-size-controls">'+
      '<label class="site-logo-size-row"><b>Ukuran HP</b><input type="range" min="60" max="190" step="5" value="'+state.mobile+'" data-field="general.logoMobileWidth" data-site-logo-size="mobile"><output class="site-logo-size-value" data-size-value="mobile">'+state.mobile+' px</output></label>'+
      '<label class="site-logo-size-row"><b>Ukuran komputer</b><input type="range" min="80" max="280" step="5" value="'+state.desktop+'" data-field="general.logoDesktopWidth" data-site-logo-size="desktop"><output class="site-logo-size-value" data-size-value="desktop">'+state.desktop+' px</output></label>'+
      '<button type="button" class="site-logo-size-reset" data-site-logo-size-reset>Gunakan ukuran standar</button></div>'+
      '<small class="site-logo-help">PNG transparan disarankan. Maksimal 5 MB.</small><span class="site-logo-status">Atur ukuran lalu klik Simpan di kanan atas.</span>'+
      '</div></div></section>');
    refreshPreview(card.querySelector('.site-logo-panel'),state.logoUrl);
  }

  document.addEventListener('input',e=>{
    if(!e.target.matches('[data-site-logo-size]'))return;
    const kind=e.target.dataset.siteLogoSize,value=branding().setSize(kind,e.target.value),panel=e.target.closest('.site-logo-panel');
    const out=panel?.querySelector('[data-size-value="'+kind+'"]');if(out)out.textContent=value+' px';
    const img=panel?.querySelector('.site-logo-preview img');if(img)img.style.maxWidth=value+'px';
    setStatus(panel,'Ukuran diubah. Klik Simpan untuk menerapkan.','ok');
  });
  document.addEventListener('change',async e=>{
    if(!e.target.matches('[data-site-logo-file]'))return;
    const panel=e.target.closest('.site-logo-panel'),file=e.target.files?.[0];
    setStatus(panel,'Mengupload logo...');
    try{
      const url=await branding().upload(file);
      syncField('general.logoUrl',url);refreshPreview(panel,url);
      setStatus(panel,'Logo berhasil diupload. Klik Simpan untuk menerapkan ke website.','ok');
    }catch(err){setStatus(panel,err.message,'bad')}
    finally{e.target.value=''}
  });
  document.addEventListener('click',e=>{
    const reset=e.target.closest('[data-site-logo-size-reset]');
    if(reset){
      const panel=reset.closest('.site-logo-panel'),state=branding().resetSizes();
      [['mobile',state.mobile],['desktop',state.desktop]].forEach(([kind,value])=>{
        const input=panel.querySelector('[data-site-logo-size="'+kind+'"]');
        if(input){input.value=value;syncField(kind==='mobile'?'general.logoMobileWidth':'general.logoDesktopWidth',value)}
        const out=panel.querySelector('[data-size-value="'+kind+'"]');if(out)out.textContent=value+' px';
      });
      setStatus(panel,'Ukuran standar dipilih. Klik Simpan.','ok');return;
    }
    const remove=e.target.closest('[data-site-logo-remove]');
    if(remove){
      const panel=remove.closest('.site-logo-panel');branding().remove();syncField('general.logoUrl','');refreshPreview(panel,'');
      setStatus(panel,'Logo dihapus dari pengaturan. Klik Simpan.','ok');
    }
  });

  addEventListener('DOMContentLoaded',()=>{install();new MutationObserver(install).observe(document.body,{childList:true,subtree:true})});
  install();
})();