const assert=require('node:assert/strict');
const D=require('./drive-folder-lib.js');
assert.equal(D.extractFolderId('https://drive.google.com/drive/u/0/mobile/folders/1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR?usp=sharing'),'1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR');
assert.equal(D.extractResourceKey('https://drive.google.com/drive/folders/abc123456789?resourcekey=0-test'),'0-test');
assert.equal(D.isVideoName('promo.MP4'),true);
assert.equal(D.isVideoName('poster.jpg'),false);
const html='<a href="https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/view?usp=drive_web"><div class="flip-entry-title">Promo BSM.mp4</div></a>'+
'<a href="https://drive.google.com/file/d/1XyZaBcDeFgHiJkLmNoPqRsTuVw98765/view?usp=drive_web"><div class="flip-entry-title">Poster.jpg</div></a>';
const files=D.parseEmbeddedFolderHtml(html);
assert.equal(files.length,2);
assert.equal(files[0].name,'Promo BSM.mp4');
assert.equal(files[0].isVideo,true);
assert.equal(files[1].isVideo,false);
console.log('drive-folder-lib tests passed');