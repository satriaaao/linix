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

      /* Product-card labels: one consistent visual system */
      html body #app .pcard::before,
      html body #app .pcard::after{
        display:none!important;
        content:none!important;
      }
      html body #app .pcard{
        position:relative!important;
      }
      html body #app .rentcam-card-status{
        position:absolute!important;
        top:12px!important;
        left:12px!important;
        z-index:120!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        height:28px!important;
        min-width:54px!important;
        padding:0 11px!important;
        margin:0!important;
        border:0!important;
        border-radius:999px!important;
        background:#111!important;
        color:#fff!important;
        font-size:9px!important;
        line-height:1!important;
        font-weight:900!important;
        letter-spacing:.055em!important;
        white-space:nowrap!important;
        box-shadow:0 4px 12px rgba(0,0,0,.16)!important;
        pointer-events:none!important;
      }
      @media(max-width:620px){
        html body #app .rentcam-card-status{
          top:8px!important;
          left:8px!important;
          height:24px!important;
          min-width:48px!important;
          padding:0 9px!important;
          font-size:8px!important;
        }
      }
    `;
    document.head.appendChild(style);

    const CARD_STATUS={
      'arri-alexa-35':'NEW',
      'arri-alexa-mini-lf':'DISCONTINUED',
      'red-v-raptor-x':'DISKON 20%',
      'cooke-s8-set':'PAKET',
      'arri-signature-prime':'PAKET',
      'atlas-mercury':'PAKET'
    };

    function applyCardBadges(){
      document.querySelectorAll('#app .pcard').forEach(card=>{
        const click=card.getAttribute('onclick')||'';
        const match=click.match(/\/produk\/([^'"\)]+)/);
        const id=match&&match[1];
        const text=id&&CARD_STATUS[id];
        const existing=card.querySelector(':scope > .rentcam-card-status');
        if(!text){ if(existing) existing.remove(); return; }
        if(existing){
          if(existing.textContent!==text) existing.textContent=text;
          return;
        }
        const badge=document.createElement('span');
        badge.className='rentcam-card-status';
        badge.textContent=text;
        card.appendChild(badge);
      });
    }

    function enforce(){
      applyCardBadges();
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
    requestAnimationFrame(enforce);
  };
  document.head.appendChild(legacy);
})();
