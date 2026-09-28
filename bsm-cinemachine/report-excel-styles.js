// Excel style fidelity v71
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BSMExcelStyles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  var DEFAULT_THEME=['000000','FFFFFF','0E2841','E8E8E8','156082','E97132','196B24','0F9ED5','A02B93','4EA72E','467886','96607D'];
  function hex(v){
    v=String(v||'').replace(/^#/,'').replace(/^FF/i,'').toUpperCase();
    return /^[0-9A-F]{6}$/.test(v)?'#'+v:'';
  }
  function tintColor(base,tint){
    base=String(base||'').replace(/^#/,'');if(!/^[0-9A-Fa-f]{6}$/.test(base))return '';
    tint=Number(tint||0);var out=[];
    for(var i=0;i<6;i+=2){
      var c=parseInt(base.slice(i,i+2),16),v=tint<0?c*(1+tint):c*(1-tint)+255*tint;
      out.push(Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'));
    }
    return '#'+out.join('').toUpperCase();
  }
  function color(c){
    if(!c||typeof c!=='object')return '';
    if(c.rgb)return hex(c.rgb);
    if(c.indexed!=null&&Number(c.indexed)!==64){
      var indexed=['000000','FFFFFF','FF0000','00FF00','0000FF','FFFF00','FF00FF','00FFFF'];
      return indexed[Number(c.indexed)]?'#'+indexed[Number(c.indexed)]:'';
    }
    if(c.theme!=null){
      var base=DEFAULT_THEME[Number(c.theme)];
      return base?tintColor(base,c.tint||0):'';
    }
    return '';
  }
  function extractCellStyle(cell){
    if(!cell||!cell.s||typeof cell.s!=='object')return null;
    var s=cell.s,fill=s.fill&&typeof s.fill==='object'?s.fill:s;
    var font=s.font&&typeof s.font==='object'?s.font:{},align=s.alignment&&typeof s.alignment==='object'?s.alignment:{};
    var pattern=String(fill.patternType||fill.pattern||'').toLowerCase();
    var bg=color(fill.fgColor||fill.color||fill.bgColor),fg=color(font.color);
    var out={};
    if(bg&&(pattern==='solid'||pattern==='2'||!pattern))out.backgroundColor=bg;
    if(fg)out.color=fg;
    if(font.bold)out.fontWeight='700';
    if(font.italic)out.fontStyle='italic';
    if(font.underline)out.textDecoration='underline';
    var h=String(align.horizontal||'').toLowerCase();
    if(/^(left|center|right|justify)$/.test(h))out.textAlign=h;
    if(align.wrapText)out.whiteSpace='normal';
    return Object.keys(out).length?out:null;
  }
  function sheetStyleMatrix(workbook,ws,xlsx,rowCount,colCount){
    rowCount=Math.max(0,Number(rowCount||0));colCount=Math.max(0,Number(colCount||0));
    if(!ws||!xlsx||!xlsx.utils||!xlsx.utils.encode_cell)return [];
    var out=[];
    for(var r=0;r<rowCount;r++){
      var row=[];
      for(var c=0;c<colCount;c++){
        var addr=xlsx.utils.encode_cell({r:r,c:c});
        row.push(extractCellStyle(ws[addr]));
      }
      out.push(row);
    }
    return out;
  }
  function css(style){
    style=style&&typeof style==='object'?style:{};var parts=[];
    var bg=hex(style.backgroundColor);if(bg)parts.push('background-color:'+bg);
    var fg=hex(style.color);if(fg)parts.push('color:'+fg);
    if(style.fontWeight==='700'||style.fontWeight==='bold')parts.push('font-weight:700');
    if(style.fontStyle==='italic')parts.push('font-style:italic');
    if(style.textDecoration==='underline')parts.push('text-decoration:underline');
    if(/^(left|center|right|justify)$/.test(String(style.textAlign||'')))parts.push('text-align:'+style.textAlign);
    if(style.whiteSpace==='normal')parts.push('white-space:normal');
    return parts.join(';');
  }
  function attr(style){var s=css(style);return s?' style="'+s+'"':'';}
  return {extractCellStyle:extractCellStyle,sheetStyleMatrix:sheetStyleMatrix,css:css,attr:attr,color:color,tintColor:tintColor};
});