/* Published AEO/GEO content shared by HTML and live website previews. */
(function(root,factory){const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;if(root)root.RentcamProductKnowledge=lib;})(typeof window==='undefined'?null:window,function(){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function faq(p={}){
  const rows=Array.isArray(p.aeoFaq)?p.aeoFaq:[{question:p.aeoQuestion,answer:p.aeoAnswer}];
  const valid=rows.map(r=>({question:String(r?.question||'').trim(),answer:String(r?.answer||'').trim()})).filter(r=>r.question&&r.answer);
  if(valid.length||!p.name)return valid;
  const included=p.included||p.inc||[];
  return [{question:'Apa saja yang termasuk dalam '+p.name+'?',answer:included.length?'Paket mencakup '+included.join(', ')+'.':'Konfirmasikan konfigurasi dan kelengkapan produk kepada tim sebelum memesan.'},{question:'Bagaimana mengecek ketersediaan '+p.name+'?',answer:'Konfirmasikan tanggal rental dan jumlah unit yang dibutuhkan kepada tim sebelum memesan.'}];
 }

 function render(p={}){const rows=faq(p),topics=String(p.geoEntities||'').split(',').map(x=>x.trim()).filter(Boolean);return `${p.geoSummary?`<section class="rc-product-knowledge"><h2>Ringkasan Produk</h2><p>${esc(p.geoSummary)}</p>${topics.length?'<div class="rc-product-topics">'+topics.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div>':''}</section>`:''}${rows.length?`<section class="rc-product-knowledge"><h2>Pertanyaan yang Sering Diajukan</h2><div class="rc-product-faq">${rows.map(r=>`<details><summary>${esc(r.question)}</summary><p>${esc(r.answer)}</p></details>`).join('')}</div></section>`:''}`;}
 return {faq,render};
});
