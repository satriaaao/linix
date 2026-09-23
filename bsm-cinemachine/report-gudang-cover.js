(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportCover=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var DEFAULT_IMAGE='https://www.arri.com/resource/image/78390/landscape_ratio1x0_38/1200/460/ca9a8ccb43e2f93056fef2fbfd636693/EF2D7F91E00F440A63457E1E350736CB/daylight-stage-overview-page-2.jpg';
  function defaultCover(image){
    return {
      logoMain:'BSM',
      logoSub:'RENTAL',
      titleTop1:'// LAPORAN GUDANG',
      titleTop2:'// REPORT LIGHTING',
      mainTitle1:'MBR',
      mainTitle2:'GUDANG LIGHTING',
      periodPrefix:'Periode',
      period:'JULI 2026',
      dataPrefix:'DATA :',
      item1:'SERVICE',
      item2:'BARANG KURANG',
      item3:'KOMPLAIN',
      footerLeft:'PT BLUE STAR MEDIA  |  BSM RENTAL',
      footerTagline:'AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.',
      footerRight:'// JULI 2026',
      image:image||DEFAULT_IMAGE
    };
  }
  function normalizeCover(src){
    var base=defaultCover(), obj=src||{};
    Object.keys(base).forEach(function(k){ if(obj[k]!==undefined&&obj[k]!==null) base[k]=obj[k]; });
    return base;
  }
  function field(esc,label,key,value,full){
    return '<div class="field '+(full?'full':'')+'"><label>'+label+'</label><input class="control cover-input" data-cover-field="'+key+'" value="'+esc(value||'')+'"></div>';
  }
  function renderCoverEditor(model,esc){
    model=normalizeCover(model); esc=esc||function(v){return String(v==null?'':v);};
    return '<div class="cover-editor-grid">'
      +'<div class="cover-editor-block"><div class="section-title"><strong>Gambar Cover</strong></div>'
      +'<div class="cover-image-editor"><div class="cover-image-thumb" style="background-image:url(&quot;'+esc(model.image)+'&quot;)"></div>'
      +'<div><input id="coverImageInput" type="file" accept="image/*" class="cover-file-input"><div class="tiny">Upload JPG/PNG. Gambar hanya berlaku untuk Slide 1.</div></div></div></div>'
      +'<div class="cover-editor-block"><div class="section-title"><strong>Logo & Judul</strong></div><div class="field-grid">'
      +field(esc,'Logo','logoMain',model.logoMain,false)+field(esc,'Sub Logo','logoSub',model.logoSub,false)
      +field(esc,'Label Kanan 1','titleTop1',model.titleTop1,true)+field(esc,'Label Kanan 2','titleTop2',model.titleTop2,true)
      +field(esc,'Judul Kecil','mainTitle1',model.mainTitle1,false)+field(esc,'Judul Utama','mainTitle2',model.mainTitle2,true)
      +'</div></div>'
      +'<div class="cover-editor-block"><div class="section-title"><strong>Periode & Menu Data</strong></div><div class="field-grid">'
      +field(esc,'Prefix Periode','periodPrefix',model.periodPrefix,false)+field(esc,'Periode','period',model.period,false)
      +field(esc,'Prefix Data','dataPrefix',model.dataPrefix,false)+field(esc,'Item 1','item1',model.item1,false)+field(esc,'Item 2','item2',model.item2,false)+field(esc,'Item 3','item3',model.item3,false)
      +'</div></div>'
      +'<div class="cover-editor-block"><div class="section-title"><strong>Footer</strong></div><div class="field-grid">'
      +field(esc,'Footer Kiri','footerLeft',model.footerLeft,true)+field(esc,'Tagline','footerTagline',model.footerTagline,true)+field(esc,'Footer Kanan','footerRight',model.footerRight,true)
      +'</div></div></div>';
  }
  function renderCoverSlide(model,esc){
    model=normalizeCover(model); esc=esc||function(v){return String(v==null?'':v);};
    var logo=String(model.logoMain||'BSM').split('').map(function(c){return '<span>'+esc(c)+'</span>';}).join('');
    return '<section class="cover-slide">'
      +'<div class="cover-grid"></div><div class="cover-hero" style="background-image:url(&quot;'+esc(model.image)+'&quot;)"></div><div class="cover-diagonal"></div>'
      +'<div class="cover-logo"><div class="cover-logo-boxes">'+logo+'</div><div class="cover-logo-sub">'+esc(model.logoSub)+'</div></div>'
      +'<div class="cover-top-right"><div>'+esc(model.titleTop1)+'</div><div class="accent">'+esc(model.titleTop2)+'</div></div>'
      +'<div class="cover-main"><div class="cover-bar"></div><div class="cover-title-one">'+esc(model.mainTitle1)+'</div><div class="cover-title-two">'+esc(model.mainTitle2)+'</div>'
      +'<div class="cover-period"><span>'+esc(model.periodPrefix)+'</span> <strong>'+esc(model.period)+'</strong></div>'
      +'<div class="cover-data-line"><strong>'+esc(model.dataPrefix)+'</strong><span>'+esc(model.item1)+'</span><b>•</b><span>'+esc(model.item2)+'</span><b>•</b><span>'+esc(model.item3)+'</span></div>'
      +'<div class="cover-items"><div class="cover-item"><div class="cover-icon">⚙</div><div>'+esc(model.item1)+'</div></div><div class="cover-item"><div class="cover-icon">◇</div><div>'+esc(model.item2)+'</div></div><div class="cover-item"><div class="cover-icon">•••</div><div>'+esc(model.item3)+'</div></div></div></div>'
      +'<div class="cover-footer"><div><strong>'+esc(model.footerLeft)+'</strong><small>'+esc(model.footerTagline)+'</small></div><div class="cover-footer-line"></div><div class="cover-footer-right">'+esc(model.footerRight)+'</div></div>'
      +'</section>';
  }
  return {defaultCover:defaultCover,normalizeCover:normalizeCover,renderCoverEditor:renderCoverEditor,renderCoverSlide:renderCoverSlide,DEFAULT_IMAGE:DEFAULT_IMAGE};
});