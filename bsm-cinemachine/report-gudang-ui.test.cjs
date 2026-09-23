const assert = require('assert');
const ui = require('./report-gudang-ui.js');

const sidebar = ui.renderSidebar('cover');
assert(sidebar.includes('data-menu="cover"'));
assert(sidebar.includes('data-menu="bulk"'));
assert(sidebar.includes('data-menu="table"'));
assert(sidebar.includes('data-menu="preview"'));
assert(sidebar.includes('data-menu="print"'));
assert(sidebar.includes('data-menu="csv"'));
assert(sidebar.includes('class="rg-sidebar-item active"'));

const modal = ui.renderModalShell('cover','Edit Cover','<div>Body</div>');
assert(modal.includes('id="rgModal"'));
assert(modal.includes('data-modal="cover"'));
assert(modal.includes('Edit Cover'));
assert(modal.includes('<div>Body</div>'));

const logo = ui.normalizeLogoSettings({width:180,x:15,y:-10});
assert.deepStrictEqual(logo,{width:180,x:15,y:-10});
assert.deepStrictEqual(ui.normalizeLogoSettings({width:999,x:-999,y:999}),{width:320,x:-200,y:200});

const overlay = ui.renderLogoOverlay({image:'data:image/png;base64,abc',width:200,x:20,y:-5});
assert(overlay.includes('class="cover-uploaded-logo"'));
assert(overlay.includes('width:200px'));
assert(overlay.includes('translate(20px,-5px)'));
assert(overlay.includes('data:image/png;base64,abc'));

const logoEditor = ui.renderLogoEditor({image:'data:image/png;base64,abc',width:200,x:20,y:-5});
assert(logoEditor.includes('id="coverLogoInput"'));
assert(logoEditor.includes('data-logo-setting="width"'));
assert(logoEditor.includes('data-logo-setting="x"'));
assert(logoEditor.includes('data-logo-setting="y"'));
assert(logoEditor.includes('data-reset-logo'));

console.log('report-gudang-ui tests passed');
