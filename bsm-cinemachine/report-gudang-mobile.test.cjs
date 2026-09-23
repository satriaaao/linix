const assert = require('assert');
const ui = require('./report-gudang-ui.js');

assert.strictEqual(ui.computePreviewScale(390,1480,20), 0.23648648648648649);
assert.strictEqual(ui.computePreviewScale(430,1480,20), 0.2635135135135135);
assert.strictEqual(ui.computePreviewScale(1600,1480,20), 1);
assert.strictEqual(ui.computePreviewScale(200,1480,20), 0.12);

const layout = ui.getMobilePreviewLayout(390,1480,820,20);
assert.strictEqual(layout.scale, 0.23648648648648649);
assert.strictEqual(layout.width, 350);
assert.strictEqual(Math.round(layout.height), 194);

console.log('mobile preview helper tests passed');
