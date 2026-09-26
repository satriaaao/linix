const assert=require('node:assert/strict');
const V=require('./drive-video-lib.js');

assert.equal(V.safeFileId('1mMEyQ_U0XvYgtNff6LruWIrHM6Gklh3Z'),'1mMEyQ_U0XvYgtNff6LruWIrHM6Gklh3Z');
assert.equal(V.safeFileId('../etc/passwd'),'');
assert.equal(V.mimeFor('promo.mp4','application/octet-stream'),'video/mp4');
assert.equal(V.mimeFor('promo.webm','application/octet-stream'),'video/webm');
assert.equal(V.mimeFor('promo.mov','application/octet-stream'),'video/quicktime');
assert.equal(V.mimeFor('promo.mp4','video/mp4'),'video/mp4');
assert.ok(V.downloadUrl('1mMEyQ_U0XvYgtNff6LruWIrHM6Gklh3Z').includes('drive.usercontent.google.com/download'));
assert.deepEqual(V.forwardRange({'range':'bytes=0-1023'}),{'range':'bytes=0-1023','accept-encoding':'identity'});
console.log('drive-video-lib tests passed');