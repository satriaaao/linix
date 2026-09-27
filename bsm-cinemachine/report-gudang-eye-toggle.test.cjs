const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'report-gudang.html'), 'utf8');
const start = html.indexOf('function compactVisibleTableLayout');
const end = html.indexOf('function applyTableViewPrefsToRoot', start);
if (start < 0 || end < 0) throw new Error('table layout function not found');
const source = html.slice(start, end);

function expectPattern(pattern, label) {
  if (!pattern.test(source)) throw new Error(label);
}

expectPattern(/if\(hidden\.has\(ci\)\)\{[\s\S]{0,180}col\.style\.display="none"/, 'hidden column must be removed from table layout');
expectPattern(/if\(!visibleCols\.length\)\{[\s\S]{0,180}cell\.style\.display="none"/, 'hidden table cell must use display:none');
expectPattern(/\}else\{[\s\S]{0,180}cell\.style\.display=""/, 'restored table cell must clear display:none');

if (!html.includes('prefs.hiddenCols=Array.from(new Set(prefs.hiddenCols.concat(logical)));saveAndRender();')) {
  throw new Error('eye button must update hidden columns and re-render');
}
if (!html.includes('prefs.hiddenRows=Array.from(new Set(prefs.hiddenRows.concat([ri])));saveAndRender();')) {
  throw new Error('row eye button must update hidden rows and re-render');
}

console.log('Report Gudang eye hide/show controls use cross-browser display toggling');
