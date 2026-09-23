(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMCameraReports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var COMPLAINTS=[
    {no:1,item:'Sony a7 IV',client:'Mas Irfan',date:'02/06/2026',indication:'Trouble',chronology:'Sensor sedikit getar',pic:'-'},
    {no:2,item:'Filter H&Y',client:'Daffa Insani',date:'03/06/2026',indication:'Trouble',chronology:'Sekedar tutup belakang copot tapi masih bisa dipakai',pic:'-'},
    {no:3,item:'Sony a7 III',client:'Hidayat',date:'04/06/2026',indication:'Trouble',chronology:'-',pic:'Arbit'},
    {no:4,item:'Battery Dummy NP-FZ100',client:'Gibran Fuad',date:'04/06/2026',indication:'Trouble',chronology:'Tiba-tiba mati',pic:'-'},
    {no:5,item:'Charger NP-FZ100',client:'Eloa Steven',date:'06/06/2026',indication:'Trouble',chronology:'Charger tidak bisa dipakai',pic:'-'},
    {no:6,item:'Sony 24-70 GM',client:'Hermanto',date:'07/06/2026',indication:'Trouble',chronology:'-',pic:'Rian'},
    {no:7,item:'Sony FX30',client:'Fiki Hadi',date:'07/06/2026',indication:'Trouble',chronology:'Video pas disiapkan aman',pic:'Rian'},
    {no:8,item:'Sony FX2',client:'RM Gagah',date:'10/06/2026',indication:'Trouble',chronology:'Kamera di lokasi nge-freeze',pic:'Ferdy'},
    {no:9,item:'Orbit Max',client:'PT. Victoria Care',date:'10/06/2026',indication:'Trouble',chronology:'Power Orbit tiba-tiba mati / beberapa menit kemudian mati',pic:'Ismail'},
    {no:10,item:'Sony 24-70 GM',client:'Haju Medical',date:'12/06/2026',indication:'Trouble',chronology:'Lensa sedikit berdebu di dalam',pic:'-'},
    {no:11,item:'Battery NP-FW500',client:'Wendha Theadora',date:'12/06/2026',indication:'Kelalaian',chronology:'Tidak disiapkan dengan anak gudang',pic:'-'},
    {no:12,item:'Sony PXW-Z90',client:'Muhammad Nuh',date:'12/06/2026',indication:'Trouble',chronology:'Output SDI tidak keluar, tapi saat di kantor aman',pic:'Ismail'},
    {no:13,item:'Charger NP-FZ100',client:'Hibul Bahri',date:'13/06/2026',indication:'Trouble',chronology:'Charger agak error',pic:'Arbit'},
    {no:14,item:'Handle Tilta CT12',client:'PT. Bima Sakti',date:'13/06/2026',indication:'-',chronology:'-',pic:'-'},
    {no:15,item:'Step Up Ring',client:'PT. Gramedia',date:'13/06/2026',indication:'Kelalaian',chronology:'Cuma disiapkan 1 set',pic:'Rian'},
    {no:16,item:'Battery NP-FZ100',client:'PT. Pola Kreasi',date:'13/06/2026',indication:'Trouble',chronology:'Battery Tilta',pic:'Raka'},
    {no:17,item:'Baut Tripod Komodo',client:'Muhammad Valdy',date:'16/06/2026',indication:'Kelalaian',chronology:'Baut kepanjangan',pic:'-'},
    {no:18,item:'Kabel Tether C to C',client:'Michael Effendy',date:'20/06/2026',indication:'Trouble',chronology:'Error',pic:'Ismail'},
    {no:19,item:'Godox V1 Pro',client:'Putra Afandi',date:'21/06/2026',indication:'Trouble',chronology:'Trouble',pic:'Raka'},
    {no:20,item:'CF Express 80GB',client:'PT. Ruang Raya',date:'21/06/2026',indication:'Trouble',chronology:'Tidak terbaca',pic:'Ferdy'}
  ];

  var SERVICE_CENTERS=[
    {
      name:'Sony Center',
      period:'JULI 2026',
      groups:[
        {
          name:'Sony 70-200 GM',total:16,inService:5,canRun:11,
          rows:[
            {date:'11/01/2025',stock:'Bsm7020008',note:'F Tidak Detect'},
            {date:'14/05/2025',stock:'1811547',note:'F Rusak'},
            {date:'23/06/2025',stock:'7020003',note:'Manual Focus Getar'},
            {date:'02/07/2026',stock:'Bsm7020005',note:'F Rusak'},
            {date:'02/07/2026',stock:'1882115',note:'F Rusak'}
          ]
        },
        {
          name:'Sony FX3',total:31,inService:15,canRun:16,
          rows:[
            {date:'19/05/2026',stock:'4870805',note:'Kipas Pendingin Rusak'},
            {date:'19/05/2026',stock:'4870637',note:'Mode Video Kipas Bunyi'},
            {date:'19/05/2026',stock:'4870193',note:'Tombol Menu, Fn DLL Problem'},
            {date:'11/06/2026',stock:'4879042',note:'Kamera error, Engsel LCD Goyang'},
            {date:'11/06/2026',stock:'4874857',note:'HDMI rusak, Engsel LCD goyang'},
            {date:'11/06/2026',stock:'4874590',note:'HDMI Rusak, Engsel LCD goyang'},
            {date:'30/06/2026',stock:'4874585',note:'Cek all'},
            {date:'30/06/2026',stock:'4878228',note:'Kamera error'},
            {date:'02/07/2026',stock:'4870334',note:'HDMI Rusak'},
            {date:'02/07/2026',stock:'4879052',note:'HDMI Rusak'},
            {date:'02/07/2026',stock:'4870892',note:'HDMI Rusak'},
            {model:'Sony FX3a',date:'02/07/2026',stock:'6500968',note:'LCD Rusak'},
            {date:'02/07/2026',stock:'4874855',note:'HDMI Rusak'},
            {date:'02/07/2026',stock:'4880930',note:'HDMI Rusak'},
            {date:'02/07/2026',stock:'4879051',note:'HDMI Rusak'}
          ]
        }
      ]
    }
  ];

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function escDefault(v){
    return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function paginateComplaints(rows,maxRows){
    maxRows=Math.max(1,Number(maxRows||20));
    var pages=[];
    for(var i=0;i<(rows||[]).length;i+=maxRows) pages.push(clone(rows.slice(i,i+maxRows)));
    return pages.length?pages:[[]];
  }
  function paginateService(groups,maxUnits){
    maxUnits=Math.max(3,Number(maxUnits||20));
    var pages=[],page=[],used=0;
    function flush(){if(page.length){pages.push(page);page=[];used=0;}}
    (groups||[]).forEach(function(group){
      var rows=clone(group.rows||[]);
      var wholeCost=rows.length+1;
      if(wholeCost<=maxUnits){
        if(used+wholeCost>maxUnits) flush();
        var whole=clone(group);whole.continued=false;whole.showTotal=true;
        page.push(whole);used+=wholeCost;return;
      }
      if(used) flush();
      var chunkSize=maxUnits-1;
      for(var i=0;i<rows.length;i+=chunkSize){
        var chunk=clone(group);
        chunk.rows=rows.slice(i,i+chunkSize);
        chunk.continued=i>0;
        chunk.showTotal=i+chunkSize>=rows.length;
        page.push(chunk);
        used+=chunk.rows.length+(chunk.showTotal?1:0);
        flush();
      }
    });
    flush();
    return pages.length?pages:[[]];
  }
  function createComplaintSlides(rows,maxRows){
    var pages=paginateComplaints(rows||COMPLAINTS,maxRows||20);
    return pages.map(function(page,i){
      return {
        template:'camera-complaint',reportType:'gudang-kamera',department:'KAMERA',
        subtitle:'Report Komplain Bulan Juni 2026',month:6,year:2026,groups:[],
        complaintRows:page,pageNo:i+1,pageTotal:pages.length
      };
    });
  }
  function createServiceSlides(centers,maxUnits){
    var slides=[];
    (centers||SERVICE_CENTERS).forEach(function(center){
      var pages=paginateService(center.groups||[],maxUnits||20);
      pages.forEach(function(groups,i){
        slides.push({
          template:'camera-service',reportType:'gudang-kamera',department:'KAMERA',
          subtitle:'Report Barang yang di Service',month:7,year:2026,groups:[],
          serviceCenter:center.name,servicePeriod:center.period||'JULI 2026',
          serviceGroups:groups,pageNo:i+1,pageTotal:pages.length
        });
      });
    });
    return slides;
  }
  function renderComplaintSlide(slide,esc){
    esc=esc||escDefault;slide=slide||createComplaintSlides()[0];
    var rows=(slide.complaintRows||[]).map(function(r,i){
      var cls=String(r.indication||'').toLowerCase()==='trouble'?'trouble':(String(r.indication||'').toLowerCase()==='kelalaian'?'negligence':'neutral');
      return '<tr><td class="camera-complaint-no">'+esc(r.no||i+1)+'</td><td>'+esc(r.item)+'</td><td>'+esc(r.client)+'</td><td class="camera-complaint-date">'+esc(r.date)+'</td><td class="camera-complaint-indication '+cls+'">'+esc(r.indication||'-')+'</td><td>'+esc(r.chronology||'-')+'</td><td class="camera-complaint-pic">'+esc(r.pic||'-')+'</td></tr>';
    }).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="camera-complaint-slide"><div class="camera-report-grid"></div>'
      +'<div class="camera-report-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT KAMERA</div></div>'
      +'<h1>REPORT KOMPLAIN <span>BULAN JUNI 2026</span>'+suffix+'</h1>'
      +'<div class="camera-complaint-wrap"><table class="camera-complaint-table"><colgroup><col class="cc-no"><col class="cc-item"><col class="cc-client"><col class="cc-date"><col class="cc-ind"><col class="cc-chrono"><col class="cc-pic"></colgroup><thead><tr><th>NO</th><th>NAMA BARANG</th><th>NAMA KLIEN</th><th>TANGGAL</th><th>INDIKASI</th><th>KRONOLOGIS</th><th>PIC</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
      +'<div class="camera-report-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// JUNI 2026</b></div></section>';
  }
  function renderServiceGroup(group,esc){
    var rows=(group.rows||[]).map(function(r,i){
      return '<tr><td class="camera-service-no">'+(i+1)+'</td><td>'+esc(r.model||group.name)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.stock)+'</td>'
        +'<td class="camera-service-total">'+(i===0&&!group.continued?esc(group.total):'-')+'</td>'
        +'<td class="camera-service-active">'+(i===0&&!group.continued?esc(group.inService):'-')+'</td>'
        +'<td class="camera-service-run">'+(i===0&&!group.continued?esc(group.canRun):'-')+'</td><td>'+esc(r.note||'-')+'</td></tr>';
    }).join('');
    if(group.showTotal){
      rows+='<tr class="camera-service-subtotal"><td colspan="4">Total '+esc(group.name)+'</td><td>'+esc(group.total)+'</td><td>'+esc(group.inService)+'</td><td>'+esc(group.canRun)+'</td><td>-</td></tr>';
    }
    return rows;
  }
  function renderServiceSlide(slide,esc){
    esc=esc||escDefault;slide=slide||createServiceSlides()[0];
    var rows=(slide.serviceGroups||[]).map(function(g){return renderServiceGroup(g,esc);}).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="camera-service-slide"><div class="camera-report-grid"></div>'
      +'<div class="camera-report-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT KAMERA</div></div>'
      +'<h1>REPORT BARANG YANG DI <span>SERVICE</span></h1><h2>'+esc(slide.serviceCenter||'SERVICE CENTER')+suffix+'</h2>'
      +'<div class="camera-service-wrap"><table class="camera-service-table"><colgroup><col class="cs-no"><col class="cs-model"><col class="cs-date"><col class="cs-stock"><col class="cs-total"><col class="cs-service"><col class="cs-run"><col class="cs-note"></colgroup><thead><tr><th>NO</th><th>MODEL</th><th>TANGGAL</th><th>STOK KANTOR / SN</th><th>TOTAL</th><th>DI SERVICE</th><th>BISA JALAN</th><th>KETERANGAN</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
      +'<div class="camera-report-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// '+esc(slide.servicePeriod||'JULI 2026')+'</b></div></section>';
  }
  return {
    COMPLAINTS:COMPLAINTS,SERVICE_CENTERS:SERVICE_CENTERS,
    paginateComplaints:paginateComplaints,paginateService:paginateService,
    createComplaintSlides:createComplaintSlides,createServiceSlides:createServiceSlides,
    renderComplaintSlide:renderComplaintSlide,renderServiceSlide:renderServiceSlide
  };
});