(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BSMITProducts=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var LONG=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
  var PAGE_SIZE=16;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(v){
    if(v==null||String(v).trim()===''||/^(belum|-|n\/a)$/i.test(String(v).trim()))return null;
    if(typeof v==='number'&&Number.isFinite(v))return v;
    var s=String(v).trim().replace(/^Rp\s*/i,'').replace(/\s/g,'');
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    var n=Number(s);if(!Number.isFinite(n))throw new Error('Nilai pendapatan tidak valid: '+v);
    return n;
  }
  function parseRows(rows){
    var header=-1,nameCol=-1,columns=[];
    rows.some(function(row,i){
      var names=row.map(function(v){return String(v||'').trim().toLowerCase();});
      var n=names.findIndex(function(v){return /^(nama produk|nama barang|produk)$/.test(v);});
      if(n<0)return false;
      columns=names.map(function(v,col){var m=LONG.indexOf(v);if(m<0)m=MONTHS.map(function(x){return x.toLowerCase();}).indexOf(v);return {col:col,month:m};}).filter(function(c){return c.month>=0;});
      if(!columns.length)return false;
      if(new Set(columns.map(function(c){return c.month;})).size!==columns.length)throw new Error('Kolom bulan duplikat. Gunakan satu kolom untuk setiap bulan.');
      header=i;nameCol=n;return true;
    });
    if(header<0)throw new Error('Header Nama Produk dan kolom Januari–Desember tidak ditemukan.');
    var products=[];
    rows.slice(header+1).forEach(function(row){
      var name=String(row[nameCol]||'').trim();
      if(!name||/^(total|grand total|nama produk)$/i.test(name))return;
      var values=Array(12).fill(null);
      columns.forEach(function(c){values[c.month]=number(row[c.col]);});
      if(values.every(function(v){return v===null;}))return;
      products.push({no:products.length+1,name:name,values:values});
    });
    if(!products.length)throw new Error('Tidak ada data produk dalam file.');
    return products;
  }
  function parseWorkbook(wb,xlsx){
    var candidates=wb.SheetNames.filter(function(n){return /analisis.*produk/i.test(n);});
    if(!candidates.length)candidates=wb.SheetNames;
    var error;
    for(var i=0;i<candidates.length;i++){
      var rows=xlsx.utils.sheet_to_json(wb.Sheets[candidates[i]],{header:1,defval:null,raw:true});
      try{return parseRows(rows);}catch(e){error=e;}
    }
    throw error||new Error('Workbook kosong.');
  }
  function createSlides(products){
    var slides=[],size=PAGE_SIZE,total=Math.ceil(products.length/size),latestMonth=-1;
    products.forEach(function(r){r.values.forEach(function(v,i){if(v!=null)latestMonth=Math.max(latestMonth,i);});});
    for(var i=0;i<products.length;i+=size)slides.push({template:'it-product',reportType:'it',department:'IT',subtitle:'Analisis Produk 2026 ('+(slides.length+1)+'/'+total+')',month:12,year:2026,groups:[],products:products.slice(i,i+size),pageNo:slides.length+1,pageTotal:total,latestMonth:latestMonth,hiddenMonths:[]});
    return slides;
  }
  function growth(previous,current){
    if(previous==null||current==null)return {label:'',status:'',tone:''};
    if(current===0)return {label:previous===0?'0%':'-100%',status:'TIDAK ADA',tone:'down'};
    if(previous===0)return {label:'Baru',status:'BARU',tone:'up'};
    var pct=(current-previous)/previous*100;
    return {label:(pct>0?'+':'')+pct.toLocaleString('id-ID',{maximumFractionDigits:1})+'%',status:pct>0?'NAIK':pct<0?'TURUN':'TETAP',tone:pct>0?'up':pct<0?'down':''};
  }
  function hiddenMonths(report){
    return (report&&Array.isArray(report.hiddenMonths)?report.hiddenMonths:[]).map(Number).filter(function(v,i,a){return Number.isInteger(v)&&v>=0&&v<12&&a.indexOf(v)===i;});
  }
  function visibleMonthIndexes(report,latest){
    var hidden=hiddenMonths(report),out=[];
    for(var i=0;i<=latest;i++)if(hidden.indexOf(i)<0)out.push(i);
    return out;
  }
  function comparisonHtml(values,monthIndex){
    if(monthIndex<=0)return '';
    var previous=values[monthIndex-1],current=values[monthIndex];
    if(previous==null||current==null)return '';
    var g=growth(previous,current);
    return '<small class="it-growth '+g.tone+'"><span class="it-vs">vs '+MONTHS[monthIndex-1]+'</span><span class="it-pct">'+esc(g.label)+'</span></small>';
  }
  function renderSlide(report,options){
    options=options||{};
    var editable=!!options.editable;
    var data=report.products||[],latest=Number.isInteger(report.latestMonth)?report.latestMonth:-1;
    if(latest<0)data.forEach(function(r){r.values.forEach(function(v,i){if(v!=null)latest=Math.max(latest,i);});});
    var visibleIndexes=latest>=0?visibleMonthIndexes(report,latest):[];
    var statusMonth=visibleIndexes.length?visibleIndexes[visibleIndexes.length-1]:-1;
    var rows=data.map(function(r,i){
      var status=statusMonth>0?growth(r.values[statusMonth-1],r.values[statusMonth]):{label:'',status:'',tone:''};
      var rowDelete=editable?'<button type="button" class="it-edit-control it-row-delete" data-it-delete-row="'+i+'" title="Hapus baris '+esc(r.name)+'" aria-label="Hapus baris '+esc(r.name)+'">×</button>':'';
      return '<tr><td class="it-no-cell">'+rowDelete+'<span>'+esc(r.no||((report.pageNo-1)*PAGE_SIZE+i+1))+'</span></td><th scope="row">'+esc(r.name)+'</th>'+visibleIndexes.map(function(monthIndex){var v=r.values[monthIndex];return '<td title="'+esc(v==null?'':'Rp'+v.toLocaleString('id-ID'))+'">'+(v==null?'':'<span class="it-value">'+v.toLocaleString('id-ID',{maximumFractionDigits:0})+'</span>'+comparisonHtml(r.values,monthIndex))+'</td>';}).join('')+'<td class="it-status '+status.tone+'">'+esc(status.status)+'</td></tr>';
    }).join('');
    var period=statusMonth>=0?'Januari–'+MONTHS[statusMonth]:'Januari';
    var monthHeaders=visibleIndexes.map(function(monthIndex){
      var del=editable?'<button type="button" class="it-edit-control it-col-delete" data-it-delete-col="'+monthIndex+'" title="Hapus kolom '+MONTHS[monthIndex]+'" aria-label="Hapus kolom '+MONTHS[monthIndex]+'">×</button>':'';
      return '<th><span class="it-col-head">'+MONTHS[monthIndex]+del+'</span></th>';
    }).join('');
    return '<section class="it-product-slide it-products-full"><div class="omset-kicker">LAPORAN IT <span>2026 / '+(report.pageNo||1)+' dari '+(report.pageTotal||1)+'</span></div><h1>Analisis Produk <span>2026</span></h1><p>'+period+' · Rupiah · Perbandingan bulan ke bulan</p><table class="it-products-table"><thead><tr><th>No</th><th>Nama Produk</th>'+monthHeaders+'<th>Status '+(statusMonth>=0?MONTHS[statusMonth]:'')+'</th></tr></thead><tbody>'+rows+'</tbody></table></section>';
  }
  return {MONTHS:MONTHS,parseRows:parseRows,parseWorkbook:parseWorkbook,createSlides:createSlides,renderSlide:renderSlide,growth:growth,visibleMonthIndexes:visibleMonthIndexes};
});
