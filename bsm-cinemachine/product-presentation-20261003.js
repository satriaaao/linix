/* Compact product information and CMS-controlled price/detail colors. */
(()=>{
 if(location.pathname.startsWith('/cms')||window.__rentcamProductPresentation)return;window.__rentcamProductPresentation=true;
 const css=document.createElement('link');css.rel='stylesheet';css.href='/product-presentation-20261003.css';document.head.append(css);
 const icons={description:'<path d="M7 3h10l3 3v15H4V3h3ZM8 9h8M8 13h8M8 17h5"/>',spec:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',included:'<path d="m12 3 9 5v8l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v8"/>',faq:'<path d="M5 3h14a2 2 0 0 1 2 2v12H9l-6 4V5a2 2 0 0 1 2-2ZM10 8a2 2 0 1 1 3 2c-1 .5-1 1-1 2M12 14h.01"/>'};
 const svg=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[k]+'</svg>';
 let pending=false;
 function apply(){pending=false;const t=window.RENTCAM_CMS_CONFIG?.theme||{},valid=(v,d)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:d;
 for(const [key,v] of Object.entries({'--rc-price-color':valid(t.priceColor,document.documentElement.dataset.storeTheme==='black'?'#34d399':'#087f5b'),'--rc-detail-color':valid(t.detailAccent,'#2563eb'),'--rc-detail-tint':valid(t.detailTint,'#eff6ff')}))if(document.documentElement.style.getPropertyValue(key)!==v)document.documentElement.style.setProperty(key,v);
 if(!location.pathname.startsWith('/produk/'))return;
 document.querySelectorAll('#app .detail-section,#app .cms-detail-block,#app .rc-product-knowledge').forEach(section=>{
   if(section.dataset.compactProduct)return;const heading=section.querySelector('h2,h3'),label=heading?.textContent.trim();let kind=/Deskripsi/i.test(label||'')?'description':/Specifications|Spesifikasi/i.test(label||'')?'spec':/Included|Isi Paket/i.test(label||'')?'included':/Pertanyaan yang Sering/i.test(label||'')?'faq':null;
   const existing=section.querySelector('.rc-included-details');if(existing)kind='included';if(!kind)return;
   section.dataset.compactProduct=kind;section.classList.add('rc-compact-product','rc-product-open-section');
   if(kind==='included'){section.dataset.rcIncludedDropdown='1';section.querySelector('.cms-included-toggle')?.remove();}
   if(existing){const summary=existing.querySelector('summary'),content=existing.querySelector('.rc-inc-body');const title=document.createElement('h2');title.innerHTML=svg(kind)+'<span>Included in Package</span>';const count=summary?.querySelector('small');if(count)title.append(count.cloneNode(true));section.replaceChildren(title);if(content)section.append(content);}
   else{const icon=document.createElement('span');icon.className='rc-detail-heading-icon';icon.innerHTML=svg(kind);heading.prepend(icon);}
   if(kind==='faq')section.querySelectorAll('.rc-product-faq details').forEach(d=>{const row=document.createElement('div');row.className='rc-faq-open';const question=document.createElement('h3');question.textContent=d.querySelector('summary')?.textContent||'';row.append(question);for(const answer of d.querySelectorAll('p'))row.append(answer);d.replaceWith(row);});

 });
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(apply);}}
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-store-theme']});
 new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true});document.addEventListener('rentcam-cms-updated',schedule);document.addEventListener('rentcam-route-change',schedule);schedule();
})();
