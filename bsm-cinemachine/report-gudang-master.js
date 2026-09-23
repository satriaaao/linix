(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportMaster=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var REPORT_TYPES=[
    {id:'it',label:'IT',department:'IT'},
    {id:'admin',label:'Admin',department:'ADMIN'},
    {id:'gudang-kamera',label:'Gudang Kamera',department:'KAMERA'},
    {id:'gudang-audio',label:'Gudang Audio',department:'AUDIO'},
    {id:'gudang-lighting',label:'Gudang Lighting',department:'LIGHTING'},
    {id:'gudang-cinema',label:'Gudang Cinema',department:'CINEMA'},
    {id:'koordinator-crew',label:'Koordinator Crew',department:'KOORDINATOR CREW'},
    {id:'marketing',label:'Marketing',department:'MARKETING'}
  ];
  function clone(v){ return JSON.parse(JSON.stringify(v==null?{}:v)); }
  function typeById(id){ return REPORT_TYPES.find(function(t){return t.id===id;})||REPORT_TYPES[0]; }
  function makeSectionCover(type,baseCover){
    type=type||REPORT_TYPES[0];
    var cover=clone(baseCover||{});
    cover.mainTitle1='MBR';
    cover.mainTitle2=String(type.label||'REPORT').toUpperCase();
    cover.titleTop1='// PT BLUE STAR MEDIA';
    cover.titleTop2='// '+String(type.label||'REPORT').toUpperCase();
    cover.periodPrefix=cover.periodPrefix||'Periode';
    cover.period=cover.period||'JULI 2026';
    cover.dataPrefix='REPORT :';
    cover.item1='RINGKASAN';
    cover.item2='KENDALA';
    cover.item3='TINDAK LANJUT';
    cover.footerLeft=cover.footerLeft||'PT BLUE STAR MEDIA  |  BSM RENTAL';
    cover.footerRight='// '+String(type.label||'REPORT').toUpperCase();
    return cover;
  }
  function createSections(baseCover,legacySlides){
    var sections={};
    REPORT_TYPES.forEach(function(type){
      sections[type.id]={id:type.id,label:type.label,cover:makeSectionCover(type,baseCover),slides:[]};
    });
    if(Array.isArray(legacySlides)&&legacySlides.length) sections['gudang-lighting'].slides=clone(legacySlides);
    return sections;
  }
  function normalizeSections(raw,baseCover,legacySlides){
    var defaults=createSections(baseCover,legacySlides);
    raw=raw&&typeof raw==='object'?raw:{};
    REPORT_TYPES.forEach(function(type){
      var src=raw[type.id];
      if(!src) return;
      defaults[type.id].label=type.label;
      defaults[type.id].cover=Object.assign(makeSectionCover(type,baseCover),clone(src.cover||{}));
      defaults[type.id].slides=Array.isArray(src.slides)?clone(src.slides):defaults[type.id].slides;
    });
    return defaults;
  }
  function flattenMaster(state){
    state=state||{};
    var pages=[{kind:'master-cover',key:'master-cover',label:'Cover Master',cover:state.cover||{}}];
    var sections=state.sections||{};
    REPORT_TYPES.forEach(function(type){
      var section=sections[type.id]||{id:type.id,label:type.label,cover:makeSectionCover(type,state.cover||{}),slides:[]};
      pages.push({kind:'section-cover',key:'section-cover:'+type.id,typeId:type.id,label:type.label,cover:section.cover||{}});
      (section.slides||[]).forEach(function(report,index){
        pages.push({kind:'report',key:'report:'+type.id+':'+index,typeId:type.id,label:type.label,reportIndex:index,report:report});
      });
    });
    return pages;
  }
  function findPageIndex(state,key){
    var pages=flattenMaster(state);
    for(var i=0;i<pages.length;i++) if(pages[i].key===key) return i;
    return 0;
  }
  return {REPORT_TYPES:REPORT_TYPES,typeById:typeById,makeSectionCover:makeSectionCover,createSections:createSections,normalizeSections:normalizeSections,flattenMaster:flattenMaster,findPageIndex:findPageIndex};
});