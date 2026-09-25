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
        {id:'service',label:'Barang Service',pageSize:10,columns:[
          ['namaAlat','Nama Alat'],['sn','SN'],['tempat','Tempat Service'],['tanggal','Tanggal Service'],['indikasi','Indikasi Rusak'],['status','Status'],['pic','PIC']
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
    var rows=(sheet.rows||[]).map(function(row,r){
      var cells=active.columns.map(function(c,ci){
        return '<td><input class="manual-cell" type="text" autocomplete="off" data-manual-row="'+r+'" data-manual-col="'+ci+'" data-manual-key="'+esc(c[0])+'" value="'+esc(row[c[0]])+'" placeholder="—"></td>';
      }).join('');
      return '<tr><th class="manual-row-index">'+(r+1)+'</th>'+cells+'<td class="manual-row-actions"><button type="button" title="Duplikat baris" data-manual-duplicate="'+r+'">⧉</button><button type="button" class="danger" title="Hapus baris" data-manual-delete="'+r+'">×</button></td></tr>';
    }).join('');
    return '<div class="manual-workbook-card">'
      +'<div class="manual-workbook-head"><div><div class="manual-kicker">INPUT MANUAL • EXCEL MODE</div><h3>'+esc(def.label)+'</h3><p>Setiap report memiliki tabelnya sendiri. Ketik langsung atau paste blok sel dari Excel / Google Sheets.</p></div><div class="manual-head-actions"><span class="manual-save-badge" data-manual-status>Tersimpan otomatis</span><button type="button" class="btn primary" data-manual-preview>Perbarui Preview</button></div></div>'
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
      var size=Math.max(3,Number(def.pageSize||10)),pages=Math.ceil(rows.length/size);
      for(var i=0;i<rows.length;i+=size){
        slides.push({
          template:'manual-grid',
          reportType:typeId,
          department:type.department,
          manualSheetId:def.id,
          manualTitle:def.label,
          manualColumns:clone(def.columns),
          manualRows:clone(rows.slice(i,i+size)),
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
    var body=rows.map(function(row,i){
      return '<tr><td class="manual-slide-no">'+(i+1)+'</td>'+cols.map(function(c){return '<td>'+e(row&&row[c[0]]!=null?row[c[0]]:'')+'</td>';}).join('')+'</tr>';
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
    var matrix=[def.columns.map(function(c){return c[1];})];
    rows.forEach(function(r){matrix.push(def.columns.map(function(c){return r[c[0]]||'';}));});
    return {name:(typeDef(typeId).label+'-'+def.label).replace(/[^a-z0-9]+/gi,'-').toLowerCase(),rows:matrix};
  }
  return {TYPES:TYPES,typeDef:typeDef,sheetDef:sheetDef,emptyRow:emptyRow,ensureBook:ensureBook,rowEmpty:rowEmpty,dataRows:dataRows,renderEditor:renderEditor,buildSlides:buildSlides,renderSlide:renderSlide,exportMatrix:exportMatrix,colLetter:colLetter};
});
