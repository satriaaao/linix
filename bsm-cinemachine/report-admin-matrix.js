(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMAdminMatrix=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function d(s){
    var a=String(s||'').split(',');
    while(a.length<30) a.push('');
    return a.slice(0,30);
  }
  var DATA={
    title:'DATA MBR ADMIN',
    period:'JUNI 2026',
    delivery:[
      {shift:'MALAM',time:'1:00',days:d('2,5,9,14,8,14,14,9,11,10,14,19,15,8,9,4,17,16,14,6,10,14,7,16,15,12,14,17,8,10')},
      {shift:'',time:'2:00',days:d(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,')},
      {shift:'',time:'3:00',days:d('1,,,,,2,,,,,,,,,1,,,,1,,1,,,1,1,,,,,')},
      {shift:'',time:'4:00',days:d('1,,,,,2,1,2,,,1,1,3,,,,2,1,,1,2,,1,2,1,1,,1,3,')},
      {shift:'',time:'5:00',days:d(',1,,,,2,2,,,,1,1,5,1,,,3,,,2,1,2,,1,4,,4,3,,')},
      {shift:'',time:'GOJEK/GOCAR',days:d(',,,,,,,,,,,,,,,,,,,,,,,,1,,1,,,')},
      {shift:'PAGI',time:'7:00',days:d('2,2,2,3,1,3,4,1,2,2,4,7,2,1,4,1,4,4,3,3,1,3,3,2,3,2,3,1,,')},
      {shift:'',time:'8:00',days:d(',4,3,2,3,3,2,2,3,2,1,7,4,2,2,,1,1,4,2,1,3,2,5,5,2,1,,,3')},
      {shift:'',time:'9:00',days:d('2,2,1,3,2,1,1,3,4,4,3,3,3,,3,1,2,1,1,2,,3,3,2,5,4,2,1,,')},
      {shift:'',time:'10:00',days:d('1,1,2,,2,1,2,2,1,3,1,5,3,1,1,1,4,1,,2,2,1,2,1,3,2,,1,,')},
      {shift:'',time:'11:00',days:d('1,2,,1,1,1,1,2,1,2,,2,2,,1,1,1,2,,1,,3,,1,2,,1,,,')},
      {shift:'',time:'12:00',days:d('1,,2,,,1,,1,1,,,1,1,,,,2,1,,,,,,1,,1,1,1,,')},
      {shift:'',time:'13:00',days:d(',,,,,1,,,,1,1,,3,,,,1,,,2,,,,,,,,,,')},
      {shift:'',time:'14:00',days:d(',1,,,1,,1,,,1,,1,3,,,,1,,,,,,,,,,,,,')},
      {shift:'',time:'15:00',days:d(',,,,,,,,,,,,1,,1,,,,,1,,,,,,,,1,,')},
      {shift:'',time:'16:00',days:d(',,,1,1,,,,,,,,,,1,1,,,,,,,,,,,,,,')},
      {shift:'',time:'17:00',days:d(',,,,,1,2,,,,,,,,,,,,,,,,,,,,,,,')}
    ],
    deliveryTotal:d('11,18,19,24,19,32,30,22,23,25,26,48,45,15,20,8,39,27,32,22,18,29,19,31,39,26,29,25,11,13'),
    jemputan:[
      {shift:'SIANG',days:d('1,4,3,6,2,2,4,4,4,4,8,1,1,5,5,2,11,2,5,1,2,3,5,5,8,5,4,4,3,2')},
      {shift:'MALAM',days:d('11,18,16,18,12,30,28,20,16,20,20,33,33,25,19,6,31,26,18,22,18,26,16,18,29,24,22,34,20,17')}
    ],
    jemputanTotal:d('12,22,19,24,14,32,32,24,20,24,28,34,34,30,24,9,42,28,23,23,20,29,21,23,37,29,26,38,23,19'),
    suratJalan:d('73,110,119,123,148,163,141,172,114,163,123,151,196,124,100,98,164,131,120,139,120,118,100,125,125,160,205,155,109,122'),
    totals:{delivery:'368',jemputan:'763',combined:'1131',suratJalan:'4011'},
    notes:['WA ADMIN MASIH SERING EROR','PERMINTAAN LAPTOP/ MACBOOX UNTUK TIM DELEVERY']
  };
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function createSlide(){
    return {template:'admin-matrix',reportType:'admin',department:'ADMIN',month:6,year:2026,subtitle:'Data MBR Admin Juni 2026',groups:[],matrix:clone(DATA)};
  }
  function escDefault(v){
    return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function dayCells(days,esc){
    return days.map(function(v){
      var value=String(v==null?'':v);
      return '<td class="admin-day '+(value?'has-value':'')+'">'+(value?esc(value):'')+'</td>';
    }).join('');
  }
  function renderSlide(input,esc){
    var data=input&&input.title?input:DATA;
    esc=esc||escDefault;
    var days=Array.from({length:30},function(_,i){return '<th class="admin-day-head">'+(i+1)+'</th>';}).join('');
    var body='';
    data.delivery.forEach(function(row,i){
      body+='<tr class="admin-detail-row">';
      if(i===0) body+='<td class="admin-group" rowspan="'+(data.delivery.length+1)+'"><b>1</b><strong>DELIVERY</strong></td>';
      if(i===0) body+='<td class="admin-shift" rowspan="6">MALAM</td>';
      if(i===6) body+='<td class="admin-shift" rowspan="'+(data.delivery.length-6)+'">PAGI</td>';
      body+='<td class="admin-time">'+esc(row.time||'')+'</td>'+dayCells(row.days,esc)+'<td class="admin-total-cell"></td><td></td></tr>';
    });
    body+='<tr class="admin-total-row"><td colspan="2">DELIVERY TOTAL</td>'+dayCells(data.deliveryTotal,esc)+'<td class="admin-grand-total">'+esc(data.totals.delivery)+'</td><td></td></tr>';
    data.jemputan.forEach(function(row,i){
      body+='<tr class="admin-detail-row">';
      if(i===0) body+='<td class="admin-group" rowspan="3"><b>2</b><strong>JEMPUTAN</strong></td>';
      body+='<td class="admin-shift">'+esc(row.shift)+'</td><td class="admin-time"></td>'+dayCells(row.days,esc)+'<td class="admin-total-cell"></td><td></td></tr>';
    });
    body+='<tr class="admin-total-row"><td colspan="2">JEMPUTAN TOTAL</td>'+dayCells(data.jemputanTotal,esc)+'<td class="admin-grand-total">'+esc(data.totals.jemputan)+'</td><td></td></tr>';
    body+='<tr class="admin-total-row admin-surat-row"><td class="admin-group"><b>3</b></td><td colspan="2">SURAT JALAN</td>'+dayCells(data.suratJalan,esc)+'<td class="admin-grand-total">'+esc(data.totals.suratJalan)+'</td><td></td></tr>';
    var notes=data.notes.map(function(n,i){return '<div class="admin-note"><b>'+(i+1)+'.</b><span>'+esc(n)+'</span></div>';}).join('');
    return '<section class="admin-matrix-slide">'
      +'<div class="admin-matrix-grid"></div>'
      +'<div class="admin-matrix-kicker"><div>// LAPORAN ADMIN</div><div class="accent">// DATA MBR</div></div>'
      +'<h1>'+esc(data.title)+' <span>'+esc(data.period)+'</span></h1>'
      +'<div class="admin-matrix-table-wrap"><table class="admin-matrix-table"><thead><tr><th>Grup</th><th>Shift</th><th>JAM/TANGGAL</th>'+days+'<th>TOTAL</th><th>KET</th></tr></thead><tbody>'+body+'</tbody></table></div>'
      +'<div class="admin-matrix-bottom"><div class="admin-box"><h3>KET</h3><div class="admin-summary-row"><span>DRIVER</span><b>-</b></div><div class="admin-summary-row"><span>DELIVERY</span><b>'+esc(data.totals.delivery)+'</b></div><div class="admin-summary-row"><span>JEMPUTAN</span><b>'+esc(data.totals.jemputan)+'</b></div><div class="admin-summary-row strong"><span>TOTAL ANTARAN DAN JEMPUTAN</span><b>'+esc(data.totals.combined)+'</b></div><div class="admin-summary-row strong"><span>TOTAL SELURUH SURAT JALAN</span><b>'+esc(data.totals.suratJalan)+'</b></div></div>'
      +'<div class="admin-box admin-notes"><h3>CATATAN</h3>'+notes+'</div></div>'
      +'<div class="admin-matrix-footer"><span>LAPORAN ADMIN DATA MBR &nbsp; | &nbsp; AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</span><i></i><strong>// JUNI 2026</strong></div>'
      +'</section>';
  }
  return {DATA:DATA,createSlide:createSlide,renderSlide:renderSlide};
});