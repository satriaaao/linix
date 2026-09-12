/* Rentcam — polish Description + Included as Standard on product detail */
(function(){
  const byCat={
    'Electronic Control':{
      desc:(n)=>`${n} dirancang untuk workflow kontrol kamera dan lensa profesional. Perangkat ini membantu operator bekerja lebih cepat, presisi, dan konsisten pada produksi film, commercial, television, dan set multicamera.`,
      inc:['Unit utama sesuai produk','Mounting / interface standar sesuai konfigurasi','Kabel atau power accessory standar bila diperlukan','Protective packing / case sesuai paket']
    },
    'Matte Box':{
      desc:(n)=>`${n} merupakan sistem matte box ARRI untuk kontrol flare, penggunaan filter cinema, dan setup kamera profesional. Cocok untuk rig studio maupun produksi lapangan dengan konfigurasi yang fleksibel.`,
      inc:['Matte box / module utama','Filter tray sesuai konfigurasi set','Clamp / rod interface sesuai tipe produk','Protective case atau packing']
    },
    'Camera Support':{
      desc:(n)=>`${n} adalah bagian dari sistem camera support ARRI untuk membuat rig lebih stabil, aman, dan cepat saat setup. Cocok untuk kebutuhan studio, tripod, handheld, maupun konfigurasi cinema rig lainnya.`,
      inc:['Support / baseplate utama','Mounting hardware standar','Rod / interface component sesuai tipe','Protective packing / case']
    },
    'Filters':{
      desc:(n)=>`${n} dibuat untuk membantu kontrol exposure dan karakter image secara presisi pada workflow cinema. Filter ARRI dirancang untuk penggunaan profesional dengan kualitas optik yang konsisten.`,
      inc:['Filter utama sesuai density / tipe','Protective pouch atau case','Filter frame bila termasuk pada konfigurasi','Cleaning cloth / protective packing']
    },
    'Follow Focus':{
      desc:(n)=>`${n} merupakan sistem follow focus ARRI untuk kontrol fokus yang halus dan presisi. Cocok untuk kebutuhan focus puller pada produksi film, commercial, television, dan set profesional.`,
      inc:['Follow focus unit utama','Gear / drive interface standar','Mounting hardware sesuai konfigurasi','Protective case / packing']
    },
    'Accessories':{
      desc:(n)=>`${n} adalah aksesori ARRI untuk melengkapi dan mengoptimalkan konfigurasi camera rig profesional. Produk ini digunakan sebagai bagian dari workflow produksi agar setup lebih praktis, aman, dan terintegrasi.`,
      inc:['Unit aksesori utama','Mounting hardware bila termasuk','Cable / adapter standar bila termasuk','Protective packing sesuai paket']
    }
  };

  function style(){
    if(document.getElementById('detail-content-polish-style')) return;
    const s=document.createElement('style');
    s.id='detail-content-polish-style';
    s.textContent=`
      #app .detail-description-card{margin-top:4px;padding:20px 22px;border:1px solid #e8e8e8;border-radius:16px;background:#fafafa}
      #app .detail-description-card h2{margin:0 0 10px;font-size:22px;line-height:1.15;letter-spacing:-.02em}
      #app .detail-description-card p{margin:0;color:#555;font-size:15px;line-height:1.75;max-width:760px}
      #app .included-card{margin-top:18px;padding:22px;border:1px solid #e8e8e8;border-radius:16px;background:#fff}
      #app .included-card-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}
      #app .included-card h2{margin:0;font-size:22px;line-height:1.15;letter-spacing:-.02em}
      #app .included-card .included-sub{margin:0;color:#8a8a8a;font-size:11px;line-height:1.4;text-align:right}
      #app .included-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      #app .included-item{min-height:54px;display:flex;align-items:center;gap:11px;padding:12px 14px;border:1px solid #ededed;border-radius:12px;background:#fcfcfc;color:#222;font-size:13px;font-weight:650;line-height:1.35}
      #app .included-check{width:24px;height:24px;flex:0 0 24px;border-radius:50%;display:grid;place-items:center;background:#111;color:#fff;font-size:13px;font-weight:900}
      #app .included-note{margin:13px 0 0;padding-top:12px;border-top:1px solid #eee;color:#777;font-size:11px;line-height:1.55}
      @media(max-width:620px){
        #app .detail-description-card{padding:16px;border-radius:13px;margin-top:0}
        #app .detail-description-card h2,#app .included-card h2{font-size:18px}
        #app .detail-description-card p{font-size:13px;line-height:1.65}
        #app .included-card{padding:16px;border-radius:13px;margin-top:12px}
        #app .included-card-head{display:block;margin-bottom:12px}
        #app .included-card .included-sub{margin-top:5px;text-align:left;font-size:10px}
        #app .included-grid{grid-template-columns:1fr;gap:8px}
        #app .included-item{min-height:48px;padding:10px 12px;font-size:12px;border-radius:10px}
        #app .included-check{width:22px;height:22px;flex-basis:22px;font-size:12px}
      }
    `;
    document.head.appendChild(s);
  }

  function apply(){
    if(!location.pathname.startsWith('/produk/')) return;
    style();
    const info=document.querySelector('#app .detail-info');
    if(!info) return;
    const name=(info.querySelector('h1')?.textContent||'Produk ARRI').trim();
    const brandLine=(info.querySelector('.detail-brand')?.textContent||'');
    const category=(brandLine.split('·')[1]||'').trim();
    if(category==='Paket'||category==='Package')return;
    const cfg=byCat[category];
    if(!cfg)return;
    const id=decodeURIComponent(location.pathname.split('/').pop());
    if((window.RENTCAM_CMS_CONFIG?.customProducts||[]).some(p=>p.id===id))return;
    const sections=info.querySelector('.detail-sections');
    if(!sections) return;

    let first=sections.querySelector('.detail-section');
    if(first && !first.classList.contains('detail-description-card')){
      first.classList.add('detail-description-card');
      const h=first.querySelector('h2'); if(h) h.textContent='Description';
      const p=first.querySelector('p'); if(p) p.textContent=cfg.desc(name);
    }

    if(!sections.querySelector('.included-card')){
      const inc=document.createElement('section');
      inc.className='included-card';
      inc.innerHTML=`<div class="included-card-head"><h2>Included as Standard</h2><p class="included-sub">Isi paket dapat menyesuaikan konfigurasi produk</p></div><div class="included-grid">${cfg.inc.map(x=>`<div class="included-item"><span class="included-check">✓</span><span>${x}</span></div>`).join('')}</div><p class="included-note">Konfigurasi final akan dikonfirmasi saat booking agar sesuai dengan kebutuhan produksi dan unit yang tersedia.</p>`;
      const spec=Array.from(sections.querySelectorAll('.detail-section')).find(x=>/Specifications/i.test(x.querySelector('h2')?.textContent||''));
      if(spec) sections.insertBefore(inc,spec); else sections.appendChild(inc);
    }
  }

  const run=()=>requestAnimationFrame(apply);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  const app=document.getElementById('app');
  if(app) new MutationObserver(run).observe(app,{childList:true,subtree:true});
  addEventListener('popstate',run);
})();
