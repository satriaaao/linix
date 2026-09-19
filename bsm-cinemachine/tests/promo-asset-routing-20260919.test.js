const assert = require('assert');
const site = require('../api/site.js');

const fixture = '<!doctype html><html><head><title>x</title><meta name="description" content="x"></head><body><main id="app"></main><script src="/public-template-popup-20260913.js"></script></body></html>';
const seo = {
  title:'Rentcam',
  description:'Rentcam',
  canonical:'https://rentalcamera.aiorbitlab.me/',
  robots:'index,follow',
  h1:'Rentcam',
  summary:'Rentcam',
  schema:[]
};

const out = site._patchPublicHtml(fixture, seo);
const expected = 'https://cdn.jsdelivr.net/gh/satriaaao/linix@43cd238cb9eaafd8f4d0f9a330ff5e4c7a1b4811/bsm-cinemachine/public-template-popup-20260913.js';

assert.ok(out.includes(expected), 'promo runtime must use immutable direct CDN asset');
assert.ok(!out.includes('src="/public-template-popup-20260913.js"'), 'promo runtime must not depend on a Vercel rewrite that can 404');
assert.ok(out.includes('43cd238cb9eaafd8f4d0f9a330ff5e4c7a1b4811'), 'promo runtime must use mobile hard-navigation build');

console.log('promo asset routing regression tests passed');
