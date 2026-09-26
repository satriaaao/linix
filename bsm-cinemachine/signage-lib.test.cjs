const assert=require('node:assert/strict');
const S=require('./signage-lib.js');

assert.equal(
  S.extractDriveFileId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/view?usp=sharing'),
  '1AbCdEfGhIjKlMnOpQrStUvWxYz12345'
);
assert.equal(
  S.extractDriveFileId('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz12345'),
  '1AbCdEfGhIjKlMnOpQrStUvWxYz12345'
);
assert.equal(
  S.extractDriveFolderId('https://drive.google.com/drive/u/0/mobile/folders/1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR?usp=sharing'),
  '1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR'
);
assert.equal(
  S.extractDriveFolderId('https://drive.google.com/drive/folders/1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR?resourcekey=abc'),
  '1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR'
);
assert.ok(S.isDriveFolderUrl('https://drive.google.com/drive/u/0/mobile/folders/1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR?usp=sharing'));
assert.ok(S.driveVideoUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/view').includes('drive.usercontent.google.com/download?id='));
const cfg=S.normalizeConfig({name:'Lobby',folderUrl:'https://drive.google.com/drive/folders/1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR',videos:[{title:'Promo',driveUrl:'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/view'}]});
assert.equal(cfg.orientation,'portrait');
assert.equal(cfg.folderUrl,'https://drive.google.com/drive/folders/1yPsaDytDE33lPsbgyK_EjRx9SxzNsPrR');
assert.equal(cfg.videos.length,1);
assert.equal(cfg.videos[0].fit,'cover');
console.log('signage-lib tests passed');