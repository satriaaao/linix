/* Rentcam app loader + global interaction patches */
document.write('<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@eb571c2066d51232bf89eff4249aebbf8023e650/bsm-cinemachine/app.js"><\/script>');
(function(){
  const BRAND_NAMES=['ARRI','SONY','Canon','RED','ZEISS','Cooke','Blackmagic Design','DJI','Aputure','Teradek','SmallHD','Sennheiser'];

  function navigate(path){
    if(typeof window.go==='function') window.go(path);
    else { history.pushState({},'',path); if(typeof window.render==='function') window.render(); else location.href=path; }
  }

  function handleBack(e){
    const btn=e.target && e.target.closest ? e.target.closest('.product-detail-simple .back-link') : null;
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    navigate('/produk');
  }

  function productIdFromCard(card){
    if(card.dataset.productId) return card.dataset.productId;
    const raw=card.getAttribute('onclick')||'';
    const m=raw.match(/\/produk\/([^'"\)]+)/);
    if(m){ card.dataset.productId=decodeURIComponent(m[1]); return card.dataset.productId; }
    return '';
  }

  function handleRelated(e){
    const card=e.target && e.target.closest ? e.target.closest('.related-card') : null;
    if(!card || e.target.closest('.related-card-cart')) return;
    const id=productIdFromCard(card);
    if(!id) return;
    e.preventDefault();
    e.stopPropagation();
    navigate('/produk/'+encodeURIComponent(id));
  }

  function installBrandStyle(){
    if(document.getElementById('rentcam-brand-marquee-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-brand-marquee-style';
    st.textContent=`
      #app .related-card{cursor:pointer!important;position:relative!important;z-index:1!important;pointer-events:auto!important}
      #app .related-card>*{pointer-events:none}
      #app .related-card .related-card-cart{pointer-events:auto!important;position:relative!important;z-index:3!important}
      #app .brand-marquee-section{margin:38px 0 0!important;padding:30px 0 12px!important;border-top:1px solid #ececec!important;overflow:hidden!important}
      #app .brand-marquee-title{margin:0 0 18px!important;font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#8b8b8b!important}
      #app .brand-marquee-viewport{width:100%!important;overflow:hidden!important;position:relative!important;mask-image:linear-gradient(to right,transparent,#000 7%,#000 93%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 7%,#000 93%,transparent)}
      #app .brand-marquee-track{display:flex!important;align-items:center!important;width:max-content!important;gap:54px!important;animation:rentcamBrandScroll 28s linear infinite!important;will-change:transform!important}
      #app .brand-marquee-viewport:hover .brand-marquee-track{animation-play-state:paused!important}
      #app .brand-logo{height:58px!important;min-width:118px!important;padding:0 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;color:#111!important;font-size:20px!important;font-weight:900!important;letter-spacing:-.035em!important;opacity:.78!important;filter:grayscale(1)!important;transition:opacity .18s ease,transform .18s ease!important}
      #app .brand-logo:hover{opacity:1!important;transform:scale(1.04)!important}
      #app .brand-logo[data-brand="Canon"]{font-family:Georgia,serif!important;font-style:italic!important;font-size:24px!important}
      #app .brand-logo[data-brand="RED"]{letter-spacing:.06em!important}
      #app .brand-logo[data-brand="ZEISS"]{letter-spacing:.04em!important}
      #app .brand-logo[data-brand="Blackmagic Design"]{font-size:16px!important;letter-spacing:-.02em!important}
      #app .brand-logo[data-brand="SmallHD"]{font-size:18px!important}
      @keyframes rentcamBrandScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      @media(max-width:620px){
        #app .brand-marquee-section{margin-top:26px!important;padding-top:22px!important}
        #app .brand-marquee-title{font-size:10px!important;margin-bottom:12px!important}
        #app .brand-marquee-track{gap:28px!important;animation-duration:22s!important}
        #app .brand-logo{height:46px!important;min-width:90px!important;font-size:16px!important;padding:0 5px!important}
        #app .brand-logo[data-brand="Canon"]{font-size:19px!important}
        #app .brand-logo[data-brand="Blackmagic Design"]{font-size:12px!important;min-width:112px!important}
        #app .brand-logo[data-brand="SmallHD"]{font-size:14px!important}
      }
      @media(prefers-reduced-motion:reduce){#app .brand-marquee-track{animation:none!important}}
    `;
    document.head.appendChild(st);
  }

  function brandMarkup(){
    const all=[...BRAND_NAMES,...BRAND_NAMES];
    return all.map(name=>`<div class="brand-logo" data-brand="${name.replace(/"/g,'&quot;')}">${name}</div>`).join('');
  }

  function mountBrandMarquee(){
    installBrandStyle();
    const related=document.getElementById('rentcam-related-products');
    if(!related || document.getElementById('rentcam-brand-marquee')) return;

    related.querySelectorAll('.related-card').forEach(card=>{
      productIdFromCard(card);
      card.setAttribute('role','link');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label','Buka detail '+(card.querySelector('.related-card-name')?.textContent||'produk'));
    });

    const section=document.createElement('section');
    section.id='rentcam-brand-marquee';
    section.className='brand-marquee-section';
    section.innerHTML=`<div class="brand-marquee-title">Brand Equipment</div><div class="brand-marquee-viewport"><div class="brand-marquee-track">${brandMarkup()}</div></div>`;
    related.insertAdjacentElement('afterend',section);
  }

  document.addEventListener('click',handleBack,true);
  document.addEventListener('touchend',handleBack,true);
  document.addEventListener('click',handleRelated,true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ') return;
    const card=e.target && e.target.closest ? e.target.closest('.related-card') : null;
    if(!card) return;
    const id=productIdFromCard(card);
    if(!id) return;
    e.preventDefault();
    navigate('/produk/'+encodeURIComponent(id));
  });

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;mountBrandMarquee();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule); else schedule();
  const obs=new MutationObserver(schedule);
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
