/* Rentcam Brand Equipment — verified logo artwork */
(function(){
  const BRAND_LOGOS={
    'ARRI':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arri_logo.svg',
    'SONY':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sony_logo.svg',
    'Canon':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Canon_logo.svg',
    'RED':'https://logo-teka.com/wp-content/uploads/2025/10/red-digital-cinema-logo.svg',
    'ZEISS':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Zeiss_logo.svg',
    'Cooke':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cooke_Optics.svg',
    'Blackmagic Design':'https://images.seeklogo.com/logo-png/33/1/blackmagic-design-logo-png_seeklogo-332440.png',
    'DJI':'https://commons.wikimedia.org/wiki/Special:Redirect/file/DJI_Innovations_logo.svg',
    'Aputure':'https://images.seeklogo.com/logo-png/35/1/aputure-logo-png_seeklogo-352127.png',
    'Teradek':'https://images.seeklogo.com/logo-png/54/1/teradek-logo-png_seeklogo-549817.png',
    'SmallHD':'https://images.seeklogo.com/logo-png/39/1/smallhd-logo-png_seeklogo-393918.png',
    'Sennheiser':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sennheiser_logo_(2019).svg'
  };

  function ensureStyle(){
    if(document.getElementById('rentcam-brand-png-style'))return;
    const st=document.createElement('style');
    st.id='rentcam-brand-png-style';
    st.textContent=`
      #app .brand-logo{
        min-width:126px!important;
        height:64px!important;
        padding:8px 12px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        box-sizing:border-box!important;
        font-size:0!important;
        line-height:0!important;
        overflow:visible!important;
      }
      #app .brand-logo .brand-logo-png{
        display:block!important;
        width:auto!important;
        max-width:138px!important;
        height:auto!important;
        max-height:42px!important;
        object-fit:contain!important;
        filter:none!important;
        opacity:1!important;
        mix-blend-mode:normal!important;
      }
      #app .brand-logo[data-brand="ZEISS"] .brand-logo-png,
      #app .brand-logo[data-brand="DJI"] .brand-logo-png{
        max-height:46px!important;
      }
      #app .brand-logo[data-brand="Blackmagic Design"] .brand-logo-png{
        max-height:48px!important;
      }
      #app .brand-logo[data-brand="Aputure"] .brand-logo-png,
      #app .brand-logo[data-brand="Teradek"] .brand-logo-png,
      #app .brand-logo[data-brand="SmallHD"] .brand-logo-png,
      #app .brand-logo[data-brand="SONY"] .brand-logo-png,
      #app .brand-logo[data-brand="Sennheiser"] .brand-logo-png{
        max-width:146px!important;
      }
      @media(max-width:620px){
        #app .brand-logo{
          min-width:102px!important;
          height:54px!important;
          padding:6px 8px!important;
        }
        #app .brand-logo .brand-logo-png{
          max-width:112px!important;
          max-height:34px!important;
        }
        #app .brand-logo[data-brand="ZEISS"] .brand-logo-png,
        #app .brand-logo[data-brand="DJI"] .brand-logo-png,
        #app .brand-logo[data-brand="Blackmagic Design"] .brand-logo-png{
          max-height:37px!important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  function upgrade(el){
    const name=el.getAttribute('data-brand')||'';
    const src=BRAND_LOGOS[name];
    if(!src)return;

    const current=el.querySelector('.brand-logo-png');
    if(current && current.dataset.brandSource===src)return;

    el.textContent='';
    const img=document.createElement('img');
    img.className='brand-logo-png';
    img.alt=name+' logo';
    img.loading='lazy';
    img.decoding='async';
    img.referrerPolicy='no-referrer';
    img.dataset.brandSource=src;
    img.src=src;

    img.onerror=function(){
      this.remove();
      const fallback=document.createElement('span');
      fallback.textContent=name;
      fallback.style.cssText='font-size:14px;font-weight:800;line-height:1;color:#111;white-space:nowrap';
      el.appendChild(fallback);
    };

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