/* Final product Included dropdown override — runs after all product renderers. */
(()=>{
  if(window.__rentcamIncludedDropdownFinal)return;
  window.__rentcamIncludedDropdownFinal=true;

  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();

  function collectItems(section){
    const cardItems=[...section.querySelectorAll('.cms-included-item')];
    if(cardItems.length){
      return cardItems.map(x=>{
        const clone=x.cloneNode(true);
        clone.querySelectorAll('.cms-included-check').forEach(n=>n.remove());
        return clean(clone.textContent);
      }).filter(Boolean);
    }
    return [...section.querySelectorAll('li')].map(x=>clean(x.textContent)).filter(Boolean);
  }

  function upgrade(){
    if(!location.pathname.startsWith('/produk/'))return;
    const accessoryHeadings=[...document.querySelectorAll('#app h2,#app h3')];
    accessoryHeadings.forEach(h=>{
      const t=clean(h.textContent).toLowerCase();
      if(t==='extra package'||t==='accessories'||t==='aksesori dalam paket'){
        const sec=h.closest('section,.cms-detail-block,.detail-section')||h.parentElement;
        if(sec)sec.remove();
      }
    });
    const headings=[...document.querySelectorAll('#app h2,#app h3')];
    for(const h of headings){
      const title=clean(h.textContent).toLowerCase();
      if(title!=='included'&&title!=='included in package')continue;

      const section=h.closest('section,.cms-detail-block,.detail-section')||h.parentElement;
      if(!section||section.dataset.rcIncludedDropdown==='1')continue;

      const items=collectItems(section);
      if(!items.length)continue;

      section.dataset.rcIncludedDropdown='1';
      section.classList.add('rc-included-dropdown-wrap');
      section.innerHTML=
        '<details class="rc-included-details">'+
          '<summary>'+
            '<span class="rc-inc-title"><b>Included in Package</b><small>'+items.length+' item</small></span>'+
            '<span class="rc-inc-chevron" aria-hidden="true">⌄</span>'+
          '</summary>'+
          '<div class="rc-inc-body"><ul>'+
            items.map(x=>'<li><span class="rc-inc-dot">✓</span><span>'+String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))+'</span></li>').join('')+
          '</ul></div>'+
        '</details>';
    }
  }

  const style=document.createElement('style');
  style.id='rc-included-dropdown-final-style';
  style.textContent=`
    #app .rc-included-dropdown-wrap{
      margin:0 0 14px!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      overflow:visible!important;
    }
    #app .rc-included-details{
      width:100%;
      border:1px solid #e4e8ed;
      border-radius:14px;
      background:#fff;
      overflow:hidden;
    }
    #app .rc-included-details>summary{
      list-style:none;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      min-height:58px;
      padding:13px 16px;
      cursor:pointer;
      user-select:none;
      background:#fff;
    }
    #app .rc-included-details>summary::-webkit-details-marker{display:none}
    #app .rc-inc-title{
      display:flex;
      align-items:center;
      gap:10px;
      min-width:0;
    }
    #app .rc-inc-title b{
      font-size:16px;
      line-height:1.2;
      color:#111827;
      letter-spacing:-.015em;
    }
    #app .rc-inc-title small{
      display:inline-flex;
      align-items:center;
      min-height:25px;
      padding:0 9px;
      border-radius:999px;
      background:#f3f5f7;
      color:#738095;
      font-size:10px;
      font-weight:800;
      white-space:nowrap;
    }
    #app .rc-inc-chevron{
      width:30px;
      height:30px;
      flex:0 0 30px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:#f5f6f8;
      color:#26354b;
      font-size:18px;
      font-weight:900;
      transition:transform .2s ease;
    }
    #app .rc-included-details[open] .rc-inc-chevron{transform:rotate(180deg)}
    #app .rc-inc-body{
      border-top:1px solid #edf0f3;
      padding:8px 16px 14px;
      background:#fbfcfd;
    }
    #app .rc-inc-body ul{
      list-style:none;
      margin:0;
      padding:0;
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:0 18px;
    }
    #app .rc-inc-body li{
      display:grid;
      grid-template-columns:22px minmax(0,1fr);
      gap:8px;
      align-items:start;
      padding:9px 0;
      border-bottom:1px solid #eef1f4;
      color:#465368;
      font-size:12px!important;
      line-height:1.4!important;
    }
    #app .rc-inc-dot{
      width:20px;
      height:20px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:#111827;
      color:#fff;
      font-size:10px;
      font-weight:900;
    }
    @media(max-width:620px){
      #app .rc-included-details>summary{min-height:54px;padding:12px 13px}
      #app .rc-inc-title{gap:7px}
      #app .rc-inc-title b{font-size:15px}
      #app .rc-inc-title small{font-size:9px;min-height:23px;padding:0 7px}
      #app .rc-inc-body{padding:6px 13px 12px}
      #app .rc-inc-body ul{grid-template-columns:1fr}
      #app .rc-inc-body li{font-size:12px!important;padding:8px 0}
    }
  `;
  document.head.appendChild(style);

  const run=()=>requestAnimationFrame(upgrade);
  const obs=new MutationObserver(run);
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('rentcam-route-change',()=>setTimeout(upgrade,0));
  document.addEventListener('rentcam-cms-updated',()=>setTimeout(upgrade,0));
  setTimeout(upgrade,0);
  setTimeout(upgrade,250);
  setTimeout(upgrade,700);
})();