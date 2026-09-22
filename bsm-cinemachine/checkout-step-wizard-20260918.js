/* Rentcam checkout step wizard — presentation only, preserves existing checkout logic. */
(()=>{
  if(window.__rentcamCheckoutWizard)return;
  window.__rentcamCheckoutWizard=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function cleanPhone(v){
    let p=String(v||'').replace(/\D/g,'');
    if(p.startsWith('0'))p='62'+p.slice(1);
    else if(p.startsWith('8'))p='62'+p;
    return p;
  }

  function validStep(form,step){
    if(step===1){
      const member=form.elements.customer_type?.value==='member';
      if(member){
        const key=String(form.elements.member_phone?.value||'').trim();
        if(key.length<4){
          alert('Isi No. HP atau Kode Member dulu.');
          form.elements.member_phone?.focus();
          return false;
        }
      }else{
        const details=form.querySelector('[data-guest-panel]');
        const name=String(form.elements.guest_name?.value||'').trim();
        const p=cleanPhone(form.elements.guest_phone?.value);
        if(name.length<2){
          if(details&&'open' in details)details.open=true;
          alert('Isi nama customer dulu.');
          form.elements.guest_name?.focus();
          return false;
        }
        if(!/^62[0-9]{7,14}$/.test(p)){
          if(details&&'open' in details)details.open=true;
          alert('Isi nomor WhatsApp yang valid dulu.');
          form.elements.guest_phone?.focus();
          return false;
        }
      }
    }
    if(step===2){
      const start=form.elements.start?.value,end=form.elements.end?.value;
      if(!start||!end){
        alert('Isi tanggal mulai dan selesai rental.');
        return false;
      }
      if(end<start){
        alert('Tanggal selesai tidak boleh sebelum tanggal mulai.');
        return false;
      }
    }
    return true;
  }

  function review(form){
    const box=form.querySelector('[data-wizard-review]');
    if(!box)return;
    const member=form.elements.customer_type?.value==='member';
    let memberLabel='';
    if(member){
      try{memberLabel=JSON.parse(form.dataset.member||'{}')?.name||''}catch(_){}
    }
    const customer=member
      ? (memberLabel||form.elements.member_phone?.value||'Belum diisi')
      : ((form.elements.guest_name?.value||'Customer')+' · '+(form.elements.guest_phone?.value||''));
    const start=form.elements.start?.value||'-',end=form.elements.end?.value||'-';
    const mode=form.elements.mode?.selectedOptions?.[0]?.textContent||'-';
    const back=form.elements.return_mode?.selectedOptions?.[0]?.textContent||'-';
    box.innerHTML=
      '<div><span>Customer</span><b>'+esc(customer)+'</b></div>'+
      '<div><span>Periode</span><b>'+esc(start)+' → '+esc(end)+'</b></div>'+
      '<div><span>Terima alat</span><b>'+esc(mode)+'</b></div>'+
      '<div><span>Pengembalian</span><b>'+esc(back)+'</b></div>';
  }

  function setStep(form,step,scroll=true){
    step=Math.max(1,Math.min(4,Number(step)||1));
    form.dataset.wizardStep=String(step);
    form.querySelectorAll('[data-wizard-panel]').forEach(p=>{
      p.hidden=Number(p.dataset.wizardPanel)!==step;
    });
    form.querySelectorAll('[data-wizard-dot]').forEach(dot=>{
      const n=Number(dot.dataset.wizardDot);
      dot.classList.toggle('active',n===step);
      dot.classList.toggle('done',n<step);
    });
    const label=form.querySelector('[data-wizard-current]');
    if(label)label.textContent='Langkah '+step+' dari 4';
    const back=form.querySelector('[data-wizard-back]');
    const next=form.querySelector('[data-wizard-next]');
    if(back)back.hidden=step===1;
    if(next){
      next.hidden=step===4;
      next.textContent=step===3?'Lihat ringkasan':'Lanjut';
    }
    if(step===4)review(form);
    if(scroll){
      const rect=form.getBoundingClientRect();
      if(rect.top<12||rect.top>innerHeight*.35){
        form.scrollIntoView({behavior:'smooth',block:'start'});
      }
    }
  }

  function panel(title,sub,node,step){
    const p=document.createElement('section');
    p.className='rc-wizard-panel';
    p.dataset.wizardPanel=String(step);
    p.innerHTML='<div class="rc-wizard-panel-head"><small>LANGKAH '+step+'</small><h4>'+title+'</h4><p>'+sub+'</p></div>';
    if(node)p.appendChild(node);
    return p;
  }

  function mount(form){
    if(!form||form.dataset.wizardMounted==='1')return;
    const customer=form.querySelector('.rc-member-box');
    const sections=[...form.querySelectorAll(':scope > .rc-compact-section')];
    const schedule=sections[0],delivery=sections[1];
    const disclosures=[...form.querySelectorAll(':scope > .rc-disclosure')];
    const payment=disclosures[0],notes=disclosures[1];
    const submit=form.querySelector(':scope > .rc-submit');
    const msg=form.querySelector(':scope > [data-msg]');
    if(!customer||!schedule||!delivery||!submit)return;

    form.dataset.wizardMounted='1';

    const head=form.querySelector('.rc-form-head');
    if(head){
      head.innerHTML='<div><small>CHECKOUT</small><h3>Selesaikan pesanan</h3></div><span data-wizard-current>Langkah 1 dari 4</span>';
      head.insertAdjacentHTML('afterend',
        '<div class="rc-wizard-progress" aria-label="Progress checkout">'+
        '<span data-wizard-dot="1"><b>1</b><em>Customer</em></span>'+
        '<i></i><span data-wizard-dot="2"><b>2</b><em>Jadwal</em></span>'+
        '<i></i><span data-wizard-dot="3"><b>3</b><em>Pengiriman</em></span>'+
        '<i></i><span data-wizard-dot="4"><b>4</b><em>Kirim</em></span>'+
        '</div>');
    }

    const p1=panel('Data customer','Member cukup No. HP atau Kode Member. Belum member isi data lewat dropdown.',customer,1);
    const p2=panel('Jadwal rental','Pilih tanggal mulai dan selesai rental.',schedule,2);
    const p3=panel('Pengambilan & pengembalian','Pilih cara alat diterima dan dikembalikan.',delivery,3);

    const finalWrap=document.createElement('div');
    finalWrap.className='rc-wizard-final';
    finalWrap.innerHTML='<div class="rc-wizard-review" data-wizard-review></div>';
    if(payment)finalWrap.appendChild(payment);
    if(notes)finalWrap.appendChild(notes);
    finalWrap.appendChild(submit);
    if(msg)finalWrap.appendChild(msg);
    const p4=panel('Ringkasan & kirim','Periksa sebentar, lalu kirim pesanan.',finalWrap,4);

    const progress=form.querySelector('.rc-wizard-progress');
    [p1,p2,p3,p4].forEach(p=>form.insertBefore(p,progress?.nextSibling||null));

    const nav=document.createElement('div');
    nav.className='rc-wizard-nav';
    nav.innerHTML='<button type="button" class="rc-wizard-back" data-wizard-back>← Kembali</button><button type="button" class="rc-wizard-next" data-wizard-next>Lanjut</button>';
    form.appendChild(nav);

    setStep(form,1,false);
  }

  function scan(){
    if(location.pathname!=='/cart')return;
    mount(document.getElementById('rentcamOrderForm'));
  }

  document.addEventListener('click',e=>{
    const next=e.target.closest?.('[data-wizard-next]');
    if(next){
      const f=next.closest('#rentcamOrderForm');
      const s=Number(f?.dataset.wizardStep||1);
      if(f&&validStep(f,s))setStep(f,s+1);
      return;
    }
    const back=e.target.closest?.('[data-wizard-back]');
    if(back){
      const f=back.closest('#rentcamOrderForm');
      if(f)setStep(f,Number(f.dataset.wizardStep||1)-1);
      return;
    }
    const dot=e.target.closest?.('[data-wizard-dot]');
    if(dot){
      const f=dot.closest('#rentcamOrderForm');
      const target=Number(dot.dataset.wizardDot),current=Number(f?.dataset.wizardStep||1);
      if(f&&target<current)setStep(f,target);
    }
  },true);

  document.addEventListener('change',e=>{
    const f=e.target.closest?.('#rentcamOrderForm');
    if(f&&Number(f.dataset.wizardStep)===4)review(f);
  },true);
  document.addEventListener('input',e=>{
    const f=e.target.closest?.('#rentcamOrderForm');
    if(f&&Number(f.dataset.wizardStep)===4)review(f);
  },true);

  const st=document.createElement('style');
  st.id='rc-checkout-wizard-style';
  st.textContent=`
    #rentcamOrderForm.rc-checkout{margin-top:14px!important;padding-top:14px!important}
    #rentcamOrderForm .rc-form-head{margin-bottom:12px!important;align-items:center!important}
    #rentcamOrderForm .rc-form-head h3{font-size:20px!important;line-height:1.1!important}
    .rc-wizard-progress{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;gap:8px;margin:0 0 14px;padding:10px 12px;border-radius:14px;background:#f7f8fa}
    .rc-wizard-progress>span{display:flex;align-items:center;gap:6px;color:#a0a7b0;min-width:0;cursor:pointer}
    .rc-wizard-progress b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#e9ecf0;color:#707985;font-size:11px}
    .rc-wizard-progress em{font-style:normal;font-size:10px;font-weight:800;white-space:nowrap}
    .rc-wizard-progress i{height:2px;background:#e2e6eb;border-radius:99px}
    .rc-wizard-progress>span.active b{background:#111;color:#fff}
    .rc-wizard-progress>span.active em{color:#111}
    .rc-wizard-progress>span.done b{background:#f26a21;color:#fff}
    .rc-wizard-progress>span.done em{color:#687386}
    .rc-wizard-panel{border:1px solid #e5e8ed;border-radius:16px;padding:15px;background:#fff;margin:0}
    .rc-wizard-panel[hidden]{display:none!important}
    .rc-wizard-panel-head{margin-bottom:10px}
    .rc-wizard-panel-head small{display:block;color:#f26a21;font-weight:900;letter-spacing:.1em;font-size:9px}
    .rc-wizard-panel-head h4{margin:4px 0 2px;font-size:18px}
    .rc-wizard-panel-head p{margin:0;color:#7d8694;font-size:11px;line-height:1.4}
    .rc-wizard-panel .rc-member-box,.rc-wizard-panel .rc-compact-section,.rc-wizard-panel .rc-disclosure{margin:8px 0!important}
    .rc-wizard-review{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
    .rc-wizard-review>div{padding:10px 11px;background:#f7f8fa;border-radius:11px}
    .rc-wizard-review span,.rc-wizard-review b{display:block}
    .rc-wizard-review span{font-size:8px;color:#8b94a1;text-transform:uppercase;letter-spacing:.06em}
    .rc-wizard-review b{margin-top:3px;font-size:10px;color:#28384e;line-height:1.35}
    .rc-wizard-nav{display:flex;gap:10px;justify-content:space-between;margin-top:12px;position:sticky;bottom:max(10px,env(safe-area-inset-bottom));z-index:8;padding-top:8px;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 28%)}
    .rc-wizard-nav button{min-height:46px!important;border-radius:12px!important;padding:0 18px!important}
    .rc-wizard-back{background:#fff!important;color:#26364d!important;border:1px solid #dfe4ea!important}
    .rc-wizard-next{margin-left:auto;background:#f26a21!important;color:#fff!important;min-width:130px}
    #rentcamOrderForm .rc-submit{position:static!important;margin-top:10px!important;box-shadow:none!important}
    @media(min-width:901px){
      #app .cartLayout{align-items:start!important}
      #app .summary{max-height:none!important}
      #rentcamOrderForm{max-width:620px;margin-left:auto;margin-right:auto}
      .rc-wizard-panel{padding:18px}
      .rc-wizard-nav{position:static;background:none;padding-top:0}
    }
    @media(max-width:620px){
      #app .summary{padding:12px!important}
      #rentcamOrderForm .rc-form-head>span{font-size:9px!important;padding:6px 8px!important}
      .rc-wizard-progress{gap:4px;padding:8px}
      .rc-wizard-progress em{display:none}
      .rc-wizard-progress b{width:24px;height:24px}
      .rc-wizard-panel{padding:12px;border-radius:14px}
      .rc-wizard-review{grid-template-columns:1fr}
      .rc-wizard-nav button{flex:1}
      .rc-wizard-next{min-width:0}
    }

    /* 2026-09-18 responsive polish */
    body:has(#rentcamOrderForm){background:#fff}
    #app .cartLayout{
      align-items:start!important;
      gap:28px!important;
    }
    #app .summary{
      border:1px solid #e7eaf0!important;
      border-radius:20px!important;
      background:#fff!important;
      box-shadow:0 14px 38px rgba(18,31,49,.06)!important;
      overflow:visible!important;
    }
    #rentcamOrderForm.rc-checkout{
      width:100%!important;
      max-width:none!important;
      margin:12px 0 0!important;
      padding:14px 0 0!important;
    }
    #rentcamOrderForm .rc-form-head{
      gap:12px!important;
      padding:0 2px!important;
    }
    #rentcamOrderForm .rc-form-head h3{
      font-size:22px!important;
      letter-spacing:-.025em!important;
    }
    .rc-wizard-progress{
      border:1px solid #eceff3!important;
      background:#fafbfc!important;
      padding:9px 10px!important;
      margin-bottom:12px!important;
    }
    .rc-wizard-panel{
      border:1px solid #e6eaf0!important;
      border-radius:18px!important;
      padding:16px!important;
      box-shadow:0 5px 18px rgba(28,42,60,.035)!important;
    }
    .rc-wizard-panel-head{
      display:grid!important;
      grid-template-columns:1fr auto!important;
      column-gap:12px!important;
      align-items:end!important;
      margin-bottom:12px!important;
    }
    .rc-wizard-panel-head small,
    .rc-wizard-panel-head h4,
    .rc-wizard-panel-head p{
      grid-column:1!important;
    }
    .rc-wizard-panel-head h4{
      font-size:20px!important;
      line-height:1.15!important;
      letter-spacing:-.02em!important;
    }
    .rc-wizard-panel-head p{
      font-size:11px!important;
      max-width:44ch!important;
    }
    .rc-wizard-panel .rc-compact-section{
      border:0!important;
      background:transparent!important;
      padding:0!important;
      margin:0!important;
      border-radius:0!important;
    }
    .rc-wizard-panel .rc-compact-section>h4{
      display:none!important;
    }
    .rc-wizard-panel .rc-section-title{
      display:flex!important;
      justify-content:flex-end!important;
      align-items:center!important;
      margin:0 0 8px!important;
    }
    .rc-wizard-panel .rc-section-title h4{
      display:none!important;
    }
    .rc-wizard-panel [data-estimate]{
      margin:0!important;
      padding:6px 10px!important;
      border-radius:999px!important;
      background:#fff4ec!important;
      color:#d95a16!important;
      font-size:10px!important;
      font-weight:850!important;
    }
    .rc-wizard-panel .rc-grid,
    .rc-wizard-panel .rc-payment-grid,
    .rc-wizard-panel .rc-guest-grid{
      gap:10px!important;
    }
    .rc-wizard-panel label{
      margin:6px 0!important;
      font-size:11px!important;
    }
    .rc-wizard-panel input,
    .rc-wizard-panel select,
    .rc-wizard-panel textarea{
      min-height:46px!important;
      margin-top:5px!important;
      padding:11px 12px!important;
      border-radius:12px!important;
      border-color:#dde3ea!important;
      background:#fff!important;
    }
    .rc-wizard-panel textarea{
      min-height:84px!important;
    }
    .rc-wizard-panel .rc-member-box{
      margin:0!important;
      padding:12px!important;
      border-radius:14px!important;
      background:#fbfcfd!important;
    }
    .rc-wizard-panel .rc-segment{
      padding:3px!important;
    }
    .rc-wizard-panel .rc-segment span{
      padding:9px 10px!important;
    }
    .rc-wizard-panel .rc-disclosure{
      margin:8px 0!important;
      border-radius:13px!important;
    }
    .rc-wizard-panel .rc-disclosure summary{
      padding:11px 12px!important;
    }
    .rc-wizard-review{
      gap:7px!important;
    }
    .rc-wizard-nav{
      margin-top:10px!important;
    }
    .rc-wizard-nav button{
      min-height:44px!important;
      font-size:12px!important;
    }

    @media(min-width:1101px){
      #app .cartLayout{
        grid-template-columns:minmax(0,1.55fr) minmax(430px,.72fr)!important;
      }
      #app .summary{
        position:sticky!important;
        top:92px!important;
        width:100%!important;
        min-width:430px!important;
        padding:20px!important;
      }
      #rentcamOrderForm{
        width:100%!important;
      }
      .rc-wizard-panel{
        padding:18px!important;
      }
      .rc-wizard-progress em{
        font-size:9px!important;
      }
    }

    @media(min-width:901px) and (max-width:1100px){
      #app .cartLayout{
        grid-template-columns:minmax(0,1fr) minmax(390px,.82fr)!important;
        gap:20px!important;
      }
      #app .summary{
        position:sticky!important;
        top:82px!important;
        min-width:390px!important;
        padding:16px!important;
      }
      .rc-wizard-progress em{
        display:none!important;
      }
      .rc-wizard-progress{
        gap:5px!important;
      }
    }

    @media(max-width:900px){
      #app .cartLayout{
        grid-template-columns:1fr!important;
        gap:14px!important;
      }
      #app .summary{
        position:static!important;
        width:100%!important;
        min-width:0!important;
        border-radius:16px!important;
        padding:14px!important;
        box-shadow:none!important;
      }
      #rentcamOrderForm.rc-checkout{
        margin-top:10px!important;
      }
      .rc-wizard-panel{
        padding:14px!important;
      }
      .rc-wizard-nav{
        position:sticky!important;
        bottom:max(8px,env(safe-area-inset-bottom))!important;
        margin-left:-2px!important;
        margin-right:-2px!important;
        padding:12px 2px 2px!important;
        background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 24%)!important;
      }
      .rc-wizard-nav button{
        min-height:48px!important;
      }
    }

    @media(max-width:620px){
      #app .summary{
        padding:12px!important;
      }
      #rentcamOrderForm .rc-form-head h3{
        font-size:19px!important;
      }
      .rc-wizard-progress{
        grid-template-columns:auto 1fr auto 1fr auto 1fr auto!important;
        padding:8px!important;
        margin-bottom:10px!important;
      }
      .rc-wizard-progress em{
        display:none!important;
      }
      .rc-wizard-panel{
        padding:12px!important;
        border-radius:14px!important;
      }
      .rc-wizard-panel-head{
        margin-bottom:10px!important;
      }
      .rc-wizard-panel-head h4{
        font-size:18px!important;
      }
      .rc-wizard-panel .rc-grid,
      .rc-wizard-panel .rc-payment-grid,
      .rc-wizard-panel .rc-guest-grid,
      .rc-wizard-panel .rc-phone-check{
        grid-template-columns:1fr!important;
      }
      .rc-wizard-panel input,
      .rc-wizard-panel select,
      .rc-wizard-panel textarea{
        font-size:16px!important;
        min-height:48px!important;
      }
      .rc-wizard-review{
        grid-template-columns:1fr!important;
      }
      .rc-wizard-nav{
        gap:8px!important;
      }
      .rc-wizard-nav button{
        flex:1 1 0!important;
        min-width:0!important;
      }
      .rc-wizard-back[hidden] + .rc-wizard-next{
        margin-left:auto!important;
        flex:0 0 100%!important;
      }
    }

    /* Full-width cart shell fix */
    html:has(#rentcamOrderForm),
    body:has(#rentcamOrderForm){
      width:100%!important;
      max-width:none!important;
      min-width:0!important;
      margin:0!important;
      overflow-x:hidden!important;
    }
    body:has(#rentcamOrderForm) #app{
      display:block!important;
      width:100%!important;
      max-width:none!important;
      min-width:0!important;
      margin:0!important;
      padding:0!important;
      overflow:visible!important;
    }
    body:has(#rentcamOrderForm) #app>.page{
      width:100%!important;
      max-width:none!important;
      margin:0!important;
      padding-left:0!important;
      padding-right:0!important;
      overflow:visible!important;
    }
    body:has(#rentcamOrderForm) #app>.page>.container{
      width:min(1480px,calc(100% - 48px))!important;
      max-width:1480px!important;
      margin-left:auto!important;
      margin-right:auto!important;
      padding-left:0!important;
      padding-right:0!important;
      box-sizing:border-box!important;
    }
    body:has(#rentcamOrderForm) #app .cartLayout{
      width:100%!important;
      max-width:none!important;
      min-width:0!important;
      margin:0!important;
      box-sizing:border-box!important;
      grid-template-columns:minmax(0,1fr) minmax(420px,470px)!important;
      gap:24px!important;
    }
    body:has(#rentcamOrderForm) #app .cartLayout>div:first-child{
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
    }
    body:has(#rentcamOrderForm) #app .summary{
      width:100%!important;
      min-width:0!important;
      max-width:470px!important;
      justify-self:end!important;
      box-sizing:border-box!important;
    }
    body:has(#rentcamOrderForm) .footer{
      width:100%!important;
      max-width:none!important;
      margin-left:0!important;
      margin-right:0!important;
      left:auto!important;
      right:auto!important;
      box-sizing:border-box!important;
    }
    body:has(#rentcamOrderForm) .footer>.container{
      width:min(1480px,calc(100% - 48px))!important;
      max-width:1480px!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body:has(#rentcamOrderForm) .promo-rail,
    body:has(#rentcamOrderForm) .promo-tab,
    body:has(#rentcamOrderForm) [class*="promo"]{
      max-width:100vw!important;
    }

    @media(min-width:1600px){
      body:has(#rentcamOrderForm) #app>.page>.container,
      body:has(#rentcamOrderForm) .footer>.container{
        width:min(1560px,calc(100% - 64px))!important;
        max-width:1560px!important;
      }
      body:has(#rentcamOrderForm) #app .cartLayout{
        grid-template-columns:minmax(0,1fr) 500px!important;
        gap:30px!important;
      }
      body:has(#rentcamOrderForm) #app .summary{
        max-width:500px!important;
      }
    }

    @media(max-width:1100px){
      body:has(#rentcamOrderForm) #app>.page>.container{
        width:calc(100% - 28px)!important;
      }
      body:has(#rentcamOrderForm) #app .cartLayout{
        grid-template-columns:minmax(0,1fr) minmax(360px,410px)!important;
        gap:16px!important;
      }
      body:has(#rentcamOrderForm) #app .summary{
        max-width:410px!important;
      }
    }

    @media(max-width:900px){
      body:has(#rentcamOrderForm) #app>.page>.container,
      body:has(#rentcamOrderForm) .footer>.container{
        width:calc(100% - 24px)!important;
      }
      body:has(#rentcamOrderForm) #app .cartLayout{
        grid-template-columns:1fr!important;
        gap:14px!important;
      }
      body:has(#rentcamOrderForm) #app .summary{
        max-width:none!important;
        justify-self:stretch!important;
      }
    }

    @media(max-width:620px){
      body:has(#rentcamOrderForm) #app>.page>.container,
      body:has(#rentcamOrderForm) .footer>.container{
        width:calc(100% - 20px)!important;
      }
    }
  `;
  document.head.appendChild(st);

  const obs=new MutationObserver(scan);
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('rentcam-route-change',()=>setTimeout(scan,0));
  scan();
})();