(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMBulkRouter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function clean(v){return String(v==null?'':v).replace(/\u00a0/g,' ').replace(/\t+/g,' ').replace(/\s{2,}/g,' ').trim();}
  function num(v){var n=Number(clean(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function splitTsvLine(line){
    var cells=[],cell='',quoted=false;
    for(var i=0;i<line.length;i++){
      var ch=line.charAt(i);
      if(ch==='"'){
        if(quoted&&line.charAt(i+1)==='"'){cell+='"';i++;continue;}
        quoted=!quoted;continue;
      }
      if(ch==='\t'&&!quoted){cells.push(clean(cell));cell='';continue;}
      cell+=ch;
    }
    cells.push(clean(cell));
    return cells;
  }
  function splitRows(text){
    return String(text||'').replace(/\r/g,'').split('\n').map(function(line){
      if(line.indexOf('\t')>=0) return splitTsvLine(line);
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
    if(typeId==='gudang-cinema'){
      if(/TGL PENYEWAAN/.test(s)&&/DURASI SEWA/.test(s)&&/NAMA ALAT/.test(s)&&/ACTION/.test(s)) return 'cinema-vendor';
      if(/TGL PENYEWAAN/.test(s)&&/INDIKASI/.test(s)&&/KRONOLOGIS/.test(s)&&/BIAYA/.test(s)) return 'cinema-complaint';
      if(/NAMA BARANG/.test(s)&&/KERUSAKAN/.test(s)&&(/SN (BALLAST|BODY)/.test(s)||/SERIAL NUMBER/.test(s)||/CASE ID/.test(s))) return 'cinema-service';
    }
    if(typeId==='gudang-lighting'){
      if(/TGL PENYEWAAN/.test(s)&&/NAMA ALAT/.test(s)&&/HARGA SEWA/.test(s)) return 'lighting-vendor';
      if(/NAMA CUSTOMER/.test(s)&&/KRONOLOGI/.test(s)&&/PENGELUARAN/.test(s)&&/INDIKASI/.test(s)) return 'lighting-complaint';
      if(/NAMA ALAT/.test(s)&&/TEMPAT SERVICE/.test(s)&&/TANGGAL SERVICE/.test(s)&&/INDIKASI RUSAK/.test(s)) return 'lighting-service';
    }
    if(typeId==='gudang-audio'){
      if(/TGL PENYEWAAN/.test(s)&&/DURASI SEWA/.test(s)&&/NAMA ALAT/.test(s)&&/UPGRADE/.test(s)&&/VENDOR/.test(s)) return 'audio-vendor';
      if(/TGL PENYEWAAN/.test(s)&&/INDIKASI/.test(s)&&/NAMA ALAT/.test(s)&&/KRONOLOGIS/.test(s)&&/ACTION/.test(s)) return 'audio-complaint';
      if(/NAMA BARANG/.test(s)&&/KERUSAKAN/.test(s)&&/SERIAL NUMBER/.test(s)&&/CASE ID/.test(s)) return 'audio-service';
    }
    if(/NAMA BARANG/.test(s)&&/QTY/.test(s)&&/HARGA VENDOR/.test(s)) return 'camera-vendor';
    if(/NAMA BARANG/.test(s)&&/(NAMA CLIEN|NAMA CLIENT|NAMA KLIEN)/.test(s)&&/(IDIKASI|INDIKASI)/.test(s)&&/KRONOLOGIS/.test(s)) return 'camera-complaint';
    if(/MODEL/.test(s)&&/STOK KANTOR/.test(s)&&/(DI\s*SERVICE|DISERVICE|\bSERVICE\b)/.test(s)&&/BISA JALAN/.test(s)) return 'camera-service';
    if(/TGL PENYEWAAN/.test(s)&&/DURASI SEWA/.test(s)&&/NAMA ALAT/.test(s)&&/UPGRADE/.test(s)&&/VENDOR/.test(s)) return 'audio-vendor';
    if(/NAMA CUSTOMER/.test(s)&&/KRONOLOGI/.test(s)&&/PENGELUARAN/.test(s)&&/INDIKASI/.test(s)) return 'lighting-complaint';
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
  function isServiceHeader(r){
    var joined=upper((r||[]).join(' ')).replace(/\s+/g,' ');
    return joined.indexOf('MODEL')>=0&&joined.indexOf('TANGGAL')>=0&&joined.indexOf('STOK KANTOR')>=0&&joined.indexOf('BISA JALAN')>=0&&/(DI\s*SERVICE|DISERVICE|\bSERVICE\b)/.test(joined);
  }
  function serviceCenterBefore(rows,headerIndex,fallback){
    for(var i=headerIndex-1;i>=0;i--){
      var vals=(rows[i]||[]).filter(function(x){return clean(x)!=='';});
      if(!vals.length) continue;
      var joined=clean(vals.join(' '));
      if(/REPORT\s+BARANG\s+YANG\s+DI\s+SERVICE/i.test(joined)) break;
      if(isServiceHeader(rows[i])) break;
      if(/^\d+$/.test(clean(vals[0]))) continue;
      if(/^(NO|MODEL|TANGGAL|STOK KANTOR)/i.test(joined)) continue;
      return joined;
    }
    return clean(fallback||'Sony Center')||'Sony Center';
  }
  function normalizeServiceDataRow(row){
    var cells=(row||[]).map(clean);
    while(cells.length>8&&cells[3]==='') cells.splice(3,1);
    if(cells.length>8){
      var head=cells.slice(0,7),note=cells.slice(7).filter(function(x){return x!=='';}).join(' ');
      cells=head.concat([note]);
    }
    while(cells.length<8) cells.push('');
    return {
      no:num(cells[0]),
      model:clean(cells[1]),
      date:clean(cells[2]),
      stock:clean(cells[3]),
      total:num(cells[4]),
      inService:num(cells[5]),
      canRun:num(cells[6]),
      note:clean(cells[7])||'-'
    };
  }
  function parseService(text,opts){
    opts=opts||{};
    var rows=splitRows(text),headers=[];
    rows.forEach(function(r,i){if(isServiceHeader(r)) headers.push(i);});
    if(!headers.length) throw new Error('Header Service belum terbaca. Gunakan kolom NO, MODEL, TANGGAL, STOK KANTOR, SERVICE/DISERVICE, BISA JALAN, KETERANGAN.');

    var centers=[],centerMap={};
    function centerFor(name){
      var key=upper(name);
      if(!centerMap[key]){
        centerMap[key]={name:name,groups:[]};
        centers.push(centerMap[key]);
      }
      return centerMap[key];
    }

    headers.forEach(function(hi,headerPos){
      var centerName=serviceCenterBefore(rows,hi,opts.serviceCenter||'Sony Center');
      var center=centerFor(centerName);
      var end=headerPos+1<headers.length?headers[headerPos+1]:rows.length;
      var current=null;

      for(var ri=hi+1;ri<end;ri++){
        var raw=rows[ri]||[],first=clean(raw[0]);
        if(!/^\d+$/.test(first)) continue;
        var item=normalizeServiceDataRow(raw);
        if(!item.model) continue;

        var newGroup=!current||item.no===1;
        if(!newGroup&&upper(item.model)!==upper(current.name)&&(item.total||item.inService||item.canRun)) newGroup=true;

        if(newGroup){
          current={name:item.model,total:item.total,inService:item.inService,canRun:item.canRun,rows:[]};
          center.groups.push(current);
        }else{
          if(item.total) current.total=item.total;
          if(item.inService) current.inService=item.inService;
          if(item.canRun) current.canRun=item.canRun;
        }

        current.rows.push({
          model:upper(item.model)===upper(current.name)?'':item.model,
          date:item.date,
          stock:item.stock,
          note:item.note
        });
      }
    });

    var slides=[];
    centers.forEach(function(center){
      if(!center.groups.length) return;
      var pages=paginateService(center.groups,opts.maxServiceUnits||20);
      pages.forEach(function(groups,i){
        slides.push({
          template:'camera-service',reportType:'gudang-kamera',department:'KAMERA',
          month:7,year:2026,subtitle:'Report Barang yang di Service',groups:[],
          serviceCenter:center.name,servicePeriod:opts.period||'JULI 2026',
          serviceGroups:groups,pageNo:i+1,pageTotal:pages.length
        });
      });
    });
    if(!slides.length) throw new Error('Data Service belum terbaca.');
    return {kind:'camera-service',slides:slides};
  }

  function parseAudioVendor(text,opts){
    opts=opts||{};
    var rows=compact(splitRows(text)),hi=headerIndex(rows,['TGL','NAMA ALAT','QTY']);
    if(hi<0) throw new Error('Header Audio Vendor belum terbaca.');
    var h=rows[hi],dateI=findCol(h,[/TGL/]),durI=findCol(h,[/DURASI/]),nameI=findCol(h,[/NAMA ALAT/]),qtyI=findCol(h,[/^QTY$/]),upI=findCol(h,[/UPGRADE/]),vendorI=findCol(h,[/^VENDOR$/]),priceI=findCol(h,[/HARGA SEWA VENDOR/,/HARGA VENDOR/]);
    var groups=[],buf=[];
    function finish(total){
      if(!buf.length) return;
      groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0))+' unit'});
      buf=[];
    }
    rows.slice(hi+1).forEach(function(r){
      var name=clean(r[nameI]);
      if(!name) return;
      if(/^TOTAL$/i.test(name)){finish(r[qtyI]);return;}
      buf.push({date:clean(r[dateI]),duration:clean(r[durI]),item:name,qty:clean(r[qtyI]),upgrade:clean(r[upI]),vendor:clean(r[vendorI]),price:clean(r[priceI])});
    });
    finish('');
    if(!groups.length) throw new Error('Data Audio Vendor belum terbaca.');
    var pages=paginateGroups(groups,opts.maxAudioVendorRows||16);
    return {kind:'audio-vendor',slides:pages.filter(function(x){return x.length;}).map(function(gs,i){
      return {template:'audio-vendor',reportType:'gudang-audio',department:'AUDIO',groups:[],audioVendorGroups:gs,pageNo:i+1,pageTotal:pages.length,period:opts.period||'JUNI 2026'};
    })};
  }

  function parseAudioComplaint(text,opts){
    opts=opts||{};
    var rows=compact(splitRows(text)),hi=headerIndex(rows,['INDIKASI','NAMA ALAT','QTY','KRONOLOGIS']);
    if(hi<0) throw new Error('Header Audio Komplain belum terbaca.');
    var h=rows[hi],dateI=findCol(h,[/TGL/,/TANGGAL/]),indI=findCol(h,[/INDIKASI/]),nameI=findCol(h,[/NAMA ALAT/]),qtyI=findCol(h,[/^QTY$/]),chronI=findCol(h,[/KRONOLOGIS/]),actionI=findCol(h,[/^ACTION$/]),picI=findCol(h,[/PIC/]),clientI=findCol(h,[/NAMA CLIENT/,/NAMA KLIEN/,/NAMA CLIEN/]);
    var groups=[],buf=[];
    function finish(total){
      if(!buf.length) return;
      groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0))+' unit'});
      buf=[];
    }
    rows.slice(hi+1).forEach(function(r){
      var name=clean(r[nameI]);
      if(!name) return;
      if(/^TOTAL$/i.test(name)){finish(r[qtyI]);return;}
      buf.push({date:clean(r[dateI]),indication:clean(r[indI]),item:name,qty:clean(r[qtyI]),chronology:clean(r[chronI]),action:clean(r[actionI]),pic:clean(r[picI]),client:clean(r[clientI])});
    });
    finish('');
    if(!groups.length) throw new Error('Data Audio Komplain belum terbaca.');
    var pages=paginateGroups(groups,opts.maxAudioComplaintRows||16);
    return {kind:'audio-complaint',slides:pages.filter(function(x){return x.length;}).map(function(gs,i){
      return {template:'audio-complaint',reportType:'gudang-audio',department:'AUDIO',groups:[],audioComplaintGroups:gs,pageNo:i+1,pageTotal:pages.length,period:opts.period||'JUNI 2026'};
    })};
  }

  function isAudioServiceHeader(row){
    var s=upper((row||[]).join(' | '));
    return s.indexOf('NAMA BARANG')>=0&&s.indexOf('KERUSAKAN')>=0&&s.indexOf('SERIAL NUMBER')>=0&&s.indexOf('CASE ID')>=0;
  }
  function audioCenterBefore(rows,hi){
    for(var i=hi-1;i>=0;i--){
      var vals=(rows[i]||[]).filter(function(x){return clean(x)!=='';});
      if(!vals.length) continue;
      var s=clean(vals.join(' '));
      if(/MBR ALAT-ALAT YANG DI SERVICE GUDANG AUDIO/i.test(s)||/^ALAT-ALAT YANG DI SERVICE$/i.test(s)) continue;
      if(isAudioServiceHeader(rows[i])) continue;
      return s;
    }
    return 'SERVICE CENTER';
  }
  function parseAudioService(text,opts){
    opts=opts||{};
    var rows=splitRows(text),headers=[];
    rows.forEach(function(r,i){if(isAudioServiceHeader(r)) headers.push(i);});
    if(!headers.length) throw new Error('Header Audio Service belum terbaca.');
    var centers=[];
    headers.forEach(function(hi,pos){
      var center={name:audioCenterBefore(rows,hi),rows:[]},end=pos+1<headers.length?headers[pos+1]:rows.length;
      for(var i=hi+1;i<end;i++){
        var r=rows[i]||[];
        if(!/^\d+$/.test(clean(r[0]))) continue;
        while(r.length<9) r.push('');
        center.rows.push({no:num(r[0]),date:clean(r[1]),item:clean(r[2]),damage:clean(r[3]),qty:clean(r[4]),sn:clean(r[5]),caseId:clean(r[6]),takenDate:clean(r[7]),note:clean(r[8])});
      }
      if(center.rows.length) centers.push(center);
    });
    if(!centers.length) throw new Error('Data Audio Service belum terbaca.');
    var slides=[],max=Math.max(5,Number(opts.maxAudioServiceRows||18));
    centers.forEach(function(center){
      var total=Math.max(1,Math.ceil(center.rows.length/max));
      for(var i=0;i<center.rows.length;i+=max){
        slides.push({template:'audio-service',reportType:'gudang-audio',department:'AUDIO',groups:[],serviceCenter:center.name,audioServiceRows:center.rows.slice(i,i+max),pageNo:Math.floor(i/max)+1,pageTotal:total,period:opts.servicePeriod||'2026'});
      }
    });
    return {kind:'audio-service',slides:slides};
  }

  function parseCinemaVendor(text,opts){
    opts=opts||{};var rows=compact(splitRows(text)),hi=headerIndex(rows,['TGL','DURASI','NAMA ALAT','QTY']);
    if(hi<0) throw new Error('Header Cinema Vendor belum terbaca.');
    var h=rows[hi],dateI=findCol(h,[/TGL/]),durI=findCol(h,[/DURASI/]),nameI=findCol(h,[/NAMA ALAT/]),qtyI=findCol(h,[/^QTY$/]),actionI=findCol(h,[/ACTION/]);
    var groups=[],buf=[];
    function finish(total){if(!buf.length)return;groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0))});buf=[];}
    rows.slice(hi+1).forEach(function(r){var name=clean(r[nameI]);if(!name)return;if(/^TOTAL$/i.test(name)){finish(r[qtyI]);return;}buf.push({date:clean(r[dateI]),duration:clean(r[durI]),item:name,qty:clean(r[qtyI]),action:clean(r[actionI])});});
    finish('');if(!groups.length)throw new Error('Data Cinema Vendor belum terbaca.');
    var pages=paginateGroups(groups,opts.maxCinemaVendorRows||16);
    return {kind:'cinema-vendor',slides:pages.filter(function(x){return x.length;}).map(function(gs,i){return {template:'cinema-vendor',reportType:'gudang-cinema',department:'CINEMA',groups:[],cinemaVendorGroups:gs,pageNo:i+1,pageTotal:pages.length,period:opts.period||'JUNI 2026'};})};
  }
  function parseCinemaComplaint(text,opts){
    opts=opts||{};var rows=compact(splitRows(text)),hi=headerIndex(rows,['TGL','INDIKASI','NAMA ALAT','QTY','KRONOLOGIS']);
    if(hi<0)throw new Error('Header Cinema Komplain belum terbaca.');
    var h=rows[hi],noI=findCol(h,[/^NO$/]),dateI=findCol(h,[/TGL/]),indI=findCol(h,[/INDIKASI/]),itemI=findCol(h,[/NAMA ALAT/]),qtyI=findCol(h,[/^QTY$/]),chronI=findCol(h,[/KRONOLOGIS/]),actionI=findCol(h,[/ACTION/]),costI=findCol(h,[/BIAYA/]),picI=findCol(h,[/^PIC$/]),clientI=findCol(h,[/NAMA CLIENT/,/NAMA KLIEN/,/NAMA CLIEN/]);
    var data=rows.slice(hi+1).filter(function(r){return clean(r[itemI])!=='';}).map(function(r,i){return {no:num(r[noI])||i+1,date:clean(r[dateI]),indication:clean(r[indI]),item:clean(r[itemI]),qty:clean(r[qtyI]),chronology:clean(r[chronI]),action:clean(r[actionI]),cost:clean(r[costI]),pic:clean(r[picI]),client:clean(r[clientI])};});
    var max=Math.max(5,Number(opts.maxCinemaComplaintRows||18)),slides=[];for(var i=0;i<data.length;i+=max)slides.push({template:'cinema-complaint',reportType:'gudang-cinema',department:'CINEMA',groups:[],cinemaComplaints:data.slice(i,i+max),pageNo:Math.floor(i/max)+1,pageTotal:Math.max(1,Math.ceil(data.length/max)),period:opts.period||'JUNI 2026'});
    if(!slides.length)throw new Error('Data Cinema Komplain belum terbaca.');return {kind:'cinema-complaint',slides:slides};
  }
  function isCinemaServiceHeader(r){var s=upper((r||[]).join(' | '));return upper((r||[])[0])==='NO'&&s.indexOf('NAMA BARANG')>=0&&s.indexOf('QTY')>=0&&(s.indexOf('KERUSAKAN')>=0||s.indexOf('TROUBLE')>=0);}
  function parseCinemaService(text,opts){
    opts=opts||{};var rows=splitRows(text),headers=[];rows.forEach(function(r,i){if(isCinemaServiceHeader(r))headers.push(i);});if(!headers.length)throw new Error('Header Cinema Service belum terbaca.');
    var slides=[],centers=[];
    headers.forEach(function(hi,pos){var name='SERVICE CENTER';for(var k=hi-1;k>=0;k--){var v=clean((rows[k]||[])[0]);if(!v)continue;if(/^MBR/i.test(v)||isCinemaServiceHeader(rows[k]))break;name=v;break;}var end=pos+1<headers.length?headers[pos+1]:rows.length,data=[];
      for(var j=hi+1;j<end;j++){var r=rows[j]||[];if(/^\d+$/.test(clean(r[0]))||(!clean(r[0])&&clean(r[1])&&clean(r[2])))data.push({no:num(r[0])||'',date:clean(r[1]),item:clean(r[2]),damage:clean(r[3]),qty:clean(r[4]),sn1:clean(r[5]),sn2:clean(r[6]),takenDate:clean(r[7]),note:clean(r[8])});}
      if(data.length)centers.push({name:name,rows:data});
    });
    var max=Math.max(5,Number(opts.maxCinemaServiceRows||18));centers.forEach(function(center){var total=Math.max(1,Math.ceil(center.rows.length/max));for(var i=0;i<center.rows.length;i+=max)slides.push({template:'cinema-service',reportType:'gudang-cinema',department:'CINEMA',groups:[],serviceCenter:center.name,cinemaServiceRows:center.rows.slice(i,i+max),pageNo:Math.floor(i/max)+1,pageTotal:total,period:opts.servicePeriod||'2026'});});
    return {kind:'cinema-service',slides:slides};
  }
  function parseLightingVendor(text,opts){
    opts=opts||{};var rows=compact(splitRows(text)),hi=headerIndex(rows,['TGL','NAMA ALAT','QTY','ACTION']);if(hi<0)throw new Error('Header Lighting Vendor belum terbaca.');
    var h=rows[hi],dateI=findCol(h,[/TGL/]),nameI=findCol(h,[/NAMA ALAT/]),qtyI=findCol(h,[/^QTY$/]),actionI=findCol(h,[/ACTION/]),backupI=findCol(h,[/BACKUP/,/UPGRADE/]),priceI=findCol(h,[/HARGA SEWA/]);
    var groups=[],buf=[];function finish(total,totalPrice){if(!buf.length)return;groups.push({name:buf[0].item,rows:buf,total:clean(total)||String(buf.reduce(function(s,r){return s+num(r.qty);},0)),totalPrice:clean(totalPrice)});buf=[];}
    rows.slice(hi+1).forEach(function(r){var first=upper(r[0]),name=clean(r[nameI]);if(first==='TOTAL'){finish(r[qtyI],r[priceI]);return;}if(!clean(r[dateI])&&!name)return;buf.push({date:clean(r[dateI]),item:name,qty:clean(r[qtyI]),action:clean(r[actionI]),backup:clean(r[backupI]),price:clean(r[priceI])});});finish('','');
    var pages=paginateGroups(groups,opts.maxLightingVendorRows||16);return {kind:'lighting-vendor',slides:pages.filter(function(x){return x.length;}).map(function(gs,i){return {template:'lighting-vendor',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingVendorGroups:gs,pageNo:i+1,pageTotal:pages.length,period:opts.period||'JUNI 2026'};})};
  }
  function parseLightingComplaint(text,opts){
    opts=opts||{};var rows=compact(splitRows(text)),hi=headerIndex(rows,['NAMA CUSTOMER','NAMA ALAT','KRONOLOGI','INDIKASI']);if(hi<0)throw new Error('Header Lighting Komplain belum terbaca.');
    var h=rows[hi],noI=findCol(h,[/^NO$/]),dateI=findCol(h,[/TGL/]),custI=findCol(h,[/NAMA CUSTOMER/]),itemI=findCol(h,[/NAMA ALAT/]),qtyI=findCol(h,[/^QTY$/]),chronI=findCol(h,[/KRONOLOGI/]),actionI=findCol(h,[/TINDAKAN/]),expI=findCol(h,[/PENGELUARAN/]),indI=findCol(h,[/INDIKASI/]),picI=findCol(h,[/PIC/]);
    var data=rows.slice(hi+1).filter(function(r){return clean(r[itemI])!=='';}).map(function(r,i){return {no:num(r[noI])||i+1,date:clean(r[dateI]),customer:clean(r[custI]),item:clean(r[itemI]),qty:clean(r[qtyI]),chronology:clean(r[chronI]),action:clean(r[actionI]),expense:clean(r[expI]),indication:clean(r[indI]),pic:clean(r[picI])};});
    var max=Math.max(5,Number(opts.maxLightingComplaintRows||18)),slides=[];for(var i=0;i<data.length;i+=max)slides.push({template:'lighting-complaint',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingComplaints:data.slice(i,i+max),pageNo:Math.floor(i/max)+1,pageTotal:Math.max(1,Math.ceil(data.length/max)),period:opts.period||'JUNI 2026'});return {kind:'lighting-complaint',slides:slides};
  }
  function parseLightingService(text,opts){
    opts=opts||{};var rows=splitRows(text),hi=headerIndex(rows,['NAMA ALAT','TEMPAT SERVICE','TANGGAL SERVICE','INDIKASI RUSAK']);if(hi<0)throw new Error('Header Lighting Service belum terbaca.');
    var groups=[],current=null,lastName='';function push(){if(current&&current.rows.length){groups.push(current);current=null;}}
    rows.slice(hi+1).forEach(function(r){var first=clean(r[0]),name=clean(r[1]);if(/^\d+$/.test(first)){if(name){push();current={name:name,rows:[],stockTitle:'',stockSummary:''};lastName=name;}else if(!current)current={name:lastName||'Barang Service',rows:[],stockTitle:'',stockSummary:''};current.rows.push({no:num(r[0]),item:name||lastName,snLamp:clean(r[2]),snControl:clean(r[3]),serviceCenter:clean(r[4]),date:clean(r[5]),damage:clean(r[6])});}else if(/^Stock /i.test(first)&&current){if(/^Stock BSM/i.test(first)){current.stockSummary=first;push();}else current.stockTitle=first;}});push();
    var pages=paginateGroups(groups,opts.maxLightingServiceRows||16);return {kind:'lighting-service',slides:pages.filter(function(x){return x.length;}).map(function(gs,i){return {template:'lighting-service',reportType:'gudang-lighting',department:'LIGHTING',groups:[],lightingServiceGroups:gs,pageNo:i+1,pageTotal:pages.length,period:opts.period||'JUNI 2026'};})};
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
    if(kind==='audio-vendor') return parseAudioVendor(text,opts);
    if(kind==='audio-complaint') return parseAudioComplaint(text,opts);
    if(kind==='audio-service') return parseAudioService(text,opts);
    if(kind==='cinema-vendor') return parseCinemaVendor(text,opts);
    if(kind==='cinema-complaint') return parseCinemaComplaint(text,opts);
    if(kind==='cinema-service') return parseCinemaService(text,opts);
    if(kind==='lighting-vendor') return parseLightingVendor(text,opts);
    if(kind==='lighting-complaint') return parseLightingComplaint(text,opts);
    if(kind==='lighting-service') return parseLightingService(text,opts);
    if(kind==='admin-matrix') return parseAdmin(text,opts);
    if(typeof opts.genericParser!=='function') throw new Error('Parser generic belum tersedia.');
    var parsed=opts.genericParser(text);
    return {kind:'generic',slides:paginateGeneric(parsed,opts.maxGenericRows||18)};
  }
  return {detectKind:detectKind,parse:parse,parseVendor:parseVendor,parseComplaint:parseComplaint,parseService:parseService,parseAudioVendor:parseAudioVendor,parseAudioComplaint:parseAudioComplaint,parseAudioService:parseAudioService,parseCinemaVendor:parseCinemaVendor,parseCinemaComplaint:parseCinemaComplaint,parseCinemaService:parseCinemaService,parseLightingVendor:parseLightingVendor,parseLightingComplaint:parseLightingComplaint,parseLightingService:parseLightingService,parseAdmin:parseAdmin,paginateGeneric:paginateGeneric};
});