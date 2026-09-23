# Report Gudang Dashboard 16:9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Refactor Report Gudang into a standard desktop/mobile dashboard with table-based menu pages, XLSX/CSV downloads, and a canonical 1600×900 (16:9) preview/PDF pipeline.

**Architecture:** Keep the existing static HTML + helper-module architecture and localStorage data model. Add a focused export helper, make sidebar navigation select dedicated content pages instead of moving long forms around, and normalize both cover/report slides to a single 1600×900 canvas that is visually scaled to the viewport while print/PDF uses the same 16:9 geometry.

**Tech Stack:** Static HTML/CSS/JavaScript, browser localStorage, existing GitHub/Vercel deployment, Node-compatible CommonJS test helpers, SheetJS browser bundle for true XLSX export.

**Spec:** docs/superpowers/specs/2026-09-23-report-gudang-dashboard-16x9-design.md

## Global Constraints

- Canonical slide size is exactly 1600×900 px.
- All preview surfaces use a 16:9 ratio on both desktop and mobile.
- PDF/print output uses a 16:9 page, not A4.
- Desktop uses a persistent left sidebar.
- Mobile uses the same sidebar as a hamburger drawer.
- Data-oriented menu pages use tables instead of long stacked forms.
- Existing localStorage state keys and slide data model remain compatible.
- Existing cover editing, logo upload/size/position, bulk import, table editing, slide navigation, and local persistence remain available.
- Both XLSX and CSV download formats are supported.
- Do not add server/database/auth changes.

## Review Focus

- Very narrow mobile viewport (320–360 px): preview must remain fully visible at 16:9 without horizontal clipping.
- Long equipment/vendor text: editor table may scroll, but the 1600×900 slide preview must not reflow or change ratio.
- Empty slide/report dataset: sidebar pages and download actions must stay usable and downloads must produce valid headers instead of crashing.
- Uploaded logo/background stored as data URLs: preview and print must preserve them without changing slide dimensions.
- Multiple report slides: PDF print must create exactly one 16:9 page per slide with cover first and no browser/dashboard UI.

---

### Task 1: Lock preview geometry to 1600×900

**Files:**
- Modify: bsm-cinemachine/report-gudang-ui.js
- Modify: bsm-cinemachine/report-gudang-mobile.test.cjs
- Test: bsm-cinemachine/report-gudang-mobile.test.cjs

**Interfaces:**
- Consumes: viewport width in CSS pixels.
- Produces: getPreviewLayout(viewportWidth, sidePadding) returning { scale, viewportWidth, viewportHeight, canvasWidth:1600, canvasHeight:900 }.

- [ ] **Step 1: Replace old 1480×820 test expectations with failing 1600×900 tests**

~~~js
const assert = require('assert');
const ui = require('./report-gudang-ui.js');

const phone = ui.getPreviewLayout(390, 10);
assert.strictEqual(phone.canvasWidth, 1600);
assert.strictEqual(phone.canvasHeight, 900);
assert.strictEqual(phone.viewportWidth, 370);
assert.strictEqual(phone.viewportHeight, 208.125);
assert.strictEqual(phone.scale, 370 / 1600);

const desktop = ui.getPreviewLayout(1920, 24);
assert.strictEqual(desktop.canvasWidth, 1600);
assert.strictEqual(desktop.canvasHeight, 900);
assert.strictEqual(desktop.scale, 1);

const narrow = ui.getPreviewLayout(320, 10);
assert.strictEqual(narrow.viewportWidth, 300);
assert.strictEqual(narrow.viewportHeight, 168.75);
~~~

- [ ] **Step 2: Run test and verify RED**

Run: node bsm-cinemachine/report-gudang-mobile.test.cjs

Expected: FAIL because getPreviewLayout does not exist and existing helpers still assume 1480×820.

- [ ] **Step 3: Implement minimal helper**

