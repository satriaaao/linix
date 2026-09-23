(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function clamp(n,min,max){ n=Number(n||0); return Math.max(min,Math.min(max,n)); }
  function normalizeLogoSettings(src){
    src=src||{};
    return {width:clamp(src.width==null?180:src.width,80,320),x:clamp(src.x||0,-200,200),y:clamp(src.y||0,-200,200)};
  }
  function renderSidebar(active){
    var items=[['slides','Slide'],['cover','Cover Slide 1'],['bulk','Input Banyak'],['table','Editor Tabel'],['preview','Preview'],['print','Print / PDF'],['csv','Export CSV']];
    return items.map(function(it){return '<button class="rg-sidebar-item '+(active===it[0]?'active':'')+'" data-menu="'+it[0]+'">'+it[1]+'</button>';}).join('');
  }
  function renderModalShell(kind,title,body){
    return '<div class="rg-modal-backdrop" id="rgModal" data-modal="'+kind+'"><div class="rg-modal-card"><div class="rg-modal-head"><strong>'+title+'</strong><button class="rg-modal-close" data-close-modal>×</button></div><div class="rg-modal-body">'+body+'</div></div></div>';
  }
  function renderLogoOverlay(src){
    var s=normalizeLogoSettings(src), image=src&&src.image?String(src.image):'';
    if(!image) return '';
    return '<img class="cover-uploaded-logo" src="'+image+'" style="width:'+s.width+'px;transform:translate('+s.x+'px,'+s.y+'px)" alt="Logo cover">';
  }
  function renderLogoEditor(src){
    var s=normalizeLogoSettings(src), image=src&&src.image?String(src.image):'';
    return '<div class="logo-settings"><div class="logo-settings-preview">'+(image?'<img src="'+image+'" alt="Preview logo">':'<span>Belum ada logo</span>')+'</div>'
      +'<label class="logo-upload">Upload Logo<input id="coverLogoInput" type="file" accept="image/*"></label>'
      +'<label>Ukuran <span data-logo-value="width">'+s.width+' px</span><input type="range" min="80" max="320" value="'+s.width+'" data-logo-setting="width"></label>'
      +'<label>Posisi X <span data-logo-value="x">'+s.x+'</span><input type="range" min="-200" max="200" value="'+s.x+'" data-logo-setting="x"></label>'
      +'<label>Posisi Y <span data-logo-value="y">'+s.y+'</span><input type="range" min="-200" max="200" value="'+s.y+'" data-logo-setting="y"></label>'
      +'<button class="btn" data-reset-logo>Reset Logo</button></div>';
  }
  return {normalizeLogoSettings:normalizeLogoSettings,renderSidebar:renderSidebar,renderModalShell:renderModalShell,renderLogoOverlay:renderLogoOverlay,renderLogoEditor:renderLogoEditor};
});