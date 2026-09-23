(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMCinemaReports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function clean(v){return String(v==null?'':v).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();}
  function upper(v){return clean(v).toUpperCase();}
  function num(v){var n=Number(clean(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function excelDate(v){
    if(typeof v==='number'&&v>30000&&v<70000){
      var d=new Date(Date.UTC(1899,11,30)+Math.round(v*86400000));
      return String(d.getUTCDate()).padStart(2,'0')+'/'+String(d.getUTCMonth()+1).padStart(2,'0')+'/'+d.getUTCFullYear();
    }
    return clean(v);
  }
  function escDefault(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function isServiceHeader(r){
    var s=upper((r||[]).join(' | '));
    return upper((r||[])[0])==='NO'&&s.indexOf('NAMA BARANG')>=0&&s.indexOf('QTY')>=0&&(s.indexOf('KERUSAKAN')>=0||s.indexOf('TROUBLE')>=0);
  }
  function previousCenter(rows,hi,current){
    for(var i=hi-1;i>=0;i--){
      var vals=(rows[i]||[]).filter(function(x){return clean(x)!=='';});
      if(!vals.length) continue;
      var s=clean(vals.join(' '));
      if(/^MBR ALAT-ALAT YANG DI SERVICE/i.test(s)) return current||'SERVICE';
      if(isServiceHeader(rows[i])) return current||'SERVICE';
      if(/^\d+$/.test(clean(vals[0]))) return current||'SERVICE';
      return clean(vals[0]);
    }
    return current||'SERVICE';
  }
  function parseServiceRows(rows){
    rows=rows||[];var centers=[],map={},current='';
    function center(name){var key=upper(name);if(!map[key]){map[key]={name:name,rows:[]};centers.push(map[key]);}return map[key];}
    for(var i=0;i<rows.length;i++){
      if(!isServiceHeader(rows[i])) continue;
      current=previousCenter(rows,i,current);
      var c=center(current),j=i+1;
      while(j<rows.length&&!isServiceHeader(rows[j])){
        var r=rows[j]||[];
        if(clean(r[0])&&!/^\d+$/.test(clean(r[0]))&&j+1<rows.length&&isServiceHeader(rows[j+1])) break;
        var numeric=/^\d+$/.test(clean(r[0]));
        var continuation=!clean(r[0])&&clean(r[1])&&clean(r[2]);
        if(numeric||continuation){
          c.rows.push({no:numeric?num(r[0]):'',date:excelDate(r[1]),item:clean(r[2]),damage:clean(r[3]),qty:clean(r[4]),sn1:clean(r[5]),sn2:clean(r[6]),takenDate:excelDate(r[7]),note:clean(r[8])});
        }
        j++;
      }
      i=j-1;
    }
    return centers.filter(function(x){return x.rows.length;});
  }
  function parseVendorRows(rows){
    rows=rows||[];var groups=[],buf=[];
    function finish(total){
      if(!buf.length)return;
      groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0))});
      buf=[];
    }
    rows.forEach(function(r){
      var name=clean(r[3]);
      if(/^TOTAL$/i.test(name)){finish(r[4]);return;}
      if(!name||/Report Barang Kurang/i.test(name)||upper(r[0])==='NO') return;
      if(clean(r[1])||clean(r[4])) buf.push({date:excelDate(r[1]),duration:clean(r[2]),item:name,qty:clean(r[4]),action:clean(r[5])});
    });
    finish('');
    return groups;
  }
  function parseComplaintRows(rows){
    rows=rows||[];var out=[];
    rows.forEach(function(r){
      if(!/^\d+$/.test(clean(r[7]))) return;
      out.push({no:num(r[7]),date:excelDate(r[8]),indication:clean(r[9]),item:clean(r[10]),qty:clean(r[11]),chronology:clean(r[12]),action:clean(r[13]),cost:clean(r[14]),pic:clean(r[15]),client:clean(r[16])});
    });
    return out;
  }
  function parseWorkbookRows(serviceRows,monthRows){return {serviceCenters:parseServiceRows(serviceRows||[]),vendorGroups:parseVendorRows(monthRows||[]),complaints:parseComplaintRows(monthRows||[])};}
  function parseWorkbook(workbook){
    if(!workbook||!root||!root.XLSX) throw new Error('Workbook Cinema belum bisa dibaca.');
    var sheets=workbook.SheetNames.map(function(name){return {name:name,rows:root.XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:true})};});
    var service=sheets.find(function(s){return /SERVICE/i.test(s.name);})||sheets[0];
    var month=sheets.find(function(s){return /Bulan|Juni/i.test(s.name);})||sheets[1]||sheets[0];
    return parseWorkbookRows(service.rows,month.rows);
  }
  function paginateGroups(groups,maxRows){
    maxRows=Math.max(4,Number(maxRows||16));var pages=[],page=[],used=0;
    function flush(){if(page.length){pages.push(page);page=[];used=0;}}
    (groups||[]).forEach(function(g){
      var cost=(g.rows||[]).length+1;
      if(cost<=maxRows){if(used+cost>maxRows)flush();page.push(clone(g));used+=cost;return;}
      if(used)flush();var chunk=maxRows-1;
      for(var i=0;i<g.rows.length;i+=chunk){var x=clone(g);x.rows=g.rows.slice(i,i+chunk);x.continued=i>0;x.showTotal=i+chunk>=g.rows.length;page.push(x);flush();}
    });flush();return pages.length?pages:[[]];
  }
  function createSlides(parsed,opts){
    parsed=parsed||{};opts=opts||{};var slides=[];
    var vp=paginateGroups(parsed.vendorGroups||[],opts.maxVendorRows||16);
    vp.forEach(function(gs,i){if(gs.length)slides.push({template:'cinema-vendor',reportType:'gudang-cinema',department:'CINEMA',groups:[],cinemaVendorGroups:gs,pageNo:i+1,pageTotal:vp.length,period:opts.period||'JUNI 2026'});});
    var maxC=Math.max(5,Number(opts.maxComplaintRows||18)),compl=parsed.complaints||[];
    for(var c=0;c<compl.length;c+=maxC) slides.push({template:'cinema-complaint',reportType:'gudang-cinema',department:'CINEMA',groups:[],cinemaComplaints:compl.slice(c,c+maxC),pageNo:Math.floor(c/maxC)+1,pageTotal:Math.max(1,Math.ceil(compl.length/maxC)),period:opts.period||'JUNI 2026'});
    (parsed.serviceCenters||[]).forEach(function(center){
      var max=Math.max(5,Number(opts.maxServiceRows||18)),total=Math.max(1,Math.ceil(center.rows.length/max));
      for(var i=0;i<center.rows.length;i+=max) slides.push({template:'cinema-service',reportType:'gudang-cinema',department:'CINEMA',groups:[],serviceCenter:center.name,cinemaServiceRows:center.rows.slice(i,i+max),pageNo:Math.floor(i/max)+1,pageTotal:total,period:opts.servicePeriod||'2026'});
    });
    return slides;
  }
  function footer(period){return '<div class="cinema-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// '+period+'</b></div>';}
  function renderVendorSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var no=0,rows='';
    (slide.cinemaVendorGroups||[]).forEach(function(g){no++;(g.rows||[]).forEach(function(r,i){rows+='<tr>'+(i===0?'<td class="cin-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false?0:1))+'">'+no+'</td>':'')+'<td>'+esc(r.date)+'</td><td>'+esc(r.duration)+'</td><td>'+esc(r.item)+'</td><td class="cin-qty">'+esc(r.qty)+'</td><td>'+esc(r.action||'-')+'</td></tr>';});if(g.showTotal!==false)rows+='<tr class="cin-total"><td colspan="3">TOTAL '+esc(g.name)+'</td><td>'+esc(g.total)+'</td><td></td></tr>';});
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="cinema-vendor-slide"><div class="cin-grid"></div><div class="cin-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT CINEMA</div></div><h1>REPORT BARANG KURANG / <span>AMBIL VENDOR</span>'+suffix+'</h1><div class="cin-wrap"><table class="cin-vendor-table"><thead><tr><th>NO</th><th>TGL PENYEWAAN</th><th>DURASI SEWA</th><th>NAMA ALAT</th><th>QTY</th><th>ACTION / VENDOR</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function indClass(v){var s=upper(v);return s.indexOf('TROUBLE')>=0?'trouble':(s.indexOf('KELALAIAN')>=0?'warning':'neutral');}
  function renderComplaintSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var rows=(slide.cinemaComplaints||[]).map(function(r){return '<tr><td class="cin-no">'+esc(r.no)+'</td><td>'+esc(r.date)+'</td><td class="cin-ind '+indClass(r.indication)+'">'+esc(r.indication||'-')+'</td><td>'+esc(r.item)+'</td><td class="cin-qty">'+esc(r.qty)+'</td><td>'+esc(r.chronology||'-')+'</td><td>'+esc(r.action||'-')+'</td><td>'+esc(r.cost||'-')+'</td><td>'+esc(r.pic||'-')+'</td><td>'+esc(r.client||'-')+'</td></tr>';}).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="cinema-complaint-slide"><div class="cin-grid"></div><div class="cin-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT CINEMA</div></div><h1>REPORT BARANG BERMASALAH / <span>KOMPLAIN</span>'+suffix+'</h1><div class="cin-wrap"><table class="cin-complaint-table"><thead><tr><th>NO</th><th>TGL</th><th>INDIKASI</th><th>NAMA ALAT</th><th>QTY</th><th>KRONOLOGIS</th><th>ACTION</th><th>BIAYA</th><th>PIC</th><th>NAMA CLIENT</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function renderServiceSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var rows=(slide.cinemaServiceRows||[]).map(function(r,i){return '<tr><td class="cin-no">'+esc(r.no||i+1)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.item)+'</td><td>'+esc(r.damage||'-')+'</td><td class="cin-qty">'+esc(r.qty)+'</td><td>'+esc(r.sn1||'-')+'</td><td>'+esc(r.sn2||'-')+'</td><td>'+esc(r.takenDate||'-')+'</td><td>'+esc(r.note||'-')+'</td></tr>';}).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="cinema-service-slide"><div class="cin-grid"></div><div class="cin-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT CINEMA</div></div><h1>ALAT-ALAT YANG DI <span>SERVICE</span></h1><h2>'+esc(slide.serviceCenter||'SERVICE CENTER')+suffix+'</h2><div class="cin-wrap"><table class="cin-service-table"><thead><tr><th>NO</th><th>TANGGAL</th><th>NAMA BARANG</th><th>KERUSAKAN</th><th>QTY</th><th>SN 1</th><th>SN 2 / CASE ID</th><th>SUDAH DIAMBIL/TGL</th><th>KETERANGAN</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'2026')+'</section>';
  }
  return {parseServiceRows:parseServiceRows,parseVendorRows:parseVendorRows,parseComplaintRows:parseComplaintRows,parseWorkbookRows:parseWorkbookRows,parseWorkbook:parseWorkbook,createSlides:createSlides,renderVendorSlide:renderVendorSlide,renderComplaintSlide:renderComplaintSlide,renderServiceSlide:renderServiceSlide};
});