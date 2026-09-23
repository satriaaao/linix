# Report Gudang Dashboard 16:9 — Design

Date: 2026-09-23
Project: BSM Rental Report Gudang Generator
Route: /report-gudang.html

## Goal

Refactor the existing Report Gudang tool into a conventional dashboard-style system that works consistently on laptop and phone, keeps editing workflows compact, exposes each data area through a clear sidebar menu, and renders/exports every presentation slide in a true 16:9 format.

## Success Criteria

1. Desktop uses a persistent left sidebar and a main content area.
2. Mobile uses a hamburger button that opens the same sidebar as a slide-in drawer.
3. Each data-oriented menu opens a dedicated page/panel with a table, not a long stacked form.
4. Tables remain editable where editing is allowed.
5. Data tables can be downloaded as XLSX and CSV.
6. Preview uses a fixed 1600×900 canvas and only scales visually to fit the viewport.
7. Cover and report slides share the same 1600×900 canvas size.
8. PDF output uses a 16:9 page matching the preview instead of A4.
9. Existing slide navigation, bulk import, cover editing, logo upload, logo sizing/positioning, local persistence, and print/export behavior remain available.

## Information Architecture

Sidebar menus:

- Dashboard / Slide
- Cover Slide 1
- Input Banyak
- Editor Tabel
- Preview
- Download Data
- PDF 16:9
- Pengaturan

Desktop:
- Sidebar remains visible on the left.
- Main area shows the selected menu page.
- Preview can be opened directly from Preview.

Mobile:
- Header contains brand and hamburger menu.
- Sidebar becomes a left drawer with a dimmed backdrop.
- Menu selection closes the drawer and opens the selected page.
- Editor forms that need focused input use a bottom-sheet/modal.

## Data Pages

### Slide
Table columns:
- No
- Type
- Name
- Period
- Status
- Actions

Actions:
- Open
- Duplicate
- Delete (report slides only)

### Cover Slide 1
A compact settings table/form:
- Element
- Value
- Action

Editable cover fields:
- Logo
- Logo width
- Logo X
- Logo Y
- Background image
- Main title
- Subtitle
- Period
- Data labels
- Footer text

Image controls stay in a modal to avoid a long page.

### Input Banyak
Contains:
- large paste area
- import button
- parse result preview table
- create slide button

### Editor Tabel
Editable table:
- No
- Date
- Equipment
- QTY
- Action/Vendor
- Rental Price
- Row actions

Per-group totals remain visible.
Add Row and Add Item remain available.

### Download Data
Show available datasets as rows:
- Slide list
- Report table
- Cover settings
- Current slide data

Each row provides:
- Download XLSX
- Download CSV

## 16:9 Preview System

Canonical slide size:
- Width: 1600 px
- Height: 900 px
- Ratio: 16:9

The DOM canvas always stays 1600×900.
Desktop and mobile only apply a scale transform/zoom based on available width.
Content is never reflowed specifically for mobile preview, so preview appearance stays identical across devices.

Preview area:
- centered canvas
- neutral dark/light stage around the slide
- compact previous/next controls
- slide counter
- optional fullscreen preview button

## PDF Output

PDF/print target must be 16:9.

CSS print page:
- custom page size matching 16:9
- no A4 assumptions
- one slide per page
- cover is page 1
- each report slide is a following page
- no browser UI/sidebar in print

The exported visual must match the 1600×900 preview proportions.

## Download Formats

Both formats are supported:

- XLSX for normal office workflows
- CSV as a lightweight fallback

Downloads are generated from the current local state so they match what is visible in the editor.

## State Model

Keep the existing localStorage state and extend it only where needed.

Existing:
- draft
- slides
- activeSlide
- activeView
- cover

Additional UI state should remain ephemeral where possible:
- selected sidebar menu
- drawer open/closed
- active modal
- preview scale

Do not persist temporary UI state unless it improves continuity.

## Files

Primary files:
- bsm-cinemachine/report-gudang.html
- bsm-cinemachine/report-gudang-ui.js

Existing helpers retained:
- report-gudang-parser.js
- report-gudang-editor.js
- report-gudang-cover.js

Potential new helper:
- report-gudang-export.js for XLSX/CSV serialization and download generation

## Error Handling

- Invalid bulk data shows a readable message without losing current state.
- Download failures show a toast.
- Missing cover image/logo falls back to existing default rendering.
- Mobile drawer/modal must always be closable by close button, backdrop tap, and Escape where supported.
- Preview scaling failure falls back to horizontal-safe full canvas rather than clipping content.

## Testing

Add tests for:
- 1600×900 preview size
- responsive scale calculation
- sidebar menu rendering
- mobile drawer state hooks
- table export data mapping
- XLSX/CSV filename generation
- PDF/print stylesheet markers
- cover logo persistence
- existing parser/editor regression checks

## Non-Goals

- No server database migration.
- No account/auth system change.
- No external file storage.
- No replacement of the current slide data model.
