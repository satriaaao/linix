const assert=require('node:assert/strict');
const photo=require('../product-photo-20261001');
assert.equal(photo.solidAlpha(0),0);assert.equal(photo.solidAlpha(.03),0);assert.equal(photo.solidAlpha(.2),255);assert.equal(photo.solidAlpha(.5),255);assert(photo.solidAlpha(.1)>0&&photo.solidAlpha(.1)<255);
const pixels=new Uint8ClampedArray(4*4*4);pixels[(1*4+1)*4+3]=255;pixels[(2*4+2)*4+3]=255;assert.deepEqual(photo.bounds(pixels,4,4),{left:1,top:1,width:2,height:2});assert.equal(photo.bounds(new Uint8ClampedArray(16),2,2),null);
console.log('Product PNG: opaque foreground, soft edge transitions and crop bounds passed.');
