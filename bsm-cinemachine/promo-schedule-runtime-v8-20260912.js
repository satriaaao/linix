/* Product status and scheduled discount display */
(function(){
if(location.pathname.startsWith('/cms'))return;
const cfg=()=>window.RENTCAM_CMS_CONFIG||{};
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const money=n=>'Rp'+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(Number(n)||0);
function inRange(a,b){const n=Date.now();return (!a||n>=new Date(a+'T00:00:00').getTime())&&(!b||n<=new Date(b+'T23:59:59').getTime())}
function products(){try{return Array.isArray(P)?P:[]}catch(e){return []}}
function meta(id){const p=products().find(x=>String(x.id)===String(id))||{},c=cfg();return {...p,...(c.productOverrides?.[id]||{}),...((c.customProducts||[]).find(x=>String(x.id)===String(id))||{})}}
function state(id){const p=meta(id),label=inRange(p.labelStart,p.labelEnd)?String(p.labelText||p.label||'').toUpperCase():'',pct=inRange(p.discountStart,p.discountEnd)?Math.max(0,Math.min(100,Number(p.discountPercent??p.discount)||0)):0,base=Math.max(0,Number(p.price)||0);return {p,label,pct,base,cut:Math.round(base*(1-pct/100)),stopped:label==='DISCONTINUED'||label==='DISCONTINUE'||p.discontinued===true}}
function badges(s){return (s.label?'<span class="rc-label '+(s.stopped?'stopped':'new')+'">'+esc(s.label)+'</span>':'')+(s.pct&&!s.stopped?'<span class="rc-label sale">DISKON '+s.pct+'%</span>':'')}
function prices(s){return (s.pct&&!s.stopped?'<del class="rc-old">'+money(s.base)+'</del><strong class="rc-new">'+money(s.cut)+'</strong>':'<strong>'+money(s.base)+'</strong>')+' <small>/ day</small>'}
function setMarkup(el,html){if(el.dataset.rcMarkup===html)return;el.dataset.rcMarkup=html;el.innerHTML=html}
function style(){if(document.getElementById('rc-product-promos'))return;const el=document.createElement('style');el.id='rc-product-promos';el.textContent=`
#app .rc-badges{position:absolute;top:12px;right:12px;left:auto;display:flex;align-items:flex-end;flex-direction:column;gap:6px;z-index:25;pointer-events:none}
#app .rc-label{font:800 10px/1.2 system-ui;color:white;border-radius:7px;padding:7px 10px;letter-spacing:.03em}
#app .rc-label.new{background:#16804a}#app .rc-label.sale{background:#ef641d}#app .rc-label.stopped{background:#5d6269}
#app .rc-price{display:flex;flex-wrap:wrap;align-items:baseline;gap:7px;margin-top:12px;font-size:16px;color:#111}
#app .rc-old{color:#999;font-size:.85em;font-weight:500;text-decoration:line-through!important}
#app .rc-new{color:#d85416}#app .rc-price small{font-size:11px;color:#777}
#app .rc-detail-badges{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
#app .rc-disabled{opacity:.55;cursor:not-allowed!important}
@media(max-width:620px){#app .rc-badges{top:8px;right:8px;gap:4px}#app .rc-label{font-size:8px;padding:6px 7px}#app .rc-price{font-size:13px;gap:5px}}
`;document.head.appendChild(el)}
function patchCard(card){const raw=card.dataset.productId||(card.getAttribute('onclick')||'').match(/\/produk\/([^'")]+)/)?.[1];if(!raw)return;const s=state(decodeURIComponent(raw)),holder=card.querySelector('.pimg,.home-category-image');if(!holder)return;
holder.style.position='relative';holder.querySelectorAll('.v8-product-label').forEach(x=>x.remove());
let box=holder.querySelector('.rc-badges');if(!box){box=document.createElement('div');box.className='rc-badges';holder.appendChild(box)}setMarkup(box,badges(s));
let price=card.querySelector('.price,.rc-price');if(!price){price=document.createElement('div');price.className='rc-price';const body=card.querySelector('.home-category-body');body?.insertBefore(price,body.querySelector('.home-category-actions'))}if(price){price.classList.add('rc-price');setMarkup(price,prices(s))}
card.querySelectorAll('button[onclick*="add("]').forEach(b=>{b.disabled=s.stopped;b.classList.toggle('rc-disabled',s.stopped);b.title=s.stopped?'Produk discontinued':''});
}
function patchDetail(){const id=location.pathname.match(/^\/produk\/([^/?#]+)/)?.[1];if(!id)return;const s=state(decodeURIComponent(id)),info=document.querySelector('#app .detail-info');if(!info)return;let box=info.querySelector('.rc-detail-badges');if(!box){box=document.createElement('div');box.className='rc-detail-badges';info.querySelector('h1')?.insertAdjacentElement('afterend',box)}setMarkup(box,badges(s));const price=info.querySelector('.detail-price');if(price){price.classList.add('rc-price');setMarkup(price,prices(s))}info.querySelectorAll('button[onclick*="add("]').forEach(b=>{b.disabled=s.stopped;b.classList.toggle('rc-disabled',s.stopped)})}
  function bannerValid(x){return x?.active!==false&&x?.deleted!==true&&inRange(x?.startDate,x?.endDate)}
  function patchHero(){if(location.pathname!=='/')return;const c=cfg(),hero=document.querySelector('#app .hero');if(!c||!hero||!Array.isArray(c.banners)||!c.banners.length)return;const valid=c.banners.filter(bannerValid);if(!valid.length){hero.style.display='none';return}hero.style.display='';const title=hero.querySelector('h1')?.textContent?.trim()||'';const cur=c.banners.find(x=>(x.title||'').trim()===title);const b=cur&&bannerValid(cur)?cur:valid[0];if(!b)return;const sig=JSON.stringify([b.id,b.title,b.text,b.subtitle,b.image,b.promoLabel,b.discountPercent,b.startDate,b.endDate]);if(hero.dataset.v8BannerSig===sig)return;hero.dataset.v8BannerSig=sig;const h=hero.querySelector('h1'),p=hero.querySelector('p'),small=hero.querySelector('small');if(h&&b.title&&h.textContent!==b.title)h.textContent=b.title;if(p&&(b.text||b.subtitle)&&p.textContent!==(b.text||b.subtitle))p.textContent=b.text||b.subtitle;if(small&&(b.ey||b.kicker)&&small.textContent!==(b.ey||b.kicker))small.textContent=b.ey||b.kicker;if(b.image)hero.style.backgroundImage=`url('${b.image}')`;let lab=hero.querySelector('.v8-hero-label');const txt=b.promoLabel||(Number(b.discountPercent)>0?('PROMO '+Number(b.discountPercent)+'%'):'');if(txt){if(!lab){lab=document.createElement('span');lab.className='v8-hero-label';hero.querySelector('.container')?.prepend(lab)}if(lab&&lab.textContent!==txt)lab.textContent=txt}else if(lab)lab.remove()}

function run(){style();document.querySelectorAll('#app .pcard,#app .home-category-card').forEach(patchCard);patchDetail();patchHero()}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{subtree:true,childList:true});
document.addEventListener('rentcam-cms-updated',schedule);document.addEventListener('rentcam-route-change',schedule);addEventListener('popstate',schedule);setInterval(schedule,30000);schedule();
const addOriginal=window.add;if(typeof addOriginal==='function')window.add=function(id,q){if(state(id).stopped){if(typeof toast==='function')toast('Produk discontinued tidak tersedia.');return}return addOriginal(id,q)};
const cartOriginal=window.cartPage;if(typeof cartOriginal==='function')window.cartPage=function(){const saved=products().map(p=>({p,price:p.price}));try{saved.forEach(x=>{const s=state(x.p.id);x.p.price=s.stopped?s.base:s.cut});return cartOriginal()}finally{saved.forEach(x=>x.p.price=x.price)}};
})();
