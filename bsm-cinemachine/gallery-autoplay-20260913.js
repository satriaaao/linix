/* Automatic product gallery slideshow */
(function(){
if(location.pathname.startsWith('/cms'))return;
let pauseUntil=Date.now()+6000,hovering=false,busy=false;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const gallery=()=>document.querySelector('#app .cms-gallery');
document.addEventListener('click',e=>{if(e.isTrusted&&e.target.closest('[data-cms-thumb]'))pauseUntil=Date.now()+8000},true);
document.addEventListener('pointerdown',e=>{if(e.target.closest('.cms-gallery'))pauseUntil=Date.now()+8000},true);
document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse'&&e.target.closest('.cms-gallery'))hovering=true},true);
document.addEventListener('pointerout',e=>{if(e.pointerType==='mouse'&&e.target.closest('.cms-gallery')&&!e.relatedTarget?.closest?.('.cms-gallery'))hovering=false},true);

function next(){
if(document.hidden||hovering||busy||Date.now()<pauseUntil||reduced())return;
const g=gallery(),main=g?.querySelector('[data-cms-main]'),buttons=g?Array.from(g.querySelectorAll('[data-cms-thumb]')):[];
if(!main||buttons.length<2)return;
const index=buttons.findIndex(b=>b.classList.contains('on'));
const button=buttons[(index+1)%buttons.length],url=button.dataset.src;
if(!url)return;
const oldSrc=main.src;busy=true;
const preload=new Image();const timeout=setTimeout(()=>{busy=false},3000);
preload.onload=()=>{clearTimeout(timeout);busy=false;if(!g.isConnected||document.hidden||hovering||Date.now()<pauseUntil||main.src!==oldSrc)return;button.click();const row=g.querySelector('.cms-gallery-thumbs');if(row){const left=button.offsetLeft;if(left<row.scrollLeft||left+button.offsetWidth>row.scrollLeft+row.clientWidth)row.scrollTo({left:Math.max(0,left-8),behavior:reduced()?'auto':'smooth'})}};
preload.onerror=()=>{clearTimeout(timeout);busy=false};
preload.src=url;
}
document.addEventListener('rentcam-route-change',()=>{hovering=false;pauseUntil=Date.now()+6000});
setInterval(next,6000);
})();
