(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportLiveEdit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function ensure(store){
    return store&&typeof store==='object'?store:{};
  }
  function page(store,pageKey,create){
    store=ensure(store);
    var key=String(pageKey||'');
    if(!key) return null;
    if(!store[key]&&create) store[key]={};
    return store[key]||null;
  }
  function setText(store,pageKey,index,text){
    var p=page(store,pageKey,true);
    if(!p) return store;
    p[String(index)]=String(text==null?'':text);
    return store;
  }
  function getText(store,pageKey,index){
    var p=page(store,pageKey,false);
    if(!p) return undefined;
    var key=String(index);
    return Object.prototype.hasOwnProperty.call(p,key)?p[key]:undefined;
  }
  function clearPage(store,pageKey){
    store=ensure(store);
    delete store[String(pageKey||'')];
    return store;
  }
  return {ensure:ensure,setText:setText,getText:getText,clearPage:clearPage};
});