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
        {id:'service',label:'Barang Service',pageSize:14,columns:[
          ['namaAlat','Nama Alat'],['snLampu','SN Lampu'],['snControl','SN Control Box'],['serviceCenter','Tempat Service'],['tanggal','Tanggal Service'],['damage','Indikasi Rusak']
        ]},
        {id:'komplain',label:'Komplain',pageSize:8,columns:[
          ['tanggal','Tanggal'],['customer','Nama Customer'],['namaAlat','Nama Alat'],['qty','QTY'],['indikasi','Indikasi'],['kronologi','Kronologi'],['tindakan','Tindakan'],['pengeluaran','Pengeluaran'],['pic','PIC']
        ]}
      ]
    };
  }

  var MONTH_NAMES=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  function clone(v){return JSON.parse(JSON.stringify(v==null?{}:v));}
  function defaultPeriodKey(){
    var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0');
    return d.getFullYear()+'-'+m;
  }
  function normalizePeriodKey(key){
    var m=String(key||'').match(/^(\d{4})-(\d{1,2})$/);
    if(!m)return defaultPeriodKey();
    var month=Math.max(1,Math.min(12,Number(m[2]||1)));
    return String(Number(m[1]||new Date().getFullYear()))+'-'+String(month).padStart(2,'0');
  }
  function periodParts(key){
    key=normalizePeriodKey(key);var p=key.split('-');
    return {key:key,year:Number(p[0]),month:Number(p[1]),monthIndex:Number(p[1])-1};
  }
  function periodLabel(key){
    var p=periodParts(key);return MONTH_NAMES[p.monthIndex]+' '+p.year;
  }
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function typeDef(typeId){return TYPES[typeId]||TYPES.it;}
  function slug(v){
    var s=String(v==null?'':v).toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    return s||'kolom';
  }
  function normalizeColumns(columns,fallback){
    var source=Array.isArray(columns)&&columns.length?columns:fallback;
    var seen={};
    return (source||[]).map(function(c,i){
      var key=slug(Array.isArray(c)?c[0]:'kolom_'+(i+1));
      if(seen[key]){var base=key,n=2;while(seen[base+'_'+n])n++;key=base+'_'+n;}
      seen[key]=true;
      return [key,String(Array.isArray(c)?(c[1]||c[0]||('Kolom '+(i+1))):('Kolom '+(i+1)))];
    });
  }
  function allSheetDefs(typeId,book){
    var base=typeDef(typeId).sheets.map(function(s){return clone(s);});
    var custom=book&&Array.isArray(book.customSheets)?book.customSheets:[];
    custom.forEach(function(s){
      if(!s||!s.id)return;
      base.push({id:String(s.id),label:String(s.label||'Tabel Baru'),pageSize:Number(s.pageSize||10),custom:true,columns:normalizeColumns(s.columns,[['nama','Nama'],['nilai','Nilai'],['keterangan','Keterangan']])});
    });
    return base;
  }
  function sheetDef(typeId,sheetId,book){
    var defs=allSheetDefs(typeId,book),found=defs.find(function(x){return x.id===sheetId;});
    if(!found)found=defs[0];
    if(book&&book.sheets&&book.sheets[found.id]&&Array.isArray(book.sheets[found.id].columns)&&book.sheets[found.id].columns.length){
      found=clone(found);found.columns=normalizeColumns(book.sheets[found.id].columns,found.columns);
    }
    return found;
  }
  function emptyRow(def){
    var out={};
    (def.columns||[]).forEach(function(c){out[c[0]]='';});
    return out;
  }
  function ensureBook(store,typeId,minRows,preferredPeriod){
    store=store&&typeof store==='object'?store:{};
    var def=typeDef(typeId),book=store[typeId];
    if(!book||typeof book!=='object')book={activeSheet:def.sheets[0].id,sheets:{},customSheets:[]};
    if(!book.sheets||typeof book.sheets!=='object')book.sheets={};
    if(!Array.isArray(book.customSheets))book.customSheets=[];
    if(!book.activePeriod)book.activePeriod=normalizePeriodKey(preferredPeriod||defaultPeriodKey());
    else book.activePeriod=normalizePeriodKey(book.activePeriod);
    var defs=allSheetDefs(typeId,book);
    if(!defs.some(function(s){return s.id===book.activeSheet;}))book.activeSheet=defs[0].id;
    defs.forEach(function(baseDef){
      var sheet=book.sheets[baseDef.id];
      if(!sheet||typeof sheet!=='object')sheet={rows:[],columns:clone(baseDef.columns),periodRows:{}};
      sheet.columns=normalizeColumns(sheet.columns,baseDef.columns);
      var s=clone(baseDef);s.columns=clone(sheet.columns);
      if(!sheet.periodRows||typeof sheet.periodRows!=='object'){
        sheet.periodRows={};
        if(Array.isArray(sheet.rows)&&sheet.rows.some(function(r){return !rowEmpty(r,s);})){
          sheet.periodRows[book.activePeriod]=sheet.rows;
        }
      }
      if(!Array.isArray(sheet.periodRows[book.activePeriod]))sheet.periodRows[book.activePeriod]=[];
      sheet.periodRows[book.activePeriod]=sheet.periodRows[book.activePeriod].map(function(r){
        if(isWarehouse(typeId)&&s.columns.some(function(c){return c[0]==='namaAlat';}))return migrateWarehouseRow(r,s);
        var row={};
        s.columns.forEach(function(col){row[col[0]]=String(r&&r[col[0]]!=null?r[col[0]]:'');});
        return row;
      });
      var target=Math.max(1,Number(minRows||6));
      while(sheet.periodRows[book.activePeriod].length<target)sheet.periodRows[book.activePeriod].push(emptyRow(s));
      sheet.rows=sheet.periodRows[book.activePeriod];
      book.sheets[s.id]=sheet;
    });
    store[typeId]=book;
    return book;
  }
  function setPeriod(book,typeId,key,minRows){
    book.activePeriod=normalizePeriodKey(key);
    var defs=allSheetDefs(typeId,book);
    defs.forEach(function(baseDef){
      var sheet=book.sheets[baseDef.id]||(book.sheets[baseDef.id]={columns:clone(baseDef.columns),periodRows:{}});
      if(!sheet.periodRows||typeof sheet.periodRows!=='object')sheet.periodRows={};
      if(!Array.isArray(sheet.periodRows[book.activePeriod]))sheet.periodRows[book.activePeriod]=[];
      var def=sheetDef(typeId,baseDef.id,book),target=Math.max(1,Number(minRows||6));
      while(sheet.periodRows[book.activePeriod].length<target)sheet.periodRows[book.activePeriod].push(emptyRow(def));
      sheet.rows=sheet.periodRows[book.activePeriod];
    });
    return book.activePeriod;
  }
  function periodKeys(book,typeId){
    var seen={};
    allSheetDefs(typeId,book).forEach(function(def){
      var sheet=book.sheets&&book.sheets[def.id];
      var periods=sheet&&sheet.periodRows&&typeof sheet.periodRows==='object'?Object.keys(sheet.periodRows):[];
      periods.forEach(function(key){
        var rows=sheet.periodRows[key]||[],effective=sheetDef(typeId,def.id,book);
        if(rows.some(function(r){return !rowEmpty(r,effective);}))seen[normalizePeriodKey(key)]=true;
      });
    });
    var keys=Object.keys(seen).sort();
    if(!keys.length)keys=[normalizePeriodKey(book.activePeriod)];
    return keys;
  }
  function rowEmpty(row,def){
    return !(def.columns||[]).some(function(c){return String(row&&row[c[0]]!=null?row[c[0]]:'').trim()!=='';});
  }
  function dataRows(book,typeId,sheetId,periodKey){
    var def=sheetDef(typeId,sheetId,book),sheet=book&&book.sheets&&book.sheets[sheetId],rows=[];
    if(sheet){
      if(periodKey&&sheet.periodRows&&Array.isArray(sheet.periodRows[normalizePeriodKey(periodKey)]))rows=sheet.periodRows[normalizePeriodKey(periodKey)];
      else if(Array.isArray(sheet.rows))rows=sheet.rows;
    }
    return rows.filter(function(r){return !rowEmpty(r,def);});
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
  function uniqueSheetId(book,label){
    var base='custom_'+slug(label),id=base,n=2;
    while(book.sheets&&book.sheets[id]){id=base+'_'+n;n++;}
    return id;
  }
  function createSheet(book,typeId,label){
    label=String(label||'Tabel Baru').trim()||'Tabel Baru';
    if(!Array.isArray(book.customSheets))book.customSheets=[];
    if(!book.sheets)book.sheets={};
    var id=uniqueSheetId(book,label);
    var cols=[['nama','Nama'],['nilai','Nilai'],['keterangan','Keterangan']];
    book.customSheets.push({id:id,label:label,pageSize:10,columns:clone(cols),custom:true});
    var period=normalizePeriodKey(book.activePeriod);
    book.sheets[id]={columns:clone(cols),periodRows:{}};
    book.sheets[id].periodRows[period]=[];
    book.sheets[id].rows=book.sheets[id].periodRows[period];
    for(var i=0;i<6;i++)book.sheets[id].rows.push(emptyRow({columns:cols}));
    book.activeSheet=id;
    return id;
  }
  function deleteSheet(book,typeId,sheetId){
    var defs=typeDef(typeId).sheets;
    if(defs.some(function(s){return s.id===sheetId;}))return false;
    book.customSheets=(book.customSheets||[]).filter(function(s){return s.id!==sheetId;});
    if(book.sheets)delete book.sheets[sheetId];
    var all=allSheetDefs(typeId,book);
    book.activeSheet=(all[0]&&all[0].id)||defs[0].id;
    return true;
  }
  function addColumn(book,typeId,sheetId,label){
    var sheet=book.sheets[sheetId],def=sheetDef(typeId,sheetId,book);
    if(!sheet)throw new Error('Sheet tidak ditemukan');
    var cols=normalizeColumns(sheet.columns,def.columns),base=slug(label||('Kolom '+(cols.length+1))),key=base,n=2;
    while(cols.some(function(c){return c[0]===key;})){key=base+'_'+n;n++;}
    cols.push([key,String(label||('Kolom '+cols.length)).trim()||('Kolom '+cols.length)]);
    sheet.columns=cols;
    (sheet.rows||[]).forEach(function(r){if(r[key]==null)r[key]='';});
    var custom=(book.customSheets||[]).find(function(s){return s.id===sheetId;});
    if(custom)custom.columns=clone(cols);
    return key;
  }
  function renameColumn(book,typeId,sheetId,key,label){
    var sheet=book.sheets[sheetId],cols=normalizeColumns(sheet&&sheet.columns,sheetDef(typeId,sheetId,book).columns);
    var col=cols.find(function(c){return c[0]===key;});
    if(!col)return false;
    col[1]=String(label||col[1]).trim()||col[1];sheet.columns=cols;
    var custom=(book.customSheets||[]).find(function(s){return s.id===sheetId;});
    if(custom)custom.columns=clone(cols);
    return true;
  }
  function deleteColumn(book,typeId,sheetId,key){
    var sheet=book.sheets[sheetId];if(!sheet)return false;
    var cols=normalizeColumns(sheet.columns,sheetDef(typeId,sheetId,book).columns);
    if(cols.length<=1)return false;
    sheet.columns=cols.filter(function(c){return c[0]!==key;});
    (sheet.rows||[]).forEach(function(r){delete r[key];});
    var custom=(book.customSheets||[]).find(function(s){return s.id===sheetId;});
    if(custom)custom.columns=clone(sheet.columns);
    return true;
  }
  function replaceSheetSchema(book,typeId,sheetId,labels,matrixRows,periodKey){
    if(!book||!book.sheets)throw new Error('Workbook manual belum siap');
    var def=sheetDef(typeId,sheetId,book),sheet=book.sheets[sheetId];
    if(!sheet)throw new Error('Sheet tidak ditemukan');
    var seen={},columns=(labels||[]).map(function(label,i){
      var text=String(label==null?'':label).trim()||('Kolom '+(i+1));
      var base=slug(text),key=base,n=2;
      while(seen[key]){key=base+'_'+n;n++;}
      seen[key]=true;return [key,text];
    });
    if(!columns.length)columns=[['kolom_1','Kolom 1']];
    sheet.columns=clone(columns);
    var custom=(book.customSheets||[]).find(function(s){return s.id===sheetId;});
    if(custom)custom.columns=clone(columns);
    var key=normalizePeriodKey(periodKey||book.activePeriod);
    book.activePeriod=key;
    if(!sheet.periodRows||typeof sheet.periodRows!=='object')sheet.periodRows={};
    sheet.periodRows[key]=(matrixRows||[]).map(function(values){
      var row={};columns.forEach(function(col,i){row[col[0]]=String(values&&values[i]!=null?values[i]:'').trim();});return row;
    });
    while(sheet.periodRows[key].length<6)sheet.periodRows[key].push(emptyRow({columns:columns}));
    sheet.rows=sheet.periodRows[key];
    return columns;
  }
  function colLetter(index){
    var n=Number(index)+1,s='';
    while(n>0){n--;s=String.fromCharCode(65+(n%26))+s;n=Math.floor(n/26);}
    return s;
  }
  function renderEditor(typeId,book){
    var def=typeDef(typeId),defs=allSheetDefs(typeId,book),active=sheetDef(typeId,book&&book.activeSheet,book),sheet=book.sheets[active.id];
    var period=periodParts(book.activePeriod),periodOptions=MONTH_NAMES.map(function(name,i){return '<option value="'+(i+1)+'" '+(period.month===i+1?'selected':'')+'>'+name+'</option>';}).join('');
    var tabs=defs.map(function(s){
      var count=dataRows(book,typeId,s.id,book.activePeriod).length;
      return '<div class="manual-sheet-tab-wrap"><button type="button" class="manual-sheet-tab '+(s.id===active.id?'active':'')+'" data-manual-sheet="'+esc(s.id)+'"><span>'+esc(s.label)+'</span><b>'+count+'</b></button>'+(s.custom?'<button type="button" class="manual-sheet-remove" data-manual-delete-sheet="'+esc(s.id)+'" title="Hapus tabel">×</button>':'')+'</div>';
    }).join('');
    var heads='<th class="manual-row-index manual-corner">#</th>'+active.columns.map(function(c,i){
      return '<th><span class="manual-col-letter">'+colLetter(i)+'</span><span class="manual-col-head"><span class="manual-col-name">'+esc(c[1])+'</span><span class="manual-col-tools"><button type="button" data-manual-rename-col="'+esc(c[0])+'" title="Ubah nama kolom">✎</button><button type="button" data-manual-delete-col="'+esc(c[0])+'" title="Hapus kolom">×</button></span></span></th>';
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
      +'<div class="manual-workbook-head"><div><div class="manual-kicker">INPUT MANUAL • EXCEL MODE</div><h3>'+esc(def.label)+'</h3><p>'+(isWarehouse(typeId)?'Nama alat yang sama otomatis dikelompokkan dan dibuat baris TOTAL seperti laporan gudang.':'Setiap report memiliki tabelnya sendiri. Ketik langsung atau paste blok sel dari Excel / Google Sheets.')+'</p></div><div class="manual-head-actions"><div class="manual-period-picker"><label>Bulan<select data-manual-month>'+periodOptions+'</select></label><label>Tahun<input type="number" min="2020" max="2100" value="'+period.year+'" data-manual-year></label><span>'+esc(periodLabel(book.activePeriod))+'</span></div><span class="manual-save-badge" data-manual-status>Tersimpan otomatis</span><button type="button" class="btn primary" data-manual-preview>Perbarui Preview</button></div></div>'
      +'<div class="manual-sheet-tabs">'+tabs+'<button type="button" class="manual-add-sheet" data-manual-add-sheet>+ Tabel</button></div>'
      +'<div class="manual-toolbar"><button type="button" class="btn primary" data-manual-bulk>+ Input Banyak / Excel</button><button type="button" class="btn" data-manual-add="1">+ 1 Baris</button><button type="button" class="btn" data-manual-add="10">+ 10 Baris</button><button type="button" class="btn primary" data-manual-add-column>+ Kolom</button><button type="button" class="btn" data-manual-export>XLSX</button><button type="button" class="btn ghost-danger" data-manual-clear>Kosongkan Tabel</button><div class="manual-toolbar-spacer"></div><span>Struktur kolom tersimpan otomatis dan bisa dipakai di Input Banyak.</span></div>'
      +'<div class="manual-grid-scroll"><table class="manual-grid-table"><thead><tr>'+heads+'</tr></thead><tbody>'+rows+'</tbody></table></div>'
      +'<div class="manual-workbook-foot"><span><strong>'+dataRows(book,typeId,active.id,book.activePeriod).length+'</strong> baris • <strong>'+esc(periodLabel(book.activePeriod))+'</strong></span><span>Sheet: <strong>'+esc(active.label)+'</strong></span></div>'
      +'</div>';
  }
  function buildSlides(typeId,book,opts){
    opts=opts||{};
    var type=typeDef(typeId),slides=[];
    periodKeys(book,typeId).forEach(function(periodKey){
      var parts=periodParts(periodKey);
      allSheetDefs(typeId,book).forEach(function(baseDef){
        var def=sheetDef(typeId,baseDef.id,book);
        var rows=dataRows(book,typeId,def.id,periodKey);
        if(!rows.length)return;
        var entries=isWarehouse(typeId)?groupedWarehouseEntries(typeId,def,rows,false):rows.map(function(row){return {kind:'data',row:row};});
        var displayRows=entries.map(function(entry){
          var row=clone(entry.row||{});
          if(entry.kind==='total')row.__autoTotal=true;
          return row;
        });
        var colCount=(def.columns||[]).length;
        var adaptiveSize=colCount>14?8:(colCount>10?9:(colCount>7?10:Number(def.pageSize||10)));
        var size=Math.max(3,adaptiveSize),pages=Math.ceil(displayRows.length/size);
        for(var i=0;i<displayRows.length;i+=size){
          slides.push({
            template:'manual-grid',
            reportType:typeId,
            department:type.department,
            manualSheetId:def.id,
            manualTitle:def.label,
            manualColumns:clone(def.columns),
            manualRows:clone(displayRows.slice(i,i+size)),
            manualPeriodKey:periodKey,
            month:parts.month,
            year:parts.year,
            period:periodLabel(periodKey),
            pageNo:Math.floor(i/size)+1,
            pageTotal:pages,
            subtitle:def.label+' • '+periodLabel(periodKey),
            groups:[]
          });
        }
      });
    });
    return slides;
  }
  function renderSlide(report,escapeFn){
    report=report||{};var e=escapeFn||esc,cols=report.manualColumns||[],rows=report.manualRows||[];
    var count=cols.length,dense=count>12?' manual-grid-ultra':(count>9?' manual-grid-dense':(count>7?' manual-grid-medium':''));
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
    var def=sheetDef(typeId,sheetId,book),rows=dataRows(book,typeId,def.id,book.activePeriod);
    if(isWarehouse(typeId))rows=groupedWarehouseEntries(typeId,def,rows,false).map(function(entry){return entry.row;});
    var matrix=[def.columns.map(function(c){return c[1];})];
    rows.forEach(function(r){matrix.push(def.columns.map(function(c){return r[c[0]]||'';}));});
    return {name:(typeDef(typeId).label+'-'+def.label).replace(/[^a-z0-9]+/gi,'-').toLowerCase(),rows:matrix};
  }
  return {TYPES:TYPES,MONTH_NAMES:MONTH_NAMES,typeDef:typeDef,sheetDef:sheetDef,allSheetDefs:allSheetDefs,emptyRow:emptyRow,ensureBook:ensureBook,setPeriod:setPeriod,periodKeys:periodKeys,periodParts:periodParts,periodLabel:periodLabel,normalizePeriodKey:normalizePeriodKey,rowEmpty:rowEmpty,dataRows:dataRows,isWarehouse:isWarehouse,groupedWarehouseEntries:groupedWarehouseEntries,createSheet:createSheet,deleteSheet:deleteSheet,addColumn:addColumn,renameColumn:renameColumn,deleteColumn:deleteColumn,replaceSheetSchema:replaceSheetSchema,renderEditor:renderEditor,buildSlides:buildSlides,renderSlide:renderSlide,exportMatrix:exportMatrix,colLetter:colLetter};
});
