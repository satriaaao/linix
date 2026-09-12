/* Rentcam website checkout requests */
(function(){
 if(location.pathname.startsWith('/cms'))return;
 const SB='https://xleceiffuopioeguniwj.supabase.co',KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
 const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 function cartItems(){try{return JSON.parse(localStorage.getItem('bsm_cart_cm')||'[]')}catch(e){return []}}
 function mount(){
  if(location.pathname!=='/cart')return;
  const summary=document.querySelector('#app .summary');if(!summary||summary.querySelector('#rentcamOrderForm'))return;
  const old=summary.querySelector('.wide');if(old)old.remove();
  summary.insertAdjacentHTML('beforeend',`<form id="rentcamOrderForm"><h3>Ajukan Pemesanan</h3><p class="order-help">Isi data Anda. Tim kami akan mengonfirmasi ketersediaan dan total biaya.</p><label>Nama lengkap<input name="name" required minlength="2" maxlength="120" autocomplete="name"></label><label>Nomor WhatsApp<input name="phone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="0812..." maxlength="20"></label><label>Email (opsional)<input name="email" type="email" autocomplete="email" maxlength="160"></label><div class="order-dates"><label>Mulai sewa<input name="start" type="date" required min="${today()}" value="${today()}"></label><label>Selesai sewa<input name="end" type="date" required min="${today()}" value="${today()}"></label></div><label>Catatan (opsional)<textarea name="notes" maxlength="2000" placeholder="Lokasi atau kebutuhan produksi"></textarea></label><div id="orderEstimate" class="order-help"></div><button class="wide" type="submit">Kirim Pesanan</button><p id="orderMessage" role="status"></p></form>`);
  updateEstimate(summary.querySelector('form'));
 }
 function updateEstimate(form){
  const start=form.elements.start.value,end=form.elements.end.value;
  form.elements.end.min=start||today();
  const days=Math.round((new Date(end+'T00:00:00')-new Date(start+'T00:00:00'))/86400000)+1;
  const el=form.querySelector('#orderEstimate');
  if(days>0){let total=0;try{for(const item of cartItems()){const p=P.find(p=>p.id===item.id);if(p)total+=Number(p.price)*Number(item.q)*days}}catch(e){}
   el.textContent='Durasi '+days+' hari · Estimasi '+new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(total)+'. Biaya final dikonfirmasi oleh tim.';
  }else el.textContent='Tanggal selesai harus setelah atau sama dengan tanggal mulai.';
 }
 document.addEventListener('change',e=>{const form=e.target.closest?.('#rentcamOrderForm');if(form)updateEstimate(form)});
 document.addEventListener('submit',async e=>{
  const form=e.target;if(form.id!=='rentcamOrderForm')return;e.preventDefault();
  const button=form.querySelector('button[type="submit"]'),msg=form.querySelector('#orderMessage');if(button.disabled)return;
  const data=new FormData(form),items=cartItems();if(!items.length){msg.textContent='Keranjang masih kosong.';return}
  const phone=String(data.get('phone')).replace(/[^0-9+]/g,'');
  if(!/^\+?[0-9]{8,16}$/.test(phone)){msg.textContent='Isi nomor WhatsApp yang valid.';return}
  if(data.get('end')<data.get('start')){msg.textContent='Periksa kembali tanggal sewa.';return}
  const payload={p_name:data.get('name').trim(),p_phone:phone,p_email:data.get('email').trim(),p_start:data.get('start'),p_end:data.get('end'),p_notes:data.get('notes').trim(),p_items:items.map(x=>({id:x.id,q:x.q}))};
  const signature=JSON.stringify(payload);
  let retry;try{retry=JSON.parse(sessionStorage.getItem('rentcam_order_retry')||'null')}catch(e){}
  payload.p_id=retry?.signature===signature?retry.id:crypto.randomUUID();sessionStorage.setItem('rentcam_order_retry',JSON.stringify({signature,id:payload.p_id}));
  button.disabled=true;button.textContent='Mengirim...';msg.textContent='';
  try{
   const r=await fetch(SB+'/rest/v1/rpc/rentcam_submit_order',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!r.ok){let error;try{error=await r.json()}catch(e){}throw new Error(error?.message||'Pesanan gagal dikirim. Coba lagi.')}
   const order=await r.json();
   sessionStorage.removeItem('rentcam_order_retry');
   localStorage.setItem('bsm_cart_cm','[]');try{cart.splice(0,cart.length);save()}catch(e){}
   form.innerHTML=`<div class="order-success"><h3>Pesanan berhasil dikirim</h3><p>Nomor pesanan <strong>${esc(order.order_number)}</strong></p><p>Estimasi total <strong>${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(order.total)}</strong></p><p>Tim kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi.</p><a href="/produk">Lanjut lihat produk →</a></div>`;
  }catch(error){msg.textContent=error.message;button.disabled=false;button.textContent='Kirim Pesanan'}
 });
 const style=document.createElement('style');style.textContent=`#rentcamOrderForm{margin-top:20px;border-top:1px solid #eee;padding-top:18px}#rentcamOrderForm label{display:block;font-size:12px;font-weight:650;margin-top:12px}#rentcamOrderForm input,#rentcamOrderForm textarea{display:block;width:100%;border:1px solid #ddd;border-radius:9px;padding:11px;margin-top:6px;background:#fff;color:#111;font:inherit;font-size:16px;box-sizing:border-box}#rentcamOrderForm textarea{min-height:80px}.order-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.order-help,#orderMessage{font-size:12px;line-height:1.6;color:#666}#orderEstimate{margin:14px 0}#rentcamOrderForm button:disabled{opacity:.6;cursor:wait}.order-success{padding:12px 0;line-height:1.6}.order-success h3{color:#177b48}`;document.head.appendChild(style);
 let queued=false;const run=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})};
 const app=document.getElementById('app');if(app)new MutationObserver(run).observe(app,{childList:true,subtree:true});
 document.addEventListener('rentcam-route-change',run);document.addEventListener('rentcam-cms-updated',run);run();
})();
