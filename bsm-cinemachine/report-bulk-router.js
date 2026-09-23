(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMBulkRouter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function clean(v){return String(v==null?'':v).replace(/\u00a0/g,' ').trim();}
  function num(v){var n=Number(clean(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function splitRows(text){
    return String(text||'').replace(/\r/g,'').split('\n').map(function(line){
      if(line.indexOf('\t')>=0) return line.split('\t').map(clean);
      return line.trim().split(/\s{2,}/).map(clean);
    });
  }
  function compact(rows){return rows.filter(function(r){return r.some(function(x){return clean(x)!=='';});});}
  function upper(v){return clean(v).toUpperCase();}
  function headerIndex(rows,required){
    return rows.findIndex(function(r){
      var joined=upper(r.join(' | '));
      return required.every(function(x){return joined.indexOf(upper(x))>=0;});
    });
  }
  function findCol(header,patterns){
    for(var i=0;i<header.length;i++){
      var c=upper(header[i]);
      for(var j=0;j<patterns.length;j++) if(patterns[j].test(c)) return i;
    }
    return -1;
  }
  function detectKind(text,typeId){
    var s=upper(text);
    if(/NAMA BARANG/.test(s)&&/QTY/.test(s)&&/HARGA VENDOR/.test(s)) return 'camera-vendor';
    if(/NAMA BARANG/.test(s)&&/(NAMA CLIEN|NAMA CLIENT|NAMA KLIEN)/.test(s)&&/(IDIKASI|INDIKASI)/.test(s)&&/KRONOLOGIS/.test(s)) return 'camera-complaint';
    if(/MODEL/.test(s)&&/STOK KANTOR/.test(s)&&/DI SERVICE/.test(s)&&/BISA JALAN/.test(s)) return 'camera-service';
    if(/JAM\/TANGGAL/.test(s)&&(/\t1\t/.test(String(text))||/\b1\s+2\s+3\b/.test(s))) return 'admin-matrix';
    return 'generic';
  }
  function paginateGroups(groups,maxRows){
    maxRows=Math.max(4,Number(maxRows||18));
    var pages=[],page=[],used=0;
    function flush(){if(page.length){pages.push(page);page=[];used=0;}}
    (groups||[]).forEach(function(group){
      var rows=group.rows||[],cost=rows.length+1;
      if(cost<=maxRows){
        if(used+cost>maxRows) flush();
        page.push(JSON.parse(JSON.stringify(group)));used+=cost;return;
      }
      if(used) flush();
      var chunkSize=maxRows-1;
      for(var i=0;i<rows.length;i+=chunkSize){
        var g=JSON.parse(JSON.stringify(group));
        g.rows=rows.slice(i,i+chunkSize);
        g.total=g.rows.reduce(function(sum,r){return sum+num(r.qty);},0);
        g.continued=i>0;
        page.push(g);flush();
      }
    });
    flush();
    return pages.length?pages:[[]];
  }
  function parseVendor(text,opts){
    opts=opts||{};
    var rows=compact(splitRows(text)),hi=headerIndex(rows,['NAMA BARANG','QTY','TANGGAL','KETERANGAN']);
    if(hi<0) throw new Error('Header Vendor belum terbaca. Gunakan: NAMA BARANG, QTY, TANGGAL, KETERANGAN, HARGA VENDOR.');
    var header=rows[hi],nameI=findCol(header,[/^NAMA BARANG$/]),qtyI=findCol(header,[/^QTY$/]),dateI=findCol(header,[/^TANGGAL$/]),noteI=findCol(header,[/^KETERANGAN$/]),priceI=findCol(header,[/HARGA VENDOR/]);
    var groups=[],buffer=[],sawTotal=false;
    function rowModel(r){
      var first=clean(r[nameI>=0?nameI:0]);
      return {qty:num(r[qtyI]),date:clean(r[dateI]),note:clean(r[noteI])||'-',price:clean(r[priceI])||'-',sourceName:first};
    }
    function pushGroup(rowsIn,totalValue){
      if(!rowsIn.length) return;
      var g={no:String(groups.length+1),name:rowsIn[0].sourceName,rows:rowsIn};
      g.total=totalValue>0?totalValue:rowsIn.reduce(function(s,r){return s+num(r.qty);},0);
      groups.push(g);
    }
    rows.slice(hi+1).forEach(function(r){
      var first=clean(r[nameI>=0?nameI:0]);
      if(!first) return;
      if(/^TOTAL\b/i.test(first)){
        pushGroup(buffer,num(r[qtyI]));buffer=[];sawTotal=true;return;
      }
      buffer.push(rowModel(r));
    });
    if(buffer.length){
      if(sawTotal){
        var tail=[],lastName='';
        buffer.forEach(function(r){
          var n=upper(r.sourceName);
          if(tail.length&&n!==lastName){pushGroup(tail,0);tail=[];}
          tail.push(r);lastName=n;
        });
        pushGroup(tail,0);
      }else{
        var run=[],runName='';
        buffer.forEach(function(r){
          var n=upper(r.sourceName);
          if(run.length&&n!==runName){pushGroup(run,0);run=[];}
          run.push(r);runName=n;
        });
        pushGroup(run,0);
      }
    }
    if(!groups.length) throw new Error('Data Vendor belum terbaca.');
    groups.forEach(function(g,i){g.no=String(i+1);});
    var grand=groups.reduce(function(s,g){return s+num(g.total);},0);
    var pages=paginateGroups(groups,opts.maxVendorRows||18);
    var slides=pages.map(function(gs,i){
      return {
        template:'camera-vendor',reportType:'gudang-kamera',department:'KAMERA',month:6,year:2026,subtitle:'Ambil Alat Vendor / Back Up',groups:[],
        cameraVendor:{title:'AMBIL ALAT VENDOR / BACK UP',reportLabel:'KAMERA',period:opts.period||'JUNI 2026',groups:gs,grandTotal:grand,pageNo:i+1,pageTotal:pages.length}
      };
    });
    return {kind:'camera-vendor',slides:slides};
  }
  function parseComplaint(text,opts){
    opts=opts||{};
    var rows=compact(splitRows(text)),hi=headerIndex(rows,['NAMA BARANG','TANGGAL','KRONOLOGIS']);
    if(hi<0) throw new Error('Header Komplain belum terbaca.');
    var h=rows[hi];
    var itemI=findCol(h,[/^NAMA BARANG$/]),clientI=findCol(h,[/NAMA (CLIEN|CLIENT|KLIEN)/]),dateI=findCol(h,[/^TANGGAL$/]),indI=findCol(h,[/(IDIKASI|INDIKASI)/]),chronI=findCol(h,[/KRONOLOGIS/]),picI=findCol(h,[/^PIC$/]),noI=findCol(h,[/^NO$/]);
    var data=rows.slice(hi+1).filter(function(r){return clean(r[itemI])!=='';}).map(function(r,i){
      return {no:num(r[noI])||i+1,item:clean(r[itemI]),client:clean(r[clientI]),date:clean(r[dateI]),indication:clean(r[indI])||'-',chronology:clean(r[chronI])||'-',pic:clean(r[picI])||'-'};
    });
    var max=Math.max(1,Number(opts.maxComplaintRows||20)),pages=[];
    for(var i=0;i<data.length;i+=max) pages.push(data.slice(i,i+max));
    if(!pages.length) throw new Error('Data Komplain belum terbaca.');
    return {kind:'camera-complaint',slides:pages.map(function(page,i){
      return {template:'camera-complaint',reportType:'gudang-kamera',department:'KAMERA',month:6,year:2026,subtitle:'Report Komplain',groups:[],complaintRows:page,pageNo:i+1,pageTotal:pages.length};
    })};
  }
  function paginateService(groups,maxUnits){
    maxUnits=Math.max(4,Number(maxUnits||20));
    var pages=[],page=[],used=0;
    function flush(){if(page.length){pages.push(page);page=[];used=0;}}
    (groups||[]).forEach(function(group){
      var rows=group.rows||[],cost=rows.length+1;
      if(cost<=maxUnits){
        if(used+cost>maxUnits) flush();
        var whole=JSON.parse(JSON.stringify(group));whole.continued=false;whole.showTotal=true;
        page.push(whole);used+=cost;return;
      }
      if(used) flush();
      var chunkSize=maxUnits-1;
      for(var i=0;i<rows.length;i+=chunkSize){
        var g=JSON.parse(JSON.stringify(group));
        g.rows=rows.slice(i,i+chunkSize);g.continued=i>0;g.showTotal=i+chunkSize>=rows.length;
        page.push(g);flush();
      }
    });
    flush();
    return pages.length?pages:[[]];
  }
  function parseService(text,opts){
    opts=opts||{};
    var rows=compact(splitRows(text)),hi=headerIndex(rows,['MODEL','TANGGAL','STOK KANTOR','DI SERVICE','BISA JALAN']);
    if(hi<0) throw new Error('Header Service belum terbaca.');
    var h=rows[hi],centerI=findCol(h,[/TEMPAT SERVICE/,/SERVICE CENTER/]),modelI=findCol(h,[/^MODEL$/]),dateI=findCol(h,[/^TANGGAL$/]),stockI=findCol(h,[/STOK KANTOR/,/SN/]),totalI=findCol(h,[/TOTAL UNIT/,/^TOTAL$/]),serviceI=findCol(h,[/DI SERVICE/]),runI=findCol(h,[/BISA JALAN/]),noteI=findCol(h,[/KETERANGAN/]);
    var centers={};
    rows.slice(hi+1).forEach(function(r){
      var model=clean(r[modelI]);if(!model||/^TOTAL\b/i.test(model)) return;
      var center=centerI>=0?clean(r[centerI]):clean(opts.serviceCenter||'Sony Center');if(!center) center='Sony Center';
      if(!centers[center]) centers[center]={name:center,groups:[],map:{}};
      var key=upper(model);
      var g=centers[center].map[key];
      if(!g){g={name:model,total:num(r[totalI]),inService:num(r[serviceI]),canRun:num(r[runI]),rows:[]};centers[center].map[key]=g;centers[center].groups.push(g);}
      if(num(r[totalI])) g.total=num(r[totalI]); if(num(r[serviceI])) g.inService=num(r[serviceI]); if(num(r[runI])) g.canRun=num(r[runI]);
      g.rows.push({date:clean(r[dateI]),stock:clean(r[stockI]),note:clean(r[noteI])||'-'});
    });
    var slides=[];
    Object.keys(centers).forEach(function(name){
      var pages=paginateService(centers[name].groups,opts.maxServiceUnits||20);
      pages.forEach(function(groups,i){
        slides.push({template:'camera-service',reportType:'gudang-kamera',department:'KAMERA',month:7,year:2026,subtitle:'Report Barang yang di Service',groups:[],serviceCenter:name,servicePeriod:opts.period||'JULI 2026',serviceGroups:groups,pageNo:i+1,pageTotal:pages.length});
      });
    });
    if(!slides.length) throw new Error('Data Service belum terbaca.');
    return {kind:'camera-service',slides:slides};
  }
  function parseAdmin(text,opts){
    opts=opts||{};
    var rows=splitRows(text),hi=rows.findIndex(function(r){return r.some(function(c){return upper(c)==='JAM/TANGGAL';});});
    if(hi<0) throw new Error('Header Admin JAM/TANGGAL belum terbaca.');
    var header=rows[hi],timeI=header.findIndex(function(c){return upper(c)==='JAM/TANGGAL';}),dayStart=timeI+1,totalI=header.findIndex(function(c){return upper(c)==='TOTAL';});
    if(totalI<0) totalI=Math.min(header.length,dayStart+30);
    var groupI=Math.max(0,timeI-2),shiftI=Math.max(0,timeI-1),dayCount=Math.min(30,Math.max(1,totalI-dayStart));
    function days(r){var a=[];for(var i=0;i<30;i++) a.push(i<dayCount?clean(r[dayStart+i]):'');return a;}
    var data={title:'DATA MBR ADMIN',period:opts.period||'JUNI 2026',delivery:[],deliveryTotal:Array(30).fill(''),jemputan:[],jemputanTotal:Array(30).fill(''),suratJalan:Array(30).fill(''),totals:{delivery:'',jemputan:'',combined:'',suratJalan:''},notes:[]};
    var current='',inNotes=false;
    rows.slice(hi+1).forEach(function(r){
      var g=upper(r[groupI]),shift=clean(r[shiftI]),time=clean(r[timeI]);
      if(g==='CATATAN'){inNotes=true;return;}
      if(inNotes){
        var note=clean(r.filter(function(x){return clean(x)!=='';}).join(' ')).replace(/^\d+\.?\s*/,'');
        if(note) data.notes.push(note);return;
      }
      if(g==='DELIVERY'){current='DELIVERY';}
      else if(g==='JEMPUTAN'){current='JEMPUTAN';}
      else if(g==='SURAT JALAN'){
        data.suratJalan=days(r);data.totals.suratJalan=clean(r[totalI]);current='';return;
      }
      if(g==='TOTAL'){
        if(current==='DELIVERY'){data.deliveryTotal=days(r);data.totals.delivery=clean(r[totalI]);}
        if(current==='JEMPUTAN'){data.jemputanTotal=days(r);data.totals.jemputan=clean(r[totalI]);}
        return;
      }
      var first=clean(r[groupI]);
      if(/^TOTAL ANTARAN/i.test(first)){data.totals.combined=clean(r[shiftI]||r[timeI]||r[1]);return;}
      if(/^TOTAL SELURUH SURAT/i.test(first)){data.totals.suratJalan=clean(r[shiftI]||r[timeI]||r[1]);return;}
      if(current==='DELIVERY' && (time||shift)) data.delivery.push({shift:shift,time:time,days:days(r)});
      if(current==='JEMPUTAN' && (shift||time)) data.jemputan.push({shift:shift||time,days:days(r)});
    });
    if(!data.totals.combined && data.totals.delivery && data.totals.jemputan) data.totals.combined=String(num(data.totals.delivery)+num(data.totals.jemputan));
    return {kind:'admin-matrix',slides:[{template:'admin-matrix',reportType:'admin',department:'ADMIN',month:6,year:2026,subtitle:'Data MBR Admin',groups:[],matrix:data}]};
  }
  function paginateGeneric(parsed,maxRows){
    maxRows=Math.max(6,Number(maxRows||18));
    var pages=paginateGroups(parsed.groups||[],maxRows);
    return pages.map(function(groups){
      var p=JSON.parse(JSON.stringify(parsed));p.groups=groups;return p;
    });
  }
  function parse(text,opts){
    opts=opts||{};
    var kind=opts.mode&&opts.mode!=='auto'?opts.mode:detectKind(text,opts.typeId);
    if(kind==='camera-vendor') return parseVendor(text,opts);
    if(kind==='camera-complaint') return parseComplaint(text,opts);
    if(kind==='camera-service') return parseService(text,opts);
    if(kind==='admin-matrix') return parseAdmin(text,opts);
    if(typeof opts.genericParser!=='function') throw new Error('Parser generic belum tersedia.');
    var parsed=opts.genericParser(text);
    return {kind:'generic',slides:paginateGeneric(parsed,opts.maxGenericRows||18)};
  }
  return {detectKind:detectKind,parse:parse,parseVendor:parseVendor,parseComplaint:parseComplaint,parseService:parseService,parseAdmin:parseAdmin,paginateGeneric:paginateGeneric};
});