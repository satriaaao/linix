/* Rentcam product watermark runtime — live CMS controlled */
/* deploy-trigger: watermark-cms */
(()=>{
  if(window.__rentcamProductWatermarkRuntime)return;
  window.__rentcamProductWatermarkRuntime=true;
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  let current=null,raf=0;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
  function cfg(){
    const root=window.RENTCAM_CMS_CONFIG||{};
    const w=root.watermark||current||{};
    return {
      enabled:w.enabled!==false,
      logoUrl:String(w.logoUrl||root.general?.logoUrl||'').trim(),
      opacity:clamp(w.opacity||18,5,80)/100,
      size:clamp(w.size||18,5,60),
      position:String(w.position||'center')
    };
  }
  function productImage(img){
    if(!img||img.classList.contains('rc-product-watermark'))return false;
    if(img.closest('.header,.footer,.brand,.promo-rail,.promo-tab,.rc-included-details'))return false;
    if(location.pathname.startsWith('/produk/')){
      return !!img.closest('#app');
    }
    return !!img.closest('.pcard,.product-card,.home-category-card,[data-product-card],[data-go^="/produk/"],a[href^="/produk/"]');
  }
  function posStyle(p){
    if(p==='top-left')return 'left:10px;top:10px;';
    if(p==='top-right')return 'right:10px;top:10px;';
    if(p==='bottom-left')return 'left:10px;bottom:10px;';
    if(p==='bottom-right')return 'right:10px;bottom:10px;';
    return 'left:50%;top:50%;transform:translate(-50%,-50%);';
  }
  function apply(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const w=cfg();
      document.querySelectorAll('.rc-product-watermark').forEach(x=>{
        if(!w.enabled||!w.logoUrl)x.remove();
      });
      if(!w.enabled||!w.logoUrl)return;
      [...document.querySelectorAll('#app img')].filter(productImage).forEach(img=>{
        const host=img.parentElement;
        if(!host)return;
        const cs=getComputedStyle(host);
        if(cs.position==='static')host.style.position='relative';
        let mark=[...host.children].find(x=>x.classList?.contains('rc-product-watermark'));
        if(!mark){
          mark=document.createElement('img');
          mark.className='rc-product-watermark';
          mark.alt='';
          mark.setAttribute('aria-hidden','true');
          host.appendChild(mark);
        }
        mark.src=w.logoUrl;
        mark.style.cssText='position:absolute;z-index:9;pointer-events:none;user-select:none;object-fit:contain;width:'+w.size+'%;max-width:'+w.size+'%;max-height:'+Math.max(16,w.size)+'%;opacity:'+w.opacity+';filter:none;'+posStyle(w.position);
      });
    });
  }
  async function pull(){
    try{
      const r=await fetch(SB+'/rest/v1/rentcam_cms_config?id=eq.1&select=config',{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      current=d?.[0]?.config?.watermark||null;
      if(!window.RENTCAM_CMS_CONFIG&&d?.[0]?.config)window.RENTCAM_CMS_CONFIG=d[0].config;
      apply();
    }catch(_){}
  }
  const style=document.createElement('style');
  style.id='rc-product-watermark-style';
  style.textContent='.rc-product-watermark{display:block!important}.pcard,.product-card,.home-category-card{overflow:hidden}';
  document.head.appendChild(style);
  document.addEventListener('rentcam-cms-updated',e=>{current=e.detail?.watermark||null;apply()});
  document.addEventListener('rentcam-route-change',()=>setTimeout(apply,0));
  new MutationObserver(apply).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  pull();
  setTimeout(apply,200);
  setTimeout(apply,700);
})();