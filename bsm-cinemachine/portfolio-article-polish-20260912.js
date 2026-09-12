/* Rentcam — standalone Portfolio + Artikel renderer */
(function(){
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const PORTFOLIO=[
    {id:'drama-night',title:'Drama Series — Night Exterior',cat:'TV Series',year:'2026',camera:'ARRI ALEXA 35',lens:'Cooke S8/i',img:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=88',desc:'Night exterior production dengan cinema lighting, wireless monitoring, dan workflow camera yang dirancang untuk set besar.'},
    {id:'automotive',title:'Automotive Commercial',cat:'Commercial',year:'2026',camera:'Sony VENICE 2',lens:'ARRI Signature Prime',img:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=88',desc:'Large-format commercial package untuk visual premium, detail tinggi, dan workflow produksi yang cepat.'},
    {id:'music-stage',title:'Music Video — Stage Production',cat:'Music Video',year:'2026',camera:'RED V-RAPTOR [X]',lens:'Atlas Mercury',img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=88',desc:'Anamorphic package dengan high-output LED, monitoring, dan wireless video untuk produksi panggung.'},
    {id:'documentary',title:'Documentary Field Unit',cat:'Documentary',year:'2026',camera:'Sony BURANO',lens:'Cinema Zoom',img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=88',desc:'Compact cinema setup untuk documentary dengan mobilitas tinggi dan pergantian setup yang cepat.'},
    {id:'fashion',title:'Fashion Campaign — Studio',cat:'Campaign',year:'2026',camera:'ARRI ALEXA Mini LF',lens:'Cooke S8/i',img:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=88',desc:'Studio package untuk skin tone natural, controlled lighting, dan monitoring client di set.'},
    {id:'corporate',title:'Corporate Film — Industrial',cat:'Corporate',year:'2026',camera:'Sony FX6',lens:'Cinema Zoom',img:'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=88',desc:'Efficient production package untuk company profile dan industrial shoot dengan crew ringkas.'}
  ];

  const ARTICLES=[
    {id:'alexa-vs-venice',title:'ARRI ALEXA 35 vs Sony VENICE 2: Pilih Mana?',cat:'Camera Guide',date:'11 Sep 2026',read:'7 min',img:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1800&q=88',excerpt:'Perbandingan sensor, latitude, workflow, body size, dan tipe produksi yang cocok untuk masing-masing kamera.'},
    {id:'cinema-lens',title:'Cara Memilih Cinema Lens untuk Film & Commercial',cat:'Lens Guide',date:'8 Sep 2026',read:'6 min',img:'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=1800&q=88',excerpt:'Cooke, ARRI Signature, ZEISS, spherical, atau anamorphic? Ini cara memilihnya berdasarkan karakter visual.'},
    {id:'lighting-set',title:'Setup Cinema Lighting untuk Set Besar',cat:'Lighting Guide',date:'5 Sep 2026',read:'8 min',img:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=88',excerpt:'Memahami key light, fill, practical, control system, dan pemilihan fixture untuk studio maupun exterior.'},
    {id:'wireless-video',title:'Wireless Video di Set: Teradek, Monitor, dan Workflow',cat:'Workflow',date:'2 Sep 2026',read:'5 min',img:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1800&q=88',excerpt:'Cara menyusun jalur video untuk director, focus puller, client monitor, dan video village tanpa bikin set berantakan.'},
    {id:'audio-production',title:'Production Sound: Recorder dan Shotgun Mic yang Tepat',cat:'Audio Guide',date:'30 Aug 2026',read:'6 min',img:'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1800&q=88',excerpt:'Dasar memilih recorder, microphone, wireless system, dan timecode untuk produksi profesional.'},
    {id:'camera-package',title:'Cara Menyusun Camera Package Sebelum Shooting',cat:'Rental Guide',date:'27 Aug 2026',read:'7 min',img:'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1800&q=88',excerpt:'Checklist body, lens, media, battery, monitoring, support, dan accessories agar tidak ada item penting yang tertinggal.'}
  ];

  function installStyle(){
    if(document.getElementById('rentcam-editorial-live-style')) return;
    const s=document.createElement('style');
    s.id='rentcam-editorial-live-style';
    s.textContent=`
      #app .rentcam-editorial{background:#fff;color:#111;padding:0 0 72px}
      #app .rentcam-editorial .container{padding-top:34px}
      #app .ed-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:42px;align-items:end;padding:32px 0 36px;border-bottom:1px solid #e8e8e8}
      #app .ed-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#777;margin-bottom:14px;display:flex;align-items:center;gap:9px}
      #app .ed-kicker:before{content:'';width:25px;height:2px;border-radius:99px;background:#f26a21}
      #app .ed-hero h1{margin:0;font-size:clamp(44px,5.4vw,76px);line-height:.94;letter-spacing:-.065em;max-width:820px}
      #app .ed-hero p{margin:0;color:#6b6b6b;font-size:15px;line-height:1.7;max-width:520px}
      #app .ed-feature{margin:32px 0 22px;border-radius:24px;overflow:hidden;cursor:pointer;position:relative;background:#111;min-height:500px}
      #app .ed-feature img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
      #app .ed-feature:hover img{transform:scale(1.02)}
      #app .ed-feature:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.03) 20%,rgba(0,0,0,.84) 100%)}
      #app .ed-feature-copy{position:absolute;z-index:2;left:34px;right:34px;bottom:32px;color:#fff;display:flex;justify-content:space-between;gap:24px;align-items:end}
      #app .ed-feature-copy small,#app .ed-card small{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
      #app .ed-feature-copy small{color:rgba(255,255,255,.72)}
      #app .ed-feature-copy h2{color:#fff;margin:8px 0;font-size:34px;line-height:1;letter-spacing:-.045em}
      #app .ed-feature-copy p{color:rgba(255,255,255,.82);font-size:13px;line-height:1.55;margin:0;max-width:650px}
      #app .ed-open{width:48px;height:48px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-size:21px;font-weight:900;flex:0 0 auto}
      #app .ed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
      #app .ed-card{border:1px solid #e8e8e8;border-radius:18px;overflow:hidden;background:#fff;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
      #app .ed-card:hover{transform:translateY(-4px);box-shadow:0 15px 34px rgba(0,0,0,.07)}
      #app .ed-card img{width:100%;aspect-ratio:1.45/1;object-fit:cover;display:block;background:#f5f5f5}
      #app .ed-card-body{padding:17px}
      #app .ed-card small{color:#888}
      #app .ed-card h3{margin:8px 0;font-size:20px;line-height:1.1;letter-spacing:-.035em}
      #app .ed-card p{margin:0;color:#707070;font-size:12px;line-height:1.58}
      #app .ed-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
      #app .ed-tag{height:28px;padding:0 10px;border-radius:999px;background:#f7f7f5;border:1px solid #e5e5e2;display:inline-flex;align-items:center;font-size:9px;font-weight:800;color:#333}
      #app .article-feature{display:grid;grid-template-columns:1.12fr .88fr;min-height:410px;background:#111;border-radius:24px;overflow:hidden;margin:32px 0 22px;cursor:pointer}
      #app .article-feature img{width:100%;height:100%;object-fit:cover;min-height:410px}
      #app .article-feature-copy{padding:42px;display:flex;flex-direction:column;justify-content:center;color:#fff}
      #app .article-feature-copy small{color:#f7a66f;font-size:9px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
      #app .article-feature-copy h2{color:#fff;font-size:36px;line-height:1.02;letter-spacing:-.05em;margin:12px 0}
      #app .article-feature-copy p{font-size:14px;line-height:1.65;color:rgba(255,255,255,.72);margin:0 0 18px}
      #app .article-feature-copy b{font-size:11px;color:#fff}
      #app .ed-detail{max-width:1120px;padding-top:28px!important;padding-bottom:70px}
      #app .ed-back{width:44px;height:44px;border-radius:50%;border:1px solid #e2e2e2;background:#fff;display:grid;place-items:center;cursor:pointer;font-size:20px;margin-bottom:24px;box-shadow:0 4px 14px rgba(0,0,0,.04)}
      #app .ed-detail-meta{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#858585}
      #app .ed-detail h1{font-size:clamp(40px,5vw,68px);line-height:.98;letter-spacing:-.055em;max-width:900px;margin:10px 0 18px}
      #app .ed-lead{max-width:780px;font-size:17px;line-height:1.65;color:#686868;margin:0 0 30px}
      #app .ed-detail-image{width:100%;max-height:650px;object-fit:cover;border-radius:22px;display:block;margin-bottom:32px}
      #app .ed-copy{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:54px}
      #app .ed-copy-main p{font-size:15px;line-height:1.85;color:#3f3f3f;margin:0 0 18px}
      #app .ed-side{border-left:1px solid #e8e8e8;padding-left:24px}
      #app .ed-side h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 12px}
      #app .ed-side-row{padding:11px 0;border-bottom:1px solid #eee;color:#777;font-size:12px}
      #app .ed-side-row b{display:block;color:#111;margin-top:3px}
      @media(max-width:900px){#app .ed-hero{grid-template-columns:1fr;gap:16px}#app .ed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#app .article-feature{grid-template-columns:1fr}#app .article-feature img{min-height:320px}#app .ed-copy{grid-template-columns:1fr;gap:28px}#app .ed-side{border-left:0;border-top:1px solid #e8e8e8;padding:22px 0 0}}
      @media(max-width:620px){#app .rentcam-editorial .container{padding-top:20px}#app .ed-hero{padding:22px 0 24px}#app .ed-hero h1{font-size:42px}#app .ed-hero p{font-size:12px}#app .ed-feature{min-height:380px;border-radius:18px;margin-top:22px}#app .ed-feature-copy{left:18px;right:18px;bottom:18px}#app .ed-feature-copy h2{font-size:25px}#app .ed-open{display:none}#app .ed-grid{grid-template-columns:1fr;gap:12px}#app .ed-card{border-radius:15px}#app .ed-card-body{padding:14px}#app .article-feature{border-radius:18px;margin-top:22px}#app .article-feature img{min-height:230px}#app .article-feature-copy{padding:22px}#app .article-feature-copy h2{font-size:27px}#app .ed-detail{padding-top:18px!important}#app .ed-back{width:40px;height:40px;margin-bottom:18px}#app .ed-detail h1{font-size:38px}#app .ed-lead{font-size:14px;margin-bottom:22px}#app .ed-detail-image{border-radius:16px;margin-bottom:24px}#app .ed-copy-main p{font-size:14px;line-height:1.75}}
    `;
    document.head.appendChild(s);
  }

  function portfolioList(){
    const f=PORTFOLIO[0], rest=PORTFOLIO.slice(1);
    return `<section class="rentcam-editorial"><div class="container"><div class="ed-hero"><div><div class="ed-kicker">Production Portfolio</div><h1>Stories built with cinema gear.</h1></div><p>Showcase produksi film, commercial, music video, campaign dan documentary dengan camera package, cinema lens, lighting serta monitoring profesional.</p></div><article class="ed-feature" onclick="go('/portfolio/${esc(f.id)}')"><img src="${esc(f.img)}" alt="${esc(f.title)}"><div class="ed-feature-copy"><div><small>${esc(f.year)} · ${esc(f.cat)} · Featured Project</small><h2>${esc(f.title)}</h2><p>${esc(f.desc)}</p></div><span class="ed-open">↗</span></div></article><div class="ed-grid">${rest.map(x=>`<article class="ed-card" onclick="go('/portfolio/${esc(x.id)}')"><img src="${esc(x.img)}" alt="${esc(x.title)}" loading="lazy"><div class="ed-card-body"><small>${esc(x.year)} · ${esc(x.cat)}</small><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p><div class="ed-tags"><span class="ed-tag">${esc(x.camera)}</span><span class="ed-tag">${esc(x.lens)}</span></div></div></article>`).join('')}</div></div></section>`;
  }

  function portfolioDetail(id){
    const x=PORTFOLIO.find(v=>v.id===id)||PORTFOLIO[0];
    return `<section class="rentcam-editorial"><div class="container ed-detail"><button class="ed-back" onclick="go('/portfolio')" aria-label="Kembali">←</button><div class="ed-detail-meta">${esc(x.year)} · ${esc(x.cat)} · Rentcam Portfolio</div><h1>${esc(x.title)}</h1><p class="ed-lead">${esc(x.desc)}</p><img class="ed-detail-image" src="${esc(x.img)}" alt="${esc(x.title)}"><div class="ed-copy"><div class="ed-copy-main"><p>Project ini dibangun dengan pendekatan camera package yang menyesuaikan kebutuhan visual, mobilitas crew, workflow monitoring dan karakter lensa.</p><p>Konfigurasi equipment disusun supaya proses produksi tetap cepat, stabil dan konsisten dari preparation sampai shooting selesai.</p></div><aside class="ed-side"><h3>Production Setup</h3><div class="ed-side-row">Camera<b>${esc(x.camera)}</b></div><div class="ed-side-row">Lens<b>${esc(x.lens)}</b></div><div class="ed-side-row">Production Type<b>${esc(x.cat)}</b></div><div class="ed-side-row">Year<b>${esc(x.year)}</b></div></aside></div></div></section>`;
  }

  function articleList(){
    const f=ARTICLES[0], rest=ARTICLES.slice(1);
    return `<section class="rentcam-editorial"><div class="container"><div class="ed-hero"><div><div class="ed-kicker">Rentcam Journal</div><h1>Guides for better productions.</h1></div><p>Artikel tentang camera system, cinema lens, lighting, production sound, rental workflow dan cara memilih equipment yang tepat untuk setiap produksi.</p></div><article class="article-feature" onclick="go('/artikel/${esc(f.id)}')"><img src="${esc(f.img)}" alt="${esc(f.title)}"><div class="article-feature-copy"><small>${esc(f.cat)} · ${esc(f.date)} · ${esc(f.read)}</small><h2>${esc(f.title)}</h2><p>${esc(f.excerpt)}</p><b>Baca artikel →</b></div></article><div class="ed-grid">${rest.map(x=>`<article class="ed-card" onclick="go('/artikel/${esc(x.id)}')"><img src="${esc(x.img)}" alt="${esc(x.title)}" loading="lazy"><div class="ed-card-body"><small>${esc(x.cat)} · ${esc(x.date)} · ${esc(x.read)}</small><h3>${esc(x.title)}</h3><p>${esc(x.excerpt)}</p></div></article>`).join('')}</div></div></section>`;
  }

  function articleDetail(id){
    const x=ARTICLES.find(v=>v.id===id)||ARTICLES[0];
    return `<section class="rentcam-editorial"><div class="container ed-detail"><button class="ed-back" onclick="go('/artikel')" aria-label="Kembali">←</button><div class="ed-detail-meta">${esc(x.cat)} · ${esc(x.date)} · ${esc(x.read)}</div><h1>${esc(x.title)}</h1><p class="ed-lead">${esc(x.excerpt)}</p><img class="ed-detail-image" src="${esc(x.img)}" alt="${esc(x.title)}"><div class="ed-copy"><div class="ed-copy-main"><p>Dalam produksi cinema, pemilihan equipment sebaiknya dimulai dari kebutuhan visual dan workflow, bukan hanya spesifikasi tertinggi. Format sensor, karakter lensa, kebutuhan low light, movement camera, serta jalur monitoring akan memengaruhi package yang paling efisien.</p><p>Compatibility dan reliability juga penting. Camera body perlu dipasangkan dengan media, battery, lens support, monitoring, wireless video, follow focus, grip, lighting, dan audio yang sesuai supaya proses shooting tetap lancar.</p><p>Sebelum booking, susun kebutuhan per departemen dan buat checklist berdasarkan scene, lokasi, durasi shooting, ukuran crew, serta kebutuhan post-production. Cara ini membantu mengurangi item yang terlupa dan membuat package lebih tepat guna.</p></div><aside class="ed-side"><h3>Article Info</h3><div class="ed-side-row">Category<b>${esc(x.cat)}</b></div><div class="ed-side-row">Published<b>${esc(x.date)}</b></div><div class="ed-side-row">Reading Time<b>${esc(x.read)}</b></div><div class="ed-side-row">By<b>Rentcam Editorial</b></div></aside></div></div></section>`;
  }

  function renderEditorial(){
    installStyle();
    const app=document.getElementById('app');
    if(!app) return;
    const p=location.pathname;
    let html='';
    if(p==='/portfolio') html=portfolioList();
    else if(p.indexOf('/portfolio/')===0) html=portfolioDetail(decodeURIComponent(p.split('/')[2]||''));
    else if(p==='/artikel') html=articleList();
    else if(p.indexOf('/artikel/')===0) html=articleDetail(decodeURIComponent(p.split('/')[2]||''));
    else return;
    if(app.dataset.editorialPath===p && app.querySelector('.rentcam-editorial')) return;
    app.dataset.editorialPath=p;
    app.innerHTML=html;
    window.scrollTo(0,0);
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;renderEditorial();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule); else schedule();
  window.addEventListener('popstate',schedule);
  const app=document.getElementById('app');
  if(app) new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
})();
