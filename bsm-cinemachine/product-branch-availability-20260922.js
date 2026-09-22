(()=>{
'use strict';
const STYLE_ID='rc-product-branch-availability-style';
const DEFAULT_BRANCH='Jakarta';

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function currentProduct(){
  const id=decodeURIComponent(location.pathname.split('/').pop()||'');
  try{
    const list=Array.isArray(window.P)?window.P:[];
    return list.find(x=>String(x?.id)===String(id))||null;
  }catch(_){return null}
}

function normalizeBranches(p){
  const cfg=window.RENTCAM_CMS_CONFIG||{};
  const ov=cfg.productOverrides?.[p?.id]||{};
  const custom=(cfg.customProducts||[]).find(x=>String(x?.id)===String(p?.id))||{};

  let raw=
    custom.branchAvailability ?? custom.branches ??
    ov.branchAvailability ?? ov.branches ??
    p?.branchAvailability ?? p?.branches ?? null;

  if(!raw){
    return [{name:DEFAULT_BRANCH,status:(Number(p?.stock)>0?'available':'check')}];
  }

  if(typeof raw==='string') raw=[raw];

  if(Array.isArray(raw)){
    return raw.map(x=>{
      if(typeof x==='string')return {name:x,status:'available'};
      return {
        name:x?.name||x?.branch||x?.label||'Cabang',
        status:x?.status||((Number(x?.stock)>0)?'available':'check'),
        stock:Number.isFinite(Number(x?.stock))?Number(x.stock):null
      };
    }).filter(x=>x.name);
  }

  if(raw&&typeof raw==='object'){
    return Object.entries(raw).map(([name,v])=>{
      if(typeof v==='boolean')return {name,status:v?'available':'unavailable'};
      if(typeof v==='number')return {name,status:v>0?'available':'unavailable',stock:v};
      if(typeof v==='string')return {name,status:v};
      return {name,status:v?.status||((Number(v?.stock)>0)?'available':'check'),stock:Number.isFinite(Number(v?.stock))?Number(v.stock):null};
    });
  }

  return [{name:DEFAULT_BRANCH,status:'check'}];
}

function statusMeta(s){
  s=String(s||'').toLowerCase();
  if(['available','tersedia','ready','in-stock','instock'].includes(s))return ['available','Tersedia'];
  if(['unavailable','habis','out','out-of-stock','soldout'].includes(s))return ['unavailable','Tidak tersedia'];
  return ['check','Cek stok'];
}

function style(){
  if(document.getElementById(STYLE_ID))return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
    #app .rc-branch-availability{margin:0 0 22px;padding:16px;border:1px solid #e7eaee;border-radius:15px;background:linear-gradient(180deg,#fff,#fafbfc)}
    #app .rc-branch-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    #app .rc-branch-head>div{display:flex;align-items:center;gap:9px;min-width:0}
    #app .rc-branch-pin{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#fff0e7;color:#f26a21;flex:0 0 auto}
    #app .rc-branch-pin svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    #app .rc-branch-head h3{margin:0;font-size:14px;line-height:1.15;color:#1a2230}
    #app .rc-branch-head p{margin:2px 0 0;font-size:10px;color:#8a93a0}
    #app .rc-branch-list{display:flex;gap:8px;flex-wrap:wrap}
    #app .rc-branch-chip{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 11px;border:1px solid #e6e9ee;border-radius:11px;background:#fff;color:#253044;font-size:11px;font-weight:800}
    #app .rc-branch-chip i{width:8px;height:8px;border-radius:50%;background:#a7afba;box-shadow:0 0 0 4px #f1f3f6}
    #app .rc-branch-chip.available i{background:#269365;box-shadow:0 0 0 4px #e8f6ef}
    #app .rc-branch-chip.unavailable i{background:#d24c4c;box-shadow:0 0 0 4px #fbeaea}
    #app .rc-branch-chip small{font-size:9px;font-weight:700;color:#7f8896}
    #app .rc-branch-chip.available small{color:#237a58}
    #app .rc-branch-chip.unavailable small{color:#b44545}
    @media(max-width:620px){
      #app .rc-branch-availability{margin-bottom:18px;padding:13px;border-radius:13px}
      #app .rc-branch-head{margin-bottom:10px}
      #app .rc-branch-pin{width:28px;height:28px;border-radius:9px}
      #app .rc-branch-head h3{font-size:13px}
      #app .rc-branch-head p{font-size:9px}
      #app .rc-branch-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      #app .rc-branch-chip{width:100%;min-height:38px;justify-content:flex-start;padding:0 10px;font-size:10.5px}
    }
  `;
  document.head.appendChild(st);
}

function markup(p){
  const branches=normalizeBranches(p);
  const chips=branches.map(b=>{
    const [cls,label]=statusMeta(b.status);
    const stock=(b.stock!==null&&b.stock!==undefined&&b.stock>=0)?' · '+b.stock+' unit':'';
    return '<div class="rc-branch-chip '+cls+'"><i></i><span>'+esc(b.name)+'</span><small>'+label+esc(stock)+'</small></div>';
  }).join('');
  return '<section class="rc-branch-availability"><div class="rc-branch-head"><div><span class="rc-branch-pin"><svg viewBox="0 0 24 24"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg></span><div><h3>Ketersediaan Cabang</h3><p>Lokasi unit rental tersedia</p></div></div></div><div class="rc-branch-list">'+chips+'</div></section>';
}

function mount(){
  if(!location.pathname.startsWith('/produk/'))return;
  style();
  const info=document.querySelector('#app .detail-info');
  if(!info)return;
  const p=currentProduct();
  if(!p)return;

  const old=info.querySelector('.rc-branch-availability');
  if(old)old.remove();

  const price=info.querySelector('.detail-price');
  const sections=info.querySelector('.detail-sections');
  if(price)price.insertAdjacentHTML('afterend',markup(p));
  else if(sections)sections.insertAdjacentHTML('beforebegin',markup(p));
}

let q=false;
function run(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;mount()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
new MutationObserver(run).observe(document.querySelector('#app')||document.body,{subtree:true,childList:true});
document.addEventListener('rentcam-cms-updated',run);
document.addEventListener('rentcam-route-change',run);
window.addEventListener('popstate',run);
})();