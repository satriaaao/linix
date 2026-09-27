const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');

assert(html.includes('id="previewPeriodSearchB"'),'Preview must expose a second month selector');
assert(html.includes('id="presentationPeriodSearchB"'),'Presentation must expose a second month selector');
assert(html.includes('state.quickPeriodA'),'Month slot A must persist');
assert(html.includes('state.quickPeriodB'),'Month slot B must persist');
assert(html.includes('var incomingPeriods=Array.from(new Set(slides.map(reportPeriodKeyFromReport).filter(Boolean)))'),'Imports must identify incoming periods');
assert(html.includes('return !existingPeriod||incomingPeriods.indexOf(existingPeriod)<0;'),'Import must preserve same-template slides from other months');
assert(!html.includes('section.slides=section.slides.filter(function(r){return r.template!==result.kind;}).concat(slides);'),'Template-wide month deletion must not return');
assert(/\.cover-hero\{[\s\S]{0,180}width:57%/.test(html),'Cover photo should occupy a clean right-side panel');
assert(/\.cover-diagonal\{[\s\S]{0,160}width:18%/.test(html),'Cover diagonal should use the premium gradient transition');
assert(html.includes('Foto Gedung / Cover'),'Cover editor should clearly request the building photo');
console.log('Multi-month retention, dual month preview/presentation and clean cover layout passed');
