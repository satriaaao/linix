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
assert.equal(V.forwardRange({range:'bytes=0-'}).range,'bytes=0-2097151');
assert.equal(V.forwardRange({range:'bytes=100-9999999'}).range,'bytes=100-2097251');
assert.equal(V.forwardRange({range:'bytes=-65536'}).range,'bytes=-65536');
assert.deepEqual(V.forwardRange({range:'invalid'}),{'accept-encoding':'identity'});
assert.deepEqual(V.forwardRange({range:'bytes=20-10'}),{'accept-encoding':'identity'});
console.log('drive-video-lib tests passed');