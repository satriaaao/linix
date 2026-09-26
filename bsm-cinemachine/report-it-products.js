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

  function detectMonthYear(text){
    var raw=String(text||'').toLowerCase(),month=-1,year=null;
    for(var i=0;i<LONG.length;i++){
      var longName=LONG[i],shortName=MONTHS[i].toLowerCase();
      if(new RegExp('(?:^|[^a-z])'+longName+'(?:[^a-z]|$)','i').test(raw)||new RegExp('(?:^|[^a-z])'+shortName+'(?:[^a-z]|$)','i').test(raw)){month=i;break;}
    }
    var y=raw.match(/(?:^|\D)(20\d{2})(?:\D|$)/);
    if(y)year=Number(y[1]);
    return {monthIndex:month,year:year};
  }
  function normalizeProductName(value){
    var s=String(value==null?'':value).trim().toLowerCase();
    try{s=s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');}catch(_){}
    return s
      .replace(/[“”„‟"']/g,'')
      .replace(/&/g,' and ')
      .replace(/\bmirror\s*less\b/g,'mirrorless')
      .replace(/\bfull\s*[- ]?frame\b/g,'fullframe')
      .replace(/[^a-z0-9]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function modelTokens(name){
    return normalizeProductName(name).split(' ').filter(function(t){return /\d/.test(t);}).sort();
  }
  function tokenSimilarity(a,b){
    a=normalizeProductName(a);b=normalizeProductName(b);
    if(!a||!b)return 0;
    if(a===b)return 1;
    var ma=modelTokens(a).join('|'),mb=modelTokens(b).join('|');
    if(ma&&mb&&ma!==mb)return 0;
    var aa=a.split(' '),bb=b.split(' '),used={},hit=0;
    aa.forEach(function(t){
      for(var i=0;i<bb.length;i++){
        if(!used[i]&&bb[i]===t){used[i]=true;hit++;break;}
      }
    });
    var dice=(2*hit)/(aa.length+bb.length);
    if((a.indexOf(b)>=0||b.indexOf(a)>=0)&&Math.min(a.length,b.length)/Math.max(a.length,b.length)>=.82)dice=Math.max(dice,.94);
    return dice;
  }
  function parseMonthlyRows(rows,context){
    var header=-1,nameCol=-1,totalCol=-1;
    for(var i=0;i<Math.min(rows.length,30);i++){
      var names=(rows[i]||[]).map(function(v){return String(v||'').trim().toLowerCase();});
      var n=names.findIndex(function(v){return /^(nama produk|nama barang|produk|item)$/.test(v);});
      var t=names.findIndex(function(v){return /^(total pembayaran|total pendapatan|pendapatan|omset|total omset|revenue|nilai|total)$/.test(v);});
      if(n>=0&&t>=0){header=i;nameCol=n;totalCol=t;break;}
    }
    if(header<0)throw new Error('Format Top Product bulanan tidak ditemukan. Gunakan kolom Nama Produk dan Total Pembayaran.');
    var products=[];
    rows.slice(header+1).forEach(function(row){
      var name=String(row&&row[nameCol]||'').trim();
      if(!name||/^(total|grand total|nama produk)$/i.test(name))return;
      var value=number(row&&row[totalCol]);
      if(value==null)return;
      products.push({name:name,value:value});
    });
    if(!products.length)throw new Error('Tidak ada nilai produk bulanan yang dapat dibaca.');
    var period=detectMonthYear(context||'');
    return {monthIndex:period.monthIndex,year:period.year,products:products};
  }
  function parseMonthlyWorkbook(wb,xlsx,options){
    options=options||{};var errors=[];
    for(var i=0;i<wb.SheetNames.length;i++){
      var name=wb.SheetNames[i],rows=xlsx.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:null,raw:true});
      try{
        var parsed=parseMonthlyRows(rows,String(options.fileName||'')+' '+name);
        if(parsed.monthIndex<0&&Number.isInteger(options.monthIndex))parsed.monthIndex=options.monthIndex;
        if(!parsed.year&&options.year)parsed.year=Number(options.year);
        if(parsed.monthIndex<0)throw new Error('Bulan file tidak terbaca dari nama file/sheet.');
        parsed.sheetName=name;
        return parsed;
      }catch(e){errors.push(e);}
    }
    throw errors[errors.length-1]||new Error('Workbook Top Product kosong.');
  }
  function mergeMonthlyProducts(existing,monthly,monthIndex,options){
    options=options||{};
    if(!Number.isInteger(monthIndex)||monthIndex<0||monthIndex>11)throw new Error('Bulan update produk tidak valid.');
    var base=(existing||[]).map(function(p){
      var values=Array.isArray(p.values)?p.values.slice(0,12):[];
      while(values.length<12)values.push(null);
      var growthOverrides=p&&p.growthOverrides&&typeof p.growthOverrides==='object'?Object.assign({},p.growthOverrides):{};
      return {no:p.no,name:String(p.name||'').trim(),values:values,growthOverrides:growthOverrides};
    }).filter(function(p){return p.name;});
    base.forEach(function(p){p.values[monthIndex]=0;});
    var exact={};
    base.forEach(function(p,i){var k=normalizeProductName(p.name);if(k&&!exact[k])exact[k]=i;});
    var matched=0,added=0,fuzzy=0;
    (monthly||[]).forEach(function(item){
      var incoming=String(item&&item.name||'').trim();if(!incoming)return;
      var value=number(item.value);if(value==null)value=0;
      var key=normalizeProductName(incoming),idx=exact[key];
      if(idx==null){
        var best=-1,bestScore=0,second=0;
        for(var j=0;j<base.length;j++){
          var score=tokenSimilarity(incoming,base[j].name);
          if(score>bestScore){second=bestScore;bestScore=score;best=j;}
          else if(score>second)second=score;
        }
        if(bestScore>=.92&&bestScore-second>=.025){idx=best;fuzzy++;}
      }
      if(idx!=null){
        base[idx].values[monthIndex]=value;matched++;
      }else{
        var values=Array(12).fill(null);
        for(var m=0;m<monthIndex;m++)values[m]=0;
        values[monthIndex]=value;
        base.push({no:0,name:incoming,values:values,growthOverrides:{}});
        exact[key]=base.length-1;added++;
      }
    });
    if(options.sort!==false){
      base.sort(function(a,b){
        var av=Number(a.values[monthIndex]||0),bv=Number(b.values[monthIndex]||0);
        if(bv!==av)return bv-av;
        return a.name.localeCompare(b.name,'id',{sensitivity:'base'});
      });
    }
    base.forEach(function(p,i){p.no=i+1;p.statusSortBase=i;});
    var zeroed=base.filter(function(p){return Number(p.values[monthIndex]||0)===0;}).length;
    return {products:base,matched:matched,added:added,fuzzyMatched:fuzzy,zeroed:zeroed,monthIndex:monthIndex};
  }
  function createSlides(products){
    products=Array.isArray(products)?products:[];
    var slides=[],size=PAGE_SIZE,total=Math.ceil(products.length/size),latestMonth=-1;
    products.forEach(function(r,i){
      r.no=i+1;
      if(!Number.isFinite(Number(r.statusSortBase)))r.statusSortBase=i;
      if(!Array.isArray(r.values))r.values=[];
      while(r.values.length<12)r.values.push(null);
      if(!r.growthOverrides||typeof r.growthOverrides!=='object'||Array.isArray(r.growthOverrides))r.growthOverrides={};
      r.values.forEach(function(v,m){if(v!=null)latestMonth=Math.max(latestMonth,m);});
    });
    for(var i=0;i<products.length;i+=size)slides.push({template:'it-product',reportType:'it',department:'IT',subtitle:'Analisis Produk 2026 ('+(slides.length+1)+'/'+total+')',month:12,year:2026,groups:[],products:products.slice(i,i+size),pageNo:slides.length+1,pageTotal:total,latestMonth:latestMonth,hiddenMonths:[]});
    return slides;
  }
  function growthOverride(row,monthIndex){
    if(!row||!row.growthOverrides||!Object.prototype.hasOwnProperty.call(row.growthOverrides,String(monthIndex))&&!Object.prototype.hasOwnProperty.call(row.growthOverrides,monthIndex))return null;
    var raw=row.growthOverrides[monthIndex];
    var value=Number(raw);
    return Number.isFinite(value)?value:null;
  }
  function growth(previous,current,override){
    if(override!=null&&Number.isFinite(Number(override))){
      var manual=Number(override);
      return {label:(manual>0?'+':'')+manual.toLocaleString('id-ID',{maximumFractionDigits:1})+'%',status:manual>0?'NAIK':manual<0?'TURUN':'',tone:manual>0?'up':manual<0?'down':'',manual:true,value:manual};
    }
    if(previous==null||current==null)return {label:'',status:'',tone:'',manual:false,value:null};
    if(current===0){
      if(previous===0)return {label:'0%',status:'',tone:'',manual:false,value:0};
      return {label:'-100%',status:'TIDAK ADA',tone:'down',manual:false,value:-100};
    }
    if(previous===0)return {label:'—',status:'NAIK',tone:'up',manual:false,value:null};
    var pct=(current-previous)/previous*100;
    return {label:(pct>0?'+':'')+pct.toLocaleString('id-ID',{maximumFractionDigits:1})+'%',status:pct>0?'NAIK':pct<0?'TURUN':'',tone:pct>0?'up':pct<0?'down':'',manual:false,value:pct};
  }
  function statusForRow(row,monthIndex){
    if(!row||monthIndex<=0)return '';
    var values=Array.isArray(row.values)?row.values:[];
    return growth(values[monthIndex-1],values[monthIndex],growthOverride(row,monthIndex)).status||'';
  }
  function sortProductsByStatus(products,monthIndex,direction){
    direction=direction==='asc'||direction==='desc'?direction:'none';
    var list=Array.isArray(products)?products:[];
    list.forEach(function(p,i){if(!Number.isFinite(Number(p.statusSortBase)))p.statusSortBase=i;});
    if(direction==='none'){
      list.sort(function(a,b){return Number(a.statusSortBase||0)-Number(b.statusSortBase||0);});
    }else{
      list.sort(function(a,b){
        var av=statusForRow(a,monthIndex),bv=statusForRow(b,monthIndex);
        var cmp=av.localeCompare(bv,'id',{sensitivity:'base'});
        if(cmp===0)cmp=Number(a.statusSortBase||0)-Number(b.statusSortBase||0);
        return direction==='asc'?cmp:-cmp;
      });
    }
    list.forEach(function(p,i){p.no=i+1;});
    return list;
  }
  function hiddenMonths(report){
    return (report&&Array.isArray(report.hiddenMonths)?report.hiddenMonths:[]).map(Number).filter(function(v,i,a){return Number.isInteger(v)&&v>=0&&v<12&&a.indexOf(v)===i;});
  }
  function visibleMonthIndexes(report,latest){
    var hidden=hiddenMonths(report),out=[];
    for(var i=0;i<=latest;i++)if(hidden.indexOf(i)<0)out.push(i);
    return out;
  }
  function comparisonHtml(row,monthIndex,editable,rowIndex){
    if(monthIndex<=0)return '';
    var values=Array.isArray(row&&row.values)?row.values:[];
    var previous=values[monthIndex-1],current=values[monthIndex];
    if(previous==null||current==null)return '';
    var override=growthOverride(row,monthIndex),g=growth(previous,current,override);
    var editableAttrs=editable?' contenteditable="true" spellcheck="false" data-it-growth-edit-row="'+rowIndex+'" data-it-growth-edit-month="'+monthIndex+'" title="Edit persen manual. Kosongkan lalu Enter untuk kembali otomatis."':'';
    var classes='it-pct'+(editable?' it-pct-editable':'')+(g.manual?' it-pct-manual':'');
    return '<small class="it-growth '+g.tone+'"><span class="it-vs">vs '+MONTHS[monthIndex-1]+'</span><span class="'+classes+'"'+editableAttrs+'>'+esc(g.label)+'</span></small>';
  }
  function renderSlide(report,options){
    options=options||{};
    var editable=!!options.editable;
    var data=report.products||[],latest=Number.isInteger(report.latestMonth)?report.latestMonth:-1;
    if(latest<0)data.forEach(function(r){(r.values||[]).forEach(function(v,i){if(v!=null)latest=Math.max(latest,i);});});
    var visibleIndexes=latest>=0?visibleMonthIndexes(report,latest):[];
    var statusMonth=visibleIndexes.length?visibleIndexes[visibleIndexes.length-1]:-1;
    var pageNo=Math.max(1,Number(report.pageNo||1));
    var rows=data.map(function(r,i){
      var status=statusMonth>0?growth((r.values||[])[statusMonth-1],(r.values||[])[statusMonth],growthOverride(r,statusMonth)):{label:'',status:'',tone:''};
      var rowDelete=editable?'<button type="button" class="it-edit-control it-row-delete" data-it-delete-row="'+i+'" title="Hapus baris '+esc(r.name)+'" aria-label="Hapus baris '+esc(r.name)+'">×</button>':'';
      var displayNo=(pageNo-1)*PAGE_SIZE+i+1;
      return '<tr><td class="it-no-cell">'+rowDelete+'<span>'+displayNo+'</span></td><th scope="row">'+esc(r.name)+'</th>'+visibleIndexes.map(function(monthIndex){
        var v=(r.values||[])[monthIndex];
        return '<td title="'+esc(v==null?'':'Rp'+v.toLocaleString('id-ID'))+'">'+(v==null?'':'<span class="it-value">'+v.toLocaleString('id-ID',{maximumFractionDigits:0})+'</span>'+comparisonHtml(r,monthIndex,editable,i))+'</td>';
      }).join('')+'<td class="it-status '+status.tone+'">'+esc(status.status)+'</td></tr>';
    }).join('');
    var period=statusMonth>=0?'Januari–'+MONTHS[statusMonth]:'Januari';
    var monthHeaders=visibleIndexes.map(function(monthIndex){
      var del=editable?'<button type="button" class="it-edit-control it-col-delete" data-it-delete-col="'+monthIndex+'" title="Hapus kolom '+MONTHS[monthIndex]+'" aria-label="Hapus kolom '+MONTHS[monthIndex]+'">×</button>':'';
      return '<th><span class="it-col-head">'+MONTHS[monthIndex]+del+'</span></th>';
    }).join('');
    var statusSort=report.statusSort==='asc'||report.statusSort==='desc'?report.statusSort:'none';
    var sortIcon=statusSort==='asc'?'↑':(statusSort==='desc'?'↓':'↑↓');
    var sortTitle=statusSort==='asc'?'Ascending — kecil ke besar / A–Z':(statusSort==='desc'?'Descending — besar ke kecil / Z–A':'Belum dipilih arah sorting');
    var statusSortButton=editable?'<button type="button" class="it-status-sort" data-it-status-sort="'+statusSort+'" title="'+sortTitle+'" aria-label="Sorting Status: '+sortTitle+'">'+sortIcon+'</button>':'';
    var statusHead='<span class="it-status-head"><span>Status '+(statusMonth>=0?MONTHS[statusMonth]:'')+'</span>'+statusSortButton+'</span>';
    return '<section class="it-product-slide it-products-full"><div class="omset-kicker">LAPORAN IT <span>2026 / '+pageNo+' dari '+(report.pageTotal||1)+'</span></div><h1>Analisis Produk <span>2026</span></h1><p>'+period+' · Rupiah · Perbandingan bulan ke bulan</p><table class="it-products-table"><thead><tr><th>No</th><th>Nama Produk</th>'+monthHeaders+'<th>'+statusHead+'</th></tr></thead><tbody>'+rows+'</tbody></table></section>';
  }
  return {MONTHS:MONTHS,parseRows:parseRows,parseWorkbook:parseWorkbook,parseMonthlyRows:parseMonthlyRows,parseMonthlyWorkbook:parseMonthlyWorkbook,mergeMonthlyProducts:mergeMonthlyProducts,normalizeProductName:normalizeProductName,detectMonthYear:detectMonthYear,createSlides:createSlides,renderSlide:renderSlide,growth:growth,statusForRow:statusForRow,sortProductsByStatus:sortProductsByStatus,visibleMonthIndexes:visibleMonthIndexes};
});
