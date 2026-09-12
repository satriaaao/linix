(function(){
  const legacy=document.createElement('script');
  legacy.src='https://cdn.jsdelivr.net/gh/satriaaao/linix@d4b1eeea5bf62fe5f98e8180d971a9653ef2f3bd/bsm-cinemachine/rentcam-live-v2.js';
  legacy.onload=function(){
    const old=document.getElementById('rentcam-alexa35-title-badge-final-fix');
    if(old) old.remove();
    const style=document.createElement('style');
    style.id='rentcam-alexa35-title-badge-final-fix';
    style.textContent=`
      html body.alexa35-detail #app .product-detail-simple .detail-info h1::before,
      html body.alexa35-detail #app .product-detail-simple .detail-info h1::after,
      html body:has(#app .detail-media img[alt*="ARRI ALEXA 35"]) #app .product-detail-simple .detail-info h1::before,
      html body:has(#app .detail-media img[alt*="ARRI ALEXA 35"]) #app .product-detail-simple .detail-info h1::after,
      html body:has(#app .detail-ref-media img[alt*="ARRI ALEXA 35"]) #app .detail-ref-info h1::before,
      html body:has(#app .detail-ref-media img[alt*="ARRI ALEXA 35"]) #app .detail-ref-info h1::after {
        display:none!important;
        content:none!important;
        visibility:hidden!important;
        opacity:0!important;
        width:0!important;
        height:0!important;
        min-width:0!important;
        min-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        box-shadow:none!important;
      }
    `;
    document.head.appendChild(style);

    function enforce(){
      if(location.pathname!='/produk/arri-alexa-35') return;
      document.body.classList.add('alexa35-detail');
      const info=document.querySelector('#app .detail-info,#app .detail-ref-info');
      if(info){
        info.querySelectorAll('*').forEach(el=>{
          if(el.children.length===0 && (el.textContent||'').trim().toUpperCase()==='NEW') el.remove();
        });
      }
    }
    enforce();
    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>requestAnimationFrame(enforce)).observe(app,{childList:true,subtree:true});
  };
  document.head.appendChild(legacy);
})();