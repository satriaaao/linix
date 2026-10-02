/* Published AEO/GEO content shared by HTML and live website previews. */
(function(root,factory){const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;if(root)root.RentcamProductKnowledge=lib;})(typeof window==='undefined'?null:window,function(){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function faq(p={}){const rows=Array.isArray(p.aeoFaq)?p.aeoFaq:[{question:p.aeoQuestion,answer:p.aeoAnswer}];return rows.map(r=>({question:String(r?.question||'').trim(),answer:String(r?.answer||'').trim()})).filter(r=>r.question&&r.answer);}
 function render(p={}){const rows=faq(p),topics=String(p.geoEntities||'').split(',').map(x=>x.trim()).filter(Boolean);return `${p.geoSummary?`<section class="rc-product-knowledge"><h2>Ringkasan Produk</h2><p>${esc(p.geoSummary)}</p>${topics.length?'<div class="rc-product-topics">'+topics.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div>':''}</section>`:''}${rows.length?`<section class="rc-product-knowledge"><h2>Pertanyaan yang Sering Diajukan</h2><div class="rc-product-faq">${rows.map(r=>`<details><summary>${esc(r.question)}</summary><p>${esc(r.answer)}</p></details>`).join('')}</div></section>`:''}`;}
 return {faq,render};
});
