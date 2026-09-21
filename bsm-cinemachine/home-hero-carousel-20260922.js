(()=>{
'use strict';
const RC_ID='rc-home-carousel-style';
const SLIDES=[
  {
    eyebrow:'MOTION PICTURE EQUIPMENT RENTALS',
    title:'Cinema gear for serious productions.',
    text:'ARRI, Sony VENICE, RED, cinema lenses, lighting, grip, monitoring dan wireless video.',
    image:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=90',
    primary:'Lihat Rental',
    primaryPath:'/produk',
    secondary:'Lihat Portfolio',
    secondaryPath:'/portfolio'
  },
  {
    eyebrow:'ARRI CAMERA SYSTEMS',
    title:'Build a cinema package that is ready for set.',
    text:'ALEXA 35, ALEXA Mini LF, cinema lenses, wireless video dan monitoring dalam satu workflow.',
    image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2000&q=90',
    primary:'Rental Kamera',
    primaryPath:'/produk?cat=Camera',
    secondary:'Produk Promo',
    secondaryPath:'/produk?label=PROMO%2CNEW%2CDISKON'
  },
  {
    eyebrow:'CINEMA LIGHTING',
    title:'Lighting packages built for film sets.',
    text:'Lighting profesional untuk studio, commercial, film, series dan exterior production.',
    image:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=90',
    primary:'Lihat Lighting',
    primaryPath:'/produk?cat=Lighting',
    secondary:'Semua Produk',
    secondaryPath:'/produk'
  }
];
let timer=null,index=0,root=null,paused=false,startX=0,lastPath='';
function css(){
  if(document.getElementById(RC_ID))return;
  const s=document.createElement('style');s.id=RC_ID;s.textContent=`
  #app .rc-home-carousel{position:relative;isolation:isolate;width:100%;height:min(620px,62vw);min-height:460px;overflow:hidden;background:#0b1118;color:#fff}
  #app .rc-home-carousel-track{position:absolute;inset:0}
  #app .rc-home-slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .65s ease,visibility .65s ease;background-position:center;background-size:cover;will-change:opacity}
  #app .rc-home-slide.is-active{opacity:1;visibility:visible;z-index:1}
  #app .rc-home-slide:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,8,12,.88) 0%,rgba(4,8,12,.62) 37%,rgba(4,8,12,.18) 68%,rgba(4,8,12,.08) 100%)}
  #app .rc-home-slide:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(5,9,14,.48) 0%,transparent 42%)}
  #app .rc-home-slide-inner{position:relative;z-index:2;height:100%;max-width:1180px;margin:0 auto;padding:0 34px;display:flex;align-items:center}
  #app .rc-home-slide-copy{max-width:720px;padding-top:14px}
  #app .rc-home-eyebrow{display:flex;align-items:center;gap:10px;margin-bottom:18px;font-size:12px;font-weight:900;letter-spacing:.18em;color:#f8fafc}
  #app .rc-home-eyebrow:before{content:"";width:34px;height:2px;background:#ff6a21;border-radius:99px}
  #app .rc-home-slide h1{margin:0;max-width:760px;font-size:clamp(46px,5.3vw,78px);line-height:.98;letter-spacing:-.055em;font-weight:850;color:#fff;text-wrap:balance}
  #app .rc-home-slide p{max-width:660px;margin:22px 0 0;font-size:16px;line-height:1.65;color:rgba(255,255,255,.78)}
  #app .rc-home-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
  #app .rc-home-actions button{min-height:48px;padding:0 20px;border-radius:12px;border:1px solid rgba(255,255,255,.22);font-size:12px;font-weight:850;cursor:pointer;transition:transform .18s ease,background .18s ease}
  #app .rc-home-actions button:hover{transform:translateY(-1px)}
  #app .rc-home-actions .primary{background:#ff6a21;border-color:#ff6a21;color:#fff;box-shadow:0 12px 30px rgba(255,106,33,.24)}
  #app .rc-home-actions .secondary{background:rgba(255,255,255,.1);backdrop-filter:blur(12px);color:#fff}
  #app .rc-home-carousel-ui{position:absolute;z-index:5;left:50%;bottom:22px;width:min(1112px,calc(100% - 48px));transform:translateX(-50%);display:flex;align-items:center;justify-content:space-between;pointer-events:none}
  #app .rc-home-dots{display:flex;gap:7px;pointer-events:auto}
  #app .rc-home-dot{width:28px;height:4px;padding:0;border:0;border-radius:99px;background:rgba(255,255,255,.32);cursor:pointer;transition:width .2s ease,background .2s ease}
  #app .rc-home-dot.is-active{width:48px;background:#ff6a21}
  #app .rc-home-nav{display:flex;gap:8px;pointer-events:auto}
  #app .rc-home-nav button{width:42px;height:42px;padding:0;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(9,14,20,.46);backdrop-filter:blur(10px);color:#fff;display:grid;place-items:center;cursor:pointer}
  #app .rc-home-nav svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  #app .rc-home-slide-no{position:absolute;right:34px;top:50%;z-index:3;transform:translateY(-50%);font-size:11px;letter-spacing:.12em;color:rgba(255,255,255,.64);writing-mode:vertical-rl}
  #app .rc-home-slide-no b{font-size:15px;color:#fff}
  #app .rc-home-trust{position:absolute;z-index:4;left:50%;bottom:64px;width:min(1112px,calc(100% - 48px));transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap}
  #app .rc-home-trust span{padding:7px 10px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(8,14,21,.35);backdrop-filter:blur(8px);font-size:9px;font-weight:800;color:rgba(255,255,255,.78)}
  @media(max-width:760px){
    #app .rc-home-carousel{height:520px;min-height:520px}
    #app .rc-home-slide{background-position:center}
    #app .rc-home-slide:before{background:linear-gradient(90deg,rgba(5,9,14,.86),rgba(5,9,14,.45)),linear-gradient(0deg,rgba(5,9,14,.5),transparent 50%)}
    #app .rc-home-slide-inner{padding:0 22px;align-items:flex-end;padding-bottom:128px}
    #app .rc-home-slide-copy{padding:0}
    #app .rc-home-eyebrow{font-size:9px;margin-bottom:14px;letter-spacing:.14em}
    #app .rc-home-eyebrow:before{width:24px}
    #app .rc-home-slide h1{font-size:clamp(38px,10vw,54px);line-height:1}
    #app .rc-home-slide p{font-size:13px;line-height:1.55;margin-top:16px;max-width:94%}
    #app .rc-home-actions{margin-top:20px}
    #app .rc-home-actions button{min-height:44px;padding:0 15px;font-size:10px}
    #app .rc-home-carousel-ui{bottom:18px;width:calc(100% - 36px)}
    #app .rc-home-nav{display:none}
    #app .rc-home-slide-no{display:none}
    #app .rc-home-trust{left:18px;right:18px;bottom:52px;width:auto;transform:none;gap:5px;overflow:hidden;flex-wrap:nowrap}
    #app .rc-home-trust span{flex:0 0 auto;font-size:7.5px;padding:6px 8px}
  }
  @media(max-width:440px){
    #app .rc-home-carousel{height:500px;min-height:500px}
    #app .rc-home-slide-inner{padding-left:18px;padding-right:18px;padding-bottom:122px}
    #app .rc-home-slide h1{font-size:40px}
    #app .rc-home-slide p{font-size:12px}
  }
  @media(prefers-reduced-motion:reduce){#app .rc-home-slide{transition:none}}
  `;document.head.appendChild(s);
}
function nav(path){if(typeof window.go==='function')window.go(path);else location.assign(path)}
function arrow(dir){return dir<0?'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>':'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>'}
function markup(){
 return '<section class="rc-home-carousel" aria-label="Banner utama">'+
  '<div class="rc-home-carousel-track">'+SLIDES.map((s,i)=>'<article class="rc-home-slide '+(i===0?'is-active':'')+'" data-rc-slide="'+i+'" style="background-image:url(\''+s.image+'\')"><div class="rc-home-slide-inner"><div class="rc-home-slide-copy"><div class="rc-home-eyebrow">'+s.eyebrow+'</div><h1>'+s.title+'</h1><p>'+s.text+'</p><div class="rc-home-actions"><button type="button" class="primary" data-rc-go="'+s.primaryPath+'">'+s.primary+'</button><button type="button" class="secondary" data-rc-go="'+s.secondaryPath+'">'+s.secondary+'</button></div></div></div><div class="rc-home-slide-no"><b>0'+(i+1)+'</b> / 0'+SLIDES.length+'</div></article>').join('')+
  '</div>'+
  '<div class="rc-home-trust"><span>ARRI & Sony Cinema</span><span>Lighting Profesional</span><span>Antar–Jemput</span><span>Support Produksi</span></div>'+
  '<div class="rc-home-carousel-ui"><div class="rc-home-dots">'+SLIDES.map((_,i)=>'<button type="button" class="rc-home-dot '+(i===0?'is-active':'')+'" data-rc-dot="'+i+'" aria-label="Slide '+(i+1)+'"></button>').join('')+'</div><div class="rc-home-nav"><button type="button" data-rc-prev aria-label="Banner sebelumnya">'+arrow(-1)+'</button><button type="button" data-rc-next aria-label="Banner berikutnya">'+arrow(1)+'</button></div></div>'+
 '</section>';
}
function show(i,user=false){
 if(!root)return;
 index=(i+SLIDES.length)%SLIDES.length;
 root.querySelectorAll('[data-rc-slide]').forEach((el,n)=>el.classList.toggle('is-active',n===index));
 root.querySelectorAll('[data-rc-dot]').forEach((el,n)=>el.classList.toggle('is-active',n===index));
 if(user)restart();
}
function restart(){clearInterval(timer);if(paused||matchMedia('(prefers-reduced-motion: reduce)').matches)return;timer=setInterval(()=>show(index+1),5200)}
function bind(){
 if(!root)return;
 root.addEventListener('click',e=>{
   const go=e.target.closest('[data-rc-go]');if(go){nav(go.dataset.rcGo);return}
   const dot=e.target.closest('[data-rc-dot]');if(dot){show(Number(dot.dataset.rcDot),true);return}
   if(e.target.closest('[data-rc-prev]')){show(index-1,true);return}
   if(e.target.closest('[data-rc-next]')){show(index+1,true);return}
 });
 root.addEventListener('mouseenter',()=>{paused=true;clearInterval(timer)});
 root.addEventListener('mouseleave',()=>{paused=false;restart()});
 root.addEventListener('touchstart',e=>{paused=true;clearInterval(timer);startX=e.touches?.[0]?.clientX||0},{passive:true});
 root.addEventListener('touchend',e=>{const x=e.changedTouches?.[0]?.clientX||startX;const dx=x-startX;if(Math.abs(dx)>45)show(index+(dx<0?1:-1),true);paused=false;restart()},{passive:true});
}
function mount(){
 if(location.pathname!=='/'){clearInterval(timer);root=null;lastPath=location.pathname;return}
 const app=document.getElementById('app');if(!app)return;
 if(app.querySelector('.rc-home-carousel')){root=app.querySelector('.rc-home-carousel');if(lastPath!==location.pathname)restart();lastPath=location.pathname;return}
 const hero=app.querySelector('.hero');if(!hero)return;
 css();hero.insertAdjacentHTML('beforebegin',markup());hero.remove();root=app.querySelector('.rc-home-carousel');bind();restart();lastPath=location.pathname;
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('popstate',schedule);
})();