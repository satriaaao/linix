(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BSMReportEditor=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function renderEditableTable(groups,helpers){
    helpers=helpers||{};
    var esc=helpers.esc||function(v){return String(v==null?'':v);};
    var money=helpers.money||function(n){return String(Number(n||0));};
    var groupQty=helpers.groupQty||function(g){return (g.rows||[]).reduce(function(s,r){return s+Number(r.qty||0);},0);};
    var groupPrice=helpers.groupPrice||function(g){return (g.rows||[]).reduce(function(s,r){return s+Number(r.price||0);},0);};
    if(!groups||!groups.length){
      return '<div class="editor-empty">Belum ada item report. Bisa input manual atau tempel data banyak.</div>';
    }
    var body='';
    groups.forEach(function(group,gIndex){
      var rows=(group.rows&&group.rows.length)?group.rows:[{id:'',date:'',qty:1,action:'',price:0}];
      rows.forEach(function(row,rIndex){
        body+='<tr class="editor-data-row" data-group="'+gIndex+'" data-row="'+rIndex+'">';
        body+='<td class="editor-no">'+(rIndex===0?(gIndex+1):'')+'</td>';
        body+='<td><input class="editor-cell editor-row-input" type="date" data-g="'+gIndex+'" data-r="'+rIndex+'" data-field="date" value="'+esc(row.date||'')+'"></td>';
        body+='<td>'+(rIndex===0?'<input class="editor-cell editor-name-input" data-g="'+gIndex+'" data-field="name" value="'+esc(group.name||'')+'">':'')+'</td>';
        body+='<td><input class="editor-cell editor-row-input editor-number" type="number" min="0" data-g="'+gIndex+'" data-r="'+rIndex+'" data-field="qty" value="'+esc(row.qty==null?'':row.qty)+'"></td>';
        body+='<td><input class="editor-cell editor-row-input" data-g="'+gIndex+'" data-r="'+rIndex+'" data-field="action" value="'+esc(row.action||'')+'"></td>';
        body+='<td><input class="editor-cell editor-row-input editor-number editor-price-input" type="number" min="0" step="100" data-g="'+gIndex+'" data-r="'+rIndex+'" data-field="price" value="'+(Number(row.price)||'')+'"></td>';
        body+='<td class="editor-actions"><button class="editor-mini-btn" data-delete-row="'+gIndex+':'+rIndex+'" title="Hapus baris">×</button></td>';
        body+='</tr>';
      });
      body+='<tr class="editor-total-row">';
      body+='<td></td><td colspan="2"><div class="editor-total-left"><strong>Total</strong><button class="editor-link-btn" data-add-row="'+gIndex+'">+ Baris</button></div></td>';
      body+='<td class="editor-total-qty">'+groupQty(group)+'</td>';
      body+='<td class="editor-total-label">Total Sewa</td>';
      body+='<td class="editor-total-price">Rp '+money(groupPrice(group))+'</td>';
      body+='<td class="editor-actions"><button class="editor-mini-btn danger" data-delete-group="'+gIndex+'" title="Hapus item">×</button></td>';
      body+='</tr>';
    });
    return '<div class="editor-table-wrap"><table class="editor-table"><thead><tr><th>No</th><th>Tanggal</th><th>Item / Temuan</th><th>QTY</th><th>Action</th><th>Nilai</th><th></th></tr></thead><tbody>'+body+'</tbody></table></div>';
  }
  return {renderEditableTable:renderEditableTable};
});