~~~js
function getPreviewLayout(viewportWidth, sidePadding){
  var canvasWidth = 1600;
  var canvasHeight = 900;
  var pad = Number(sidePadding == null ? 10 : sidePadding);
  var available = Math.max(0, Number(viewportWidth || 0) - (pad * 2));
  var scale = Math.min(1, Math.max(.12, available / canvasWidth));
  return {
    scale: scale,
    viewportWidth: canvasWidth * scale,
    viewportHeight: canvasHeight * scale,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  };
}
~~~

Export it from report-gudang-ui.js.

- [ ] **Step 4: Run helper tests**

Run:
- node bsm-cinemachine/report-gudang-mobile.test.cjs
- node bsm-cinemachine/report-gudang-ui.test.cjs

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add bsm-cinemachine/report-gudang-ui.js bsm-cinemachine/report-gudang-mobile.test.cjs
git commit -m "refactor: standardize report preview at 16x9"
~~~

---

### Task 2: Add dataset export mapping for CSV and XLSX

**Files:**
- Create: bsm-cinemachine/report-gudang-export.js
- Create: bsm-cinemachine/report-gudang-export.test.cjs
- Modify: bsm-cinemachine/report-gudang.html

**Interfaces:**
- Consumes: state, active report, cover settings.
- Produces:
  - buildReportRows(report)
  - buildSlideRows(state)
  - buildCoverRows(cover)
  - csvString(rows)
  - safeFilename(base, ext)
  - downloadDataset(format, filename, rows)

- [ ] **Step 1: Write failing export tests**

~~~js
const assert = require('assert');
const exp = require('./report-gudang-export.js');

const report = {
  groups: [{
    name: 'Spotlight 36"',
    rows: [
      {date:'2026-06-01',qty:1,action:'DS',price:133200},
      {date:'2026-06-22',qty:1,action:'GEN',price:166500}
    ]
  }]
};

const rows = exp.buildReportRows(report);
assert.deepStrictEqual(rows[0], ['No','Tanggal','Nama Alat','QTY','Action / Vendor','Harga Sewa']);
assert.deepStrictEqual(rows[1], [1,'2026-06-01','Spotlight 36"',1,'DS',133200]);

const csv = exp.csvString([['Nama','Harga'],['A, B',133200]]);
assert(csv.includes('"A, B"'));
assert.strictEqual(exp.safeFilename('Report Gudang JUNI 2026','xlsx'),'report-gudang-juni-2026.xlsx');

const empty = exp.buildReportRows({groups:[]});
assert.strictEqual(empty.length, 1);
~~~

- [ ] **Step 2: Run and verify RED**

Run: node bsm-cinemachine/report-gudang-export.test.cjs

Expected: FAIL because export helper does not exist.

- [ ] **Step 3: Implement pure row mapping and CSV escaping**

Browser download behavior:
- CSV uses Blob + object URL.
- XLSX uses window.XLSX.utils.aoa_to_sheet(rows), creates a workbook, appends a Data sheet, and calls XLSX.writeFile.
- If window.XLSX is missing, throw Error("XLSX library belum termuat").

- [ ] **Step 4: Add SheetJS browser dependency**

Add before app scripts:

~~~html
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="/report-gudang-export.js"></script>
~~~

- [ ] **Step 5: Run tests**

Run: node bsm-cinemachine/report-gudang-export.test.cjs

Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add bsm-cinemachine/report-gudang-export.js bsm-cinemachine/report-gudang-export.test.cjs bsm-cinemachine/report-gudang.html
git commit -m "feat: add csv and xlsx report exports"
~~~

---

### Task 3: Replace popup-first navigation with standard dashboard pages

**Files:**
- Modify: bsm-cinemachine/report-gudang.html
- Modify: bsm-cinemachine/report-gudang-ui.js
- Modify: bsm-cinemachine/report-gudang-ui.test.cjs

