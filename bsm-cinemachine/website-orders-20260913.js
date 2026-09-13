/* Rentcam checkout: member/non-member, CMS order, WhatsApp summary */
(()=>{
  if(location.pathname.startsWith('/cms'))return;
  const SB='https://xleceiffuopioeguniwj.supabase.co',KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const clean=v=>{let p=String(v||'').replace(/\D/g,'');if(p.startsWith('0'))p='62'+p.slice(1);else if(p.startsWith('8'))p='62'+p;return p};
  const adminWa=()=>clean(window.RENTCAM_CMS_CONFIG?.general?.whatsapp||'');
  const banks=()=> (window.RENTCAM_CMS_CONFIG?.payment?.bankAccounts||[]).filter(x=>x.active!==false);
  const taxCfg=()=>{const t=window.RENTCAM_CMS_CONFIG?.tax||{},rate=Math.max(0,Number(t.rate??t.ppnRate??0)||0);return {enabled:t.enabled===true&&rate>0,rate,label:t.label||'PPN'}};
  const iso=v=>v?new Date(v+'+07:00').toISOString():null;
  const productById=id=>{try{return (Array.isArray(P)?P:[]).find(x=>String(x.id)===String(id))||{}}catch(_){return {}}};
  const pname=id=>{try{const p=(Array.isArray(P)?P:[]).find(x=>String(x.id)===String(id));return p?.name||p?.title||String(id)}catch(_){return String(id)}};
  const wib=v=>v?new Date(v+'+07:00').toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})+' WIB':'Belum diisi';
  const days=(start,end)=>Math.max(1,Math.round((new Date(end||start||today())-new Date(start||today()))/86400000)+1||1);
  function totals(items,start=today(),end=today()){
    const d=days(start,end),tax=taxCfg();
    const subtotal=items.reduce((sum,i)=>sum+(Number(productById(i.id).price)||0)*(Number(i.q)||1)*d,0);
    const ppn=tax.enabled?Math.round(subtotal*tax.rate/100):0;
    return {days:d,tax,subtotal,ppn,grand:subtotal+ppn};
  }
  function updateSummary(f){
    if(location.pathname!=='/cart')return;
    const host=document.querySelector('#app .summary');if(!host)return;
    let items=[];try{items=JSON.parse(localStorage.getItem('bsm_cart_cm')||'[]')}catch(_){}
    const t=totals(items,f?.elements?.start?.value||today(),f?.elements?.end?.value||today());
    const setRow=(label,value)=>{
      const rows=[...host.querySelectorAll('div,p,li')].filter(el=>!el.closest('#rentcamOrderForm')&&el.textContent.trim().includes(label));
      rows.sort((a,b)=>a.textContent.length-b.textContent.length);
      const row=rows[0];if(!row)return;
      const leaves=[...row.querySelectorAll('*')].filter(el=>!el.children.length&&el.textContent.trim()&&el.textContent.trim()!==label);
      if(leaves.length)leaves.at(-1).textContent=value;
    };
    setRow('PPN',t.tax.enabled?`${M(t.ppn)} (${t.tax.rate}%)`:'Belum termasuk');
    setRow('Estimate',M(t.tax.enabled?t.grand:t.subtotal));
    let note=host.querySelector('[data-rc-tax-note]');
    if(!note){note=document.createElement('p');note.dataset.rcTaxNote='1';note.className='rc-tax-note';host.insertBefore(note,host.querySelector('#rentcamOrderForm')||null)}
    note.textContent=t.tax.enabled?`${t.tax.label} aktif ${t.tax.rate}%: total estimasi sudah termasuk pajak.`:'PPN belum diaktifkan dari CMS.';
  }
  async function rpc(name,data){
    const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(data)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(j.message||'Gagal memproses. Coba lagi.');
    return j;
  }
  async function upload(file){
    if(!file)return '';
    if(file.size>5242880||!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw Error('Bukti transfer maksimal 5 MB: JPG, PNG, WEBP, PDF.');
    const token=await rpc('rentcam_checkout_upload_token',{}),ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[file.type]);
    const path=token+'/'+crypto.randomUUID()+'.'+ext;
    const r=await fetch(SB+'/storage/v1/object/rental-receipts/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':file.type},body:file});
    if(!r.ok)throw Error('Upload bukti gagal.');
    return path;
  }
  function wa(order,customer,items,x,link){
    const target=adminWa();if(!/^62[0-9]{7,14}$/.test(target))return '';
    const total=totals(items,x.start,x.end),code=order.order_number||'-';
    const lines=[`Halo ${window.RENTCAM_CMS_CONFIG?.general?.siteName||'Rentcam'}, saya sudah mengisi order di website.`,'',`*KODE ORDER: ${code}*`,'Admin bisa cek kode ini di CMS > Order Masuk.','','*DATA CUSTOMER*',`Nama: ${customer.name||'Belum diisi'}`,`WhatsApp: ${customer.phone?('+'+customer.phone):'Belum diisi'}`,`Email: ${customer.email||'Belum diisi'}`,'','*DAFTAR PRODUK*',...items.map((i,n)=>{const p=productById(i.id),qty=Number(i.q)||1;return `${n+1}. ${p.name||p.title||pname(i.id)}\n   Qty: ${qty}\n   Harga: ${M(Number(p.price)||0)} / hari`;}),'','*JADWAL*',`Mulai: ${x.start||'Belum diisi'}`,`Selesai: ${x.end||'Belum diisi'}`,`Durasi: ${total.days} hari`,`Terima alat: ${x.mode==='delivery'?'Diantar ke lokasi':'Ambil sendiri'}`,`Jam terima: ${wib(x.deliver_at)}`,`Kembali: ${x.return_mode==='collect'?'Dijemput dari lokasi':'Kembalikan sendiri'}`,`Jam kembali: ${wib(x.collect_at)}`,'','*LOKASI*',`Alamat: ${x.address||'Belum diisi'}`,`Google Maps: ${x.maps_url||'Belum diisi'}`];
    if(x.notes)lines.push('','*CATATAN*',x.notes);
    lines.push('','*RINGKASAN BIAYA*',`Subtotal: ${M(total.subtotal)}`,`${total.tax.label}: ${total.tax.enabled?`${M(total.ppn)} (${total.tax.rate}%)`:'Belum termasuk'}`,`Total estimasi: ${M(total.tax.enabled?total.grand:(Number(order.total)||total.subtotal))}`,'',`Link status: ${location.origin}${link}`);
    return 'https://wa.me/'+target+'?text='+encodeURIComponent(lines.join('\n'));
  }
  const bankFields=()=>`<div class="rc-payment-grid"><label>Rekening<select name="bank"><option value="">Pilih rekening</option>${banks().map(b=>`<option value="${E(b.id)}">${E(b.bank)} · ${E(b.holder)}</option>`).join('')}</select></label><label>Nominal<input name="amount" type="number" placeholder="Rp0"></label></div><p class="rc-help" data-bank-info>Opsional, bisa dilengkapi nanti.</p><label>Bukti transfer <span>(opsional)</span><input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></label>`;
  function formHtml(){return `<form id="rentcamOrderForm" class="rc-form rc-checkout" novalidate>
    <div class="rc-form-head"><div><small>LANGKAH TERAKHIR</small><h3>Data pemesanan</h3></div><span>Bisa kirim dulu</span></div>
    <fieldset class="rc-member-box"><legend>Tipe customer</legend><div class="rc-segment"><label><input type="radio" name="customer_type" value="member" checked><span>Sudah member<small>Cukup nomor HP</small></span></label><label><input type="radio" name="customer_type" value="guest"><span>Non-member<small>Bisa isi singkat</small></span></label></div>
      <div data-member-panel><label>Nomor HP / WhatsApp<div class="rc-phone-check"><input name="member_phone" type="tel" inputmode="tel" placeholder="0812 3456 7890"><button id="rcMemberCheck" type="button">Cek nomor</button></div></label><p class="rc-member-status" data-member-status>Masukkan nomor yang terdaftar di Master Customer.</p><div class="rc-member-card" data-member-card hidden></div></div>
      <div data-guest-panel hidden class="rc-guest-grid"><label>Nama<input name="guest_name" placeholder="Nama customer"></label><label>WhatsApp<input name="guest_phone" type="tel" inputmode="tel" placeholder="0812 3456 7890"></label><label class="rc-guest-email">Email<input name="guest_email" type="email" placeholder="nama@email.com"></label></div></fieldset>
    <section class="rc-compact-section"><div class="rc-section-title"><h4>Jadwal rental</h4><p data-estimate>1 hari</p></div><div class="rc-grid"><label>Mulai<input name="start" type="date" value="${today()}"></label><label>Selesai<input name="end" type="date" value="${today()}"></label></div></section>
    <section class="rc-compact-section"><h4>Pengambilan & pengembalian</h4><div class="rc-grid"><label>Alat diterima<select name="mode"><option value="self_pickup">Ambil sendiri</option><option value="delivery">Diantar</option></select></label><label>Alat kembali<select name="return_mode"><option value="self_return">Kembalikan sendiri</option><option value="collect">Dijemput</option></select></label></div><div class="rc-grid"><label>Tanggal & jam terima<input name="deliver_at" type="datetime-local" value="${today()}T09:00"></label><label>Tanggal & jam kembali<input name="collect_at" type="datetime-local" value="${today()}T18:00"></label></div><div class="rc-location" data-location hidden><label>Alamat<textarea name="address" rows="2" placeholder="Alamat/patokan"></textarea></label><label>Google Maps<input name="maps_url" type="url" placeholder="https://maps.google.com/..."></label><button type="button" id="rcUseLocation">Gunakan lokasi saya</button><span data-location-status></span><input name="latitude" type="hidden"><input name="longitude" type="hidden"></div></section>
    <details class="rc-disclosure"><summary><span>Pembayaran transfer<small>Bisa dilengkapi nanti</small></span><b>Opsional</b></summary><div>${bankFields()}</div></details>
    <details class="rc-disclosure"><summary><span>Catatan<small>Kebutuhan khusus</small></span><b>Opsional</b></summary><div><textarea name="notes" rows="3" placeholder="Tulis catatan jika ada"></textarea></div></details>
    <button class="wide rc-submit" type="submit" disabled><span>Kirim pesanan</span><small data-submit-hint>Verifikasi member dahulu</small></button><p data-msg role="status"></p>
  </form>`}
  function update(f){
    if(!f)return;
    const member=f.elements.customer_type?.value==='member';
    f.querySelector('[data-member-panel]').hidden=!member;f.querySelector('[data-guest-panel]').hidden=member;
    f.querySelector('[data-location]').hidden=!(f.elements.mode.value==='delivery'||f.elements.return_mode.value==='collect');
    const d=Math.round((new Date(f.elements.end.value||today())-new Date(f.elements.start.value||today()))/86400000)+1;
    f.querySelector('[data-estimate]').textContent=(d>0?d:1)+' hari';
    const b=banks().find(b=>b.id===f.elements.bank?.value),info=f.querySelector('[data-bank-info]');
    if(info)info.textContent=b?`${b.bank} · ${b.number} · a.n. ${b.holder}`:'Opsional, bisa dilengkapi nanti.';
    const submit=f.querySelector('.rc-submit'),ok=!member||Boolean(f.dataset.memberVerified);
    if(submit&&!submit.dataset.busy){submit.disabled=!ok;submit.querySelector('[data-submit-hint]').textContent=ok?'Masuk CMS lalu buka WhatsApp':'Verifikasi member dahulu'}
    updateSummary(f);
  }
  async function checkMember(f){
    const phone=clean(f.elements.member_phone.value),status=f.querySelector('[data-member-status]'),card=f.querySelector('[data-member-card]');
    delete f.dataset.memberVerified;delete f.dataset.member;card.hidden=true;card.innerHTML='';
    if(!/^62[0-9]{7,14}$/.test(phone)){status.className='rc-member-status error';status.textContent='Nomor HP belum valid.';update(f);return}
    status.textContent='Memeriksa nomor...';
    try{const m=await rpc('rentcam_member_lookup',{p_phone:phone});if(!m?.found)throw Error('Nomor belum terdaftar. Pilih Non-member untuk lanjut.');f.dataset.memberVerified=phone;f.dataset.member=JSON.stringify(m);status.className='rc-member-status success';status.textContent='Nomor terverifikasi.';card.hidden=false;card.innerHTML=`<strong>${E(m.name)}</strong>${m.email?`<span>${E(m.email)}</span>`:''}`}catch(err){status.className='rc-member-status error';status.textContent=err.message}
    update(f);
  }
  function mount(){if(location.pathname!=='/cart')return;const host=document.querySelector('#app .summary');if(!host)return;const form=host.querySelector('#rentcamOrderForm');if(form){update(form);return}host.querySelector('.wide')?.remove();host.insertAdjacentHTML('beforeend',formHtml());update(host.querySelector('form'))}
  document.addEventListener('change',e=>{const f=e.target.closest?.('#rentcamOrderForm');if(!f)return;if(e.target.name==='start')f.elements.deliver_at.value=(e.target.value||today())+'T09:00';if(e.target.name==='end')f.elements.collect_at.value=(e.target.value||today())+'T18:00';update(f)});
  document.addEventListener('input',e=>{const f=e.target.closest?.('#rentcamOrderForm');if(!f)return;if(e.target.name==='member_phone'){delete f.dataset.memberVerified;delete f.dataset.member}update(f)});
  document.addEventListener('click',e=>{const b=e.target.closest?.('#rcMemberCheck');if(b){checkMember(b.closest('form'));return}const loc=e.target.closest?.('#rcUseLocation');if(!loc)return;const f=loc.closest('form'),s=f.querySelector('[data-location-status]');if(!navigator.geolocation){s.textContent='Browser tidak mendukung lokasi.';return}navigator.geolocation.getCurrentPosition(p=>{const lat=p.coords.latitude.toFixed(6),lng=p.coords.longitude.toFixed(6);f.elements.latitude.value=lat;f.elements.longitude.value=lng;f.elements.maps_url.value=`https://www.google.com/maps?q=${lat},${lng}`;s.textContent='Koordinat masuk.'},()=>s.textContent='Izin lokasi ditolak.')});
  document.addEventListener('submit',async e=>{
    const f=e.target;if(!f.matches('#rentcamOrderForm'))return;e.preventDefault();
    const btn=f.querySelector('[type=submit]'),msg=f.querySelector('[data-msg]');if(btn.disabled)return;btn.disabled=true;btn.dataset.busy='1';msg.textContent='Memproses...';
    try{
      const x=Object.fromEntries(new FormData(f)),items=JSON.parse(localStorage.getItem('bsm_cart_cm')||'[]');if(!items.length)throw Error('Keranjang kosong.');
      const isMember=x.customer_type==='member';let customer;
      if(isMember){const phone=clean(x.member_phone);if(!f.dataset.memberVerified||phone!==f.dataset.memberVerified||!f.dataset.member)throw Error('Cek dan verifikasi nomor member dahulu.');const m=JSON.parse(f.dataset.member);customer={name:m.name,phone,email:m.email||''}}else{customer={name:String(x.guest_name||'').trim()||'Customer Web',phone:clean(x.guest_phone)||adminWa()||'6280000000000',email:String(x.guest_email||'').trim()}};
      x.start=x.start||today();x.end=x.end||x.start;if(x.end<x.start)x.end=x.start;x.deliver_at=x.deliver_at||x.start+'T09:00';x.collect_at=x.collect_at||x.end+'T18:00';if(x.collect_at<x.deliver_at)x.collect_at=x.deliver_at;
      const total=totals(items,x.start,x.end);
      const details={customer_type:isMember?'member':'guest',customer_token:crypto.randomUUID(),delivery:{mode:x.mode||'self_pickup',return_mode:x.return_mode||'self_return',address:String(x.address||'').trim(),maps_url:String(x.maps_url||'').trim(),latitude:x.latitude?Number(x.latitude):null,longitude:x.longitude?Number(x.longitude):null,pickup_at:iso(x.deliver_at),return_at:iso(x.collect_at),deliver_at:x.mode==='delivery'?iso(x.deliver_at):null,collect_at:x.return_mode==='collect'?iso(x.collect_at):null},tax:{enabled:total.tax.enabled,rate:total.tax.rate,label:total.tax.label,amount:total.ppn,subtotal:total.subtotal,total:total.tax.enabled?total.grand:total.subtotal},subtotal:total.subtotal,tax_amount:total.ppn,total_with_tax:total.tax.enabled?total.grand:total.subtotal,bank_id:x.bank||'',transfer_amount:Number(x.amount)||null};
      const file=f.elements.receipt?.files?.[0];if(file)details.receipt_path=await upload(file);
      const payload={p_id:crypto.randomUUID(),p_name:customer.name,p_phone:customer.phone,p_email:customer.email,p_start:x.start,p_end:x.end,p_notes:String(x.notes||'').trim(),p_items:items.map(i=>({id:i.id,q:i.q})),p_details:details};
      const order=await rpc('rentcam_checkout',payload),link='/pesanan#'+order.id+':'+details.customer_token,waLink=wa(order,customer,items,x,link);
      localStorage.setItem('bsm_cart_cm','[]');try{cart.splice(0,cart.length);save()}catch(_){}
      f.innerHTML=`<div class="rc-order-success"><span>✓</span><h3>Pesanan berhasil masuk CMS</h3><p>${E(order.order_number)} · ${M(total.tax.enabled?total.grand:(Number(order.total)||total.subtotal))}</p>${waLink?`<a class="wide rc-wa" href="${E(waLink)}">Lanjut ke WhatsApp</a>`:''}</div>`;
      if(waLink){location.assign(waLink);return}
    }catch(err){msg.textContent=err.message;delete btn.dataset.busy;btn.disabled=false;update(f)}
  });
  const st=document.createElement('style');st.textContent=`.rc-form{width:100%;margin-top:20px;padding-top:16px;border-top:1px solid #e8e8e8;color:#121212}.rc-form *{box-sizing:border-box;min-width:0}.rc-form-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.rc-form-head small{font-size:10px;letter-spacing:.12em;color:#f26a21;font-weight:800}.rc-form-head h3{font-size:24px;margin:5px 0 0}.rc-form-head>span,.rc-disclosure summary b{font-size:11px;background:#f3f5f7;padding:7px 10px;border-radius:999px;color:#667085}.rc-form label{display:block;margin:10px 0;font-size:12px;font-weight:800}.rc-form input,.rc-form select,.rc-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #dfe2e6;border-radius:12px;padding:12px 13px;font:inherit;font-size:15px;background:#fff;color:#111}.rc-member-box,.rc-compact-section,.rc-disclosure{border:1px solid #e4e7eb;border-radius:16px;padding:14px;margin:12px 0;background:#fff}.rc-member-box legend{padding:0 7px;font-size:11px;color:#70757d;font-weight:800}.rc-segment{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:4px;background:#f2f3f5;border-radius:13px}.rc-segment input{position:absolute;opacity:0}.rc-segment span{display:flex;flex-direction:column;padding:10px 12px;border-radius:10px;color:#555;font-size:13px;font-weight:850}.rc-segment small{font-size:10px;font-weight:500;color:#8b9097}.rc-segment input:checked+span{background:#111;color:#fff}.rc-segment input:checked+span small{color:#ccc}.rc-phone-check,.rc-grid,.rc-payment-grid,.rc-guest-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rc-phone-check{grid-template-columns:1fr auto}.rc-form button{border:0;border-radius:12px;background:#111;color:#fff;padding:12px 16px;font:inherit;font-weight:850;cursor:pointer}.rc-form button:disabled{opacity:.48}.rc-member-status{font-size:12px;color:#747b86}.rc-member-status.success{color:#16834d}.rc-member-status.error{color:#c7392f}.rc-member-card{border-radius:12px;background:#edf9f2;padding:11px}.rc-member-card span{display:block;color:#667085;font-size:11px;margin-top:3px}.rc-location{margin-top:10px}.rc-location button{margin-top:8px;background:#eef4ff;color:#1859a9}.rc-location span{display:block;margin-top:6px;font-size:11px;color:#777}.rc-disclosure{padding:0;overflow:hidden}.rc-disclosure summary{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px;cursor:pointer;list-style:none}.rc-disclosure summary span{display:flex;flex-direction:column;font-size:13px;font-weight:850}.rc-disclosure summary small{font-size:10px;color:#888}.rc-disclosure>div{padding:0 14px 14px}.rc-tax-note{margin:12px 0 0!important;padding:10px 12px!important;border-radius:12px!important;background:#f7f8fa!important;color:#667085!important;font-size:12px!important;line-height:1.45!important}.rc-submit{width:100%;min-height:54px;margin-top:14px;display:flex;align-items:center;justify-content:space-between;text-align:left}.rc-submit small{font-size:10px;color:#ccc}.rc-order-success{text-align:center;padding:25px 5px}.rc-order-success>span{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#168b52;color:#fff;font-size:25px;margin:auto}.rc-order-success a{display:block;background:#168b52;color:#fff;padding:14px;border-radius:12px;text-decoration:none;margin-top:16px}@media(max-width:900px){html,body{max-width:100%!important;overflow-x:hidden!important}#app .cartLayout{display:grid!important;grid-template-columns:1fr!important;gap:18px!important}#app .summary{position:static!important;width:100%!important;max-width:100%!important;padding:16px!important}.rc-grid,.rc-payment-grid,.rc-guest-grid,.rc-phone-check{grid-template-columns:1fr}.rc-form input,.rc-form select,.rc-form textarea{font-size:16px}.rc-submit{position:sticky;bottom:max(12px,env(safe-area-inset-bottom));z-index:5;box-shadow:0 10px 28px #0003}}`;document.head.append(st);
  let q=false;const run=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;mount()})};
  new MutationObserver(run).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
  document.addEventListener('rentcam-route-change',run);document.addEventListener('rentcam-cms-updated',run);run();
})();
