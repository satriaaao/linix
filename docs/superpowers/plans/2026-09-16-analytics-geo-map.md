# Analytics Geo Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-preserving geo analytics, product-name click counts, anonymous visitor counts, and an aggregate map to Rentcam Analytics without changing the public website UI.

**Architecture:** Existing browser analytics calls to Supabase will be transparently intercepted before `cms-public-runtime-v8-20260912.js` runs and rerouted to a Vercel serverless endpoint. The endpoint reads Vercel geolocation headers, hashes only the random session id, rounds coordinates, and inserts the enriched event into the existing `rentcam_events.meta` JSONB field. A CMS enhancer replaces the basic `#v5report` contents with richer tables and a Leaflet/OpenStreetMap aggregate map.

**Tech Stack:** Vanilla JavaScript, Vercel Node Functions, Supabase/PostgREST, Leaflet 1.9.4, OpenStreetMap, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-16-analytics-geo-map-design.md`

## Global Constraints

- Do not change the public website layout or visual design.
- Do not store or display raw visitor IP addresses.
- Do not request browser GPS/location permission.
- Keep old analytics events readable when `meta.geo` is absent.
- Tracking failures must never block public navigation or product clicks.
- Use city/region/country and rounded IP-geolocation coordinates only.

---

### Task 1: Pure analytics helpers

**Files:**
- Create: `bsm-cinemachine/analytics-geo-lib-20260916.js`
- Test: `bsm-cinemachine/tests/analytics-geo-20260916.test.js`

**Interfaces:**
- Produces `RentcamAnalyticsGeo.roundCoord`, `normalizeGeo`, `productName`, `summarize`.

- [ ] Write failing Node tests for coordinate rounding, product-name resolution, location grouping, and anonymous visitor count.
- [ ] Run `node --test bsm-cinemachine/tests/analytics-geo-20260916.test.js` and confirm failure because the helper module does not exist.
- [ ] Implement the UMD/CommonJS helper module.
- [ ] Run the test again and confirm all tests pass.

### Task 2: Vercel analytics event endpoint

**Files:**
- Create: `bsm-cinemachine/api/analytics-event.js`
- Test: `bsm-cinemachine/tests/analytics-endpoint-20260916.test.js`

**Interfaces:**
- Consumes JSON `{event_type,path,product_id,session_id,meta}`.
- Produces a Supabase `rentcam_events` insert with `meta.geo` and `meta.visitor_hash`.

- [ ] Write failing tests for method validation, invalid event validation, geo header normalization, no raw-IP persistence, and successful Supabase insert payload.
- [ ] Run `node --test bsm-cinemachine/tests/analytics-endpoint-20260916.test.js` and confirm failure.
- [ ] Implement the serverless handler using Node `crypto` and Vercel geo headers.
- [ ] Run endpoint tests and confirm all pass.

### Task 3: Public tracking interceptor

**Files:**
- Create: `bsm-cinemachine/analytics-geo-interceptor-20260916.js`
- Create: `bsm-cinemachine/product-search-analytics-loader-20260916.js`
- Modify: `bsm-cinemachine/vercel.json`

**Interfaces:**
- Intercepts only POSTs to `/rest/v1/rentcam_events` and forwards their body to `/api/analytics-event`.
- All other fetch requests remain unchanged.

- [ ] Implement a fetch interceptor that fails open to the original Supabase request if the Vercel endpoint cannot be reached.
- [ ] Preserve the original product-search script by loading it synchronously before the interceptor.
- [ ] Point `/product-search-20260912.js` at the new loader in `vercel.json`.
- [ ] Verify source inspection shows the interceptor loads before the fixed-commit `cms-public-runtime-v8-20260912.js`.

### Task 4: Rich CMS Analytics dashboard

**Files:**
- Create: `bsm-cinemachine/analytics-geo-dashboard-20260916.js`
- Modify: `bsm-cinemachine/rental-insights-loader-20260916.js`

**Interfaces:**
- Watches for `#v5report`, fetches 7-day events and current presence, and renders metrics, Top Produk, Top Lokasi, recent activity, and map.

- [ ] Load Leaflet 1.9.4 CSS/JS lazily only on the Analytics page.
- [ ] Query `rentcam_events` including `meta` and resolve product names from `P`, `RENTCAM_CMS_CONFIG.productOverrides`, and `customProducts`.
- [ ] Render product name + ID + click count, location table, anonymous unique visitors, and recent event location.
- [ ] Render an OpenStreetMap map with one aggregate marker per rounded location and no exact address/IP.
- [ ] Update `rental-insights-loader-20260916.js` to load the dashboard enhancer synchronously.

### Task 5: Preview and production verification

**Files:**
- Modify only deployment refs if a commit-SHA pin is needed in `bsm-cinemachine/vercel.json`.

**Interfaces:**
- Preview must expose `/`, `/cms`, `/api/analytics-event`, `/product-search-20260912.js`, and `/rental-insights-20260913.js`.

- [ ] Run both Node test files and confirm zero failures.
- [ ] Deploy preview and verify `/` and `/cms` return `200 text/html`.
- [ ] POST a synthetic allowed analytics event to the preview endpoint and verify a success response without raw IP in the payload/response.
- [ ] Verify rewritten analytics assets return `200 application/javascript`.
- [ ] Promote/deploy the same artifact to production.
- [ ] Verify production routes/assets and check Vercel runtime errors.
