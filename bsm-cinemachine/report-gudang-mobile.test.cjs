const assert = require('assert');
const fs = require('fs');
const ui = require('./report-gudang-ui.js');

const phone = ui.getPreviewLayout(390, 10);
assert.strictEqual(phone.canvasWidth, 1600);
assert.strictEqual(phone.canvasHeight, 900);
assert.strictEqual(phone.viewportWidth, 370);
assert.strictEqual(phone.viewportHeight, 208.125);
assert.strictEqual(phone.scale, 370 / 1600);

const desktop = ui.getPreviewLayout(1920, 24);
assert.strictEqual(desktop.canvasWidth, 1600);
assert.strictEqual(desktop.canvasHeight, 900);
assert.strictEqual(desktop.scale, 1);

const narrow = ui.getPreviewLayout(320, 10);
assert.strictEqual(narrow.viewportWidth, 300);
assert.strictEqual(narrow.viewportHeight, 168.75);

const html = fs.readFileSync('./bsm-cinemachine/report-gudang.html','utf8');
const pageSizeRule='@page{size:13.333in 7.5in;margin:0}';
assert(html.includes(pageSizeRule));
assert.strictEqual((html.match(/@page\{/g)||[]).length,1,'PDF harus hanya punya satu aturan @page 16:9');
assert(!/A4/i.test(html),'PDF tidak boleh memakai ukuran A4');
assert(html.includes('.print-page{width:13.333in;height:7.5in;'));
assert(html.includes('.print-canvas{width:1600px;height:900px;transform:scale(.8)'));
assert(html.includes('html2canvas.min.js'),'direct PDF harus memuat html2canvas');
assert(html.includes('jspdf.umd.min.js'),'direct PDF harus memuat jsPDF');
assert(html.includes('function downloadPdf16x9()'),'harus ada generator download PDF langsung');
assert(html.includes('if(kind===\"pdf\"){closeSidebar();downloadPdf16x9();return;}'),'menu PDF harus download langsung');
assert(!html.includes('if(kind===\"pdf\"){closeSidebar();renderPrintStack();setTimeout(function(){window.print();},60);return;}'),'menu PDF tidak boleh membuka dialog print');
assert(html.includes('width:1600px!important;height:900px!important'));
assert(html.includes('id="previewViewport"'));
assert(html.includes('id="previewCanvas"'));
assert(html.includes('id="downloadsPage"'));
assert(html.includes('id="slidesPage"'));
assert(html.includes('id="coverPage"'));
assert(html.includes('id="tablePage"'));
assert(html.includes('id="previewPage"'));
assert(html.includes('page-break-after:always'));
assert(html.includes('.top-actions .btn.menu-toggle#menuToggle{'));
assert(!html.includes('body:not(.mobile-preview) .report-zone{display:none}'));

console.log('16:9 dashboard mobile/print tests passed');
