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
assert(html.includes('@page{size:13.333in 7.5in'));
assert(!html.includes('@page{size:A4 landscape'));
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
