(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.RentcamIntegrity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
  function taxConfig(config){
    const t=config?.tax||{};
    const rate=clamp(t.rate??t.ppnRate??0,0,100);
    return {enabled:t.enabled===true&&rate>0,rate,label:String(t.label||'PPN')};
  }
  function quoteTax(afterDiscount,config){
    const t=taxConfig(config);
    return t.enabled?Math.round((Number(afterDiscount)||0)*t.rate/100):0;
  }
  function rentalDays(start,end){
    const a=new Date(start),b=new Date(end||start);
    if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))return 1;
    return Math.max(1,Math.round((b-a)/86400000)+1);
  }
  function lineTotal(pricePerDay,qty,days){
    return Math.round((Number(pricePerDay)||0)*(Number(qty)||0)*Math.max(1,Number(days)||1));
  }
  function cleanPhone(value){
    let p=String(value||'').replace(/\D/g,'');
    if(p.startsWith('0'))p='62'+p.slice(1);
    else if(p.startsWith('8'))p='62'+p;
    return p;
  }
  function validPhone(value){
    return /^62[0-9]{7,14}$/.test(cleanPhone(value));
  }
  function money(value){return 'Rp'+Number(value||0).toLocaleString('id-ID');}
  function parseMoney(value){return Number(String(value||'').replace(/[^0-9-]/g,''))||0;}
  return {taxConfig,quoteTax,rentalDays,lineTotal,cleanPhone,validPhone,money,parseMoney};
});
