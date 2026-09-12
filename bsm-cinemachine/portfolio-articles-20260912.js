/* Rentcam — premium portfolio + editorial article pages */
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const EXTRA_PORT=[
    {id:'fashion',title:'Fashion Film — Studio Campaign',cat:'Commercial',year:'2026',camera:'ARRI ALEXA Mini LF',lenses:'ARRI Signature Prime',img:'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=88',desc:'Studio campaign dengan lighting terkontrol, skin tone natural dan workflow monitoring yang cepat.'},
    {id:'shortfilm',title:'Short Film — Urban Night',cat:'Film',year:'2026',camera:'ARRI ALEXA 35',lenses:'Cooke S8/i',img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=88',desc:'Night exterior dengan dynamic range tinggi, practical light dan compact wireless monitoring.'},
    {id:'concert',title:'Live Performance — Concert Visual',cat:'Live Production',year:'2026',camera:'Sony VENICE 2',lenses:'Cinema Zoom',img:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=88',desc:'Multi-camera setup untuk performance dengan low-light capability dan workflow production yang efisien.'},
    {id:'corporate',title:'Corporate Brand Story',cat:'Corporate',year:'2026',camera:'Sony BURANO',lenses:'ARRI Signature Prime',img:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=88',desc:'Brand story dengan setup ringan, interview premium dan lighting natural untuk lokasi kantor.'}
  ];

  const EXTRA_ART=[
    {id:'burano-guide',title:'Sony BURANO untuk Documentary dan Commercial',cat:'Camera Guide',date:'10 Sep 2026',img:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=88',excerpt:'Kapan BURANO lebih cocok dibanding VENICE 2 atau FX6 untuk produksi lapangan.'},
    {id:'wireless-video',title:'Workflow Wireless Video yang Rapi di Set',cat:'Workflow',date:'7 Sep 2026',img:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=88',excerpt:'Menyusun transmitter, director monitor, focus monitor dan power management tanpa bikin set berantakan.'},
    {id:'production-audio',title:'Audio Production: Recorder dan Shotgun Mic',cat:'Audio Guide',date:'4 Sep 2026',img:'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1400&q=88',excerpt:'Dasar memilih recorder, shotgun microphone, wireless lav dan timecode untuk produksi profesional.'},
    {id:'camera-support',title:'Camera Support untuk Rig Cinema Berat',cat:'Workflow',date:'1 Sep 2026',img:'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1400&q=88',excerpt:'Baseplate, dovetail, tripod head dan support system yang tepat untuk build cinema.'},
    {id:'lighting-package',title:'Menyusun Lighting Package untuk Commercial',cat:'Lighting Guide',date:'29 Aug 2026',img:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=88',excerpt:'Cara menggabungkan key light, soft source, practical dan control system untuk set commercial.'}
  ];

  try{
    EXTRA_PORT.forEach(x=>{if(!PORT.some(v=>v.id===x.id)) PORT.push(x)});
    EXTRA_ART.forEach(x=>{if(!ART.some(v=>v.id===x.id)) ART.push(x)});
  }catch(e){}

  function installStyle(){
    if(document.getElementById('rentcam-editorial-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-editorial-style';
    st.textContent=`
      #app .editorial-page{background:#f7f7f5;min-height:70vh;padding:0 0 72px}
      #app .editorial-hero{padding:64px 0 44px;border-bottom:1px solid #e5e5e1;background:linear-gradient(180deg,#fff 0%,#f7f7f5 100%)}
      #app .editorial-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#f26a21;margin-bottom:12px}
      #app .editorial-hero h1{margin:0;max-width:850px;font-size:clamp(42px,6vw,76px);line-height:.96;letter-spacing:-.055em;color:#111}
      #app .editorial-hero p{max-width:680px;margin:18px 0 0;font-size:16px;line-height:1.65;color:#666}
      #app .editorial-stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}
      #app .editorial-stat{display:flex;align-items:center;height:38px;padding:0 14px;border:1px solid #deded9;border-radius:999px;background:#fff;font-size:11px;font-weight:800;color:#444}
      #app .editorial-filters{display:flex;gap:8px;flex-wrap:wrap;padding:28px 0 24px}
      #app .editorial-filter{height:38px;padding:0 14px;border:1px solid #ddd;background:#fff;border-radius:999px;font-size:11px;font-weight:800;color:#555;cursor:pointer}
      #app .editorial-filter.on{background:#111;border-color:#111;color:#fff}

      #app .portfolio-feature{display:grid;grid-template-columns:1.45fr .75fr;min-height:520px;background:#111;border-radius:24px;overflow:hidden;color:#fff;cursor:pointer;margin-bottom:18px}
      #app .portfolio-feature-media{position:relative;min-height:520px;overflow:hidden}
      #app .portfolio-feature-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .55s ease}
      #app .portfolio-feature:hover img{transform:scale(1.025)}
      #app .portfolio-feature-copy{padding:44px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(160deg,#151515,#080808)}
      #app .portfolio-feature-copy small,#app .portfolio-card small{font-size:9px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#f26a21}
      #app .portfolio-feature-copy h2{margin:10px 0 14px;font-size:42px;line-height:1.03;letter-spacing:-.045em;color:#fff}
      #app .portfolio-feature-copy p{margin:0 0 24px;color:#aaa;line-height:1.6;font-size:13px}
      #app .portfolio-meta-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,.12)}
      #app .portfolio-meta-row span{display:block;color:#777;font-size:9px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}
      #app .portfolio-meta-row b{font-size:12px;color:#fff}
      #app .portfolio-grid-premium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
      #app .portfolio-card{background:#fff;border:1px solid #e7e7e3;border-radius:18px;overflow:hidden;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
      #app .portfolio-card:hover{transform:translateY(-4px);box-shadow:0 14px 38px rgba(0,0,0,.07)}
      #app .portfolio-card-media{aspect-ratio:1.38/1;overflow:hidden;background:#eee}
      #app .portfolio-card-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
      #app .portfolio-card:hover img{transform:scale(1.03)}
      #app .portfolio-card-body{padding:18px}
      #app .portfolio-card h3{margin:8px 0 8px;font-size:20px;line-height:1.08;letter-spacing:-.025em;color:#111}
      #app .portfolio-card p{margin:0;color:#777;font-size:12px;line-height:1.55}
      #app .portfolio-card-equipment{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}
      #app .portfolio-chip{display:inline-flex;align-items:center;min-height:27px;padding:0 9px;background:#f5f5f2;border-radius:999px;font-size:9px;font-weight:750;color:#555}

      #app .article-feature{display:grid;grid-template-columns:1.18fr .82fr;background:#fff;border:1px solid #e6e6e1;border-radius:22px;overflow:hidden;cursor:pointer;margin-bottom:22px}
      #app .article-feature-media{min-height:410px;overflow:hidden}
      #app .article-feature-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
      #app .article-feature:hover img{transform:scale(1.025)}
      #app .article-feature-copy{padding:42px;display:flex;flex-direction:column;justify-content:center}
      #app .article-label{font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#f26a21}
      #app .article-feature h2{margin:12px 0 14px;font-size:40px;line-height:1.02;letter-spacing:-.04em;color:#111}
      #app .article-feature p{margin:0;color:#6e6e6e;font-size:14px;line-height:1.65}
      #app .article-read{margin-top:22px;font-size:11px;font-weight:850;color:#111}
      #app .article-grid-premium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
      #app .article-card-premium{background:#fff;border:1px solid #e7e7e3;border-radius:18px;overflow:hidden;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
      #app .article-card-premium:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(0,0,0,.07)}
      #app .article-card-media{aspect-ratio:1.5/1;overflow:hidden}
      #app .article-card-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
      #app .article-card-premium:hover img{transform:scale(1.03)}
      #app .article-card-body{padding:18px}
      #app .article-card-premium h3{margin:8px 0 9px;font-size:19px;line-height:1.15;letter-spacing:-.022em;color:#111}
      #app .article-card-premium p{margin:0;color:#777;font-size:12px;line-height:1.55}
      #app .article-card-footer{display:flex;justify-content:space-between;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid #eee;font-size:9px;color:#999}

      #app .editorial-detail{background:#fff;padding:34px 0 74px}
      #app .detail-back-icon{width:42px;height:42px;border:1px solid #ddd;border-radius:50%;background:#fff;display:grid;place-items:center;cursor:pointer;font-size:19px;margin-bottom:28px;transition:.18s ease}
      #app .detail-back-icon:hover{background:#111;color:#fff;border-color:#111}
      #app .portfolio-detail-head{display:grid;grid-template-columns:1fr .86fr;gap:54px;align-items:end;margin-bottom:32px}
      #app .portfolio-detail-head h1,#app .article-detail-head h1{margin:8px 0 0;font-size:clamp(40px,6vw,72px);line-height:.98;letter-spacing:-.052em;color:#111}
      #app .portfolio-detail-summary{font-size:15px;line-height:1.7;color:#666;margin:0}
      #app .portfolio-detail-image{width:100%;aspect-ratio:2/1;object-fit:cover;border-radius:22px;display:block}
      #app .portfolio-detail-info{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 36px}
      #app .portfolio-info-box{padding:18px;border:1px solid #e5e5e1;border-radius:14px;background:#fafaf8}
      #app .portfolio-info-box span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-bottom:7px}
      #app .portfolio-info-box b{font-size:13px;color:#111}
      #app .detail-copy{max-width:820px;margin:0 auto;font-size:16px;line-height:1.82;color:#4d4d4d}
      #app .detail-copy h2{font-size:28px;line-height:1.1;letter-spacing:-.03em;color:#111;margin:38px 0 14px}
      #app .detail-copy p{margin:0 0 20px}
      #app .detail-callout{margin:30px 0;padding:24px;border-left:3px solid #f26a21;background:#f8f8f5;border-radius:0 14px 14px 0;font-weight:650;color:#222}
      #app .article-detail-head{max-width:920px;margin:0 auto 28px;text-align:center}
      #app .article-detail-lead{max-width:760px;margin:18px auto 0;font-size:18px;line-height:1.6;color:#666}
      #app .article-detail-meta{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px;color:#999;font-size:10px;font-weight:750}
      #app .article-detail-image{width:min(1120px,100%);aspect-ratio:1.9/1;object-fit:cover;border-radius:22px;display:block;margin:34px auto 38px}
      #app .related-editorial{margin-top:54px;padding-top:30px;border-top:1px solid #e8e8e4}
      #app .related-editorial-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}
      #app .related-editorial-head h2{margin:0;font-size:28px;letter-spacing:-.03em}

      @media(max-width:900px){
        #app .portfolio-feature{grid-template-columns:1fr;min-height:auto}
        #app .portfolio-feature-media{min-height:390px}
        #app .portfolio-feature-copy{padding:30px}
        #app .portfolio-grid-premium,#app .article-grid-premium{grid-template-columns:repeat(2,minmax(0,1fr))}
        #app .article-feature{grid-template-columns:1fr}
        #app .article-feature-media{min-height:340px}
        #app .portfolio-detail-head{grid-template-columns:1fr;gap:16px;align-items:start}
      }
      @media(max-width:620px){
        #app .editorial-page{padding-bottom:42px}
        #app .editorial-hero{padding:38px 0 28px}
        #app .editorial-hero h1{font-size:42px}
        #app .editorial-hero p{font-size:13px;margin-top:12px}
        #app .editorial-stats{margin-top:18px}
        #app .editorial-stat{height:32px;padding:0 11px;font-size:9px}
        #app .editorial-filters{flex-wrap:nowrap;overflow-x:auto;padding:20px 0 16px;scrollbar-width:none}
        #app .editorial-filters::-webkit-scrollbar{display:none}
        #app .editorial-filter{flex:0 0 auto;height:34px;font-size:9.5px;padding:0 12px}
        #app .portfolio-feature{border-radius:16px;margin-bottom:10px}
        #app .portfolio-feature-media{min-height:260px}
        #app .portfolio-feature-copy{padding:22px}
        #app .portfolio-feature-copy h2{font-size:28px;margin:8px 0 10px}
        #app .portfolio-feature-copy p{font-size:11px;margin-bottom:16px}
        #app .portfolio-meta-row{grid-template-columns:1fr;gap:10px;padding-top:14px}
        #app .portfolio-grid-premium,#app .article-grid-premium{grid-template-columns:1fr;gap:10px}
        #app .portfolio-card,#app .article-card-premium{border-radius:14px}
        #app .portfolio-card-media{aspect-ratio:1.55/1}
        #app .portfolio-card-body,#app .article-card-body{padding:14px}
        #app .portfolio-card h3,#app .article-card-premium h3{font-size:17px}
        #app .article-feature{border-radius:16px;margin-bottom:12px}
        #app .article-feature-media{min-height:230px}
        #app .article-feature-copy{padding:22px}
        #app .article-feature h2{font-size:28px;margin:9px 0 10px}
        #app .article-feature p{font-size:12px}
        #app .editorial-detail{padding:20px 0 46px}
        #app .detail-back-icon{width:38px;height:38px;margin-bottom:20px}
        #app .portfolio-detail-head h1,#app .article-detail-head h1{font-size:38px}
        #app .portfolio-detail-summary{font-size:13px}
        #app .portfolio-detail-image,#app .article-detail-image{border-radius:15px;aspect-ratio:1.35/1}
        #app .portfolio-detail-info{grid-template-columns:1fr;gap:8px;margin:12px 0 26px}
        #app .portfolio-info-box{padding:14px}
        #app .article-detail-lead{font-size:15px;margin-top:12px}
        #app .article-detail-image{margin:24px auto 28px}
        #app .detail-copy{font-size:14px;line-height:1.75}
        #app .detail-copy h2{font-size:23px;margin-top:30px}
      }
    `;
    document.head.appendChild(st);
  }

  window.__rentcamPortfolioCat=window.__rentcamPortfolioCat||'All';
  window.__rentcamArticleCat=window.__rentcamArticleCat||'All';
  window.rentcamPortfolioFilter=function(cat){window.__rentcamPortfolioCat=cat;render()};
  window.rentcamArticleFilter=function(cat){window.__rentcamArticleCat=cat;render()};

  function portfolioCard(x){
    return `<article class="portfolio-card" onclick="go('/portfolio/${esc(x.id)}')"><div class="portfolio-card-media"><img src="${x.img}" alt="${esc(x.title)}" loading="lazy"></div><div class="portfolio-card-body"><small>${esc(x.year)} · ${esc(x.cat)}</small><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p><div class="portfolio-card-equipment"><span class="portfolio-chip">${esc(x.camera)}</span><span class="portfolio-chip">${esc(x.lenses)}</span></div></div></article>`;
  }

  window.portfolio=function(){
    installStyle();
    const cats=['All',...new Set(PORT.map(x=>x.cat))];
    const current=window.__rentcamPortfolioCat;
    const items=current==='All'?PORT:PORT.filter(x=>x.cat===current);
    const feature=items[0]||PORT[0];
    const rest=items.slice(1);
    return `<section class="editorial-page"><div class="editorial-hero"><div class="container"><div class="editorial-kicker">Production Portfolio</div><h1>Selected productions. Built around the right gear.</h1><p>Showcase workflow kamera, lensa, lighting dan monitoring untuk berbagai kebutuhan produksi.</p><div class="editorial-stats"><span class="editorial-stat">${PORT.length} Projects</span><span class="editorial-stat">Cinema Camera Systems</span><span class="editorial-stat">Production Ready</span></div></div></div><div class="container"><div class="editorial-filters">${cats.map(c=>`<button class="editorial-filter ${current===c?'on':''}" onclick="rentcamPortfolioFilter('${String(c).replace(/'/g,"\\'")}')">${esc(c)}</button>`).join('')}</div>${feature?`<article class="portfolio-feature" onclick="go('/portfolio/${esc(feature.id)}')"><div class="portfolio-feature-media"><img src="${feature.img}" alt="${esc(feature.title)}"></div><div class="portfolio-feature-copy"><small>${esc(feature.year)} · ${esc(feature.cat)}</small><h2>${esc(feature.title)}</h2><p>${esc(feature.desc)}</p><div class="portfolio-meta-row"><div><span>Camera</span><b>${esc(feature.camera)}</b></div><div><span>Lenses</span><b>${esc(feature.lenses)}</b></div></div></div></article>`:''}<div class="portfolio-grid-premium">${rest.map(portfolioCard).join('')}</div></div></section>`;
  };

  window.portDetail=function(id){
    installStyle();
    const x=PORT.find(v=>v.id===id); if(!x) return portfolio();
    const related=PORT.filter(v=>v.id!==id).slice(0,3);
    return `<section class="editorial-detail"><div class="container"><button class="detail-back-icon" onclick="go('/portfolio')" aria-label="Kembali">←</button><div class="portfolio-detail-head"><div><div class="editorial-kicker">${esc(x.year)} · ${esc(x.cat)}</div><h1>${esc(x.title)}</h1></div><p class="portfolio-detail-summary">${esc(x.desc)}</p></div><img class="portfolio-detail-image" src="${x.img}" alt="${esc(x.title)}"><div class="portfolio-detail-info"><div class="portfolio-info-box"><span>Camera System</span><b>${esc(x.camera)}</b></div><div class="portfolio-info-box"><span>Lens Package</span><b>${esc(x.lenses)}</b></div><div class="portfolio-info-box"><span>Production Type</span><b>${esc(x.cat)}</b></div></div><div class="detail-copy"><h2>Production Approach</h2><p>Package dirancang supaya camera department dapat bekerja cepat dan konsisten sejak prep sampai shooting. Fokusnya adalah reliability, ergonomi rig, monitoring, power management dan workflow yang sesuai kebutuhan set.</p><div class="detail-callout">Camera dan lens dipilih sebagai satu sistem, bukan berdiri sendiri. Support, wireless video, media, battery dan monitoring ikut menentukan kelancaran produksi.</div><h2>Equipment Workflow</h2><p>Konfigurasi dapat disesuaikan untuk handheld, tripod, studio build maupun run-and-gun. Tim rental dapat membantu menyiapkan package berdasarkan format shooting, jumlah crew dan kebutuhan monitoring.</p></div>${related.length?`<div class="related-editorial"><div class="related-editorial-head"><h2>Project Lainnya</h2></div><div class="portfolio-grid-premium">${related.map(portfolioCard).join('')}</div></div>`:''}</div></section>`;
  };

  function articleCard(x){
    return `<article class="article-card-premium" onclick="go('/artikel/${esc(x.id)}')"><div class="article-card-media"><img src="${x.img}" alt="${esc(x.title)}" loading="lazy"></div><div class="article-card-body"><div class="article-label">${esc(x.cat)}</div><h3>${esc(x.title)}</h3><p>${esc(x.excerpt)}</p><div class="article-card-footer"><span>${esc(x.date)}</span><span>Baca artikel →</span></div></div></article>`;
  }

  window.articles=function(){
    installStyle();
    const cats=['All',...new Set(ART.map(x=>x.cat))];
    const current=window.__rentcamArticleCat;
    const items=current==='All'?ART:ART.filter(x=>x.cat===current);
    const feature=items[0]||ART[0];
    const rest=items.slice(1);
    return `<section class="editorial-page"><div class="editorial-hero"><div class="container"><div class="editorial-kicker">Rentcam Journal</div><h1>Production knowledge, without the noise.</h1><p>Guide kamera, lensa, lighting, audio dan workflow produksi yang praktis untuk membantu memilih equipment dengan lebih tepat.</p><div class="editorial-stats"><span class="editorial-stat">${ART.length} Articles</span><span class="editorial-stat">Camera & Lighting</span><span class="editorial-stat">Production Workflow</span></div></div></div><div class="container"><div class="editorial-filters">${cats.map(c=>`<button class="editorial-filter ${current===c?'on':''}" onclick="rentcamArticleFilter('${String(c).replace(/'/g,"\\'")}')">${esc(c)}</button>`).join('')}</div>${feature?`<article class="article-feature" onclick="go('/artikel/${esc(feature.id)}')"><div class="article-feature-media"><img src="${feature.img}" alt="${esc(feature.title)}"></div><div class="article-feature-copy"><div class="article-label">Featured · ${esc(feature.cat)}</div><h2>${esc(feature.title)}</h2><p>${esc(feature.excerpt)}</p><div class="article-read">${esc(feature.date)} · Baca artikel →</div></div></article>`:''}<div class="article-grid-premium">${rest.map(articleCard).join('')}</div></div></section>`;
  };

  window.artDetail=function(id){
    installStyle();
    const x=ART.find(v=>v.id===id); if(!x) return articles();
    const related=ART.filter(v=>v.id!==id).slice(0,3);
    return `<section class="editorial-detail"><div class="container"><button class="detail-back-icon" onclick="go('/artikel')" aria-label="Kembali">←</button><div class="article-detail-head"><div class="article-label">${esc(x.cat)}</div><h1>${esc(x.title)}</h1><p class="article-detail-lead">${esc(x.excerpt)}</p><div class="article-detail-meta"><span>${esc(x.date)}</span><span>•</span><span>5 min read</span><span>•</span><span>Rentcam Journal</span></div></div><img class="article-detail-image" src="${x.img}" alt="${esc(x.title)}"><article class="detail-copy"><p>Dalam produksi cinema, pilihan equipment sebaiknya mengikuti kebutuhan visual, ritme kerja set, ukuran crew dan workflow post-production. Spesifikasi tinggi baru terasa berguna ketika seluruh sistem bekerja dengan konsisten.</p><h2>Mulai dari kebutuhan produksi</h2><p>Tentukan dulu format shooting, kebutuhan frame rate, kondisi cahaya, cara kamera bergerak dan siapa saja yang membutuhkan monitoring. Dari sana camera body, lens, media, battery, support dan wireless system bisa disusun lebih tepat.</p><div class="detail-callout">Package yang baik bukan package dengan alat paling banyak, tetapi package yang paling sesuai dengan cara crew bekerja.</div><h2>Perhatikan workflow di set</h2><p>Compatibility antar perangkat, distribusi power, balancing rig, media management dan monitoring sering lebih menentukan kelancaran shooting dibanding satu spesifikasi tunggal. Prep sebelum shooting membantu mengurangi perubahan mendadak di lokasi.</p><h2>Bangun package sebagai satu sistem</h2><p>Rentcam dapat membantu menyusun camera package lengkap termasuk body, lens, media, battery, monitoring, wireless video, follow focus, grip dan lighting sesuai skala produksi.</p></article>${related.length?`<div class="related-editorial"><div class="related-editorial-head"><h2>Artikel Lainnya</h2></div><div class="article-grid-premium">${related.map(articleCard).join('')}</div></div>`:''}</div></section>`;
  };

  if(/^\/(portfolio|artikel)(\/|$)/.test(location.pathname) && typeof render==='function') setTimeout(()=>render(),0);
})();
