/* Rentcam product watermark runtime — baked once, no duplicate overlay */
/* deploy-trigger: watermark-no-double */
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

  function removeOverlay(host){
    if(!host)return;
    host.querySelectorAll(':scope > .rc-product-watermark').forEach(x=>x.remove());
  }

  function drawRect(canvas,imgW,imgH){
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
    const base=drawRect(canvas,iw,ih);
    ctx.drawImage(baseImg,base.x,base.y,base.w,base.h);
    const r=wmRect(base,logo,w);
    ctx.globalAlpha=w.opacity;
    ctx.drawImage(logo,r.x,r.y,r.w,r.h);
    ctx.globalAlpha=1;
    return canvas.toDataURL('image/jpeg',0.92);
  }


  function protectImage(img){
    if(!img||!productImage(img))return;
    img.setAttribute('draggable','false');
    img.setAttribute('data-rc-protected','1');
    img.removeAttribute('download');
    img.style.webkitUserDrag='none';
    img.style.webkitTouchCallout='none';
    img.style.userSelect='none';
  }

  function ensureOverlay(img,w){
    protectImage(img);
    const host=img.parentElement;
    if(!host)return;
    const cs=getComputedStyle(host);
    if(cs.position==='static')host.style.position='relative';

    let mark=host.querySelector(':scope > .rc-product-watermark');
    if(!w.enabled||!w.logoUrl){
      if(mark)mark.remove();
      return;
    }
    if(!mark){
      mark=document.createElement('img');
      mark.className='rc-product-watermark';
      mark.alt='';
      mark.setAttribute('aria-hidden','true');
      mark.setAttribute('draggable','false');
      host.appendChild(mark);
    }
    if(mark.src!==w.logoUrl)mark.src=w.logoUrl;
    mark.style.opacity=String(w.opacity);
    mark.style.width=w.size+'%';
    mark.style.left='';
    mark.style.right='';
    mark.style.top='';
    mark.style.bottom='';
    const gap=w.offset+'%';
    if(w.position==='top-right'){mark.style.top=gap;mark.style.right=gap;}
    else if(w.position==='bottom-left'){mark.style.bottom=gap;mark.style.left=gap;}
    else if(w.position==='bottom-right'){mark.style.bottom=gap;mark.style.right=gap;}
    else {mark.style.top=gap;mark.style.left=gap;}
  }

  function apply(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const w=cfg();
      [...document.querySelectorAll('#app img')].filter(productImage).forEach(img=>ensureOverlay(img,w));
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
  style.textContent='.pcard,.product-card,.home-category-card,.cms-gallery-main,.cms-gallery-thumb{overflow:hidden}#app img[data-rc-protected="1"]{-webkit-user-drag:none!important;-webkit-touch-callout:none!important;user-select:none!important;-webkit-user-select:none!important}.rc-product-watermark{position:absolute!important;z-index:7!important;height:auto!important;max-width:34%!important;object-fit:contain!important;pointer-events:none!important;-webkit-user-drag:none!important;-webkit-touch-callout:none!important;user-select:none!important;transition:none!important;animation:none!important}';
  document.head.appendChild(style);
  document.addEventListener('contextmenu',e=>{
    const img=e.target?.closest?.('#app img');
    if(img&&productImage(img)){e.preventDefault();e.stopPropagation();}
  },true);
  document.addEventListener('dragstart',e=>{
    const img=e.target?.closest?.('#app img');
    if(img&&productImage(img)){e.preventDefault();e.stopPropagation();}
  },true);
  document.addEventListener('mousedown',e=>{
    const img=e.target?.closest?.('#app img');
    if(img&&productImage(img)&&e.button===1){e.preventDefault();e.stopPropagation();}
  },true);
  document.addEventListener('selectstart',e=>{
    const img=e.target?.closest?.('#app img');
    if(img&&productImage(img)){e.preventDefault();}
  },true);
  document.addEventListener('rentcam-cms-updated',e=>{current=e.detail?.watermark||null;apply()});
  document.addEventListener('rentcam-route-change',()=>setTimeout(apply,0));
  new MutationObserver(apply).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  pull();
  setTimeout(apply,200);
})();