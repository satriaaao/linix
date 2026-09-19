const assert = require('assert');
const kernel = require('../cms-kernel-20260918.js');
const cms = require('../api/cms.js');

const ui = kernel.MANIFEST.find(x => x.id === 'cms-ui');
assert.ok(ui, 'cms-ui manifest entry must exist');
assert.ok(
  ui.src.includes('81eb7a8963c3ad50dd93daded6003f3825bb1739') &&
  ui.src.includes('cms-admin-all-tables-adapter-20260918.js'),
  'cms-ui must load the advanced CMS adapter from an immutable known-good commit'
);

assert.strictEqual(typeof cms._sanitizeCmsHtml, 'function', 'CMS HTML sanitizer must be exported for regression testing');
const dirty = '<!doctype html><head><link rel="stylesheet" href="/assets/vendor/f4c7a2d91b-cart-mobile-layout-fix-20260919.css"><link rel="stylesheet" href="/cms.css"></head><body></body>';
const clean = cms._sanitizeCmsHtml(dirty);
assert.ok(!clean.includes('cart-mobile-layout-fix-20260919.css'), 'cart-only CSS must not leak into CMS');
assert.ok(clean.includes('/cms.css'), 'CMS styles must be preserved');

console.log('cms runtime guard regression tests passed');
