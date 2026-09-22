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
  const newUpdate="const submit=f.querySelector('.rc-submit'),memberKey=String(f.elements.member_phone?.value||'').trim().toUpperCase(),guestName=String(f.elements.guest_name?.value||'').trim(),guestPhone=clean(f.elements.guest_phone?.value),memberReady=memberKey.length>=4,guestReady=guestName.length>=2&&/^62[0-9]{7,14}$/.test(guestPhone),ok=member?memberReady:guestReady;\n    if(submit&&!submit.dataset.busy){submit.disabled=!ok;submit.querySelector('[data-submit-hint]').textContent=member?(f.dataset.memberVerified===memberKey?'Member ditemukan · siap lanjut':'Isi HP/kode member'):(ok?'Siap kirim · buka WhatsApp':'Buka data customer & lengkapi')}" ;
  if(!out.includes(oldUpdate)) throw new Error('submit-state seam not found');
  out=out.replace(oldUpdate,newUpdate);

  const oldCustomer="if(isMember){const phone=clean(x.member_phone);if(!f.dataset.memberVerified||phone!==f.dataset.memberVerified||!f.dataset.member)throw Error('Cek dan verifikasi nomor member dahulu.');const m=JSON.parse(f.dataset.member);customer={name:m.name,phone,email:m.email||''}}else{customer={name:String(x.guest_name||'').trim()||'Customer Web',phone:clean(x.guest_phone)||adminWa()||'6280000000000',email:String(x.guest_email||'').trim()}};";
  const newCustomer="if(isMember){const memberKey=String(x.member_phone||'').trim().toUpperCase();if(memberKey.length<4)throw Error('Isi No. HP atau Kode Member.');let m=null;if(f.dataset.memberVerified===memberKey&&f.dataset.member){try{m=JSON.parse(f.dataset.member)}catch(_){m=null}}if(!m?.found){m=await rpc('rentcam_member_lookup',{p_phone:memberKey})}if(!m?.found)throw Error('Member tidak ditemukan. Cek No. HP/Kode Member atau pilih Belum Member.');f.dataset.memberVerified=memberKey;f.dataset.member=JSON.stringify(m);customer={name:m.name,phone:m.phone,email:m.email||''}}else{const name=String(x.guest_name||'').trim(),phone=clean(x.guest_phone);if(name.length<2)throw Error('Isi nama customer.');if(!/^62[0-9]{7,14}$/.test(phone))throw Error('Isi nomor WhatsApp yang valid.');customer={name,phone,email:String(x.guest_email||'').trim()}};";
  if(!out.includes(oldCustomer)) throw new Error('customer seam not found');
  out=out.replace(oldCustomer,newCustomer);


  const memberBoxRe=/<fieldset class="rc-member-box">[\s\S]*?<\/fieldset>/;
  const newMemberBox=`<fieldset class="rc-member-box rc-member-compact"><legend>Tipe customer</legend>
    <div class="rc-segment"><label><input type="radio" name="customer_type" value="member" checked><span>Sudah Member<small>No. HP / Kode Member</small></span></label><label><input type="radio" name="customer_type" value="guest"><span>Belum Member<small>Isi data singkat</small></span></label></div>
    <div data-member-panel class="rc-member-simple">
      <label>No. HP / Kode Member<div class="rc-phone-check"><input name="member_phone" type="text" autocomplete="off" autocapitalize="characters" placeholder="0812 3456 7890 / BSM-XXXXXXXX"><button id="rcMemberCheck" type="button">Cek Member</button></div></label>
      <p class="rc-member-status" data-member-status>Cukup masukkan nomor HP atau kode member.</p>
      <div class="rc-member-card" data-member-card hidden></div>
    </div>
    <details data-guest-panel hidden class="rc-guest-details">
      <summary><span>Isi data customer<small>Nama, WhatsApp & Email</small></span><b>▼</b></summary>
      <div class="rc-guest-grid"><label>Nama<input name="guest_name" placeholder="Nama customer"></label><label>WhatsApp<input name="guest_phone" type="tel" inputmode="tel" placeholder="0812 3456 7890"></label><label class="rc-guest-email">Email<input name="guest_email" type="email" placeholder="nama@email.com"></label></div>
    </details>
    <style>
      #rentcamOrderForm .rc-member-compact{padding:12px!important}
      #rentcamOrderForm .rc-member-simple{margin-top:10px}
      #rentcamOrderForm .rc-member-simple>label{margin-bottom:0}
      #rentcamOrderForm .rc-member-status{margin:8px 2px 0}
      #rentcamOrderForm .rc-member-card{margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;background:#edf9f2}
      #rentcamOrderForm .rc-member-card:before{content:"✓";width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#16834d;color:#fff;font-weight:900;flex:0 0 auto}
      #rentcamOrderForm .rc-member-card strong{flex:1}
      #rentcamOrderForm .rc-member-card span{margin:0!important;padding:4px 7px;border-radius:999px;background:#dff2e7;color:#236545!important;font-size:9px!important;font-weight:850}
      #rentcamOrderForm .rc-guest-details{margin-top:10px;border:1px solid #e5e8ed;border-radius:12px;overflow:hidden;background:#fafbfc}
      #rentcamOrderForm .rc-guest-details summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;cursor:pointer;list-style:none}
      #rentcamOrderForm .rc-guest-details summary::-webkit-details-marker{display:none}
      #rentcamOrderForm .rc-guest-details summary span{display:flex;flex-direction:column;font-size:12px;font-weight:850}
      #rentcamOrderForm .rc-guest-details summary small{font-size:9px;color:#8b919a;font-weight:500;margin-top:2px}
      #rentcamOrderForm .rc-guest-details summary b{font-size:10px;color:#697386}
      #rentcamOrderForm .rc-guest-details[open] summary b{transform:rotate(180deg)}
      #rentcamOrderForm .rc-guest-details .rc-guest-grid{padding:0 12px 12px}
      @media(max-width:900px){#rentcamOrderForm .rc-phone-check{grid-template-columns:1fr!important}#rentcamOrderForm #rcMemberCheck{min-height:46px}}
    </style>
  </fieldset>`;
  if(!memberBoxRe.test(out)) throw new Error('member box seam not found');
  out=out.replace(memberBoxRe,newMemberBox);

  const checkMemberRe=/async function checkMember\(f\)\{[\s\S]*?\n  \}\n  function mount/;
  const newCheckMember=`async function checkMember(f){
    const memberKey=String(f.elements.member_phone.value||'').trim().toUpperCase(),status=f.querySelector('[data-member-status]'),card=f.querySelector('[data-member-card]');
    delete f.dataset.memberVerified;delete f.dataset.member;card.hidden=true;card.innerHTML='';
    if(memberKey.length<4){status.className='rc-member-status error';status.textContent='Isi No. HP atau Kode Member.';update(f);return}
    status.textContent='Mencari member...';
    try{
      const m=await rpc('rentcam_member_lookup',{p_phone:memberKey});
      if(!m?.found)throw Error('Member tidak ditemukan. Coba No. HP/Kode Member lain.');
      f.dataset.memberVerified=memberKey;f.dataset.member=JSON.stringify(m);
      status.className='rc-member-status success';status.textContent='Member ditemukan. Data customer otomatis digunakan.';
      card.hidden=false;card.innerHTML='<strong>'+E(m.name)+'</strong>'+(m.member_code?'<span>'+E(m.member_code)+'</span>':'');
    }catch(err){status.className='rc-member-status error';status.textContent=err.message}
    update(f);
  }
  function mount`;
  if(!checkMemberRe.test(out)) throw new Error('check member seam not found');
  out=out.replace(checkMemberRe,newCheckMember);

  return out;
}
module.exports={patchWebsiteOrders};
