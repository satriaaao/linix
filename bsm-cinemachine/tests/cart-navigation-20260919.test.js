const assert = require('assert');
const site = require('../api/site.js');

const fixture = `<!doctype html><html><head><title>Rentcam</title><meta name="description" content="Rentcam"></head><body>
<button class="rc-cart-button" data-go="/cart" aria-label="Keranjang rental">Cart</button>
<script>document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){e.preventDefault();location.href=g.dataset.go}})</script>
<script src="/cart-click-fix-20260914.js?v=legacy"></script>
<main id="app"></main>
</body></html>`;

const seo = {
  title:'Rental Cart | Rentcam',
  description:'Keranjang rental Rentcam.',
  canonical:'https://rentalcamera.aiorbitlab.me/cart',
  robots:'noindex,nofollow',
  h1:'Rental Cart',
  summary:'Keranjang rental pelanggan.',
  schema:[]
};

const out = site._patchPublicHtml(fixture, seo);

assert.ok(out.includes('data-go="/cart"'), 'cart keeps the normal data-go navigation path');
assert.ok(!out.includes('/cart-click-fix-20260914.js'), 'legacy cart script must be removed');
assert.ok(!out.includes('rc-cart-direct-handler'), 'no extra direct cart handler should be injected');
assert.ok(!out.includes("addEventListener('pointerup'"), 'pointerup cart handler must not exist');
assert.ok(!out.includes("addEventListener('touchend'"), 'touchend cart handler must not exist');
assert.ok(!out.includes('z-index:9999'), 'cart must not sit above the mobile drawer');
assert.ok(out.includes('touch-action:manipulation'), 'cart keeps mobile tap hardening');

console.log('cart navigation regression tests passed');
