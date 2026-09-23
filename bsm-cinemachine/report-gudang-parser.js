(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportParser=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var MONTHS={
    JANUARI:1,JAN:1,JANUARY:1,
    FEBRUARI:2,FEB:2,FEBRUARY:2,
    MARET:3,MAR:3,MARCH:3,
    APRIL:4,APR:4,
    MEI:5,MAY:5,
    JUNI:6,JUN:6,JUNE:6,
    JULI:7,JUL:7,JULY:7,
    AGUSTUS:8,AGU:8,AUG:8,AUGUST:8,
    SEPTEMBER:9,SEP:9,SEPT:9,
    OKTOBER:10,OKT:10,OCT:10,OCTOBER:10,
    NOVEMBER:11,NOV:11,
    DESEMBER:12,DES:12,DEC:12,DECEMBER:12
  };
  function cleanCell(value){
    var s=String(value==null?'':value).trim();
    if(s.length>=2 && s.charAt(0)==='"' && s.charAt(s.length-1)==='"'){
      s=s.slice(1,-1).replace(/""/g,'"');
    }
    return s.trim();
  }
  function parsePrice(value){
    var s=cleanCell(value);
    if(!s || !/\d/.test(s)) return 0;
    var digits=s.replace(/[^0-9]/g,'');
    return digits?Number(digits):0;
  }
  function parseQty(value){
    var n=Number(String(value==null?'':value).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function normalizeDate(value,defaultYear){
    var s=cleanCell(value);
    if(!s) return '';
    var iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(iso) return iso[1]+'-'+String(Number(iso[2])).padStart(2,'0')+'-'+String(Number(iso[3])).padStart(2,'0');
    var dmy=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if(dmy){
      var y=Number(dmy[3]); if(y<100) y+=2000;
      return y+'-'+String(Number(dmy[2])).padStart(2,'0')+'-'+String(Number(dmy[1])).padStart(2,'0');
    }
    var mon=s.match(/^(\d{1,2})[-\s]([A-Za-z]+)[-\s](\d{2,4})$/);
    if(mon){
      var m=MONTHS[String(mon[2]).toUpperCase()];
      if(m){
        var yy=Number(mon[3]); if(yy<100) yy+=2000;
        return yy+'-'+String(m).padStart(2,'0')+'-'+String(Number(mon[1])).padStart(2,'0');
      }
    }
    var dMon=s.match(/^(\d{1,2})[-\s]([A-Za-z]+)$/);
    if(dMon){
      var mm=MONTHS[String(dMon[2]).toUpperCase()];
      if(mm) return Number(defaultYear||new Date().getFullYear())+'-'+String(mm).padStart(2,'0')+'-'+String(Number(dMon[1])).padStart(2,'0');
    }
    return s;
  }
  function splitLine(line){
    if(line.indexOf('\t')>=0) return line.split('\t').map(cleanCell);
    return line.trim().split(/\s{2,}/).map(cleanCell);
  }
  function parseBulkText(text){
    var raw=String(text||'').replace(/\r/g,'');
    var lines=raw.split('\n').map(function(x){return x.replace(/\u00a0/g,' ');}).filter(function(x){return x.trim()!=='';});
    if(!lines.length) throw new Error('Data kosong. Tempel data report terlebih dahulu.');

    var department='LIGHTING',month=6,year=new Date().getFullYear(),subtitle='Report Barang Kurang / Ambil Vendor';
    var titleLine=lines.find(function(x){return /report\s+gudang/i.test(x)&&/bsm\s+rental/i.test(x);});
    if(titleLine){
      var dm=titleLine.match(/report\s+gudang\s+(.+?)\s+bsm\s+rental/i);
      if(dm&&dm[1]) department=cleanCell(dm[1]).toUpperCase();
    }
    var periodLine=lines.find(function(x){return /(?:priode|periode)/i.test(x);});
    if(periodLine){
      var pm=periodLine.match(/(?:priode|periode)\s+([A-Za-z]+)\s+(\d{4})/i);
      if(pm){
        month=MONTHS[String(pm[1]).toUpperCase()]||month;
        year=Number(pm[2])||year;
      }
    }
    var subCandidate=lines.find(function(x){return /report\s+barang/i.test(x) && !/report\s+gudang/i.test(x);});
    if(subCandidate) subtitle=cleanCell(subCandidate);

    var headerIndex=lines.findIndex(function(x){return /TGL\s*Penyewaan/i.test(x)&&/QTY/i.test(x)&&/Action/i.test(x);});
    var dataLines=headerIndex>=0?lines.slice(headerIndex+1):lines;
    var groups=[],current=null;

    dataLines.forEach(function(line){
      var cells=splitLine(line);
      if(!cells.length) return;
      var first=(cells[0]||'').trim();
      if(/^total\b/i.test(first)||/^total\b/i.test(line.trim())) return;

      var numeric=/^\d+$/.test(first);
      var dateCell=numeric?(cells[1]||''):(first===''?(cells[1]||''):(cells[0]||''));
      var nameCell=numeric?(cells[2]||''):(first===''?(cells[2]||''):'');
      var qtyCell=numeric?(cells[3]||''):(first===''?(cells[3]||''):(cells[1]||''));
      var actionCell=numeric?(cells[4]||''):(first===''?(cells[4]||''):(cells[2]||''));
      var priceCell=cells.length?cells[cells.length-1]:'';

      if(numeric){
        current={id:'g'+(groups.length+1),name:cleanCell(nameCell)||('Barang '+first),rows:[]};
        groups.push(current);
      }
      if(!current) return;

      var normalized=normalizeDate(dateCell,year);
      if(!normalized || !/\d/.test(normalized)) return;
      current.rows.push({
        id:'r'+groups.length+'-'+(current.rows.length+1),
        date:normalized,
        qty:parseQty(qtyCell),
        action:cleanCell(actionCell),
        price:parsePrice(priceCell)
      });
    });

    groups=groups.filter(function(g){return g.rows.length>0;});
    if(!groups.length) throw new Error('Baris tabel belum terbaca. Pastikan data memiliki kolom No, TGL Penyewaan, Nama Alat, QTY, Action, dan Harga Sewa.');
    return {department:department,month:month,year:year,subtitle:subtitle,groups:groups};
  }
  return {parseBulkText:parseBulkText,normalizeDate:normalizeDate,parsePrice:parsePrice};
});