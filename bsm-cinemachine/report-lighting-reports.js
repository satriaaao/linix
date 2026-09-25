(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMLightingReports=api;
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
  function parseVendorRows(rows){
    rows=rows||[];var groups=[],buf=[];
    function finish(total,totalPrice){
      if(!buf.length)return;
      groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0)),totalPrice:clean(totalPrice)});
      buf=[];
    }
    rows.forEach(function(r){
      var first=upper(r[0]),name=clean(r[2]);
      if(first==='TOTAL'){finish(r[3],r[6]);return;}
      if(first==='NO'||/REPORT BARANG KURANG/i.test(clean(r[0]))||/MBR REPORT/i.test(clean(r[0]))||/PRIODE/i.test(clean(r[0]))) return;
      if(clean(r[1])||name){
        if(clean(r[1])||clean(r[3])) buf.push({date:excelDate(r[1]),item:name||'',qty:clean(r[3]),action:clean(r[4]),backup:clean(r[5]),price:clean(r[6])});
      }
    });
    finish('','');
    return groups;
  }
  function parseServiceRows(rows){
    rows=rows||[];var groups=[],current=null,lastName='';
    function push(){if(current&&current.rows.length){groups.push(current);current=null;}}
    for(var i=0;i<rows.length;i++){
      var r=rows[i]||[],first=clean(r[0]),name=clean(r[1]);
      if(/^\d+$/.test(first)){
        if(name){
          push();
          current={name:name,rows:[],stockSummary:'',stockTitle:''};lastName=name;
        }else if(!current){
          current={name:lastName||'Barang Service',rows:[],stockSummary:'',stockTitle:''};
        }
        current.rows.push({no:num(r[0]),item:name||lastName,snLamp:clean(r[2]),snControl:clean(r[3]),serviceCenter:clean(r[4]),date:excelDate(r[5]),damage:clean(r[6])});
      }else if(/^Stock /i.test(first)&&current){
        if(/^Stock BSM/i.test(first)){current.stockSummary=first;push();}
        else current.stockTitle=first;
      }
    }
    push();return groups;
  }
  function parseComplaintRows(rows){
    rows=rows||[];var out=[];
    rows.forEach(function(r){
      if(!/^\d+$/.test(clean(r[0]))) return;
      out.push({no:num(r[0]),date:excelDate(r[1]),customer:clean(r[2]),item:clean(r[3]),qty:clean(r[4]),chronology:clean(r[5]),action:clean(r[6]),expense:clean(r[7]),indication:clean(r[8]),pic:clean(r[9])});
    });
    return out;
  }
  function parseWorkbookRows(vendorRows,serviceRows,complaintRows){return {vendorGroups:parseVendorRows(vendorRows||[]),serviceGroups:parseServiceRows(serviceRows||[]),complaints:parseComplaintRows(complaintRows||[])};}
  function parseWorkbook(workbook){
    if(!workbook||!root||!root.XLSX) throw new Error('Workbook Lighting belum bisa dibaca.');
    var sheets=workbook.SheetNames.map(function(name){return {name:name,rows:root.XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:true})};});
    var vendor=sheets.find(function(s){return /Alat Kurang/i.test(s.name);})||sheets[0];
    var service=sheets.find(function(s){return /Barang Service/i.test(s.name);})||sheets[1]||sheets[0];
    var complaint=sheets.find(function(s){return /Komplain/i.test(s.name);})||sheets[2]||sheets[0];
    return parseWorkbookRows(vendor.rows,service.rows,complaint.rows);
  }
  function paginateGroups(groups,maxRows){
    maxRows=Math.max(4,Number(maxRows||16));var pages=[],page=[],used=0;
    function flush(){if(page.length){pages.push(page);page=[];used=0;}}
    (groups||[]).forEach(function(g){
      var cost=(g.rows||[]).length+1+(g.stockSummary?1:0);
      if(cost<=maxRows){if(used+cost>maxRows)flush();page.push(clone(g));used+=cost;return;}
      if(used)flush();var chunk=maxRows-2;
      for(var i=0;i<g.rows.length;i+=chunk){
        var x=clone(g);x.rows=g.rows.slice(i,i+chunk);x.continued=i>0;x.showTotal=i+chunk>=g.rows.length;
        if(!x.showTotal){x.stockSummary='';x.stockTitle='';}
        page.push(x);flush();
      }
    });flush();return pages.length?pages:[[]];
  }
  function createSlides(parsed,opts){
    parsed=parsed||{};opts=opts||{};var slides=[];
    var vp=paginateGroups(parsed.vendorGroups||[],opts.maxVendorRows||16);
    vp.forEach(function(gs,i){if(gs.length)slides.push({template:'lighting-vendor',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingVendorGroups:gs,pageNo:i+1,pageTotal:vp.length,period:opts.period||'JUNI 2026'});});
    var sp=paginateGroups(parsed.serviceGroups||[],opts.maxServiceRows||16);
    sp.forEach(function(gs,i){if(gs.length)slides.push({template:'lighting-service',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingServiceGroups:gs,pageNo:i+1,pageTotal:sp.length,period:opts.servicePeriod||'JUNI 2026'});});
    var maxC=Math.max(5,Number(opts.maxComplaintRows||9)),compl=parsed.complaints||[];
    for(var c=0;c<compl.length;c+=maxC) slides.push({template:'lighting-complaint',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingComplaints:compl.slice(c,c+maxC),pageNo:Math.floor(c/maxC)+1,pageTotal:Math.max(1,Math.ceil(compl.length/maxC)),period:opts.period||'JUNI 2026'});
    return slides;
  }
  function footer(period){return '<div class="light-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// '+period+'</b></div>';}
  function renderVendorSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var no=0,rows='';
    (slide.lightingVendorGroups||[]).forEach(function(g){no++;(g.rows||[]).forEach(function(r,i){rows+='<tr>'+(i===0?'<td class="light-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false?0:1))+'">'+no+'</td>':'')+'<td>'+esc(r.date)+'</td><td>'+esc(r.item||g.name)+'</td><td class="light-qty">'+esc(r.qty)+'</td><td>'+esc(r.action||'-')+'</td><td>'+esc(r.backup||'-')+'</td><td class="light-price">'+esc(r.price||'-')+'</td></tr>';});if(g.showTotal!==false)rows+='<tr class="light-total"><td colspan="2">TOTAL '+esc(g.name)+'</td><td>'+esc(g.total)+'</td><td colspan="2"></td><td>'+esc(g.totalPrice||'-')+'</td></tr>';});
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="lighting-vendor-slide"><div class="light-grid"></div><div class="light-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT LIGHTING</div></div><h1>REPORT BARANG KURANG / <span>AMBIL VENDOR</span>'+suffix+'</h1><div class="light-wrap"><table class="light-vendor-table"><thead><tr><th>NO</th><th>TGL PENYEWAAN</th><th>NAMA ALAT</th><th>QTY</th><th>ACTION / VENDOR</th><th>BACKUP / UPGRADE</th><th>HARGA SEWA</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function indClass(v){var s=upper(v);return s.indexOf('TROUBLE')>=0?'trouble':(s.indexOf('KELALAIAN')>=0?'warning':(s.indexOf('BELUM READY')>=0?'ready':'neutral'));}
  function renderComplaintSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var rows=(slide.lightingComplaints||[]).map(function(r){return '<tr><td class="light-no">'+esc(r.no)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.customer)+'</td><td>'+esc(r.item)+'</td><td class="light-qty">'+esc(r.qty)+'</td><td>'+esc(r.chronology||'-')+'</td><td>'+esc(r.action||'-')+'</td><td>'+esc(r.expense||'-')+'</td><td class="light-ind '+indClass(r.indication)+'">'+esc(r.indication||'-')+'</td><td>'+esc(r.pic||'-')+'</td></tr>';}).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="lighting-complaint-slide"><div class="light-grid"></div><div class="light-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT LIGHTING</div></div><h1>REPORT BARANG BERMASALAH / <span>KOMPLAIN</span>'+suffix+'</h1><div class="light-wrap"><table class="light-complaint-table"><colgroup><col class="lc-no"><col class="lc-date"><col class="lc-customer"><col class="lc-item"><col class="lc-qty"><col class="lc-chrono"><col class="lc-action"><col class="lc-expense"><col class="lc-ind"><col class="lc-pic"></colgroup><thead><tr><th>NO</th><th>TGL</th><th>NAMA CUSTOMER</th><th>NAMA ALAT</th><th>QTY</th><th>KRONOLOGI</th><th>TINDAKAN</th><th>PENGELUARAN</th><th>INDIKASI</th><th>PIC</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function renderServiceSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var no=0,rows='';
    (slide.lightingServiceGroups||[]).forEach(function(g){no++;(g.rows||[]).forEach(function(r,i){rows+='<tr>'+(i===0?'<td class="light-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false||!g.stockSummary?0:1))+'">'+no+'</td>':'')+'<td>'+esc(r.item||g.name)+'</td><td>'+esc(r.snLamp||'-')+'</td><td>'+esc(r.snControl||'-')+'</td><td>'+esc(r.serviceCenter||'-')+'</td><td>'+esc(r.date||'-')+'</td><td>'+esc(r.damage||'-')+'</td></tr>';});if(g.showTotal!==false&&g.stockSummary)rows+='<tr class="light-stock"><td colspan="6"><strong>'+esc(g.stockTitle||('Stock '+g.name))+'</strong> — '+esc(g.stockSummary)+'</td></tr>';});
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="lighting-service-slide"><div class="light-grid"></div><div class="light-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT LIGHTING</div></div><h1>REPORT BARANG YANG DI <span>SERVICE</span>'+suffix+'</h1><div class="light-wrap"><table class="light-service-table"><colgroup><col style="width:5%"><col style="width:16%"><col style="width:14%"><col style="width:14%"><col style="width:15%"><col style="width:14%"><col style="width:22%"></colgroup><thead><tr><th>NO</th><th>NAMA ALAT</th><th>SN LAMPU</th><th>SN CONTROL BOX</th><th>TEMPAT SERVICE</th><th>TANGGAL SERVICE</th><th>INDIKASI RUSAK</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  return {parseVendorRows:parseVendorRows,parseServiceRows:parseServiceRows,parseComplaintRows:parseComplaintRows,parseWorkbookRows:parseWorkbookRows,parseWorkbook:parseWorkbook,createSlides:createSlides,renderVendorSlide:renderVendorSlide,renderComplaintSlide:renderComplaintSlide,renderServiceSlide:renderServiceSlide};
});