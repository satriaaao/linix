const assert = require('assert');
const editor = require('./report-gudang-editor.js');

const groups = [{
  id:'g1',
  name:'Spotlight 36"',
  rows:[
    {id:'r1',date:'2026-06-01',qty:1,action:'Spotlight 19" DS',price:133200},
    {id:'r2',date:'2026-06-22',qty:1,action:'DS',price:166500}
  ]
}];

const html = editor.renderEditableTable(groups,{
  esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),
  money:n=>new Intl.NumberFormat('id-ID').format(Number(n||0)),
  groupQty:g=>g.rows.reduce((s,r)=>s+Number(r.qty||0),0),
  groupPrice:g=>g.rows.reduce((s,r)=>s+Number(r.price||0),0)
});

assert(html.includes('class="editor-table-wrap"'));
assert(html.includes('data-field="date"'));
assert(html.includes('data-field="name"'));
assert(html.includes('data-field="qty"'));
assert(html.includes('data-field="action"'));
assert(html.includes('data-field="price"'));
assert(html.includes('Spotlight 36&quot;'));
assert(html.includes('133200'));
assert(html.includes('299.700'));
assert(html.includes('data-add-row="0"'));
assert(html.includes('data-delete-group="0"'));
assert(html.includes('data-delete-row="0:1"'));
console.log('report-gudang-editor tests passed');