**Interfaces:**
- Consumes: state and renderSidebar(active).
- Produces: showPage(pageId) plus dedicated page containers.

- [ ] **Step 1: Update sidebar test for standard menu**

~~~js
const sidebar = ui.renderSidebar('preview');
['slides','cover','bulk','table','preview','downloads','pdf','settings'].forEach(key => {
  assert(sidebar.includes('data-menu="' + key + '"'));
});
assert(sidebar.includes('class="rg-sidebar-item active"'));
~~~

- [ ] **Step 2: Run and verify RED**

Run: node bsm-cinemachine/report-gudang-ui.test.cjs

Expected: FAIL because current sidebar still exposes print/csv directly.

- [ ] **Step 3: Update sidebar renderer**

Use:
- Slide
- Cover Slide 1
- Input Banyak
- Editor Tabel
- Preview
- Download Data
- PDF 16:9
- Pengaturan

- [ ] **Step 4: Create dedicated page containers in main content**

~~~html
<section class="dashboard-page" id="slidesPage"></section>
<section class="dashboard-page" id="coverPage"></section>
<section class="dashboard-page" id="bulkPage"></section>
<section class="dashboard-page" id="tablePage"></section>
<section class="dashboard-page active" id="previewPage"></section>
<section class="dashboard-page" id="downloadPage"></section>
<section class="dashboard-page" id="settingsPage"></section>
~~~

Move current cover editor, bulk editor, report info/editor table, and preview into their permanent pages. Stop moving those nodes into modal containers.

- [ ] **Step 5: Implement showPage(pageId)**

~~~js
function showPage(pageId){
  activeMenu = pageId;
  Array.prototype.forEach.call(document.querySelectorAll('.dashboard-page'), function(page){
    page.classList.toggle('active', page.id === pageId + 'Page');
  });
  renderSidebarNav();
  closeSidebar();
  if(pageId === 'preview') requestAnimationFrame(updatePreviewScale);
}
~~~

- [ ] **Step 6: Keep modal only for focused cover image/logo edits**

Bulk/table/slides should be regular pages. Image/logo editors may remain modal/bottom-sheet.

- [ ] **Step 7: Style desktop/mobile dashboard**

Desktop:
- persistent 240px sidebar;
- main content fills remaining width.

Mobile:
- hamburger visible;
- sidebar becomes fixed left drawer;
- backdrop closes drawer;
- selected menu closes drawer.

- [ ] **Step 8: Run sidebar tests**

Run: node bsm-cinemachine/report-gudang-ui.test.cjs

Expected: PASS.

- [ ] **Step 9: Commit**

~~~bash
git add bsm-cinemachine/report-gudang.html bsm-cinemachine/report-gudang-ui.js bsm-cinemachine/report-gudang-ui.test.cjs
git commit -m "refactor: use standard dashboard sidebar pages"
~~~

---

### Task 4: Make each data page table-based and downloadable

**Files:**
- Modify: bsm-cinemachine/report-gudang.html
- Modify: bsm-cinemachine/report-gudang-export.js
- Modify: bsm-cinemachine/report-gudang-export.test.cjs

**Interfaces:**
- Consumes: state and Task 2 export helpers.
- Produces: slide table, cover settings table, editor table, downloads table.

- [ ] **Step 1: Add failing slide/cover mapping tests**

~~~js
const state = {
  activeView: 1,
  slides: [{department:'LIGHTING',month:6,year:2026,groups:[]}],
  cover: {mainTitle2:'GUDANG LIGHTING',period:'JULI 2026'}
};

const slideRows = exp.buildSlideRows(state);
assert.deepStrictEqual(slideRows[0], ['No','Tipe','Nama','Periode']);
assert.strictEqual(slideRows[1][1], 'Cover');
assert.strictEqual(slideRows[2][1], 'Report');

