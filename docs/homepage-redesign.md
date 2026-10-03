# Interactive Travel Magazine homepage — Issue #38

Source: [Issue #38](https://github.com/shortbreakhub/short-breaks-hub-frontend/issues/38). Contracts: [#32](redesign-baseline.md), [#34](performance-foundation.md), [#36](shared-editorial-ui.md). Branch: `feature/38-interactive-travel-magazine-homepage`. No commit, push or merge.

## Recovery and audit

The interrupted session started from a clean tree, audited the real homepage, and saved the before build, runtime requests, screenshots, representative HTML and exact route inventory. On resumption its six modified/new source areas and 13 derivatives were retained, not reset. Its successful 258-page build and 616-test result were recovered. Before optimization measurements were reused from `/tmp/issue38-before.json` and `/tmp/issue34-issue38-before-runtime.json`; earlier intermediate after measurements were superseded.

The original homepage used a full-height beach background, typewriter copy, Region → Country discovery, and six equal region cards. The useful region inventory, country API/navigation helpers, metadata ownership, shared shell and optimized delivery conventions were retained. Real official itinerary data exists through the current API; no new homepage API or content model was needed.

Before resumption: the real HomePage composition, temporary vector atlas/six sketches, native discovery controls, six EN/FR editorial snapshots, derivatives, scoped styles and limited Navbar integration were implemented. After resumption: the rejected atlas treatment was corrected, replacement artwork hooks were added, photo alt descriptions and photo accessibility were refined, focused semantic/mounted tests and browser verification were added, responsive-image changes were verified, and complete final verification/documentation finished.

## Information architecture and composition

1. Opening spread: “Short Breaks. Big Stories.”, concise travel copy, story jump link, world atlas stage, adjacent Region → Country exploration form.
2. Short editorial bridge connecting global discovery and stories.
3. Editor’s Picks: dominant Shanghai photograph/story with Paris and Tokyo supporting stories.
4. Featured itineraries: New York, Sydney and Morocco; numbered, staggered desktop composition rather than another equal-card catalogue.
5. Six-region inspiration: one existing optimized photograph alongside numbered crawlable region links and useful descriptions.
6. Planning transition: inspiration → daily itinerary/planning → existing Hotel Search. The CTA opens the existing Shanghai itinerary; no fake homepage hotel/flight form.

The #36 primitives support containers, headers, actions, native fields, media and metadata. Homepage hierarchy, story composition and atlas remain specialized. Georgia/system fonts require no downloads. Navbar receives homepage-only paper colors, proportions and a tablet/mobile menu treatment; existing authentication, language and route destinations are retained. Menu naming/expanded state are localized. Footer is unchanged.

### Atlas correction and integration boundary

The rejected grid, dotted routes, compass, hard continent outlines and tiny monochrome icons are removed. Geography is a low-contrast, smooth supporting silhouette. Six larger warm color studies dominate the scene, followed by visible pins and clickable city labels. Desktop landmark frames are 100–138px, compared with the former 34–54px; mobile frames are 78px compared with 32px. Their area and color contrast substantially increase prominence without adding raster assets.

`HomePage` owns slogan, discovery and editorial content. `AtlasStage` owns the figure/caption, semantic itinerary links and presentation positions. `visualLayer` replaces backdrop artwork; `renderLandmark(key)` replaces the temporary landmarks independently. `AtlasVisual` and `LandmarkSketch` are temporary scenery/color studies, not an engine or permanent asset library. The whole stage may later be enhanced/replaced while leaving the surrounding homepage intact. Percent positions are editorial presentation, not geographic coordinates or Hotel Search mappings.

There are no inert drag/zoom/country controls. Existing links really open existing itineraries. Essential discovery remains available through all six region links and editorial titles even when mobile hides two atlas markers.

### Real content and photo delivery

`homepageSelection.js` specifies six existing official slugs. `homepage.json` stores current API EN/FR titles/summaries, duration, destination and original photo provenance. This is curated content, not a claim of live “latest” ranking. `homepage:refresh` explicitly fetches existing read-only detail endpoints for both languages and regenerates the snapshot/derivatives. Normal development and production builds render this snapshot directly; homepage stories never depend on client-only requests. Editors must refresh when selected content changes.

| Existing original, retained | Source bytes | New derivative bytes: 480w / 960w / optional 1440w |
| --- | ---: | ---: |
| Shanghai hero | 3,129,223 | 18,172 / 63,208 / 126,442 |
| Paris hero | 4,141,742 | 18,292 / 69,982 |
| Tokyo hero | 3,891,482 | 41,168 / 153,464 |
| Sydney hero | 3,819,425 | 28,922 / 107,398 |
| Morocco hero | 5,153,781 | 37,840 / 135,086 |
| New York hero | 3,666,216 | 19,992 / 74,680 |

These are existing artwork/photography resized with locked Sharp/WebP settings, not replacements. All 13 derivatives total 894,646 bytes in the repository/output. Every variant preserves source aspect ratio. Shanghai has a larger source for its dominant feature; supporting stories have sizes matching their actual smaller mobile frames. All seven editorial photos are below the initial fold in measured views and lazy, with srcset, sizes, intrinsic dimensions, reserved aspect-ratio frames and translated alt text. The atlas is inline SVG; there is no giant raster hero. #34 shared assets and originals remain untouched.

## Responsive, language and accessibility review

- Desktop 1440px: slogan/copy left, dominant atlas right; full-width discovery below; asymmetric photo hierarchy and staggered stories.
- Tablet 768px: two-column introductory copy above the full-width atlas, discovery intro spanning its controls, deliberate editorial columns and existing hamburger navigation.
- Mobile 390px: stacked slogan/copy, taller atlas composition with four landmarks, full-width exploration action, dominant pick plus two supporting stories, compact image/text itineraries, stacked regions/planning. No horizontal overflow.
- English/French use existing i18n resources. French slogan is “Petites escapades. Grandes histoires.” Official story translations come from the existing API snapshot. Long French headings/actions were visually reviewed; layouts wrap without clipping.
- One h1, associated section headings, real links/buttons, labeled native selects, disabled states, localized loading/status/error/retry, 44px action targets, decorative SVG hidden from assistive technology, meaningful photo alt text, logical reading order and visible 3px keyboard focus.
- Discovery terminates failures, retries, clears stale country choices and ignores late responses. Language changes preserve selection. No new animation; existing shared reduced-motion treatment remains.

Six real dev-homepage browser scenarios (three widths × two languages) passed. Full-page, hero and picks screenshots were reviewed, including lower-page rhythm/crops and French wrapping. Element screenshots can contain the sticky Navbar after automatic scrolling; full-page shots provide the unobstructed composition.

## Verification and measured delivery

```sh
npm run build                    # Vite + complete production prerender
npm test
node --test tests/homepage.test.js tests/hotelBooking.test.js tests/hotelHandoff.test.js tests/hotelTripPrep.test.js tests/performance.test.js
npm run homepage:verify          # real dev homepage, Chromium, deterministic APIs
npm run performance:measure
npm run performance:browser -- issue38-final
git diff --check
```

- Complete suite: **622 pass**, zero failures/skips. New homepage checks: **6 pass**. Focused homepage/Hotel/affiliate/#34 guard run: **22 pass**.
- Tests cover EN/FR headings/copy, all six region/official links, native discovery semantics, responsive image attributes, real content/provenance/size/aspect-ratio, production crawlable stories, replaceable atlas hooks, recoverable API failure/retry, stale response rejection, region reset and language-safe navigation. Existing prerender h1 expectation changes to the approved slogan; no pixel/class snapshots.
- Production build/prerender passed: **258 routes**, exact same saved inventory: home/contact, six regions, 52 countries, 198 official itineraries. Existing prerender pipeline unchanged.
- Home, Europe, China and Shanghai: title/description/robots/canonical, social metadata and both JSON-LD scripts exactly match before. Non-home heading content/bootstrap unchanged. Homepage contains all selected official stories and six regions before JavaScript runs. App-shell and production-showcase exclusion tests pass.
- Shanghai mapping remains TRIP_COM / CITY / MAPPED / opaque string ID `2`. Tests verify dates, occupancy, child ages and filters plus exact `Allianceid=9927800`, `SID=327885881`, present-empty `trip_sub1=`, `trip_sub3=D19155586`. URL construction/window opening are mocked; no live affiliate click.
- Browser checks passed on normal dev homepage at 1440/768/390px, EN/FR: visible 6/6/4 landmarks, no overflow, labels, touch targets, keyboard focus, Enter retry, selection reset, menu behavior and navigation. Production runtime checks additionally passed SPA home → Europe → France → itinerary without document reload and lazy auth/community/weather routes without JavaScript errors.
- `git diff --check` and untracked-text whitespace checks passed. Final diff reviewed for route/API/affiliate/unrelated changes. No dependencies added or removed.

| Reproducible measure, bytes | Before #38 | Final #38 |
| --- | ---: | ---: |
| Initial JS raw / Node gzip9 | 470,646 / 152,482 | 491,613 / 159,778 |
| Initial CSS raw / Node gzip9 | 75,421 / 13,561 | 79,971 / 14,841 |
| Desktop homepage local bodies | 1,244,043 | 870,826 |
| Mobile homepage local bodies | 1,617,013 | 982,524 |
| All generated production files | 1,384,117,087 | 1,385,064,302 |
| Source asset library | 1,480,956,369 | 1,481,851,015 |

Raw/gzip JS adds 20,967/7,296 bytes; gzip +4.8%, below the 180KB #34 guard. CSS adds 4,550 raw/1,280 gzip, below 20KB gzip. This supplies the actual homepage composition, content, primitives and translations; no heavy atlas dependency. Static/lazy route boundaries remain. Shared initial growth also adds approximately 25.6KB uncompressed to other measured routes; deep image debt there remains.

Desktop/mobile request weight improves **30.0% / 39.2%**. These are cold Chromium **uncompressed local bodies**, including HTML, JS, CSS and images, with external requests blocked and existing API fixtures. Desktop 1440×900 DPR1; mobile 390×844 DPR2. Native lazy lookahead requested all seven editorial photos; we do not claim they were absent from initial requests. This is not a field LCP/CLS/INP or compressed Internet-transfer measurement.

Above fold: English shared logo/flag **16,856 raster bytes**; French **65,020** because the existing French flag is 52,763 bytes. Inline atlas figure markup is **6,508 raw / 1,926 gzip bytes**, included in HTML, with **zero external atlas asset requests**. No eager editorial photograph or old 507KB beach background is requested. Original files and output totals grew with derivatives; repository reduction is not used to claim page-load savings. Full measurement details: `homepage-measurements.json`.

Recovered before screenshots: `/tmp/issue34-issue38-before-home-{desktop,mobile}.png`. Final production screenshots: `/tmp/issue34-issue38-final-home-{desktop,mobile}.png`. Reviewed EN/FR full pages: `/tmp/issue38-home-{1440,768,390}-{en,fr}.png`; hero/picks captures use corresponding prefixes. Verification JSON/logs live under `/tmp/issue38-*`.

## Remaining debt and exact next atlas scope

**These landmark color studies are not final approved illustration assets.** The corrected hierarchy/composition is ready for review, but premium illustrated landmarks still need separately supplied/refined artwork. Geography is intentionally simplified scenery; final projection, coordinate accuracy and collision behavior remain unimplemented. Do not reuse its presentation spots as destination mappings.

Existing Morocco photography depicts the coast while its itinerary is Marrakech-centered: it is the current official hero, retained rather than fabricated or silently changing content. Its alt text describes the actual boats/coast. Editorially matching that photo is a separate content decision. Existing French flag weight, six optional missing deep food photos, deep itinerary/country image weight, deferred Lottie warning, and stale Browserslist data remain. No new analytics/field-CWV assessment or external sitemap publishing was performed.

The next dedicated REAL World Atlas issue should implement only:

1. Projection/geography data and real pan/zoom inside the replaceable atlas boundary, progressively enhanced from crawlable HTML.
2. A separate destination/coordinate/illustration association and measured assets, without changing Hotel Search mapping or official route identities.
3. Supplied illustrated artwork, collision/density/loading rules: 12–16 initial desktop and 4–6 mobile landmarks, not all worldwide illustrations eagerly.
4. Touch-safe mobile controlled viewport and equivalent list/card discovery, keyboard/focus/popup semantics, reduced-motion behavior and useful loading/failure fallbacks.
5. Lazy engine/data/media delivery, prerender/accessibility/SEO regression coverage, desktop/tablet/mobile visual review and actual request/CWV measurement.

Retain budgets: engine ≤60KB gzip, geography ≤75KB gzip, initial desktop illustrations ≤200KB combined, mobile ≤100KB, deferred illustrations ≤25KB each. Current initial JS is ~160KB gzip, leaving ~20KB under the existing shell guard; load the real engine behind a separately measured deferred boundary rather than increasing that guard to fit it. Do not rewrite the hero, discovery or editorial sections again merely to integrate it.

## Exact file inventory

Modified (6): `package.json`, `src/components/Navbar.jsx`, `src/locales/en/common.json`, `src/locales/fr/common.json`, `src/pages/HomePage.jsx`, `tests/prerenderOutput.test.js`.

Added text (12):

- `docs/homepage-redesign.md`
- `docs/homepage-measurements.json`
- `scripts/sync-homepage-content.mjs`
- `scripts/verify-homepage.mjs`
- `src/components/home/AtlasVisual.jsx`
- `src/components/home/AtlasStage.jsx`
- `src/components/home/HomeDiscovery.jsx`
- `src/config/homepageSelection.js`
- `src/content/homepage.json`
- `src/styles/homepage.css`
- `src/utils/homepageImages.js`
- `tests/homepage.test.js`

Added photos (13): `src/assets/homepage/{shanghai-480,shanghai-960,shanghai-1440,paris-480,paris-960,tokyo-480,tokyo-960,sydney-480,sydney-960,marrakech-480,marrakech-960,newYork-480,newYork-960}.webp`.

Final tree has 6 tracked modifications and 25 untracked files, nothing staged. Standard unstaged `git diff --stat` lists only the 6 tracked files: 238 insertions, 121 deletions. No Flights, final map engine, backend/API/database, destination-mapping, public-route, SEO-strategy or affiliate-tracking changes. Stop for review.
