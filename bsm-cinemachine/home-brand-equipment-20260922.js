(()=>{
'use strict';
const STYLE_ID='rc-brand-equipment-style';
const BRANDS=[
  {name:'ARRI',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Arri_logo.svg/800px-Arri_logo.svg.png'},
  {name:'SONY',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/960px-Sony_logo.svg.png'},
  {name:'CANON',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Canon_logo.svg/800px-Canon_logo.svg.png'},
  {name:'SIGMA',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Sigma-logo.svg/330px-Sigma-logo.svg.png'},
  {name:'BLACKMAGIC DESIGN',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Blackmagic_Design_logo.png/640px-Blackmagic_Design_logo.png'},
  {name:'ZOOM',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Zoom_Corporation_logo.svg/330px-Zoom_Corporation_logo.svg.png'},
  {name:'RØDE',src:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/R%C3%98DE_logo.svg/320px-R%C3%98DE_logo.svg.png'}
]
function style(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #app .rc-brand-equipment{margin:34px 0 36px;padding:0}
    #app .rc-brand-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}
    #app .rc-brand-head small{display:block;margin-bottom:5px;color:#f26a21;font-size:9px;font-weight:950;letter-spacing:.15em}
    #app .rc-brand-head h2{margin:0;color:#111827;font-size:30px;line-height:1;letter-spacing:-.035em}
    #app .rc-brand-head p{margin:0;color:#8b95a3;font-size:10px;line-height:1.45;text-align:right}
    #app .rc-brand-marquee{position:relative;overflow:hidden;width:100%;border:1px solid #eceff3;border-radius:18px;background:linear-gradient(180deg,#fff,#fafbfc);box-shadow:0 6px 22px rgba(20,32,50,.035)}
    #app .rc-brand-marquee:before,#app .rc-brand-marquee:after{content:"";position:absolute;z-index:3;top:0;bottom:0;width:70px;pointer-events:none}
    #app .rc-brand-marquee:before{left:0;background:linear-gradient(90deg,#fff,rgba(255,255,255,0))}
    #app .rc-brand-marquee:after{right:0;background:linear-gradient(270deg,#fff,rgba(255,255,255,0))}
    #app .rc-brand-track{display:flex;width:max-content;gap:14px;padding:14px;animation:rcBrandScroll 28s linear infinite;will-change:transform}
    #app .rc-brand-marquee:hover .rc-brand-track{animation-play-state:paused}
    #app .rc-brand-item{flex:0 0 auto;width:170px;height:78px;padding:12px 18px;border:1px solid #edf0f4;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(18,32,48,.035)}
    #app .rc-brand-logo-box{width:136px;height:46px;display:flex;align-items:center;justify-content:center}
    #app .rc-brand-logo{display:block!important;width:auto!important;height:auto!important;max-width:136px!important;max-height:40px!important;object-fit:contain!important;filter:none!important;opacity:1!important}
    @keyframes rcBrandScroll{from{transform:translateX(0)}to{transform:translateX(calc(-50% - 7px))}}
    @media(max-width:760px){
      #app .rc-brand-equipment{margin:28px 0 30px}
      #app .rc-brand-head{align-items:flex-start;flex-direction:column;gap:5px;margin-bottom:12px}
      #app .rc-brand-head small{font-size:8px;margin-bottom:4px}
      #app .rc-brand-head h2{font-size:27px}
      #app .rc-brand-head p{text-align:left;font-size:9px}
      #app .rc-brand-marquee{border-radius:15px}
      #app .rc-brand-marquee:before,#app .rc-brand-marquee:after{width:34px}
      #app .rc-brand-track{gap:9px;padding:10px;animation-duration:20s}
      #app .rc-brand-item{width:138px;height:64px;padding:10px 14px;border-radius:12px}
      #app .rc-brand-logo-box{width:110px;height:38px}
      #app .rc-brand-logo{max-width:110px!important;max-height:32px!important}
    }
    @media(prefers-reduced-motion:reduce){
      #app .rc-brand-track{animation:none;overflow-x:auto}
    }
  `;document.head.appendChild(s);
}
function item(b){return '<div class="rc-brand-item" title="'+b.name+'"><span class="rc-brand-logo-box"><img class="rc-brand-logo" src="'+b.src+'" alt="'+b.name+'" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer"></span></div>'}
function markup(){
  const one=BRANDS.map(item).join('');
  return '<section class="rc-brand-equipment"><div class="rc-brand-head"><div><small>TRUSTED BRANDS</small><h2>BRAND EQUIPMENT</h2></div><p>Equipment profesional dari brand produksi terpercaya.</p></div><div class="rc-brand-marquee"><div class="rc-brand-track">'+one+one+'</div></div></section>';
}
function mount(){
  if(location.pathname!=='/')return;
  const home=document.querySelector('#rentcam-home-product-sections .container');
  if(!home)return;
  style();
  const journal=home.querySelector('.home-journal');
  if(!journal)return;
  if(home.querySelector('.rc-brand-equipment'))return;
  journal.insertAdjacentHTML('beforebegin',markup());
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('rentcam-cms-updated',schedule);
window.addEventListener('popstate',schedule);
})();