const coverRows = exp.buildCoverRows(state.cover);
assert.deepStrictEqual(coverRows[0], ['Field','Value']);
assert(coverRows.some(row => row[0] === 'Judul Utama' && row[1] === 'GUDANG LIGHTING'));
~~~

- [ ] **Step 2: Run and verify RED**

Run: node bsm-cinemachine/report-gudang-export.test.cjs

Expected: FAIL until buildSlideRows/buildCoverRows exist.

- [ ] **Step 3: Implement slide/cover mappings**

Cover is row 1. Reports start at row 2. Cover settings include logo, logo width/X/Y, background, main title, period, item labels, and footer.

- [ ] **Step 4: Render Slide page as table**

Columns:
- No
- Tipe
- Nama
- Periode
- Status
- Aksi

Actions:
- Buka
- Duplikat (reports only)
- Hapus (reports only)

- [ ] **Step 5: Render Cover page as compact editable table**

Columns:
- Elemen
- Nilai
- Aksi

Text rows use inline inputs. Image/logo rows show compact preview + Ubah. Logo detail controls remain focused in modal.

- [ ] **Step 6: Keep Editor Tabel behavior**

Preserve inline date/name/QTY/action/price edit, add row/item, delete row/group, and totals.

- [ ] **Step 7: Build Download Data table**

Rows:
- Daftar Slide
- Report Aktif
- Pengaturan Cover

Columns:
- Data
- Jumlah Baris
- XLSX
- CSV

- [ ] **Step 8: Run tests**

Run:
- node bsm-cinemachine/report-gudang-export.test.cjs
- node bsm-cinemachine/report-gudang-editor.test.cjs

Expected: PASS.

- [ ] **Step 9: Commit**

~~~bash
git add bsm-cinemachine/report-gudang.html bsm-cinemachine/report-gudang-export.js bsm-cinemachine/report-gudang-export.test.cjs
git commit -m "feat: add table based data pages and downloads"
~~~

---

### Task 5: Convert cover and report slides to true 1600×900 canvases

**Files:**
- Modify: bsm-cinemachine/report-gudang.html
- Modify: bsm-cinemachine/report-gudang-cover.js
- Modify: bsm-cinemachine/report-gudang-ui.js
- Test: bsm-cinemachine/report-gudang-mobile.test.cjs

**Interfaces:**
- Consumes: Task 1 getPreviewLayout.
- Produces: all slide DOM with fixed width:1600px;height:900px.

- [ ] **Step 1: Update cover/report CSS**

~~~css
.cover-slide,
.report {
  width:1600px;
  height:900px;
  min-height:900px;
  aspect-ratio:16 / 9;
}
~~~

Remove old 1480×820 assumptions.

- [ ] **Step 2: Adjust cover composition proportionally**

Keep current visual hierarchy with the hero image at right, title at left, and footer inside bottom safe area.

- [ ] **Step 3: Add dense report classes for long tables**

~~~js
var rowCount = report.groups.reduce(function(sum,g){
  return sum + g.rows.length + 1;
}, 0);
reportEl.classList.toggle('report-dense', rowCount > 16);
reportEl.classList.toggle('report-very-dense', rowCount > 24);
~~~

Corresponding CSS reduces font/padding without changing slide height.

- [ ] **Step 4: Use a viewport wrapper and scale only the canvas**

~~~js
function updatePreviewScale(){
  var layout = BSMReportUI.getPreviewLayout(
    window.innerWidth,
    window.innerWidth <= 980 ? 10 : 24
  );
  previewViewport.style.width = layout.viewportWidth + 'px';
  previewViewport.style.height = layout.viewportHeight + 'px';
  previewCanvas.style.transform = 'scale(' + layout.scale + ')';
}
~~~

Use transform-origin: top left and overflow:hidden on the viewport.

- [ ] **Step 5: Run mobile tests**

Run: node bsm-cinemachine/report-gudang-mobile.test.cjs

Expected: PASS for phone and desktop widths.

