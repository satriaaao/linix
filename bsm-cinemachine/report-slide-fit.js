(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportSlideFit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function n(v,fallback){
    v=Number(v);
    return Number.isFinite(v)?v:(fallback||0);
  }
  function level(metrics){
    metrics=metrics||{};
    var rootWidth=n(metrics.rootWidth,1600);
    var rootHeight=n(metrics.rootHeight,900);
    var contentBottom=n(metrics.contentBottom,0);
    var footerTop=n(metrics.footerTop,860);
    if(rootWidth>1640||rootHeight>930||contentBottom>footerTop+12) return 'tight';
    if(rootWidth>1600||rootHeight>900||(footerTop-contentBottom)<18) return 'compact';
    return 'normal';
  }
  return {level:level};
});