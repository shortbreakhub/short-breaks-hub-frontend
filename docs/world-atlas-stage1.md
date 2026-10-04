# World Atlas Stage 1 — Issue #40 review report

**Historical naked-world report:** the current Europe-only artwork experiment supersedes this presentation. See [europe-atlas-experiment.md](europe-atlas-experiment.md) for the active surface, camera, overlay coordinates and measurements. The world assets are retained for review.

Implemented on `feature/40-naked-interactive-world-map`. Issue [#40](https://github.com/shortbreakhub/short-breaks-hub-frontend/issues/40) is the scope authority. **Ready for human visual review; visual acceptance is not claimed. No Stage 2 work has begun.** No commit, push or merge.

## Audit and preserved homepage

The starting tree was clean on the requested branch. Before editing, inspected `HomePage`, `AtlasStage`, `AtlasVisual`, homepage styles/tests/content, English/French translations, dependencies, Vite manifest/build and production prerender; read the #32 protected contracts, #34 performance foundation, #36 shared UI documentation and #38 homepage report. Built and measured the unmodified tree, including cold desktop/mobile requests, and saved representative HTML and the exact 258-path inventory.

Issue #38's atlas used handcrafted geography and six temporary illustrated destination links, with `visualLayer`/`renderLandmark` replacement seams. The hero, responsive photo derivatives, real editorial stories, Region/Country discovery and SEO content already worked. Those surrounding elements remain. Removed `AtlasVisual` and temporary landmark/pin/label styling; only the `HomePage` Atlas invocation changed. Navbar, Footer, editorial sections, image derivatives, itinerary/API implementation and Hotel Search are untouched.

## Engine and geographic architecture

**Pinned `maplibre-gl@6.11.2`**, the sole added mapping library. It supplies Mercator coordinates, camera, gestures and resize handling. Its normal basemap, CSS widgets, labels, tiles, geolocation and controls are not used. The official [MapLibre API](https://maplibre.org/maplibre-gl-js/docs/) fits the required future coordinate overlays.

The SDK and adapter are dynamically imported only after explicit **Explore the map** activation. Before activation, prerendered HTML shows a lightweight geographic SVG derived from the same real data. This deliberate activation protects the critical initial path from a substantial engine download. It adds an interaction step; automatic initialization is not silently introduced later.

The v6 integration uses named module exports and an explicitly Vite-built, same-origin module worker URL. `vite.config.js` sets `worker.format: "es"`. One worker and a maximum pixel ratio of 2 limit rendering resources. Main and worker builds currently duplicate some shared SDK code; the measured bytes include both.

An older bundled-worker release was evaluated, but **not retained**: releases through 6.4.0 have the published [sanitizer advisory](https://github.com/advisories/GHSA-jrc7-96c5-q579). Final audit adds no MapLibre advisory. Existing dependency audit totals remain the same 19 as the starting lockfile (1 low, 3 moderate, 14 high, 1 critical); unrelated upgrades are deferred. Verification used Node 22.23.2. A new transitive JSON-lint package declares Node >=22; confirm the deployment installation runtime before deployment.

### Geography and style

Natural Earth **1:110m land**, GeoJSON from the upstream [Natural Earth vector repository](https://github.com/nvkelso/natural-earth-vector), pinned at commit `693f11422f4e08d2da4566b854dda53eb7c39fb3`, file `geojson/ne_110m_land.geojson`. Exact source URL/hash/processing are in `src/assets/atlas/provenance.json`.

All 127 land features are retained, including antimeridian and polar geometry. Attributes/bboxes are stripped and coordinates rounded to four decimals. Source GeoJSON: 138,160 raw bytes. Delivered GeoJSON: **106,656 raw / 39,056 gzip9 bytes**. The initial SVG preview uses the same polygons projected mathematically to spherical Mercator, with no manually drawn continent shapes: **73,387 raw / 30,539 gzip9 bytes**. Both are checked into the repository and emitted as hashed assets. Their combined geography cost is **69,595 gzip bytes**, below the 75 KB target. No runtime or normal build downloads occur.

Offline regeneration: `npm run atlas:prepare -- /path/to/ne_110m_land.geojson`. The original input hash is `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`.

The local style has exactly two layers: cream background `#f5f0e5` and muted sage land `#ccd5bb`, with antialiased fill. No coastline strokes, borders, roads, tiles, POIs, labels, terrain, grids, routes, compass, landmarks or destination overlays. Projection remains Mercator; land is supporting scenery.

## Cameras, constraints and interactions

Viewport width selects the composition; atlas container width selects the scale. `minZoom = log2(containerWidth / 512)` prevents a small repeated/empty world. Initial zoom adds the offsets below. All coordinates are `[longitude, latitude]`.

| State | Center | Initial zoom | Measured minimum | Atlas dimensions |
|---|---|---:|---:|---|
| Desktop, 1440px | `[10, 20]` | 0.843487 | 0.693487 | 828 × 455px |
| Tablet, 768px | `[15, 18]` | 0.675855 | 0.495855 | 722 × 397px |
| Mobile, 390px | `[25, 28]` | -0.236184 | -0.516184 | 358 × 286px |

Desktop offset +0.15; tablet +0.18; mobile +0.28. The northern world is intentionally cropped through an editorial window; mobile's higher latitude removes the distracting Antarctic strip. The entire data remains available outside the initial viewport. The negative mobile zoom is intentional: one Mercator world is 512px at zoom zero.

Maximum zoom **3.25**, appropriate to regions rather than streets. Bounds **`[[-179.999, -85], [179.999, 85]]`**; distinct longitude endpoints avoid ±180° collapsing to the same normalized meridian. `renderWorldCopies: false`. No repeated worlds, rotation or pitch. Bounds constrain camera panning and excessive empty space; no destination-specific restrictions.

Mouse dragging and keyboard arrows pan. Native labelled 44px buttons zoom ±0.5 and reset; buttons disable at limits. Bare wheel input scrolls the page; Ctrl/Command + wheel zooms. Cooperative touch gestures preserve one-finger page scrolling and use two fingers for map pan/pinch. Double-click/tap zoom is disabled because the SDK's two-finger tap recognizer could undo a small pinch on release. No compass, fullscreen or geolocation UI.

`ResizeObserver` resizes the map, recalculates minimum scale and preserves the user's center and relative zoom, including orientation changes. Reset selects the new viewport's composition. Mobile uses the existing shorter 1000:800 stage; tablet retains its own map row. No horizontal page overflow at any verified size.

## Accessibility, localization and fallback

Semantic Region/Country discovery, six region links, six real itinerary stories, photos, headings and planning entry points remain outside WebGL and in prerendered HTML. Atlas uses a labelled figure/region, meaningful geographic preview alt text, a described canvas and labelled native actions. Keyboard arrows work, visible inset canvas focus survives clipping, Tab exits to controls and then normal navigation. No keyboard trap. Canvas itself does not expose geographic features to screen readers; semantic discovery is the useful accessible alternative until Stage 2.

New strings use the existing English/French translations, including help overlays, loading, errors, reload and controls. Language changes update canvas/help labels without reinitializing the user's map. Loading reserves the stage dimensions, uses a status message and has a **15-second deadline**. No decorative auto-pan/fly; explicit controls/reset use immediate `jumpTo`, and SDK gestures respect reduced-motion preference. Activation transfers focus without scrolling only if the activating button still owns focus; a later selection is not interrupted.

Failures preserve the slogan, discovery, editorial content and itinerary links:

| Failure | Visible response / recovery |
|---|---|
| GeoJSON fetch or invalid data | Real geographic preview + localized alert; direct retry |
| WebGL initialization/context loss | Preview + alert; retry/new map |
| Loading deadline | Preview + alert; abort and remove pending map; retry |
| Adapter/engine module download | Preview + alert; explicitly labelled page reload (failed ES imports are cached) |
| Module-worker download | Preview + alert; page reload; no false direct retry |
| Preview SVG unavailable | Warm editorial text fallback + activation; interactive map can still initialize |

The preview check also handles an image that failed **before hydration** attached the React error listener. Maps, workers, observers, fetches and optional overlay cleanup are released on failure/unmount.

## Runtime network, caching and license audit

**Zero new external runtime requests.** Automatic Atlas requests are exclusively our emitted assets:

1. Initial `world-preview-*.svg`.
2. After activation `createAtlasMap-*.js` (SDK/adapter).
3. After activation `world-land-*.geojson`.
4. After activation `maplibre-gl-worker-*.js`.

Style is an in-memory local object. No external tiles/style/geography/glyphs/sprites, API keys, attribution service or telemetry. Production tests block external requests and confirm activation adds none. Each local asset failure is exercised as above. The homepage already has unrelated external integrations; this issue does not claim the whole site has none. Clicking the optional Natural Earth credit opens its terms page; that is not an automatic map dependency.

Hashed assets can use long-lived immutable caching when deployed; HTML should revalidate. The tests intentionally serve uncached, uncompressed bodies. GeoJSON is fetched only once per activation attempt; preview remains cached if retried. Configure same-origin module-worker support (`worker-src 'self'` if deploying a restrictive CSP), correct JS/GeoJSON/SVG MIME types and asset compression. No tile server can take down this atlas. Older/no-WebGL browsers keep the useful fallback rather than adding another renderer.

MapLibre is BSD-3-Clause: retain the copyright/license notices. Full license is shipped in `public/licenses/MapLibre-LICENSE.txt`, alongside bundled legal comments. Dependency license texts are retained in `public/licenses/MapLibre-dependencies-NOTICES.txt` (24 declared transitive packages, including the MIT notice from murmurhash-js’s packaged README). This static notice adds no homepage request. No compulsory MapLibre/OpenStreetMap basemap attribution widget applies to this custom public-domain source. Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/); credit is optional but visibly provided. There is no tile/API subscription cost.

## Stage 2 integration boundary

`AtlasStage({onMapReady})` exposes the actual MapLibre map once geography is idle; an optional returned function removes future overlays on teardown. The adapter is `src/components/home/atlas/createAtlasMap.js`; styling/cameras are `atlasConfig.js`.

Future assets can attach with MapLibre DOM Markers using real `[lng,lat]`, or a separately rendered DOM layer using `map.project()` and map `move`/`resize` events. Paris and Shanghai projection/unprojection and camera/resize changes are verified without drawing overlays. Homepage hero/discovery/editorial sections need no rewrite. No destination schema, markers, labels, artwork loading, collision or priorities are implemented now.

Recommended next issue, **only after naked-map human approval**: supplied illustrated assets and a small coordinate record (`slug`, `[lng,lat]`, priority, min zoom, asset); responsive 12–16 desktop /4–6 mobile selection; geographic anchoring, collision/priority handling, viewport-deferred assets, accessible semantic destination links and localized hover/tap/keyboard information. Preserve initial landmarks ≤200 KB desktop/≤100 KB mobile combined and deferred assets ≤25 KB each. Keep Hotel/Flight markers, routing and backend changes out of that stage. Resolve/explicitly accept the measured engine overrun before adding further atlas machinery.

## Verification and performance

| Measurement | Before | After | Delta |
|---|---:|---:|---:|
| Initial JS raw | 491,613 | 493,537 | +1,924 |
| Initial JS gzip9 | 159,775 | 160,016 | +241 |
| Initial CSS raw | 79,994 | 82,124 | +2,130 |
| Initial CSS gzip9 | 14,847 | 15,189 | +342 |
| Desktop homepage local bodies, inactive | 870,849 | 942,815 | +71,966 |
| Mobile homepage local bodies, inactive | 982,547 | 1,054,513 | +71,966 |
| Desktop homepage local bodies, activated | 870,849 | 2,575,511 | +1,704,662 |
| Mobile homepage local bodies, activated | 982,547 | 2,687,209 | +1,704,662 |
| All production files raw | 1,385,064,325 | 1,386,775,687 | +1,711,362 |
| Source assets raw | 1,481,851,015 | 1,482,031,725 | +180,710 |

Deferred MapLibre/adapter: **1,017,972 raw /277,066 gzip**. Separate module worker: **508,068 raw /147,239 gzip**. Combined SDK delivery: **1,526,040 raw /424,305 gzip**. Activation adds the GeoJSON as well: **1,632,696 raw /463,361 gzip estimate** on either device. Initial desktop/mobile local weight rises **8.3% /7.3%**; this is a measured cost, not a performance improvement.

The issue-body #38 baseline (159,778 JS /14,841 CSS gzip bytes) is approximate; the actual unchanged-tree measurements above are retained for reproducibility.

Sizes use decimal bytes, identical Node gzip level 9. Cold runtime weights are **uncompressed local response bodies**, desktop 1440×900 DPR1 and mobile 390×844 DPR2, with external integrations blocked. They are not compressed Internet transfer or field CWV. Browser compressed totals in the JSON are estimates from compressing each body; a deployed server's encoding/cache policy may differ. Repository/build totals are recorded separately and are not used as page-load savings.

The **60 KB Atlas-JS target is not met**: the lazy SDK/adapter and module worker total 424,305 bytes gzip. Deferral protects initial delivery but does not make this download disappear. The 180 KB initial-JS and 20 KB CSS #34 guards remain unchanged. A separate 500 KB deferred-engine regression ceiling is added around the measured ~424 KB delivery, explicitly documented as a ceiling, **not** evidence of meeting the original target. Both geographic assets together remain under 75 KB. No Stage 2 asset budget is consumed.

Initial above-fold Atlas asset is the SVG: 73,387 raw /30,539 gzip bytes. Existing English logo/flag are 16,856 raw bytes; total eager image bodies **90,243 raw bytes**. Existing French flag increases shell imagery by 48,164 bytes. Activated geography adds 106,656 raw /39,056 gzip bytes; this is separate from SDK cost. Editorial WebP derivatives/loading/dimensions are unchanged. Native lazy lookahead still requests the seven editorial photos; they are not excluded to improve measurements.

- `npm test`: **625 passed, zero failures/skips**.
- Focused Atlas/homepage/Hotel/performance tests: **25 passed**. Three new Node Atlas tests cover responsive cameras/bounds, authentic global geography/size/style, lazy engine/static budget and deferred-worker ceiling. Homepage tests preserve localized content/images/discovery and update the old landmark assumptions to naked-map SSR semantics.
- `npm run build`: success, including the complete production prerender. **Exactly 258 paths, identical inventory**: home/contact +6 regions +52 countries +198 official itineraries. Existing concurrency and country bootstrap pipeline unchanged.
- Generated homepage, Europe, China, Shanghai: titles, metadata, canonical and JSON-LD deep-equal the saved before output. Non-home prerender payloads unchanged. Homepage retains one slogan H1, seven editorial photos, six semantic region links and all six story destinations; no map-only SEO content. Preview/activation prerender; engine waits for interaction. Existing sitemap/route assumptions unchanged.
- Hotel, all URL inputs and tracking tests pass. Shanghai remains `TRIP_COM / CITY / MAPPED / externalId="2"`; `Allianceid=9927800`, `SID=327885881`, `trip_sub1=` present/empty, `trip_sub3=D19155586`. No live affiliate clicks.
- #34 performance guard passes unchanged. Existing runtime SPA/secondary-route smoke checks pass.
- `npm run homepage:verify`: English/French at 1440/768/390; responsive layout, semantic discovery/retry/reset/navigation, labels, touch targets, focus and no overflow pass.
- `npm run atlas:verify`: actual engine at all six viewport/language combinations; geographic Paris/Shanghai coordinates, mouse/keyboard pan, buttons/Ctrl-wheel zoom, bare-wheel page scrolling, mobile one-finger scrolling/two-finger pinch+pan, resizing, focus/Tab, no pins/labels, source failure/retry; WebGL unavailable, real context loss/recovery and loading deadline all pass. Reduced-motion contexts used.
- `npm run atlas:measure`: real production bundle desktop/mobile; initial versus activated requests and every Atlas asset failure/recovery pass. No new external requests or unhandled page errors.
- `git diff --check`: clean; final diff reviewed for scope creep. No protected product/SEO/affiliate modules changed.

Build warnings remain visible: large MapLibre/worker and existing Lottie chunks; stale Browserslist database; the six documented missing optional food images (five Seattle, one New York). Warning thresholds and tests were not weakened. A concurrent verification run stalled the existing lazy-route test; rerunning the full suite independently passed. Earlier import/worker-path/gesture/fallback failures were corrected and all final checks rerun; failed intermediate runs are not presented as passes.

Screenshots (local review artifacts): `/tmp/issue40-preview-{1440,768,390}-{en,fr}.png`, `/tmp/issue40-map-*`, `/tmp/issue40-hero-*`, `/tmp/issue40-fallback-*`, `/tmp/issue40-production-{desktop,mobile}.png`. Reviewed desktop/tablet/mobile English/French hero and fallback, plus unchanged editorial sections from the homepage verifier. Before screenshots: `/tmp/issue34-issue40-before-home-{desktop,mobile}.png`. Machine-readable final results: [atlas-measurements.json](atlas-measurements.json).

## Remaining visual/performance debt

My visual review answer is **yes**: the quiet naked geography is appropriate beside the editorial slogan without needing landmarks to hide it. This is engineering review, not human design approval. Natural Earth's 110m coastlines are visibly generalized at the allowed upper zoom; small islands are omitted by the source scale. Mercator exaggerates Greenland/northern land and cannot display the poles normally. Northern cropping is deliberate but camera balance should be approved on real devices. The explicit activation step and plain three-button controls are restrained foundation UI, not the final illustrated atlas experience. Existing narrow French native-select truncation remains from #38.

The main debt is the measured 424 KB engine+worker versus the 60 KB target; investigate shared worker/module delivery before more features. No field LCP/CLS/INP claim is made; software-rendered Chromium cannot substitute for touch/GPU testing on physical iOS/Android. Human visual approval, physical-device performance and hosting compression/CSP/runtime review remain before deployment or Stage 2.

## Exact change inventory and working tree

- Modified: `package-lock.json`
- Modified: `package.json`
- Modified: `scripts/verify-homepage.mjs`
- Modified: `src/components/home/AtlasStage.jsx`
- Deleted: `src/components/home/AtlasVisual.jsx`
- Modified: `src/locales/en/common.json`
- Modified: `src/locales/fr/common.json`
- Modified: `src/pages/HomePage.jsx`
- Modified: `src/styles/homepage.css`
- Modified: `tests/homepage.test.js`
- Modified: `vite.config.js`
- New: `docs/atlas-measurements.json`
- New: `docs/world-atlas-stage1.md`
- New: `public/licenses/MapLibre-LICENSE.txt`
- New: `public/licenses/MapLibre-dependencies-NOTICES.txt`
- New: `scripts/measure-atlas-runtime.mjs`
- New: `scripts/prepare-atlas-geography.mjs`
- New: `scripts/verify-atlas.mjs`
- New: `src/assets/atlas/provenance.json`
- New: `src/assets/atlas/world-land.geojson`
- New: `src/assets/atlas/world-preview.svg`
- New: `src/components/home/atlas/atlasConfig.js`
- New: `src/components/home/atlas/createAtlasMap.js`
- New: `tests/atlas.test.js`

Starting working tree: clean. Current branch: `feature/40-naked-interactive-world-map`. All changes remain unstaged; added files are untracked.

`git status --short --untracked-files=all`:

```text
 M package-lock.json
 M package.json
 M scripts/verify-homepage.mjs
 M src/components/home/AtlasStage.jsx
 D src/components/home/AtlasVisual.jsx
 M src/locales/en/common.json
 M src/locales/fr/common.json
 M src/pages/HomePage.jsx
 M src/styles/homepage.css
 M tests/homepage.test.js
 M vite.config.js
?? docs/atlas-measurements.json
?? docs/world-atlas-stage1.md
?? public/licenses/MapLibre-LICENSE.txt
?? scripts/measure-atlas-runtime.mjs
?? scripts/prepare-atlas-geography.mjs
?? scripts/verify-atlas.mjs
?? src/assets/atlas/provenance.json
?? src/assets/atlas/world-land.geojson
?? src/assets/atlas/world-preview.svg
?? src/components/home/atlas/atlasConfig.js
?? src/components/home/atlas/createAtlasMap.js
?? tests/atlas.test.js
```

`git diff --stat`:

```text
 package-lock.json                   | 228 ++++++++++++++++++++++++++++++++++++
 package.json                        |   6 +-
 scripts/verify-homepage.mjs         |   9 +-
 src/components/home/AtlasStage.jsx  | 120 +++++++++++++++----
 src/components/home/AtlasVisual.jsx |  36 ------
 src/locales/en/common.json          |  15 +++
 src/locales/fr/common.json          |  15 +++
 src/pages/HomePage.jsx              |   2 +-
 src/styles/homepage.css             |  39 ++++--
 tests/homepage.test.js              |  22 ++--
 vite.config.js                      |   1 +
 11 files changed, 402 insertions(+), 91 deletions(-)
```

This tracked diff statistic excludes the newly added/untracked files above. No staging was performed merely to inflate the statistic.

No destination pins/labels or landmark illustrations remain in the production Atlas. No Flights, Hotel markers, backend/API/database changes, destination-mapping changes, public-route changes, SEO-strategy changes or affiliate-tracking changes. No commit, push or merge. Stop for human review.

## Interrupted-session cleanup

On 2026-10-04, retained the implementation and successful verification above, checked the main MapLibre license against the installed package, and added the transitive dependency notices. Only license/report files changed during continuation; application verification was not repeated. Measurements describe the last verified production build, before this static notice was added; the notice is not loaded by the homepage. The latest reproducible saved figures (160,016 JS /15,189 CSS gzip bytes) supersede the earlier interim figures (160,013 /15,157).