- [ ] **Step 6: Commit**

~~~bash
git add bsm-cinemachine/report-gudang.html bsm-cinemachine/report-gudang-cover.js bsm-cinemachine/report-gudang-ui.js
git commit -m "feat: render report slides on 1600x900 canvas"
~~~

---

### Task 6: Make Print/PDF match the 16:9 preview exactly

**Files:**
- Modify: bsm-cinemachine/report-gudang.html
- Test: bsm-cinemachine/report-gudang-mobile.test.cjs

**Interfaces:**
- Consumes: 1600×900 print stack.
- Produces: one 16:9 page per slide.

- [ ] **Step 1: Add failing static print assertions**

~~~js
const fs = require('fs');
const html = fs.readFileSync('./bsm-cinemachine/report-gudang.html','utf8');
assert(html.includes('@page{size:13.333in 7.5in'));
assert(!html.includes('@page{size:A4 landscape'));
assert(html.includes('page-break-after:always'));
~~~

- [ ] **Step 2: Run and verify RED**

Run: node bsm-cinemachine/report-gudang-mobile.test.cjs

Expected: FAIL because current print CSS still contains A4 landscape.

- [ ] **Step 3: Replace A4 print rules**

~~~css
@media print {
  @page{size:13.333in 7.5in;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  .topbar,.editor,.report-toolbar,.slide-dots{display:none!important}
  .print-stack{display:block!important}
  .print-stack .cover-slide,
  .print-stack .report{
    width:13.333in!important;
    height:7.5in!important;
    min-height:7.5in!important;
    margin:0!important;
    transform:none!important;
    zoom:1!important;
    box-shadow:none!important;
    border:0!important;
    page-break-after:always;
    break-after:page;
  }
  .print-stack > :last-child{
    page-break-after:auto;
    break-after:auto;
  }
}
~~~

- [ ] **Step 4: Keep print stack ordering**

Cover first, then report slides in order.

- [ ] **Step 5: Run test**

Run: node bsm-cinemachine/report-gudang-mobile.test.cjs

Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add bsm-cinemachine/report-gudang.html bsm-cinemachine/report-gudang-mobile.test.cjs
git commit -m "fix: export report pdf in 16x9"
~~~

---

### Task 7: Final integration and regression verification

**Files:**
- Modify only if tests expose defects:
  - bsm-cinemachine/report-gudang.html
  - bsm-cinemachine/report-gudang-ui.js
  - bsm-cinemachine/report-gudang-export.js
  - bsm-cinemachine/report-gudang-cover.js

**Interfaces:**
- Consumes: all previous tasks.
- Produces: production-ready dashboard.

- [ ] **Step 1: Run focused tests**

Run:
- node bsm-cinemachine/report-gudang-ui.test.cjs
- node bsm-cinemachine/report-gudang-mobile.test.cjs
- node bsm-cinemachine/report-gudang-editor.test.cjs
- node bsm-cinemachine/report-gudang-export.test.cjs

Expected: all PASS, no warnings/errors.

- [ ] **Step 2: Run syntax validation**

Evaluate helper files and the inline app script with new Function(...).

Expected: no syntax errors.

- [ ] **Step 3: Verify production manually**

Desktop:
- sidebar visible;
- each menu opens dedicated page;
- data pages are tables;
- preview centered 16:9;
- XLSX/CSV downloads work;
- PDF prints 16:9.

Mobile:
- hamburger visible;
- drawer opens/closes;
- 320–430 px screens show full 16:9 slide;
- preview does not clip horizontally;
- tables scroll independently;
- cover logo/image focused editor remains usable.

- [ ] **Step 4: Verify Vercel**

Latest deployment state must be READY and production route returns HTTP 200.

- [ ] **Step 5: Commit integration fixes if needed**

~~~bash
git add bsm-cinemachine/
git commit -m "fix: polish report dashboard 16x9 integration"
~~~
