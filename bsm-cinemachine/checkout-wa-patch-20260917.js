function patchWebsiteOrders(source){
  let out=String(source||'');

  const oldWaGuard="const target=adminWa();if(!/^62[0-9]{7,14}$/.test(target))return '';";
  const newWaGuard="const target=adminWa();";
  if(!out.includes(oldWaGuard)) throw new Error('WA guard seam not found');
  out=out.replace(oldWaGuard,newWaGuard);

  const oldWaReturn="return 'https://wa.me/'+target+'?text='+encodeURIComponent(lines.join('\\n'));";
  const newWaReturn="return (/^62[0-9]{7,14}$/.test(target)?'https://wa.me/'+target:'https://wa.me/')+'?text='+encodeURIComponent(lines.join('\\n'));";
  if(!out.includes(oldWaReturn)) throw new Error('WA return seam not found');
  out=out.replace(oldWaReturn,newWaReturn);

  const oldUpdate="const submit=f.querySelector('.rc-submit'),ok=!member||Boolean(f.dataset.memberVerified);\n    if(submit&&!submit.dataset.busy){submit.disabled=!ok;submit.querySelector('[data-submit-hint]').textContent=ok?'Masuk CMS lalu buka WhatsApp':'Verifikasi member dahulu'}";
  const newUpdate="const submit=f.querySelector('.rc-submit'),memberPhone=clean(f.elements.member_phone?.value),guestName=String(f.elements.guest_name?.value||'').trim(),guestPhone=clean(f.elements.guest_phone?.value),memberReady=/^62[0-9]{7,14}$/.test(memberPhone),guestReady=guestName.length>=2&&/^62[0-9]{7,14}$/.test(guestPhone),ok=member?memberReady:guestReady;\n    if(submit&&!submit.dataset.busy){submit.disabled=!ok;submit.querySelector('[data-submit-hint]').textContent=member?(f.dataset.memberVerified===memberPhone?'Siap kirim · buka WhatsApp':'Member dicek otomatis saat kirim'):(ok?'Siap kirim · buka WhatsApp':'Isi nama & WhatsApp')}";
  if(!out.includes(oldUpdate)) throw new Error('submit-state seam not found');
  out=out.replace(oldUpdate,newUpdate);

  const oldCustomer="if(isMember){const phone=clean(x.member_phone);if(!f.dataset.memberVerified||phone!==f.dataset.memberVerified||!f.dataset.member)throw Error('Cek dan verifikasi nomor member dahulu.');const m=JSON.parse(f.dataset.member);customer={name:m.name,phone,email:m.email||''}}else{customer={name:String(x.guest_name||'').trim()||'Customer Web',phone:clean(x.guest_phone)||adminWa()||'6280000000000',email:String(x.guest_email||'').trim()}};";
  const newCustomer="if(isMember){const phone=clean(x.member_phone);if(!/^62[0-9]{7,14}$/.test(phone))throw Error('Isi nomor WhatsApp member yang valid.');let m=null;if(f.dataset.memberVerified===phone&&f.dataset.member){try{m=JSON.parse(f.dataset.member)}catch(_){m=null}}if(!m?.found){m=await rpc('rentcam_member_lookup',{p_phone:phone})}if(!m?.found)throw Error('Nomor belum terdaftar. Pilih Non-member untuk lanjut.');f.dataset.memberVerified=phone;f.dataset.member=JSON.stringify(m);customer={name:m.name,phone,email:m.email||''}}else{const name=String(x.guest_name||'').trim(),phone=clean(x.guest_phone);if(name.length<2)throw Error('Isi nama customer.');if(!/^62[0-9]{7,14}$/.test(phone))throw Error('Isi nomor WhatsApp yang valid.');customer={name,phone,email:String(x.guest_email||'').trim()}};";
  if(!out.includes(oldCustomer)) throw new Error('customer seam not found');
  out=out.replace(oldCustomer,newCustomer);

  return out;
}
module.exports={patchWebsiteOrders};
