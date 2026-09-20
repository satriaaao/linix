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

  function installBrandStyle(){
    if(document.getElementById('rentcam-brand-marquee-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-brand-marquee-style';
    st.textContent=`
      #app .brand-marquee-section{margin:34px 0 8px!important;padding:28px 0 12px!important;border-top:1px solid #ececec!important;overflow:hidden!important}
      #app .brand-marquee-title{margin:0 0 18px!important;font-size:12px!important;font-weight:800!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#8b8b8b!important}
      #app .brand-marquee-viewport{width:100%!important;overflow:hidden!important;position:relative!important;mask-image:linear-gradient(to right,transparent,#000 7%,#000 93%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 7%,#000 93%,transparent)}
      #app .brand-marquee-track{display:flex!important;align-items:center!important;width:max-content!important;gap:4px!important;animation:rentcamBrandScroll 28s linear infinite!important;will-change:transform!important}
      #app .brand-marquee-viewport:hover .brand-marquee-track{animation-play-state:paused!important}
      #app .brand-logo{height:48px!important;width:84px!important;min-width:84px!important;flex:0 0 84px!important;padding:2px 3px!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;color:#111!important;font-size:0!important;font-weight:900!important;letter-spacing:-.035em!important;opacity:1!important;filter:none!important;transition:opacity .18s ease,transform .18s ease!important}
      #app .brand-logo:hover{opacity:1!important;transform:scale(1.04)!important}
      #app .brand-logo[data-brand="Canon"]{font-family:Georgia,serif!important;font-style:italic!important;font-size:24px!important}
      #app .brand-logo[data-brand="RED"]{letter-spacing:.06em!important}
      #app .brand-logo[data-brand="ZEISS"]{letter-spacing:.04em!important}
      #app .brand-logo[data-brand="Blackmagic Design"]{font-size:16px!important;letter-spacing:-.02em!important}
      #app .brand-logo[data-brand="SmallHD"]{font-size:18px!important}
      @keyframes rentcamBrandScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      @media(max-width:620px){
        #app .brand-marquee-section{margin-top:24px!important;padding-top:20px!important}
        #app .brand-marquee-title{font-size:10px!important;margin-bottom:12px!important}
        #app .brand-marquee-track{gap:2px!important;animation-duration:22s!important}
        #app .brand-logo{height:42px!important;width:76px!important;min-width:76px!important;flex:0 0 76px!important;font-size:0!important;padding:2px!important}
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
    if(!related) return;

    let section=document.getElementById('rentcam-brand-marquee');
    if(!section){
      section=document.createElement('section');
      section.id='rentcam-brand-marquee';
      section.className='brand-marquee-section';
      section.innerHTML=`<div class="brand-marquee-title">Brand Equipment</div><div class="brand-marquee-viewport"><div class="brand-marquee-track">${brandMarkup()}</div></div>`;
    }

    if(related.nextElementSibling!==section){
      related.insertAdjacentElement('afterend',section);
    }
  }

  document.addEventListener('click',handleBack,true);
  document.addEventListener('touchend',handleBack,true);

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