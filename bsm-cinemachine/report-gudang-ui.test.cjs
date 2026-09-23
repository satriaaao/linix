const assert = require('assert');
const ui = require('./report-gudang-ui.js');

const sidebar = ui.renderSidebar('preview');
['slides','cover','bulk','table','preview','downloads','pdf','settings'].forEach(key => {
  assert(sidebar.includes('data-menu="'+key+'"'));
});
assert(sidebar.includes('class="rg-sidebar-item active"'));

const modal = ui.renderModalShell('cover','Edit Cover','<div>Body</div>');
assert(modal.includes('id="rgModal"'));
assert(modal.includes('data-modal="cover"'));

const logo=ui.normalizeLogoSettings({width:180,x:15,y:-10});
assert.deepStrictEqual(logo,{width:180,x:15,y:-10});
assert.deepStrictEqual(ui.normalizeLogoSettings({width:999,x:-999,y:999}),{width:320,x:-200,y:200});

const overlay=ui.renderLogoOverlay({image:'data:image/png;base64,abc',width:200,x:20,y:-5});
assert(overlay.includes('class="cover-uploaded-logo"'));
assert(overlay.includes('width:200px'));
assert(overlay.includes('translate(20px,-5px)'));

console.log('report-gudang-ui tests passed');
