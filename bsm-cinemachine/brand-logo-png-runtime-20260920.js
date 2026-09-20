/* Rentcam brand equipment — PNG logo runtime */
(function(){
  const LOGOS={
    'ARRI':'arri.com',
    'SONY':'sony.com',
    'Canon':'canon.com',
    'RED':'red.com',
    'ZEISS':'zeiss.com',
    'Cooke':'cookeoptics.com',
    'Blackmagic Design':'blackmagicdesign.com',
    'DJI':'dji.com',
    'Aputure':'aputure.com',
    'Teradek':'teradek.com',
    'SmallHD':'smallhd.com',
    'Sennheiser':'sennheiser.com'
  };

  function ensureStyle(){
    if(document.getElementById('rentcam-brand-png-style'))return;
    const st=document.createElement('style');
    st.id='rentcam-brand-png-style';
    st.textContent=`
      #app .brand-logo{
        min-width:118px!important;
        height:58px!important;
        padding:7px 12px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        box-sizing:border-box!important;
        font-size:0!important;
        line-height:0!important;
        overflow:hidden!important;
      }
      #app .brand-logo .brand-logo-png{
        display:block!important;
        width:auto!important;
        max-width:128px!important;
        height:auto!important;
        max-height:38px!important;
        object-fit:contain!important;
        filter:grayscale(1)!important;
        opacity:.82!important;
        mix-blend-mode:multiply!important;
      }
      #app .brand-logo:hover .brand-logo-png{
        opacity:1!important;
      }
      @media(max-width:620px){
        #app .brand-logo{
          min-width:96px!important;
          height:50px!important;
          padding:6px 8px!important;
        }
        #app .brand-logo .brand-logo-png{
          max-width:105px!important;
          max-height:31px!important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  function logoUrl(domain){
    return 'https://logo.clearbit.com/'+encodeURIComponent(domain)+'?size=256';
  }

  function fallbackUrl(domain){
    return 'https://www.google.com/s2/favicons?sz=256&domain_url='+encodeURIComponent('https://'+domain);
  }

  function upgrade(el){
    const name=el.getAttribute('data-brand')||'';
    const domain=LOGOS[name];
    if(!domain||el.querySelector('.brand-logo-png'))return;

    const img=document.createElement('img');
    img.className='brand-logo-png';
    img.alt=name+' logo';
    img.loading='lazy';
    img.decoding='async';
    img.src=logoUrl(domain);
    img.dataset.fallback='0';

    img.onerror=function(){
      if(this.dataset.fallback==='0'){
        this.dataset.fallback='1';
        this.src=fallbackUrl(domain);
        return;
      }
      this.style.display='none';
      const fallback=document.createElement('span');
      fallback.textContent=name;
      fallback.style.cssText='font-size:14px;font-weight:800;line-height:1;color:#111';
      this.parentElement?.appendChild(fallback);
    };

    el.textContent='';
    el.appendChild(img);
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll('#app .brand-logo[data-brand]').forEach(upgrade);
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);
  else schedule();

  const app=document.getElementById('app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  document.addEventListener('rentcam-route-change',schedule);
  document.addEventListener('rentcam-cms-updated',schedule);
  addEventListener('popstate',schedule);
})();
