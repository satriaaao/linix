/* Rentalcamera public checkout integrity: strict guest validation and WhatsApp totals that match rental days. */
(()=>{
  if(location.pathname.startsWith('/cms'))return;
  const I=window.RentcamIntegrity;
  if(!I){console.error('RentcamIntegrity belum dimuat');return;}
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const productById=id=>{try{return (Array.isArray(window.P)?window.P:(typeof P!=='undefined'&&Array.isArray(P)?P:[])).find(x=>String(x.id)===String(id))||{}}catch(_){return {}}};
  const adminWa=()=>I.cleanPhone(window.RENTCAM_CMS_CONFIG?.general?.whatsapp||'');
  const iso=v=>v?new Date(v+'+07:00').toISOString():null;
  const today=()=>new Date().toLocaleDateString('sv-SE');

  async function rpc(name,data){
    const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(data)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.message||'Gagal memproses. Coba lagi.');
    return j;
  }
  async function upload(file){
    if(!file)return '';
    if(file.size>5242880||!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw new Error('Bukti transfer maksimal 5 MB: JPG, PNG, WEBP, PDF.');
    const token=await rpc('rentcam_checkout_upload_token',{}),ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[file.type]);
    const path=token+'/'+crypto.randomUUID()+'.'+ext;
    const r=await fetch(SB+'/storage/v1/object/rental-receipts/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':file.type},body:file});
    if(!r.ok)throw new Error('Upload bukti gagal.');
    return path;
  }
  function totals(items,start,end){
    const days=I.rentalDays(start,end),tax=I.taxConfig(window.RENTCAM_CMS_CONFIG||{});
    const subtotal=items.reduce((sum,item)=>sum+I.lineTotal(Number(productById(item.id).price)||0,Number(item.q)||1,days),0);
    const ppn=tax.enabled?Math.round(subtotal*tax.rate/100):0;
    return {days,tax,subtotal,ppn,grand:subtotal+ppn};
  }
  function waLink(order,customer,items,x){
    const target=adminWa();if(!I.validPhone(target))return '';
    const t=totals(items,x.start,x.end),code=order.order_number||'-';
    const d=v=>v?new Date(v+'T00:00:00+07:00').toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}):'Belum diisi';
    const period=(x.start&&x.end)?`${d(x.start).replace(/\s+\d{4}$/,'')}–${d(x.end)} (${t.days} Hari)`:`${d(x.start||x.end)} (${t.days} Hari)`;
    const memberStatus=x.customer_type==='member'?'Sudah Member':'Belum Member';
    const productLines=items.map(item=>{
      const p=productById(item.id),qty=Number(item.q)||1,price=Number(p.price)||0,total=I.lineTotal(price,qty,t.days);
      return `- ${p.name||p.title||String(item.id)} = ${qty}x × ${t.days} hari (${I.money(total)})`;
    });
    const lines=['*Pesanan Rental*','',`Status member : ${memberStatus}`,`Customer: ${customer.name}`,`WhatsApp: +${customer.phone}`,`No. Pesanan: ${code}`,`Periode: ${period}`,`Metode: ${x.mode==='delivery'?'Diantar':'Ambil Sendiri'}`,'','____________________________________','','*Daftar Rental*',...productLines,'','*Ringkasan Biaya*',`- Subtotal: ${I.money(t.subtotal)}`,`- ${t.tax.label}: ${t.tax.enabled?`${I.money(t.ppn)} (${t.tax.rate}%)`:'Belum Termasuk'}`,`- Total Estimasi: ${I.money(t.tax.enabled?t.grand:(Number(order.total)||t.subtotal))}`];
    return 'https://wa.me/'+target+'?text='+encodeURIComponent(lines.join('\n'));
  }

  document.addEventListener('submit',async e=>{
    const form=e.target;if(!form.matches?.('#rentcamOrderForm'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const btn=form.querySelector('[type=submit]'),msg=form.querySelector('[data-msg]');
    if(btn?.dataset.integrityBusy==='1')return;
    if(btn){btn.disabled=true;btn.dataset.integrityBusy='1';}
    if(msg)msg.textContent='Memproses...';
    try{
      const x=Object.fromEntries(new FormData(form));
      let items=[];try{items=JSON.parse(localStorage.getItem('bsm_cart_cm')||'[]')}catch(_){}
      if(!Array.isArray(items)||!items.length)throw new Error('Keranjang kosong.');
      const isMember=x.customer_type==='member';let customer;
      if(isMember){
        const phone=I.cleanPhone(x.member_phone);
        if(!form.dataset.memberVerified||phone!==form.dataset.memberVerified||!form.dataset.member)throw new Error('Cek dan verifikasi nomor member dahulu.');
        const member=JSON.parse(form.dataset.member);
        customer={name:String(member.name||'').trim(),phone,email:String(member.email||'').trim()};
      }else{
        const name=String(x.guest_name||'').trim(),phone=I.cleanPhone(x.guest_phone);
        if(name.length<2)throw new Error('Isi nama customer non-member.');
        if(!I.validPhone(phone))throw new Error('Isi nomor WhatsApp non-member yang valid.');
        customer={name,phone,email:String(x.guest_email||'').trim()};
      }
      x.start=x.start||today();x.end=x.end||x.start;if(x.end<x.start)x.end=x.start;
      x.deliver_at=x.deliver_at||x.start+'T09:00';x.collect_at=x.collect_at||x.end+'T18:00';if(x.collect_at<x.deliver_at)x.collect_at=x.deliver_at;
      const t=totals(items,x.start,x.end);
      const details={customer_type:isMember?'member':'guest',customer_token:crypto.randomUUID(),delivery:{mode:x.mode||'self_pickup',return_mode:x.return_mode||'self_return',address:String(x.address||'').trim(),maps_url:String(x.maps_url||'').trim(),latitude:x.latitude?Number(x.latitude):null,longitude:x.longitude?Number(x.longitude):null,pickup_at:iso(x.deliver_at),return_at:iso(x.collect_at),deliver_at:x.mode==='delivery'?iso(x.deliver_at):null,collect_at:x.return_mode==='collect'?iso(x.collect_at):null},tax:{enabled:t.tax.enabled,rate:t.tax.rate,label:t.tax.label,amount:t.ppn,subtotal:t.subtotal,total:t.tax.enabled?t.grand:t.subtotal},subtotal:t.subtotal,tax_amount:t.ppn,total_with_tax:t.tax.enabled?t.grand:t.subtotal,bank_id:x.bank||'',transfer_amount:Number(x.amount)||null};
      const file=form.elements.receipt?.files?.[0];if(file)details.receipt_path=await upload(file);
      const payload={p_id:crypto.randomUUID(),p_name:customer.name,p_phone:customer.phone,p_email:customer.email,p_start:x.start,p_end:x.end,p_notes:String(x.notes||'').trim(),p_items:items.map(i=>({id:i.id,q:i.q})),p_details:details};
      const order=await rpc('rentcam_checkout',payload),link=waLink(order,customer,items,x);
      localStorage.setItem('bsm_cart_cm','[]');
      document.querySelector('#count')&&(document.querySelector('#count').textContent='0');
      form.innerHTML=`<div class="rc-order-success"><span>✓</span><h3>Pesanan berhasil masuk CMS</h3><p>${esc(order.order_number||'-')} · ${I.money(t.tax.enabled?t.grand:(Number(order.total)||t.subtotal))}</p>${link?`<a class="wide rc-wa" href="${esc(link)}">Lanjut ke WhatsApp</a>`:''}</div>`;
      if(link)location.assign(link);
    }catch(err){
      if(msg)msg.textContent=err.message||'Pesanan gagal diproses.';
      if(btn){delete btn.dataset.integrityBusy;btn.disabled=false;}
    }
  },true);
})();
