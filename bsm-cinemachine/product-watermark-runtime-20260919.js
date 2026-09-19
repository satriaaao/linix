/* Rentcam product watermark runtime — visible + baked into downloadable images */
/* deploy-trigger: watermark-baked-download */
(()=>{
  if(window.__rentcamProductWatermarkRuntime)return;
  window.__rentcamProductWatermarkRuntime=true;

  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const processed=new WeakSet();
  const originalSrc=new WeakMap();
  let current=null,raf=0,logoPromise=null;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
  const isData=s=>String(s||'').startsWith('data:')||String(s||'').startsWith('blob:');

  function cfg(){
    const root=window.RENTCAM_CMS_CONFIG||{};
    const w=root.watermark||current||{};
    return {
      enabled:w.enabled!==false,
      logoUrl:String(w.logoUrl||root.general?.logoUrl||'').trim(),
      opacity:clamp(w.opacity||22,5,80)/100,
      size:clamp(w.size||18,5,60),
      position:String(w.position||'top-left'),
      offset:clamp(w.offset||8,2,24)
    };
  }

  function productImage(img){
    if(!img||img.classList.contains('rc-product-watermark'))return false;
    if(img.closest('.header,.footer,.brand,.promo-rail,.promo-tab,.rc-included-details,.rc-promo-widget'))return false;
    if(location.pathname.startsWith('/produk/')) return !!img.closest('#app');
    return !!img.closest('.pcard,.product-card,.home-category-card,[data-product-card],[data-go^="/produk/"],a[href^="/produk/"]');
  }

  function posStyle(p,o){
    const v=o+'%';
    if(p==='top-right')return 'right:'+v+';top:'+v+';';
    if(p==='bottom-left')return 'left:'+v+';bottom:'+v+';';
    if(p==='bottom-right')return 'right:'+v+';bottom:'+v+';';
    return 'left:'+v+';top:'+v+';';
  }

  function drawRect(canvas,ctx,imgW,imgH){
    const cW=canvas.width,cH=canvas.height;
    const scale=Math.min(cW/imgW,cH/imgH);
    const w=imgW*scale,h=imgH*scale;
    return {x:(cW-w)/2,y:(cH-h)/2,w,h};
  }

  function wmRect(base,logo,w){
    const wmW=Math.max(64,base.w*(w.size/100));
    const wmH=wmW*((logo.height||logo.naturalHeight||1)/(logo.width||logo.naturalWidth||1));
    const m=Math.max(8,base.w*(w.offset/100));
    let x=base.x+m,y=base.y+m;
    if(w.position==='top-right')x=base.x+base.w-wmW-m;
    if(w.position==='bottom-left')y=base.y+base.h-wmH-m;
    if(w.position==='bottom-right'){x=base.x+base.w-wmW-m;y=base.y+base.h-wmH-m;}
    return {x,y,w:wmW,h:wmH};
  }

  async function loadBitmapFromUrl(src){
    const r=await fetch(src,{mode:'cors',cache:'force-cache'});
    if(!r.ok)throw new Error('image '+r.status);
    const blob=await r.blob();
    if('createImageBitmap' in window)return await createImageBitmap(blob);
    return await new Promise((resolve,reject)=>{
      const im=new Image();
      im.crossOrigin='anonymous';
      im.onload=()=>resolve(im);
      im.onerror=reject;
      im.src=URL.createObjectURL(blob);
    });
  }

  function logoBitmap(url){
    if(!logoPromise||logoPromise.url!==url){
      const p=loadBitmapFromUrl(url);
      p.url=url;
      logoPromise=p;
    }
    return logoPromise;
  }

  async function makeWatermarkedSrc(img,w){
    const src=originalSrc.get(img)||img.currentSrc||img.src;
    if(!src||isData(src))return null;
    const [baseImg,logo]=await Promise.all([loadBitmapFromUrl(src),logoBitmap(w.logoUrl)]);
    const iw=baseImg.width||baseImg.naturalWidth, ih=baseImg.height||baseImg.naturalHeight;
    if(!iw||!ih)return null;
    const canvas=document.createElement('canvas');
    canvas.width=Math.min(2200,iw);
    canvas.height=Math.round(canvas.width*(ih/iw));
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const base=drawRect(canvas,ctx,iw,ih);
    ctx.drawImage(baseImg,base.x,base.y,base.w,base.h);
    const r=wmRect(base,logo,w);
    ctx.globalAlpha=w.opacity;
    ctx.drawImage(logo,r.x,r.y,r.w,r.h);
    ctx.globalAlpha=1;
    return canvas.toDataURL('image/jpeg',0.92);
  }

  function addDownloadHelper(img){
    const host=img.parentElement;
    if(!host||host.querySelector(':scope > .rc-wm-download'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='rc-wm-download';
    btn.title='Download foto dengan watermark';
    btn.setAttribute('aria-label','Download foto dengan watermark');
    btn.innerHTML='⬇';
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const a=document.createElement('a');
      a.download='rentcam-watermark.jpg';
      a.href=img.src;
      document.body.appendChild(a);a.click();a.remove();
    });
    host.appendChild(btn);
  }

  function apply(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const w=cfg();
      document.querySelectorAll('.rc-product-watermark').forEach(x=>{if(!w.enabled||!w.logoUrl)x.remove();});
      if(!w.enabled||!w.logoUrl)return;
      [...document.querySelectorAll('#app img')].filter(productImage).forEach(img=>{
        const host=img.parentElement;
        if(!host)return;
        const cs=getComputedStyle(host);
        if(cs.position==='static')host.style.position='relative';
        if(!originalSrc.has(img))originalSrc.set(img,img.currentSrc||img.src);

        let mark=[...host.children].find(x=>x.classList?.contains('rc-product-watermark'));
        if(!mark){
          mark=document.createElement('img');
          mark.className='rc-product-watermark';
          mark.alt='';
          mark.setAttribute('aria-hidden','true');
          host.appendChild(mark);
        }
        mark.src=w.logoUrl;
        mark.style.cssText='position:absolute;z-index:9;pointer-events:none;user-select:none;object-fit:contain;width:'+w.size+'%;max-width:'+w.size+'%;max-height:'+Math.max(16,w.size)+'%;opacity:'+w.opacity+';filter:none;'+posStyle(w.position,w.offset);

        // Make native save/download include watermark too by replacing visible product image with a baked version.
        if(!processed.has(img)){
          processed.add(img);
          const bake=()=>makeWatermarkedSrc(img,w).then(src=>{if(src&&img.isConnected){img.dataset.rcWatermarked='1';img.src=src;}}).catch(()=>{});
          if(img.complete&&img.naturalWidth)bake(); else img.addEventListener('load',bake,{once:true});
        }
        addDownloadHelper(img);
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
  style.textContent='.rc-product-watermark{display:block!important}.pcard,.product-card,.home-category-card{overflow:hidden}.rc-wm-download{position:absolute;right:10px;top:10px;z-index:11;width:30px;height:30px;border:0;border-radius:999px;background:rgba(255,255,255,.88);box-shadow:0 6px 18px rgba(0,0,0,.14);font-size:14px;line-height:30px;padding:0;display:none}.pcard:hover .rc-wm-download,.product-card:hover .rc-wm-download,.home-category-card:hover .rc-wm-download{display:block}@media(max-width:760px){.rc-wm-download{display:none!important}}';
  document.head.appendChild(style);
  document.addEventListener('rentcam-cms-updated',e=>{current=e.detail?.watermark||null;processed.clear?.();apply()});
  document.addEventListener('rentcam-route-change',()=>setTimeout(apply,0));
  new MutationObserver(apply).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  pull();
  setTimeout(apply,200);
  setTimeout(apply,900);
})();