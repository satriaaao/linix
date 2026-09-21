(()=>{
'use strict';
const STYLE_ID='rc-brand-equipment-style';
const BRANDS=[
  {name:'ARRI',className:'arri'},
  {name:'SONY',className:'sony'},
  {name:'RED',className:'red'},
  {name:'SIGMA',className:'sigma'},
  {name:'APUTURE',className:'aputure'},
  {name:'BLACKMAGIC DESIGN',className:'blackmagic'},
  {name:'ZOOM',className:'zoom'},
  {name:'RØDE',className:'rode'},
  {name:'SARAMONIC',className:'saramonic'},
  {name:'CANON',className:'canon'}
];
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
    #app .rc-brand-item{flex:0 0 auto;min-width:160px;height:72px;padding:0 22px;border:1px solid #edf0f4;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;color:#1b2430;box-shadow:0 3px 12px rgba(18,32,48,.035)}
    #app .rc-brand-word{display:block;white-space:nowrap;font-size:20px;font-weight:950;letter-spacing:.04em;line-height:1}
    #app .rc-brand-item.sony .rc-brand-word{font-family:Georgia,serif;letter-spacing:.03em}
    #app .rc-brand-item.red .rc-brand-word{font-size:24px;letter-spacing:.09em}
    #app .rc-brand-item.sigma .rc-brand-word{font-size:22px;font-weight:800;letter-spacing:.08em}
    #app .rc-brand-item.aputure .rc-brand-word{font-size:18px;letter-spacing:.12em}
    #app .rc-brand-item.blackmagic .rc-brand-word{font-size:13px;letter-spacing:.055em;text-align:center}
    #app .rc-brand-item.zoom .rc-brand-word{font-size:23px;letter-spacing:.06em}
    #app .rc-brand-item.rode .rc-brand-word{font-size:23px;letter-spacing:.08em}
    #app .rc-brand-item.saramonic .rc-brand-word{font-size:15px;letter-spacing:.08em}
    #app .rc-brand-item.canon .rc-brand-word{font-family:Georgia,serif;font-size:22px;letter-spacing:.02em}
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
      #app .rc-brand-item{min-width:128px;height:58px;padding:0 15px;border-radius:12px}
      #app .rc-brand-word{font-size:17px}
      #app .rc-brand-item.red .rc-brand-word{font-size:20px}
      #app .rc-brand-item.sigma .rc-brand-word{font-size:18px}
      #app .rc-brand-item.aputure .rc-brand-word{font-size:15px}
      #app .rc-brand-item.blackmagic .rc-brand-word{font-size:10px}
      #app .rc-brand-item.zoom .rc-brand-word,#app .rc-brand-item.rode .rc-brand-word,#app .rc-brand-item.canon .rc-brand-word{font-size:18px}
      #app .rc-brand-item.saramonic .rc-brand-word{font-size:12px}
    }
    @media(prefers-reduced-motion:reduce){
      #app .rc-brand-track{animation:none;overflow-x:auto}
    }
  `;document.head.appendChild(s);
}
function item(b){return '<div class="rc-brand-item '+b.className+'"><span class="rc-brand-word">'+b.name+'</span></div>'}
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