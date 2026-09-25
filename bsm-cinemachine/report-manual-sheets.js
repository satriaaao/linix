(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BSMManualSheets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var TYPES={
    it:{
      label:'IT',department:'IT',
      sheets:[
        {id:'omset',label:'Pertumbuhan Omset',pageSize:12,columns:[
          ['bulan','Bulan'],['tahun2024','Tahun 2024'],['tahun2025','Tahun 2025'],['tahun2026','Tahun 2026'],['catatan','Catatan']
        ]},
        {id:'produk',label:'Analisis Produk',pageSize:8,columns:[
          ['nama','Nama Produk'],['jan','Jan'],['feb','Feb'],['mar','Mar'],['apr','Apr'],['mei','Mei'],['jun','Jun'],['jul','Jul'],['agu','Agu'],['sep','Sep'],['okt','Okt'],['nov','Nov'],['des','Des'],['status','Status']
        ]}
      ]
    },
    admin:{
      label:'Admin',department:'ADMIN',
      sheets:[
        {id:'mbr-admin',label:'Data MBR Admin',pageSize:10,columns:[
          ['tanggal','Tanggal'],['jam','Jam'],['kegiatan','Kegiatan'],['customer','Customer / Project'],['delivery','Delivery'],['jemputan','Jemputan'],['suratJalan','Surat Jalan'],['ket','KET'],['catatan','Catatan']
        ]}
      ]
    },
    'gudang-kamera':warehouse('Gudang Kamera','KAMERA'),
    'gudang-audio':warehouse('Gudang Audio','AUDIO'),
    'gudang-lighting':warehouse('Gudang Lighting','LIGHTING'),
    'gudang-cinema':warehouse('Gudang Cinema','CINEMA'),
    'koordinator-crew':{
      label:'Koordinator Crew',department:'KOORDINATOR CREW',
      sheets:[
        {id:'kegiatan',label:'Kegiatan Crew',pageSize:9,columns:[
          ['tanggal','Tanggal'],['nama','Nama Crew'],['spesialisasi','Spesialisasi'],['kegiatan','Kegiatan'],['jalan','Ngawal / Jalan'],['penolakan','Penolakan'],['komplain','Komplain'],['skorsing','Skorsing'],['poin','Poin'],['catatan','Catatan']
        ]},
        {id:'rekap',label:'Rekap Crew',pageSize:12,columns:[
          ['nama','Nama Crew'],['totalJalan','Total Jalan'],['penolakan','Penolakan'],['komplain','Komplain'],['skorsing','Skorsing'],['totalPoin','Total Poin'],['status','Status']
        ]}
      ]
    },
    marketing:{
      label:'Marketing',department:'MARKETING',
      sheets:[
        {id:'campaign',label:'Campaign',pageSize:9,columns:[
          ['tanggal','Tanggal'],['campaign','Campaign'],['channel','Channel'],['target','Target'],['realisasi','Realisasi'],['leads','Leads'],['budget','Budget'],['omset','Omset'],['status','Status'],['catatan','Catatan']
        ]},
        {id:'konten',label:'Konten & Sosial Media',pageSize:10,columns:[
          ['tanggal','Tanggal'],['konten','Konten'],['platform','Platform'],['reach','Reach'],['engagement','Engagement'],['leads','Leads'],['status','Status'],['catatan','Catatan']
        ]}
      ]
    }
  };

  function warehouse(label,department){
    return {
      label:label,department:department,
      sheets:[
        {id:'vendor',label:'Barang Kurang / Vendor',pageSize:11,columns:[
          ['tanggal','Tgl Penyewaan'],['namaAlat','Nama Alat'],['qty','QTY'],['action','Action / Vendor'],['backup','Backup / Upgrade'],['harga','Harga Sewa'],['pic','PIC / Keterangan']
        ]},
        {id:'service',label:'Barang Service',pageSize:12,columns:[
          ['namaAlat','Model / Nama Alat'],['tanggal','Tanggal'],['stokSn','Stok Kantor / SN'],['total','Total'],['diService','Di Service'],['bisaJalan','Bisa Jalan'],['keterangan','Keterangan']
        ]},
        {id:'komplain',label:'Komplain',pageSize:8,columns:[
          ['tanggal','Tanggal'],['customer','Nama Customer'],['namaAlat','Nama Alat'],['qty','QTY'],['indikasi','Indikasi'],['kronologi','Kronologi'],['tindakan','Tindakan'],['pengeluaran','Pengeluaran'],['pic','PIC']
        ]}
      ]
    };
  }

  function clone(v){return JSON.parse(JSON.stringify(v==null?{}:v));}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function typeDef(typeId){return TYPES[typeId]||TYPES.it;}
  function sheetDef(typeId,sheetId){
    var def=typeDef(typeId),found=def.sheets.find(function(x){return x.id===sheetId;});
    return found||def.sheets[0];
  }
  function emptyRow(def){
    var out={};
    (def.columns||[]).forEach(function(c){out[c[0]]='';});
    return out;
  }
  function ensureBook(store,typeId,minRows){
    store=store&&typeof store==='object'?store:{};
    var def=typeDef(typeId),book=store[typeId];
    if(!book||typeof book!=='object')book={activeSheet:def.sheets[0].id,sheets:{}};
    if(!book.sheets||typeof book.sheets!=='object')book.sheets={};
    if(!def.sheets.some(function(s){return s.id===book.activeSheet;}))book.activeSheet=def.sheets[0].id;
    def.sheets.forEach(function(s){
      var sheet=book.sheets[s.id];
      if(!sheet||typeof sheet!=='object')sheet={rows:[]};
      if(!Array.isArray(sheet.rows))sheet.rows=[];
      sheet.rows=sheet.rows.map(function(r){
        if(isWarehouse(typeId))return migrateWarehouseRow(r,s);
        var row={};
        s.columns.forEach(function(c){row[c[0]]=String(r&&r[c[0]]!=null?r[c[0]]:'');});
        return row;
      });
      var target=Math.max(1,Number(minRows||6));
      while(sheet.rows.length<target)sheet.rows.push(emptyRow(s));
      book.sheets[s.id]=sheet;
    });
    store[typeId]=book;
    return book;
  }
  function rowEmpty(row,def){
    return !(def.columns||[]).some(function(c){return String(row&&row[c[0]]!=null?row[c[0]]:'').trim()!=='';});
  }
  function dataRows(book,typeId,sheetId){
    var def=sheetDef(typeId,sheetId),sheet=book&&book.sheets&&book.sheets[sheetId];
    return (sheet&&Array.isArray(sheet.rows)?sheet.rows:[]).filter(function(r){return !rowEmpty(r,def);});
  }
  function isWarehouse(typeId){return String(typeId||'').indexOf('gudang-')===0;}
  function cleanName(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function numberValue(v){
    var s=String(v==null?'':v).trim();
    if(!s)return 0;
    s=s.replace(/rp\.?/ig,'').replace(/\s/g,'');
    if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');
    else if(/^[-+]?\d+(,\d+)$/.test(s))s=s.replace(',','.');
    else s=s.replace(/[^0-9.+-]/g,'');
    var n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  function formatTotal(n){
    return Number(n||0).toLocaleString('id-ID',{maximumFractionDigits:2});
  }
  function totalKeys(sheetId){
    if(sheetId==='vendor')return ['qty','harga'];
    if(sheetId==='service')return ['total','diService','bisaJalan'];
    if(sheetId==='komplain')return ['qty','pengeluaran'];
    return [];
  }
  function migrateWarehouseRow(row,def){
    row=row||{};
    var source=Object.assign({},row);
    if(def.id==='service'){
      if(source.stokSn==null&&source.sn!=null)source.stokSn=source.sn;
      if(source.keterangan==null||source.keterangan==='')source.keterangan=source.status||source.indikasi||source.pic||'';
    }
    var out={};
    def.columns.forEach(function(c){out[c[0]]=String(source[c[0]]!=null?source[c[0]]:'');});
    return out;
  }
  function groupedWarehouseEntries(typeId,def,sheetRows,includeEmpty){
    if(!isWarehouse(typeId))return (sheetRows||[]).map(function(row,index){return {kind:'data',row:row,index:index};});
    var namedOrder=[],named={},other=[],empty=[];
    (sheetRows||[]).forEach(function(row,index){
      if(rowEmpty(row,def)){if(includeEmpty)empty.push({kind:'data',row:row,index:index});return;}
      var name=cleanName(row&&row.namaAlat),key=name.toLocaleLowerCase('id-ID');
      if(!name){other.push({kind:'data',row:row,index:index});return;}
      if(!named[key]){named[key]={name:name,items:[]};namedOrder.push(key);}
      named[key].items.push({kind:'data',row:row,index:index});
    });
    var out=[];
    namedOrder.forEach(function(key){
      var group=named[key];
      group.items.forEach(function(item){out.push(item);});
      var total={};
      def.columns.forEach(function(c){total[c[0]]='';});
      total.namaAlat='Total '+group.name;
      totalKeys(def.id).forEach(function(k){
        total[k]=formatTotal(group.items.reduce(function(sum,item){return sum+numberValue(item.row&&item.row[k]);},0));
      });
      out.push({kind:'total',row:total,name:group.name,count:group.items.length});
    });
    other.forEach(function(item){out.push(item);});
    empty.forEach(function(item){out.push(item);});
    return out;
  }
  function colLetter(index){
    var n=Number(index)+1,s='';
    while(n>0){n--;s=String.fromCharCode(65+(n%26))+s;n=Math.floor(n/26);}
    return s;
  }
  function renderEditor(typeId,book){
    var def=typeDef(typeId),active=sheetDef(typeId,book&&book.activeSheet),sheet=book.sheets[active.id];
    var tabs=def.sheets.map(function(s){
      var count=dataRows(book,typeId,s.id).length;
      return '<button type="button" class="manual-sheet-tab '+(s.id===active.id?'active':'')+'" data-manual-sheet="'+esc(s.id)+'"><span>'+esc(s.label)+'</span><b>'+count+'</b></button>';
    }).join('');
    var heads='<th class="manual-row-index manual-corner">#</th>'+active.columns.map(function(c,i){
      return '<th><span class="manual-col-letter">'+colLetter(i)+'</span><span class="manual-col-name">'+esc(c[1])+'</span></th>';
    }).join('')+'<th class="manual-actions-head">Aksi</th>';
    var editorEntries=groupedWarehouseEntries(typeId,active,sheet.rows||[],true);
    var rows=editorEntries.map(function(entry){
      var row=entry.row||{},r=entry.index;
      if(entry.kind==='total'){
        var totalCells=active.columns.map(function(c){
          var v=row[c[0]]||'';
          return '<td class="'+(c[0]==='namaAlat'?'manual-total-name':'manual-total-value')+'">'+esc(v)+'</td>';
        }).join('');
        return '<tr class="manual-auto-total-row"><th class="manual-row-index">Σ</th>'+totalCells+'<td class="manual-row-actions"><span class="manual-total-badge">AUTO</span></td></tr>';
      }
      var cells=active.columns.map(function(c,ci){
        return '<td><input class="manual-cell" type="text" autocomplete="off" data-manual-row="'+r+'" data-manual-col="'+ci+'" data-manual-key="'+esc(c[0])+'" value="'+esc(row[c[0]])+'" placeholder="—"></td>';
      }).join('');
      return '<tr><th class="manual-row-index">'+(r+1)+'</th>'+cells+'<td class="manual-row-actions"><button type="button" title="Duplikat baris" data-manual-duplicate="'+r+'">⧉</button><button type="button" class="danger" title="Hapus baris" data-manual-delete="'+r+'">×</button></td></tr>';
    }).join('');
    return '<div class="manual-workbook-card">'
      +'<div class="manual-workbook-head"><div><div class="manual-kicker">INPUT MANUAL • EXCEL MODE</div><h3>'+esc(def.label)+'</h3><p>'+(isWarehouse(typeId)?'Nama alat yang sama otomatis dikelompokkan dan dibuat baris TOTAL seperti laporan gudang.':'Setiap report memiliki tabelnya sendiri. Ketik langsung atau paste blok sel dari Excel / Google Sheets.')+'</p></div><div class="manual-head-actions"><span class="manual-save-badge" data-manual-status>Tersimpan otomatis</span><button type="button" class="btn primary" data-manual-preview>Perbarui Preview</button></div></div>'
      +'<div class="manual-sheet-tabs">'+tabs+'</div>'
      +'<div class="manual-toolbar"><button type="button" class="btn" data-manual-add="1">+ 1 Baris</button><button type="button" class="btn" data-manual-add="10">+ 10 Baris</button><button type="button" class="btn" data-manual-export>XLSX</button><button type="button" class="btn ghost-danger" data-manual-clear>Kosongkan Tabel</button><div class="manual-toolbar-spacer"></div><span>Tip: copy beberapa sel dari Excel lalu paste pada sel pertama.</span></div>'
      +'<div class="manual-grid-scroll"><table class="manual-grid-table"><thead><tr>'+heads+'</tr></thead><tbody>'+rows+'</tbody></table></div>'
      +'<div class="manual-workbook-foot"><span><strong>'+dataRows(book,typeId,active.id).length+'</strong> baris berisi data</span><span>Sheet: <strong>'+esc(active.label)+'</strong></span></div>'
      +'</div>';
  }
  function buildSlides(typeId,book,opts){
    opts=opts||{};
    var type=typeDef(typeId),slides=[];
    type.sheets.forEach(function(def){
      var rows=dataRows(book,typeId,def.id);
      if(!rows.length)return;
      var entries=isWarehouse(typeId)?groupedWarehouseEntries(typeId,def,rows,false):rows.map(function(row){return {kind:'data',row:row};});
      var displayRows=entries.map(function(entry){
        var row=clone(entry.row||{});
        if(entry.kind==='total')row.__autoTotal=true;
        return row;
      });
      var size=Math.max(3,Number(def.pageSize||10)),pages=Math.ceil(displayRows.length/size);
      for(var i=0;i<displayRows.length;i+=size){
        slides.push({
          template:'manual-grid',
          reportType:typeId,
          department:type.department,
          manualSheetId:def.id,
          manualTitle:def.label,
          manualColumns:clone(def.columns),
          manualRows:clone(displayRows.slice(i,i+size)),
          period:opts.period||'2026',
          pageNo:Math.floor(i/size)+1,
          pageTotal:pages,
          subtitle:def.label,
          groups:[]
        });
      }
    });
    return slides;
  }
  function renderSlide(report,escapeFn){
    report=report||{};var e=escapeFn||esc,cols=report.manualColumns||[],rows=report.manualRows||[];
    var count=cols.length,dense=count>9?' manual-grid-dense':(count>7?' manual-grid-medium':'');
    var head='<th class="manual-slide-no">No</th>'+cols.map(function(c){return '<th>'+e(c[1])+'</th>';}).join('');
    var visibleNo=0;
    var body=rows.map(function(row){
      var total=!!(row&&row.__autoTotal);
      if(!total)visibleNo++;
      return '<tr class="'+(total?'manual-slide-total':'')+'"><td class="manual-slide-no">'+(total?'Σ':visibleNo)+'</td>'+cols.map(function(c){return '<td>'+e(row&&row[c[0]]!=null?row[c[0]]:'')+'</td>';}).join('')+'</tr>';
    }).join('');
    var suffix=(report.pageTotal||1)>1?' ('+(report.pageNo||1)+'/'+report.pageTotal+')':'';
    return '<section class="manual-grid-slide'+dense+'"><div class="manual-slide-grid"></div>'
      +'<div class="manual-slide-kicker"><div>// INPUT MANUAL</div><div class="accent">// '+e(String(report.reportType||'REPORT').toUpperCase())+'</div></div>'
      +'<h1>'+e(report.manualTitle||'REPORT')+' <span>'+e(report.department||'BSM RENTAL')+'</span>'+suffix+'</h1>'
      +'<div class="manual-slide-sub">Tabel manual • data tersimpan per report</div>'
      +'<div class="manual-slide-table-wrap"><table class="manual-slide-table"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>'
      +'<div class="manual-slide-footer"><strong>MBR PT BLUE STAR MEDIA</strong><i></i><b>// '+e(report.period||'2026')+'</b></div>'
      +'</section>';
  }
  function exportMatrix(typeId,book,sheetId){
    var def=sheetDef(typeId,sheetId),rows=dataRows(book,typeId,def.id);
    if(isWarehouse(typeId))rows=groupedWarehouseEntries(typeId,def,rows,false).map(function(entry){return entry.row;});
    var matrix=[def.columns.map(function(c){return c[1];})];
    rows.forEach(function(r){matrix.push(def.columns.map(function(c){return r[c[0]]||'';}));});
    return {name:(typeDef(typeId).label+'-'+def.label).replace(/[^a-z0-9]+/gi,'-').toLowerCase(),rows:matrix};
  }
  return {TYPES:TYPES,typeDef:typeDef,sheetDef:sheetDef,emptyRow:emptyRow,ensureBook:ensureBook,rowEmpty:rowEmpty,dataRows:dataRows,isWarehouse:isWarehouse,groupedWarehouseEntries:groupedWarehouseEntries,renderEditor:renderEditor,buildSlides:buildSlides,renderSlide:renderSlide,exportMatrix:exportMatrix,colLetter:colLetter};
});
