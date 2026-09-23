(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMCameraVendor=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var DATA={
    title:'AMBIL ALAT VENDOR / BACK UP',
    reportLabel:'KAMERA',
    period:'JULI 2026',
    groups:[
      {
        no:'1',
        name:'Sony FX3',
        total:67,
        rows:[
          {qty:4,date:'05 Juni 2026',note:'2x Kopafi, 2x DS',price:'-'},
          {qty:3,date:'06 Juni 2026',note:'2x Kopafi, DS',price:'-'},
          {qty:2,date:'10 Juni 2026',note:'Kopafi',price:'-'},
          {qty:6,date:'11 Juni 2026',note:'2x Kopafi, 1x Bandung, 1x DMS, 1x Ali, 1x DS',price:'-'},
          {qty:7,date:'13 Juni 2026',note:'1x DWR, 4x Bandung, 2x DS',price:'-'},
          {qty:1,date:'14 Juni 2027',note:'Kopafi',price:'-'},
          {qty:2,date:'17 Juni 2026',note:'Kopafi',price:'-'},
          {qty:7,date:'20 Juni 2026',note:'1x Bandung, 2x Kopafi, 2x DS, 1x DMS, 1x DWR',price:'-'},
          {qty:5,date:'21 Juni 2026',note:'-',price:'-'},
          {qty:1,date:'22 Juni 2026',note:'Bandung',price:'-'},
          {qty:9,date:'23 Juni 2026',note:'3x Bandung, 2x Kopafi, 1x FM, 2x RSC, 1x Baraka',price:'-'},
          {qty:2,date:'24 Juni 2026',note:'1x Baraka, 1x Bandung',price:'-'},
          {qty:9,date:'25 Juni 2026',note:'2x Bandung, 2x Kopafi, 1x Baraka, 2x DWR, 2x RSC',price:'-'},
          {qty:9,date:'26 Juni 2026',note:'3x Bandung, 2x Kopafi, 1x Baraka, 1x DWR, 1x RSC',price:'-'}
        ]
      },
      {
        no:'2',
        name:'Sony a7 III',
        total:26,
        rows:[
          {qty:15,date:'06 Juni 2026',note:'5x Kopafi, 1x Ali, 1x Kent, 2x Bandung, 2x RSC, 1x a7R V, 3x a7S III',price:'-'},
          {qty:2,date:'07 Juni 2026',note:'Bandung',price:'-'},
          {qty:8,date:'13 Juni 2026',note:'4x Kopafi, 1x a7 V, 3x RSC',price:'-'},
          {qty:1,date:'14 Juni 2027',note:'Kopafi',price:'-'}
        ]
      }
    ],
    grandTotal:93
  };
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function createSlide(){
    return {
      template:'camera-vendor',
      reportType:'gudang-kamera',
      department:'KAMERA',
      month:7,
      year:2026,
      subtitle:'Ambil Alat Vendor / Back Up',
      groups:[],
      cameraVendor:clone(DATA)
    };
  }
  function escDefault(v){
    return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function renderGroup(group,esc){
    var html='';
    (group.rows||[]).forEach(function(row,i){
      html+='<tr class="camera-vendor-data-row">';
      if(i===0){
        html+='<td class="camera-vendor-no" rowspan="'+((group.rows||[]).length+1)+'"><b>'+esc(group.no)+'</b></td>';
      }
      html+='<td class="camera-vendor-name">'+esc(group.name)+'</td>';
      html+='<td class="camera-vendor-qty"><span>'+esc(row.qty)+'</span></td>';
      html+='<td class="camera-vendor-date">'+esc(row.date)+'</td>';
      html+='<td class="camera-vendor-note">'+esc(row.note||'-')+'</td>';
      html+='<td class="camera-vendor-price">'+esc(row.price||'-')+'</td>';
      html+='</tr>';
    });
    html+='<tr class="camera-vendor-total-row"><td class="camera-vendor-total-label">Total</td><td class="camera-vendor-qty"><span>'+esc(group.total)+'</span></td><td></td><td></td><td>-</td></tr>';
    return html;
  }
  function renderSlide(input,esc){
    var data=input&&input.title?input:DATA;
    esc=esc||escDefault;
    var body=(data.groups||[]).map(function(group){return renderGroup(group,esc);}).join('');
    return '<section class="camera-vendor-slide">'
      +'<div class="camera-vendor-grid"></div>'
      +'<div class="camera-vendor-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT '+esc(data.reportLabel||'KAMERA')+'</div></div>'
      +'<h1>'+esc(data.title||'AMBIL ALAT VENDOR / BACK UP')+'</h1>'
      +'<div class="camera-vendor-table-wrap"><table class="camera-vendor-table">'
      +'<colgroup><col class="cv-col-no"><col class="cv-col-name"><col class="cv-col-qty"><col class="cv-col-date"><col class="cv-col-note"><col class="cv-col-price"></colgroup>'
      +'<thead><tr><th>NO</th><th>NAMA BARANG</th><th>QTY</th><th>TANGGAL</th><th>KETERANGAN</th><th>HARGA VENDOR</th></tr></thead>'
      +'<tbody>'+body+'</tbody></table></div>'
      +'<div class="camera-vendor-grand"><span>TOTAL KESELURUHAN</span><b>'+esc(data.grandTotal)+'</b></div>'
      +'<div class="camera-vendor-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// '+esc(data.period||'JULI 2026')+'</b></div>'
      +'</section>';
  }
  return {DATA:DATA,createSlide:createSlide,renderSlide:renderSlide};
});