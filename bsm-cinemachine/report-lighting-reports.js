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
  function excelStyle(styleRows,r,c){return styleRows&&styleRows[r]&&styleRows[r][c]?clone(styleRows[r][c]):null;}
  function parseVendorRows(rows,styleRows){
    rows=rows||[];var groups=[],buf=[],totalStyles=null;
    function finish(total,totalPrice,styles){
      if(!buf.length)return;
      groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0)),totalPrice:clean(totalPrice),totalStyles:styles||totalStyles});
      buf=[];totalStyles=null;
    }
    rows.forEach(function(r,ri){
      var first=upper(r[0]),name=clean(r[2]);
      if(first==='TOTAL'){
        totalStyles={date:excelStyle(styleRows,ri,1),item:excelStyle(styleRows,ri,2),qty:excelStyle(styleRows,ri,3),action:excelStyle(styleRows,ri,4),backup:excelStyle(styleRows,ri,5),price:excelStyle(styleRows,ri,6)};
        finish(r[3],r[6],totalStyles);return;
      }
      if(first==='NO'||/REPORT BARANG KURANG/i.test(clean(r[0]))||/MBR REPORT/i.test(clean(r[0]))||/PRIODE/i.test(clean(r[0]))) return;
      if(clean(r[1])||name){
        if(clean(r[1])||clean(r[3]))buf.push({date:excelDate(r[1]),item:name||'',qty:clean(r[3]),action:clean(r[4]),backup:clean(r[5]),price:clean(r[6]),excelStyles:{date:excelStyle(styleRows,ri,1),item:excelStyle(styleRows,ri,2),qty:excelStyle(styleRows,ri,3),action:excelStyle(styleRows,ri,4),backup:excelStyle(styleRows,ri,5),price:excelStyle(styleRows,ri,6)}});
      }
    });
    finish('','',null);return groups;
  }
  function parseServiceRows(rows,styleRows){
    rows=rows||[];var groups=[],current=null,lastName='';
    function push(){if(current&&current.rows.length){groups.push(current);current=null;}}
    for(var i=0;i<rows.length;i++){
      var r=rows[i]||[],first=clean(r[0]),name=clean(r[1]);
      if(/^\d+$/.test(first)){
        if(name){push();current={name:name,rows:[],stockSummary:'',stockTitle:'',stockTitleStyle:null,stockSummaryStyle:null};lastName=name;}
        else if(!current)current={name:lastName||'Barang Service',rows:[],stockSummary:'',stockTitle:'',stockTitleStyle:null,stockSummaryStyle:null};
        var c4=r[4],c5=r[5],c6=r[6],c4s=clean(c4),c5s=clean(c5),looksDate4=(typeof c4==='number'&&c4>30000&&c4<70000)||/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(c4s),looksDate5=(typeof c5==='number'&&c5>30000&&c5<70000)||/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(c5s);
        var serviceCenter='',serviceDate='',damage='',serviceCenterStyle=null,dateStyle=null,damageStyle=null;
        if(looksDate4&&!looksDate5){serviceDate=excelDate(c4);damage=clean(c5)||clean(c6);dateStyle=excelStyle(styleRows,i,4);damageStyle=excelStyle(styleRows,i,5)||excelStyle(styleRows,i,6);}
        else{serviceCenter=c4s;serviceDate=excelDate(c5);damage=clean(c6);serviceCenterStyle=excelStyle(styleRows,i,4);dateStyle=excelStyle(styleRows,i,5);damageStyle=excelStyle(styleRows,i,6);}
        current.rows.push({no:num(r[0]),item:name||lastName,snLamp:clean(r[2]),snControl:clean(r[3]),serviceCenter:serviceCenter,date:serviceDate,damage:damage,excelStyles:{item:excelStyle(styleRows,i,1),snLamp:excelStyle(styleRows,i,2),snControl:excelStyle(styleRows,i,3),serviceCenter:serviceCenterStyle,date:dateStyle,damage:damageStyle}});
      }else if(/^Stock /i.test(first)&&current){
        if(/^Stock BSM/i.test(first)){current.stockSummary=first;current.stockSummaryStyle=excelStyle(styleRows,i,0);push();}
        else{current.stockTitle=first;current.stockTitleStyle=excelStyle(styleRows,i,0);}
      }
    }
    push();return groups;
  }
  function parseComplaintRows(rows,styleRows){
    rows=rows||[];var out=[];
    rows.forEach(function(r,ri){
      if(!/^\d+$/.test(clean(r[0])))return;
      out.push({no:num(r[0]),date:excelDate(r[1]),customer:clean(r[2]),item:clean(r[3]),qty:clean(r[4]),chronology:clean(r[5]),action:clean(r[6]),expense:clean(r[7]),indication:clean(r[8]),pic:clean(r[9]),excelStyles:{date:excelStyle(styleRows,ri,1),customer:excelStyle(styleRows,ri,2),item:excelStyle(styleRows,ri,3),qty:excelStyle(styleRows,ri,4),chronology:excelStyle(styleRows,ri,5),action:excelStyle(styleRows,ri,6),expense:excelStyle(styleRows,ri,7),indication:excelStyle(styleRows,ri,8),pic:excelStyle(styleRows,ri,9)}});
    });
    return out;
  }
  function parseWorkbookRows(vendorRows,serviceRows,complaintRows,vendorStyles,serviceStyles,complaintStyles){
    return {vendorGroups:parseVendorRows(vendorRows||[],vendorStyles||[]),serviceGroups:parseServiceRows(serviceRows||[],serviceStyles||[]),complaints:parseComplaintRows(complaintRows||[],complaintStyles||[]),vendorHeaderStyles:(vendorStyles&&vendorStyles[3])||[],serviceHeaderStyles:(serviceStyles&&serviceStyles[3])||[],complaintHeaderStyles:(complaintStyles&&complaintStyles[1])||[]};
  }
  function parseWorkbook(workbook){
    if(!workbook||!root||!root.XLSX) throw new Error('Workbook Lighting belum bisa dibaca.');
    var sheets=workbook.SheetNames.map(function(name){return {name:name,rows:root.XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:true})};});
    var vendor=sheets.find(function(s){return /Alat Kurang/i.test(s.name);})||sheets[0];
    var service=sheets.find(function(s){return /Barang Service/i.test(s.name);})||sheets[1]||sheets[0];
    var complaint=sheets.find(function(s){return /Komplain/i.test(s.name);})||sheets[2]||sheets[0];
    var styler=root.BSMExcelStyles&&typeof root.BSMExcelStyles.sheetStyleMatrix==='function'?root.BSMExcelStyles:null;
    var vendorStyles=styler?styler.sheetStyleMatrix(workbook,workbook.Sheets[vendor.name],root.XLSX,vendor.rows.length,7):[];
    var serviceStyles=styler?styler.sheetStyleMatrix(workbook,workbook.Sheets[service.name],root.XLSX,service.rows.length,7):[];
    var complaintStyles=styler?styler.sheetStyleMatrix(workbook,workbook.Sheets[complaint.name],root.XLSX,complaint.rows.length,10):[];
    return parseWorkbookRows(vendor.rows,service.rows,complaint.rows,vendorStyles,serviceStyles,complaintStyles);
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
    vp.forEach(function(gs,i){if(gs.length)slides.push({template:'lighting-vendor',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingVendorGroups:gs,lightingHeaderStyles:clone(parsed.vendorHeaderStyles||[]),pageNo:i+1,pageTotal:vp.length,period:opts.period||'JUNI 2026'});});
    var sp=paginateGroups(parsed.serviceGroups||[],opts.maxServiceRows||16);
    sp.forEach(function(gs,i){if(gs.length)slides.push({template:'lighting-service',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingServiceGroups:gs,lightingHeaderStyles:clone(parsed.serviceHeaderStyles||[]),pageNo:i+1,pageTotal:sp.length,period:opts.servicePeriod||'JUNI 2026'});});
    var maxC=Math.max(5,Number(opts.maxComplaintRows||9)),compl=parsed.complaints||[];
    for(var c=0;c<compl.length;c+=maxC)slides.push({template:'lighting-complaint',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingComplaints:compl.slice(c,c+maxC),lightingHeaderStyles:clone(parsed.complaintHeaderStyles||[]),pageNo:Math.floor(c/maxC)+1,pageTotal:Math.max(1,Math.ceil(compl.length/maxC)),period:opts.period||'JUNI 2026'});
    return slides;
  }
  function styleAttr(style){return root.BSMExcelStyles&&typeof root.BSMExcelStyles.attr==='function'?root.BSMExcelStyles.attr(style):'';}
  function footer(period){return '<div class="light-footer"><div><strong>MBR PT BLUE STAR MEDIA</strong><small>AKURAT, TERKONTROL, SIAP MENDUKUNG SETIAP PRODUKSI.</small></div><i></i><b>// '+period+'</b></div>';}
  function renderVendorSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var no=0,rows='';
    (slide.lightingVendorGroups||[]).forEach(function(g){no++;(g.rows||[]).forEach(function(r,i){var x=r.excelStyles||{};rows+='<tr>'+(i===0?'<td class="light-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false?0:1))+'">'+no+'</td>':'')+'<td'+styleAttr(x.date)+'>'+esc(r.date)+'</td><td'+styleAttr(x.item)+'>'+esc(r.item||g.name)+'</td><td class="light-qty"'+styleAttr(x.qty)+'>'+esc(r.qty)+'</td><td'+styleAttr(x.action)+'>'+esc(r.action||'-')+'</td><td'+styleAttr(x.backup)+'>'+esc(r.backup||'-')+'</td><td class="light-price"'+styleAttr(x.price)+'>'+esc(r.price||'-')+'</td></tr>';});if(g.showTotal!==false){var t=g.totalStyles||{};rows+='<tr class="light-total"><td colspan="2"'+styleAttr(t.item||t.date)+'>TOTAL '+esc(g.name)+'</td><td'+styleAttr(t.qty)+'>'+esc(g.total)+'</td><td colspan="2"'+styleAttr(t.action||t.backup)+'></td><td'+styleAttr(t.price)+'>'+esc(g.totalPrice||'-')+'</td></tr>';}});
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="lighting-vendor-slide"><div class="light-grid"></div><div class="light-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT LIGHTING</div></div><h1>REPORT BARANG KURANG / <span>AMBIL VENDOR</span>'+suffix+'</h1><div class="light-wrap"><table class="light-vendor-table"><thead><tr>'+['NO','TGL PENYEWAAN','NAMA ALAT','QTY','ACTION / VENDOR','BACKUP / UPGRADE','HARGA SEWA'].map(function(h,i){return '<th'+styleAttr((slide.lightingHeaderStyles||[])[i])+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function indClass(v){var s=upper(v);return s.indexOf('TROUBLE')>=0?'trouble':(s.indexOf('KELALAIAN')>=0?'warning':(s.indexOf('BELUM READY')>=0?'ready':'neutral'));}
  function renderComplaintSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var rows=(slide.lightingComplaints||[]).map(function(r){var x=r.excelStyles||{};return '<tr><td class="light-no">'+esc(r.no)+'</td><td'+styleAttr(x.date)+'>'+esc(r.date)+'</td><td'+styleAttr(x.customer)+'>'+esc(r.customer)+'</td><td'+styleAttr(x.item)+'>'+esc(r.item)+'</td><td class="light-qty"'+styleAttr(x.qty)+'>'+esc(r.qty)+'</td><td'+styleAttr(x.chronology)+'>'+esc(r.chronology||'-')+'</td><td'+styleAttr(x.action)+'>'+esc(r.action||'-')+'</td><td'+styleAttr(x.expense)+'>'+esc(r.expense||'-')+'</td><td class="light-ind '+indClass(r.indication)+'"'+styleAttr(x.indication)+'>'+esc(r.indication||'-')+'</td><td'+styleAttr(x.pic)+'>'+esc(r.pic||'-')+'</td></tr>';}).join('');
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="lighting-complaint-slide"><div class="light-grid"></div><div class="light-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT LIGHTING</div></div><h1>REPORT BARANG BERMASALAH / <span>KOMPLAIN</span>'+suffix+'</h1><div class="light-wrap"><table class="light-complaint-table"><colgroup><col class="lc-no"><col class="lc-date"><col class="lc-customer"><col class="lc-item"><col class="lc-qty"><col class="lc-chrono"><col class="lc-action"><col class="lc-expense"><col class="lc-ind"><col class="lc-pic"></colgroup><thead><tr>'+['NO','TGL','NAMA CUSTOMER','NAMA ALAT','QTY','KRONOLOGI','TINDAKAN','PENGELUARAN','INDIKASI','PIC'].map(function(h,i){return '<th'+styleAttr((slide.lightingHeaderStyles||[])[i])+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  function renderServiceSlide(slide,esc){
    esc=esc||escDefault;slide=slide||{};var no=0,rows='';
    (slide.lightingServiceGroups||[]).forEach(function(g){no++;(g.rows||[]).forEach(function(r,i){var x=r.excelStyles||{};rows+='<tr>'+(i===0?'<td class="light-no" rowspan="'+((g.rows||[]).length+(g.showTotal===false||!g.stockSummary?0:1))+'">'+no+'</td>':'')+'<td'+styleAttr(x.item)+'>'+esc(r.item||g.name)+'</td><td'+styleAttr(x.snLamp)+'>'+esc(r.snLamp||'-')+'</td><td'+styleAttr(x.snControl)+'>'+esc(r.snControl||'-')+'</td><td'+styleAttr(x.serviceCenter)+'>'+esc(r.serviceCenter||'-')+'</td><td'+styleAttr(x.date)+'>'+esc(r.date||'-')+'</td><td'+styleAttr(x.damage)+'>'+esc(r.damage||'-')+'</td></tr>';});if(g.showTotal!==false&&g.stockSummary)rows+='<tr class="light-stock"><td colspan="6"'+styleAttr(g.stockSummaryStyle||g.stockTitleStyle)+'><strong>'+esc(g.stockTitle||('Stock '+g.name))+'</strong> — '+esc(g.stockSummary)+'</td></tr>';});
    var suffix=slide.pageTotal>1?' ('+slide.pageNo+'/'+slide.pageTotal+')':'';
    return '<section class="lighting-service-slide"><div class="light-grid"></div><div class="light-kicker"><div>// LAPORAN GUDANG</div><div class="accent">// REPORT LIGHTING</div></div><h1>REPORT BARANG YANG DI <span>SERVICE</span>'+suffix+'</h1><div class="light-wrap"><table class="light-service-table"><colgroup><col style="width:5%"><col style="width:16%"><col style="width:14%"><col style="width:14%"><col style="width:15%"><col style="width:14%"><col style="width:22%"></colgroup><thead><tr>'+['NO','NAMA ALAT','SN LAMPU','SN CONTROL BOX','TEMPAT SERVICE','TANGGAL SERVICE','INDIKASI RUSAK'].map(function(h,i){return '<th'+styleAttr((slide.lightingHeaderStyles||[])[i])+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+footer(slide.period||'JUNI 2026')+'</section>';
  }
  return {parseVendorRows:parseVendorRows,parseServiceRows:parseServiceRows,parseComplaintRows:parseComplaintRows,parseWorkbookRows:parseWorkbookRows,parseWorkbook:parseWorkbook,createSlides:createSlides,renderVendorSlide:renderVendorSlide,renderComplaintSlide:renderComplaintSlide,renderServiceSlide:renderServiceSlide};
});