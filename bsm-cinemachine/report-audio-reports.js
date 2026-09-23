(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMAudioReports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function clean(v){return String(v==null?'':v).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();}
  function upper(v){return clean(v).toUpperCase();}
  function num(v){var n=Number(clean(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function qtyText(v){var s=clean(v);return s||'';}
  function escDefault(v){
    return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function excelDate(v){
    if(typeof v==='number'&&v>30000&&v<60000){
      var d=new Date(Date.UTC(1899,11,30)+Math.round(v*86400000));
      var dd=String(d.getUTCDate()).padStart(2,'0'),mm=String(d.getUTCMonth()+1).padStart(2,'0');
      return dd+'/'+mm+'/'+d.getUTCFullYear();
    }
    return clean(v);
  }
  function rowNonEmpty(row){return (row||[]).some(function(x){return clean(x)!=='';});}
  function isHeader(row,words){
    var text=upper((row||[]).join(' | '));
    return words.every(function(w){return text.indexOf(upper(w))>=0;});
  }
  function findRow(rows,pattern,start){
    for(var i=start||0;i<rows.length;i++){
      if(pattern.test(clean((rows[i]||[])[0]))) return i;
    }
    return -1;
  }
  function parseServiceRows(rows){
    rows=rows||[];
    var centers=[];
    for(var i=0;i<rows.length-1;i++){
      var first=clean((rows[i]||[])[0]),next=rows[i+1]||[];
      if(!first||upper(next[0])!=='NO'||!isHeader(next,['NAMA BARANG','QTY','SERIAL NUMBER'])) continue;
      if(/^(MBR|ALAT-ALAT YANG DI SERVICE)$/i.test(first)) continue;
      var center={name:first,rows:[]},j=i+2;
      while(j<rows.length){
        var r=rows[j]||[];
        var candidate=clean(r[0]),nxt=rows[j+1]||[];
        if(candidate&&upper(nxt[0])==='NO'&&isHeader(nxt,['NAMA BARANG','QTY','SERIAL NUMBER'])) break;
        if(/^\d+$/.test(clean(r[0]))){
          center.rows.push({
            no:num(r[0]),date:excelDate(r[1]),item:clean(r[2]),damage:clean(r[3]),qty:qtyText(r[4]),
            sn:clean(r[5]),caseId:clean(r[6]),takenDate:excelDate(r[7]),note:clean(r[8]),receipt:clean(r[9])
          });
        }
        j++;
      }
      if(center.rows.length) centers.push(center);
      i=j-1;
    }
    return centers;
  }
  function parseVendorRows(rows){
    rows=rows||[];
    var title=findRow(rows,/Report Barang Kurang\s*\/\s*Ambil Vendor/i,0);
    if(title<0) return [];
    var hi=-1;
    for(var i=title+1;i<rows.length;i++){if(isHeader(rows[i],['TGL','Nama Alat','QTY'])){hi=i;break;}}
    if(hi<0) return [];
    var groups=[],buf=[];
    function finish(total){
      if(!buf.length) return;
      groups.push({name:clean(buf[0].item),rows:buf,total:qtyText(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0))+' unit'});
      buf=[];
    }
    for(var j=hi+1;j<rows.length;j++){
      var r=rows[j]||[];
      if(/Report Barang Bermasalah\s*\/\s*Komplain/i.test(clean(r[0]))) break;
      var name=clean(r[3]);
      if(!name) continue;
      if(/^total$/i.test(name)){finish(r[4]);continue;}
      buf.push({date:excelDate(r[1]),duration:clean(r[2]),item:name,qty:qtyText(r[4]),upgrade:clean(r[5]),vendor:clean(r[6]),price:clean(r[7])});
    }
    finish('');
    return groups;
  }
  function parseComplaintRows(rows){
    rows=rows||[];
    var title=findRow(rows,/Report Barang Bermasalah\s*\/\s*Komplain/i,0);
    if(title<0) return [];
    var hi=-1;
    for(var i=title+1;i<rows.length;i++){if(isHeader(rows[i],['Indikasi','Nama Alat','QTY','Kronologis'])){hi=i;break;}}
    if(hi<0) return [];
    var groups=[],buf=[];
    function finish(total){
      if(!buf.length) return;
      groups.push({name:clean(buf[0].item),rows:buf,total:qtyText(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0))+' unit'});
      buf=[];
    }
    for(var j=hi+1;j<rows.length;j++){
      var r=rows[j]||[],name=clean(r[3]);
      if(!name) continue;
      if(/^total$/i.test(name)){finish(r[4]);continue;}
      buf.push({
        date:excelDate(r[1]),indication:clean(r[2]),item:name,qty:qtyText(r[4]),chronology:clean(r[5]),
        action:clean(r[6]),pic:clean(r[7]),client:clean(r[8])
      });
    }
    finish('');
    return groups;
  }
  function parseWorkbookRows(serviceRows,sheet2Rows){
    return {serviceCenters:parseServiceRows(serviceRows||[]),vendorGroups:parseVendorRows(sheet2Rows||[]),complaintGroups:parseComplaintRows(sheet2Rows||[])};
  }
  function parseWorkbook(workbook){
    if(!workbook||!workbook.SheetNames||!workbook.Sheets||!root.XLSX) throw new Error('Workbook Audio belum bisa dibaca.');
    var sheets=workbook.SheetNames.map(function(name){return {name:name,rows:root.XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:true})};});
    var service=sheets.find(function(s){return /service/i.test(s.name)||s.rows.some(function(r){return /MBR ALAT-ALAT YANG DI SERVICE GUDANG AUDIO/i.test(clean(r[0]));});});
    var other=sheets.find(function(s){return s!==service&&s.rows.some(function(r){return /Report Barang Kurang|Report Barang Bermasalah/i.test(clean(r[0]));});});
    if(!service) service=sheets[0];
    if(!other) other=sheets[1]||sheets[0];
    return parseWorkbookRows(service?service.rows:[],other?other.rows:[]);
  }
  function paginateGroups(groups,maxRows){
    maxRows=Math.max(4,Number(maxRows||16));
    var pages=[],page=[],used=0;
    function flush(){if(page.length){pages.push(page);page=[];used=0;}}
    (groups||[]).forEach(function(group){
      var cost=(group.rows||[]).length+1;
      if(cost<=maxRows){
        if(used+cost>maxRows) flush();
        page.push(clone(group));used+=cost;return;
      }
      if(used) flush();
      var chunkSize=maxRows-1;
      for(var i=0;i<group.rows.length;i+=chunkSize){
        var g=clone(group);g.rows=group.rows.slice(i,i+chunkSize);g.continued=i>0;g.showTotal=i+chunkSize>=group.rows.length;
        page.push(g);flush();
      }
    });
    flush();
    return pages.length?pages:[[]];
  }
  function createSlides(parsed,opts){
    parsed=parsed||{};opts=opts||{};
    var slides=[];
    var vp=paginateGroups(parsed.vendorGroups||[],opts.maxVendorRows||16);
    vp.forEach(function(groups,i){if(groups.length) slides.push({template:'audio-vendor',reportType:'gudang-audio',department:'AUDIO',groups:[],audioVendorGroups:groups,pageNo:i+1,pageTotal:vp.length,period:opts.period||'JUNI 2026'});});
    var cp=paginateGroups(parsed.complaintGroups||[],opts.maxComplaintRows||16);
    cp.forEach(function(groups,i){if(groups.length) slides.push({template:'audio-complaint',reportType:'gudang-audio',department:'AUDIO',groups:[],audioComplaintGroups:groups,pageNo:i+1,pageTotal:cp.length,period:opts.period||'JUNI 2026'});});
    (parsed.serviceCenters||[]).forEach(function(center){
      var rows=center.rows||[],max=Math.max(5,Number(opts.maxServiceRows||18)),total=Math.max(1,Math.ceil(rows.length/max));
      for(var i=0;i<rows.length;i+=max){
        slides.push({template:'audio-service',reportType:'gudang-audio',department:'AUDIO',groups:[],serviceCenter:center.name,audioServiceRows:rows.slice(i,i+max),pageNo:Math.floor(i/max)+1,pageTotal:total,period:opts.servicePeriod||'2026'});
      }
    });
    return slides;
  }
  function groupRows(groups,renderer){
    var html='',no=0;
    (groups||[]).forEach(function(g){
      no++;
      html+=renderer(g,no);
    });
    return html;
  }
  function footer(period){
    return '<div class="audio-report-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// '+period+'</b></div>';
  }
  function renderVendorSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};
    var rows=groupRows(slide.audioVendorGroups,function(g,no){
      var out='';
      (g.rows||[]).forEach(function(r,i){
        out+='<tr>'+(i===0?'<td class="audio-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false?0:1))+'"><b>'+no+'</b></td>':'')
          +'<td>'+esc(r.date)+'</td><td>'+esc(r.duration)+'</td><td>'+esc(r.item)+'</td><td class="audio-qty">'+esc(r.qty)+'</td><td>'+esc(r.upgrade||'-')+'</td><td>'+esc(r.vendor||'-')+'</td><td class="audio-price">'+esc(r.price||'-')+'</td></tr>';
      });
      if(g.showTotal!==false) out+='<tr class="audio-total-row"><td colspan="3">Total '+esc(g.name)+'</td><td>'+esc(g.total)+'</td><td colspan="3"></td></tr>';
      return out;
    });
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="audio-vendor-slide"><div class="audio-report-grid"></div><div class="audio-report-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT AUDIO</div></div><h1>REPORT BARANG KURANG / <span>AMBIL VENDOR</span>'+suffix+'</h1>'
      +'<div class="audio-table-wrap"><table class="audio-vendor-table"><colgroup><col class="av-no"><col class="av-date"><col class="av-duration"><col class="av-item"><col class="av-qty"><col class="av-upgrade"><col class="av-vendor"><col class="av-price"></colgroup><thead><tr><th>NO</th><th>TGL PENYEWAAN</th><th>DURASI SEWA</th><th>NAMA ALAT</th><th>QTY</th><th>UPGRADE</th><th>VENDOR</th><th>HARGA SEWA VENDOR</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function indicationClass(v){
    var s=upper(v);if(s.indexOf('TROUBLE')>=0) return 'trouble';if(s.indexOf('KURANG')>=0||s.indexOf('KETINGGALAN')>=0||s.indexOf('SALAH')>=0||s.indexOf('TIDAK DI CEK')>=0||s.indexOf('MISSCOM')>=0) return 'warning';return 'neutral';
  }
  function renderComplaintSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};
    var rows=groupRows(slide.audioComplaintGroups,function(g,no){
      var out='';
      (g.rows||[]).forEach(function(r,i){
        out+='<tr>'+(i===0?'<td class="audio-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false?0:1))+'"><b>'+no+'</b></td>':'')
          +'<td>'+esc(r.date)+'</td><td class="audio-indication '+indicationClass(r.indication)+'">'+esc(r.indication||'-')+'</td><td>'+esc(r.item)+'</td><td class="audio-qty">'+esc(r.qty)+'</td><td>'+esc(r.chronology||'-')+'</td><td>'+esc(r.action||'-')+'</td><td>'+esc(r.pic||'-')+'</td><td>'+esc(r.client||'-')+'</td></tr>';
      });
      if(g.showTotal!==false) out+='<tr class="audio-total-row"><td colspan="3">Total '+esc(g.name)+'</td><td>'+esc(g.total)+'</td><td colspan="4"></td></tr>';
      return out;
    });
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="audio-complaint-slide"><div class="audio-report-grid"></div><div class="audio-report-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT AUDIO</div></div><h1>REPORT BARANG BERMASALAH / <span>KOMPLAIN</span>'+suffix+'</h1>'
      +'<div class="audio-table-wrap"><table class="audio-complaint-table"><colgroup><col class="ac-no"><col class="ac-date"><col class="ac-ind"><col class="ac-item"><col class="ac-qty"><col class="ac-chrono"><col class="ac-action"><col class="ac-pic"><col class="ac-client"></colgroup><thead><tr><th>NO</th><th>TGL PENYEWAAN</th><th>INDIKASI</th><th>NAMA ALAT</th><th>QTY</th><th>KRONOLOGIS</th><th>ACTION</th><th>PIC</th><th>NAMA CLIENT</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function renderServiceSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};
    var rows=(slide.audioServiceRows||[]).map(function(r,i){
      return '<tr><td class="audio-no">'+esc(r.no||i+1)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.item)+'</td><td>'+esc(r.damage||'-')+'</td><td class="audio-qty">'+esc(r.qty)+'</td><td>'+esc(r.sn||'-')+'</td><td>'+esc(r.caseId||'-')+'</td><td>'+esc(r.takenDate||'-')+'</td><td>'+esc(r.note||r.receipt||'-')+'</td></tr>';
    }).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="audio-service-slide"><div class="audio-report-grid"></div><div class="audio-report-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT AUDIO</div></div><h1>ALAT-ALAT YANG DI <span>SERVICE</span></h1><h2>'+esc(slide.serviceCenter||'SERVICE CENTER')+suffix+'</h2>'
      +'<div class="audio-table-wrap"><table class="audio-service-table"><colgroup><col class="as-no"><col class="as-date"><col class="as-item"><col class="as-damage"><col class="as-qty"><col class="as-sn"><col class="as-case"><col class="as-taken"><col class="as-note"></colgroup><thead><tr><th>NO</th><th>TANGGAL</th><th>NAMA BARANG</th><th>KERUSAKAN</th><th>QTY</th><th>SERIAL NUMBER / SN</th><th>CASE ID</th><th>SUDAH DIAMBIL / TGL</th><th>KETERANGAN</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'2026')+'</section>';
  }
  return {parseServiceRows:parseServiceRows,parseVendorRows:parseVendorRows,parseComplaintRows:parseComplaintRows,parseWorkbookRows:parseWorkbookRows,parseWorkbook:parseWorkbook,createSlides:createSlides,renderVendorSlide:renderVendorSlide,renderComplaintSlide:renderComplaintSlide,renderServiceSlide:renderServiceSlide};
});