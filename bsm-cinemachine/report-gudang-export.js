(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var MONTHS=['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
  function buildReportRows(report){
    var out=[['No','Tanggal','Nama Alat','QTY','Action / Vendor','Harga Sewa']];
    var groups=report&&Array.isArray(report.groups)?report.groups:[];
    groups.forEach(function(group,gIndex){
      (group.rows||[]).forEach(function(row){
        out.push([gIndex+1,row.date||'',group.name||'',Number(row.qty||0),row.action||'',Number(row.price||0)]);
      });
    });
    return out;
  }
  function buildSlideRows(state){
    var out=[['No','Tipe','Nama','Periode']];
    var cover=state&&state.cover?state.cover:{};
    out.push([1,'Cover',cover.mainTitle2||'Cover',cover.period||'']);
    (state&&state.slides||[]).forEach(function(slide,i){
      var month=MONTHS[Math.max(0,Number(slide.month||1)-1)]||'';
      out.push([i+2,'Report',slide.department||'Report',(month+' '+(slide.year||'')).trim()]);
    });
    return out;
  }
  function buildCoverRows(cover){
    cover=cover||{}; var logo=cover.logo||{};
    return [
      ['Field','Value'],
      ['Judul Utama',cover.mainTitle2||''],
      ['Judul Kecil',cover.mainTitle1||''],
      ['Periode',cover.period||''],
      ['Item 1',cover.item1||''],
      ['Item 2',cover.item2||''],
      ['Item 3',cover.item3||''],
      ['Footer',cover.footerLeft||''],
      ['Tagline',cover.footerTagline||''],
      ['Logo',logo.image?'Uploaded':'Default'],
      ['Logo Width',Number(logo.width||180)],
      ['Logo X',Number(logo.x||0)],
      ['Logo Y',Number(logo.y||0)],
      ['Background',cover.image?'Uploaded / URL':'']
    ];
  }
  function csvCell(v){
    var s=String(v==null?'':v);
    return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }
  function csvString(rows){
    return (rows||[]).map(function(row){return row.map(csvCell).join(',');}).join('\n');
  }
  function safeFilename(base,ext){
    var name=String(base||'download').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'download';
    var suffix=String(ext||'csv').toLowerCase().replace(/[^a-z0-9]/g,'')||'csv';
    return name+'.'+suffix;
  }
  function downloadDataset(format,filename,rows){
    format=String(format||'csv').toLowerCase();
    if(typeof window==='undefined'||typeof document==='undefined') throw new Error('Download hanya tersedia di browser');
    if(format==='xlsx'){
      if(!window.XLSX) throw new Error('XLSX library belum termuat');
      var wb=window.XLSX.utils.book_new();
      var ws=window.XLSX.utils.aoa_to_sheet(rows||[]);
      window.XLSX.utils.book_append_sheet(wb,ws,'Data');
      window.XLSX.writeFile(wb,safeFilename(filename,'xlsx'));
      return;
    }
    var blob=new Blob(['\ufeff'+csvString(rows||[])],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=safeFilename(filename,'csv');document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  return {buildReportRows:buildReportRows,buildSlideRows:buildSlideRows,buildCoverRows:buildCoverRows,csvString:csvString,safeFilename:safeFilename,downloadDataset:downloadDataset};
});