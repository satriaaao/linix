/* Rentcam CMS final visual override — runs after CMS runtime styles */
(function(){
  if(!location.pathname.startsWith('/cms')) return;
  const CSS = `
  :root{
    --rc-bg:#eef2f7;
    --rc-panel:#ffffff;
    --rc-border:#e2e7ef;
    --rc-text:#172033;
    --rc-muted:#748095;
    --rc-sidebar:#0b1220;
    --rc-sidebar2:#101a2b;
    --rc-orange:#f26a21;
    --rc-orange2:#ff8240;
    --rc-shadow:0 14px 38px rgba(18,31,50,.08);
  }
  html,body{background:var(--rc-bg)!important;color:var(--rc-text)!important}
  html body .v5{background:linear-gradient(135deg,#eef2f7 0%,#f8fafc 58%,#fff6f0 130%)!important;min-height:100dvh!important}

  html body .v5 .v5-side{
    width:286px!important;padding:20px 16px 28px!important;
    background:linear-gradient(180deg,var(--rc-sidebar),var(--rc-sidebar2))!important;
    border-right:1px solid rgba(255,255,255,.06)!important;
    box-shadow:14px 0 34px rgba(8,18,34,.07)!important;
  }
  html body .v5 .v5-main{margin-left:286px!important}
  html body .v5 .v5-logo{padding:7px 10px 26px!important;gap:13px!important}
  html body .v5 .v5-mark{
    width:46px!important;height:46px!important;border-radius:15px!important;
    background:linear-gradient(145deg,var(--rc-orange2),var(--rc-orange))!important;
    box-shadow:0 12px 26px rgba(242,106,33,.26)!important
  }
  html body .v5 .v5-logo b{font-size:17px!important;color:#fff!important;letter-spacing:-.02em!important}
  html body .v5 .v5-logo small{font-size:11px!important;color:#7f8da5!important}
  html body .v5 .v5-nav-label{padding:20px 13px 7px!important;color:#61718a!important;font-size:9px!important;letter-spacing:.14em!important}
  html body .v5 .v5-nav button{
    height:48px!important;min-height:48px!important;padding:0 14px!important;border-radius:13px!important;
    color:#9cabc0!important;font-size:13px!important;font-weight:750!important;gap:12px!important
  }
  html body .v5 .v5-nav button:hover{background:rgba(255,255,255,.055)!important;color:#fff!important}
  html body .v5 .v5-nav button.on{
    background:linear-gradient(90deg,rgba(242,106,33,.22),rgba(242,106,33,.07))!important;
    color:#fff!important;box-shadow:inset 3px 0 var(--rc-orange)!important
  }
  html body .v5 .v5-nav button.on .v5-menu-icon{color:#ff9b65!important}

  html body .v5 .v5-top{
    height:82px!important;padding:0 30px!important;background:rgba(255,255,255,.88)!important;
    border-bottom:1px solid rgba(218,225,235,.9)!important;
    backdrop-filter:blur(18px) saturate(150%)!important;-webkit-backdrop-filter:blur(18px) saturate(150%)!important;
    box-shadow:0 4px 18px rgba(23,32,51,.035)!important
  }
  html body .v5 .v5-top h1{font-size:24px!important;font-weight:850!important;letter-spacing:-.04em!important;color:var(--rc-text)!important}
  html body .v5 .v5-content{max-width:1660px!important;padding:30px!important}
  html body .v5 .v5-actions{gap:8px!important}

  html body .v5 .v5-btn{
    height:42px!important;min-height:42px!important;padding:0 15px!important;border-radius:12px!important;
    border:1px solid #dbe1ea!important;background:#fff!important;color:#354157!important;
    font-size:12px!important;font-weight:800!important;box-shadow:0 1px 2px rgba(20,30,45,.025)!important
  }
  html body .v5 .v5-btn:hover{border-color:#cbd3df!important;box-shadow:0 8px 18px rgba(28,42,60,.07)!important;transform:translateY(-1px)!important}
  html body .v5 .v5-btn.primary,html body .v5 .v5-btn.orange{
    background:linear-gradient(145deg,var(--rc-orange2),var(--rc-orange))!important;
    border-color:var(--rc-orange)!important;color:#fff!important;
    box-shadow:0 8px 18px rgba(242,106,33,.20)!important
  }
  html body .v5 .v5-btn.danger{color:#bd3f49!important;background:#fff6f7!important;border-color:#f0d0d5!important}

  html body .v5 .v5-card,html body .v5 .v5-product-stat{
    background:rgba(255,255,255,.96)!important;border:1px solid var(--rc-border)!important;
    border-radius:22px!important;box-shadow:0 7px 24px rgba(25,39,58,.045)!important
  }
  html body .v5 .v5-card{padding:24px!important;margin-bottom:20px!important}
  html body .v5 .v5-head{margin-bottom:20px!important;gap:18px!important}
  html body .v5 .v5-head h2{font-size:20px!important;font-weight:850!important;letter-spacing:-.03em!important;color:#202c40!important}
  html body .v5 .v5-head p{font-size:12px!important;line-height:1.55!important;color:var(--rc-muted)!important;margin-top:5px!important}

  html body .v5 .v5-stat{min-height:145px!important;position:relative!important;overflow:hidden!important}
  html body .v5 .v5-stat:after{
    content:""!important;position:absolute!important;width:130px!important;height:130px!important;border-radius:50%!important;
    right:-46px!important;top:-50px!important;background:rgba(242,106,33,.07)!important
  }
  html body .v5 .v5-stat strong{font-size:36px!important;letter-spacing:-.05em!important;color:#1b283d!important;margin-top:11px!important}
  html body .v5 .v5-stat small{font-size:12px!important;color:#748096!important;font-weight:750!important}

  html body .v5 .v5-product-stats{gap:15px!important;margin-bottom:22px!important}
  html body .v5 .v5-product-stat{padding:21px!important;min-height:148px!important}
  html body .v5 .v5-product-stat-top>span{font-size:12px!important;color:#718096!important;font-weight:750!important}
  html body .v5 .v5-product-stat>strong{font-size:31px!important;color:#1c2a40!important;letter-spacing:-.045em!important}
  html body .v5 .v5-product-stat>small{font-size:11px!important;color:#96a0b0!important}

  html body .v5 .v5-tablewrap{border:1px solid var(--rc-border)!important;border-radius:15px!important;background:#fff!important;overflow:auto!important}
  html body .v5 .v5-table{min-width:940px!important;font-size:12px!important}
  html body .v5 .v5-table th{
    padding:13px 14px!important;background:#f7f9fc!important;color:#768398!important;
    font-size:10px!important;font-weight:850!important;letter-spacing:.075em!important;border-bottom:1px solid var(--rc-border)!important
  }
  html body .v5 .v5-table td{
    padding:14px!important;font-size:12px!important;line-height:1.45!important;color:#39475c!important;border-top:1px solid #edf1f5!important
  }
  html body .v5 .v5-table tbody tr:hover{background:#fafcff!important}
  html body .v5 .v5-prod img{width:52px!important;height:52px!important;border-radius:12px!important;background:#f3f5f8!important;border:1px solid #e8ecf1!important}
  html body .v5 .v5-prod b{font-size:13px!important;color:#26334a!important}
  html body .v5 .v5-prod small{font-size:10px!important;color:#98a2b3!important}
  html body .v5 .v5-pill{padding:6px 9px!important;border-radius:999px!important;background:#f2f5f8!important;border:1px solid #e4e8ee!important;color:#637086!important;font-size:10px!important}
  html body .v5 .v5-pill.on{background:#edf9f4!important;border-color:#cbe9dd!important;color:#15805d!important}

  html body .v5 .v5-search,html body .v5 .v5-select,html body .v5 .v5-input,html body .v5 .v5-textarea,
  html body .v5 .v5-field input,html body .v5 .v5-field select,html body .v5 .v5-field textarea{
    border:1px solid #d8dee8!important;background:#fff!important;color:#263248!important;border-radius:12px!important;
    font-size:13px!important;box-shadow:0 1px 2px rgba(30,40,55,.02)!important
  }
  html body .v5 .v5-search,html body .v5 .v5-select,html body .v5 .v5-input{min-height:46px!important}
  html body .v5 .v5-search{min-width:340px!important;max-width:540px!important;padding:0 14px!important}
  html body .v5 .v5-field input,html body .v5 .v5-field select{min-height:46px!important;padding:10px 13px!important}
  html body .v5 .v5-textarea,html body .v5 .v5-field textarea{min-height:116px!important;padding:12px 13px!important}
  html body .v5 .v5-field label{font-size:11px!important;color:#59667a!important;font-weight:800!important;margin-bottom:7px!important}
  html body .v5 .v5-search:focus,html body .v5 .v5-select:focus,html body .v5 .v5-input:focus,html body .v5 .v5-textarea:focus,
  html body .v5 .v5-field input:focus,html body .v5 .v5-field select:focus,html body .v5 .v5-field textarea:focus{
    border-color:rgba(242,106,33,.65)!important;box-shadow:0 0 0 3px rgba(242,106,33,.11)!important;outline:none!important
  }

  html body .v5 .v5-tabs{display:flex!important;gap:6px!important;width:max-content!important;max-width:100%!important;padding:5px!important;border:1px solid var(--rc-border)!important;background:#f3f6fa!important;border-radius:14px!important}
  html body .v5 .v5-tabs button{height:36px!important;padding:0 13px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#69768b!important;font-size:11px!important}
  html body .v5 .v5-tabs button.on{background:#172033!important;color:#fff!important;box-shadow:0 5px 12px rgba(23,32,51,.14)!important}

  html body .v5-modal{background:rgba(8,14,25,.62)!important;backdrop-filter:blur(9px)!important;-webkit-backdrop-filter:blur(9px)!important;padding:24px!important}
  html body .v5 .v5-panel{width:min(1120px,calc(100vw - 38px))!important;max-height:92dvh!important;border-radius:25px!important;background:#f6f8fb!important;box-shadow:0 34px 100px rgba(4,10,20,.32)!important}
  html body .v5 .v5-modalhead,html body .v5 .v5-modalfoot{padding:17px 21px!important;background:rgba(255,255,255,.97)!important;border-color:var(--rc-border)!important}
  html body .v5 .v5-modalhead b{font-size:18px!important;color:#202c40!important}
  html body .v5 .v5-modalbody{padding:21px!important}
  html body .v5 .v5-section{padding:19px!important;border:1px solid var(--rc-border)!important;border-radius:17px!important;background:#fff!important;margin-bottom:15px!important}
  html body .v5 .v5-section h3{font-size:14px!important;color:#28354b!important;font-weight:850!important}

  html body .v5-login{background:radial-gradient(circle at 18% 18%,rgba(242,106,33,.23),transparent 28%),radial-gradient(circle at 84% 76%,rgba(83,105,255,.14),transparent 30%),linear-gradient(145deg,#09111e,#111c2d 62%,#0a1220)!important}
  html body .v5-loginbox{width:min(440px,92vw)!important;padding:36px!important;border-radius:26px!important;box-shadow:0 32px 90px rgba(0,0,0,.3)!important}
  html body .v5-loginbox:before{content:"R"!important;display:grid!important;place-items:center!important;width:52px!important;height:52px!important;border-radius:16px!important;margin-bottom:20px!important;background:linear-gradient(145deg,var(--rc-orange2),var(--rc-orange))!important;color:#fff!important;font-weight:900!important;font-size:19px!important;box-shadow:0 12px 28px rgba(242,106,33,.25)!important}
  html body .v5-loginbox h1{font-size:29px!important;letter-spacing:-.045em!important;color:#172033!important}
  html body .v5-loginbox p{font-size:12px!important;color:#78859a!important;margin:7px 0 22px!important}

  @media(max-width:1100px){
    html body .v5 .v5-side{width:258px!important}
    html body .v5 .v5-main{margin-left:258px!important}
    html body .v5 .v5-content{padding:22px!important}
  }
  @media(max-width:900px){
    html body .v5 .v5-side{width:min(320px,88vw)!important;transform:translateX(-105%)!important}
    html body .v5.open .v5-side{transform:none!important}
    html body .v5 .v5-main{margin-left:0!important}
    html body .v5 .v5-top{height:74px!important;padding:0 16px!important}
    html body .v5 .v5-content{padding:17px!important}
    html body .v5 .v5-hamb{display:inline-flex!important}
    html body .v5 .span8,html body .v5 .span6,html body .v5 .span4{grid-column:span 12!important}
  }
  @media(max-width:620px){
    html body .v5 .v5-top{padding:0 10px!important}
    html body .v5 .v5-top h1{font-size:18px!important;max-width:34vw!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    html body .v5 .v5-actions .v5-btn{width:41px!important;min-width:41px!important;padding:0!important}
    html body .v5 .v5-actions .v5-btn span,html body .v5 .v5-dirty{display:none!important}
    html body .v5 .v5-content{padding:11px!important}
    html body .v5 .v5-card{padding:16px!important;border-radius:18px!important}
    html body .v5 .v5-head{align-items:flex-start!important;flex-direction:column!important}
    html body .v5 .v5-search{min-width:100%!important;width:100%!important}
    html body .v5 .v5-product-stats{grid-template-columns:1fr 1fr!important;gap:9px!important}
    html body .v5-modal{padding:6px!important}
    html body .v5 .v5-panel{width:100%!important;max-height:98dvh!important;border-radius:18px!important}
    html body .v5 .v5-modalbody{padding:12px!important}
  }
  @media(max-width:390px){html body .v5 .v5-product-stats{grid-template-columns:1fr!important}}
  `;

  function ensure(){
    let s=document.getElementById('rentcam-cms-final-ui');
    if(!s){
      s=document.createElement('style');
      s.id='rentcam-cms-final-ui';
      s.textContent=CSS;
    }
    if(document.head.lastElementChild!==s) document.head.appendChild(s);
    document.documentElement.dataset.cmsUi='final';
  }
  ensure();
  window.addEventListener('rentcam:cms-ready',()=>{ensure();setTimeout(ensure,0);setTimeout(ensure,250)});
  document.addEventListener('DOMContentLoaded',ensure,{once:true});
  setTimeout(ensure,500);
  const mo=new MutationObserver(()=>ensure());
  mo.observe(document.head,{childList:true});
})();