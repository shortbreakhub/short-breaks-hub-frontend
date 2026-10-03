# Issue #34 — frontend performance foundation

Source of truth: [GitHub #34](https://github.com/shortbreakhub/short-breaks-hub-frontend/issues/34). Protected contracts: [redesign baseline](redesign-baseline.md).
Branch: `feature/34-frontend-performance-foundation`; starting tree clean. Baseline collected before source changes, using the current production API/prerender path. No visual redesign or atlas implementation.

## Reproduction and measurement limits

```sh
npm ci
npm run assets:optimize  # only required after changing a selected original
npm run build           # Vite build AND complete production prerender, needs API access
npm test                # output-based checks require the build first
npm run performance:measure
npx playwright install chromium  # if Chromium is not already installed
npm run performance:browser -- after
git diff --check
```

`performance:measure` walks the actual Vite manifest static import graph, measures raw bytes and Node gzip level 9, CSS, all generated files, and source assets. Vite's console uses its own gzip defaults: before entry 391.14 KB, after 152.70 KB; the figures below use the same Python gzip level 9 for both. Node’s final entry result is 152,484 bytes; the baseline-comparable Python result is 151,952 bytes. Both are recorded. Decimal KB/MB. Machine-readable results are in [performance-measurements.json](performance-measurements.json).

`performance:browser` serves `dist` without compression, with a cold Chromium context per route. Desktop 1440×900 DPR1; mobile 390×844 DPR2. It records actual local requests at network idle and after a bottom scroll, mocks APIs from real generated bootstrap data, blocks all external requests (analytics, external footer badge, exchange rates except a fixture), and never visits affiliate providers. JSON/screenshots go to `/tmp/issue34-after-*`. Counts are uncompressed local asset/HTML bodies, not Internet transfer totals; they do not measure field LCP/CLS/INP. Chromium lazy-image lookahead fetched all six homepage cards in this scenario, so no savings are claimed from simply marking them lazy.

## Before / after

| Measure | Before | After |
| --- | ---: | ---: |
| Homepage static JS raw | 1,743,830 | 470,646 |
| Homepage static JS gzip level 9 | 388,143 | 151,952 |
| CSS raw / gzip level 9 | 66,948 / 11,852 | 66,948 / 11,852 |
| All production files including 258 HTML documents | 1,450,911,956 | 1,384,108,614 |
| Source asset library | 1,477,048,774 | 1,480,956,369 |
| JS chunks | 1 | 14 |
| Prerender routes | 258 | 258, exact same paths |

Initial raw JS fell 73.0%; gzip fell 60.9%. Production output fell 66,803,342 bytes, while source assets grew 3,907,595 bytes because editable originals remain. Repository reduction is not being substituted for page-load improvement. Total JS across all routes remains 1,647,529 raw / 385,809 gzip; splitting defers working features rather than deleting them.

| Actual initial local page requests | Before bytes | After bytes | Reduction |
| --- | ---: | ---: | ---: |
| home-desktop | 25,914,165 | 1,235,570 | 95.2% |
| home-mobile | 25,914,165 | 1,608,540 | 93.8% |
| europe | 34,149,301 | 1,149,140 | 96.6% |
| china | 30,949,142 | 29,168,041 | 5.8% |
| shanghai | 9,488,999 | 7,756,099 | 18.3% |

The China and Shanghai figures expose remaining deep-image debt. Homepage desktop uses 480w cards; mobile DPR2 selects 960w. Screenshots were compared: same photos, logo, composition, classes, colours and layout; compression is intentionally lossy WebP, not replacement artwork.

Baseline initial modules (rendered pre-minification bytes, not additive network sizes): lottie-web 657,519; react-dom 539,605; axios 97,783; i18next 81,446; react-router 72,492; Google Maps wrapper 56,517; OpenMeteo SDK 42,753; Helmet 32,468; Toastify 30,935; flatbuffers 27,096; lottie-react 22,696. Loading JSON is 526,177 source bytes. Lottie/animation data, weather, map wrapper and itinerary URL inventory are no longer homepage static dependencies. React, router, Axios, i18n, Helmet and Toastify stay shared to preserve working contracts.

## Asset evidence and delivery decisions

23 selected originals → 38 derivatives. [Generated provenance manifest](../src/assets/optimized/manifest.json) includes source SHA-256, dimensions, output sizes and filenames. Original sources are retained. `assets:optimize` regenerates the derivatives and URL inventories deterministically for the locked Sharp version.

- Shared logo: original 1024×1024 PNG was 1.49 MB for 112px desktop / 48px mobile display. 224px PNG preserves the design and transparency at desktop 2× density, delivers 12,257 bytes, and sets intrinsic dimensions.
- Hero: original 3926×2209 JPEG was 2.38 MB. 1920px WebP delivers 507,190 bytes and stays eager as the above-fold background; existing hero dimensions/CSS remain. A mobile crop/source can be separately evaluated later; this issue does not redesign imagery.
- Six homepage region photos: sources range 1.45–7.00 MB and 3552–7360px wide; rendered cards ~400px. 480/960px sources suit desktop and mobile DPR2. Combined small/large variants are 155,926 / 528,896 bytes. `srcset`, `sizes`, dimensions and existing meaningful alt text are retained. Cards below the full-height hero are lazy.
- Six official region banners: 1600px WebP bounds backgrounds displayed in existing 300/400px-high areas, keeps same photo/crop/layout, remains eager.
- Nine European country cards: Europe was 34.15 MB in the local baseline. 480/960px derivatives address its frequently visited grid. First three images stay eager; later cards may load lazily; existing fixed-height frames and intrinsic dimensions prevent collapse. Other regions' country sources and deep itinerary photography are deferred rather than indiscriminately optimized.

| Source retained | Original bytes | Derivative width / bytes |
| --- | ---: | --- |
| `logo-icon.png` | 1,494,019 | 224w: 12,257 |
| `hero-bg.jpg` | 2,383,628 | 1920w: 507,190 |
| `southeast.jpg` | 3,699,617 | 480w: 44,326, 960w: 156,024 |
| `eastasia.jpg` | 1,781,203 | 480w: 29,624, 960w: 88,254 |
| `europe.jpg` | 7,002,789 | 480w: 35,088, 960w: 125,750 |
| `americas.jpg` | 3,758,652 | 480w: 19,816, 960w: 69,226 |
| `anz.jpg` | 1,451,232 | 480w: 11,194, 960w: 31,542 |
| `northAfrica.jpg` | 2,510,627 | 480w: 15,878, 960w: 58,100 |
| `southeast-asia-banner.jpg` | 3,858,206 | 1600w: 209,304 |
| `east-asia-banner.jpg` | 3,281,663 | 1600w: 280,208 |
| `europe-banner.jpg` | 1,513,997 | 1600w: 283,884 |
| `americas-banner.jpg` | 8,015,222 | 1600w: 388,010 |
| `oceania-banner.jpg` | 1,524,361 | 1600w: 99,140 |
| `africa-banner.jpg` | 4,022,369 | 1600w: 213,760 |
| `france.jpg` | 2,500,372 | 480w: 43,274, 960w: 159,258 |
| `germany.jpg` | 5,474,642 | 480w: 20,054, 960w: 74,732 |
| `greece.jpg` | 4,422,422 | 480w: 28,372, 960w: 102,298 |
| `italy.jpg` | 2,491,865 | 480w: 42,750, 960w: 160,462 |
| `netherlands.jpg` | 4,454,501 | 480w: 21,728, 960w: 79,422 |
| `portugal.jpg` | 3,241,322 | 480w: 27,556, 960w: 102,940 |
| `spain.jpg` | 2,845,621 | 480w: 22,112, 960w: 74,032 |
| `switzerland.jpg` | 3,856,565 | 480w: 35,080, 960w: 127,506 |
| `united kingdom.jpg` | 3,717,979 | 480w: 22,218, 960w: 75,164 |

No mass deletion: PNG language flags stay as-is via narrow imports. Community-specific photos, deep itinerary heroes/food images, external badge and original Lottie artwork/data stay unchanged. Confirmed duplicate photos (e.g. Australia/ANZ, Egypt/North Africa, Malacca/community) remain; deleting or repointing them requires a dedicated content/use audit. Largest remaining production photos include san-miguel (~15.24 MB), grand-central-market (~12.59 MB), phnompenhhero (~11.54 MB), halonghero (~11.16 MB), and vietnamcountry (~10.92 MB); see JSON for precise built asset names/sizes. Their existence in the output does not mean all pages request them.

## Loading architecture and contracts

Browser route boundaries: region, browse, official itinerary, account group, community/profile/create group, weather and existing Google Map utility. Home/legal/contact remain eager. Account/community groups avoid one tiny chunk per screen; Vite shares itinerary components and URL inventories. Food place map loads only when opened. Existing Lottie code/data move behind routes that actually use them; animation behaviour/artwork is unchanged.

SSR uses `prerenderPages.js` with resolved real components, so `renderToString` emits complete crawlable pages rather than Suspense loading shells. Browser startup preloads its matched route before hydration, retaining the bootstrap and avoiding a Suspense/client-only content regression. `RouteLoadBoundary` supplies localized reload recovery after a rejected route chunk and resets on route navigation without remounting successful pages. Normal itinerary/API retry handling remains unchanged. New English/French loading/failure strings support this boundary.

Runtime dependencies are unchanged. Sharp and Playwright are development-only tools for reproducible asset generation, measurements and browser verification. Sharp requires detect-libc 2.1.2 (previously 2.0.4); lockfile adds optional native platform packages. No working library was replaced solely for bytes; unused Google loader dependency remains out of the initial bundle.

| Final emitted chunk | Raw bytes | Gzip level 9 |
| --- | ---: | ---: |
| `assets/loading-animation-CxWO7YTd.js` | 843,287 | 138,523 |
| `assets/index-BglBZVGx.js` | 470,646 | 151,952 |
| `assets/loadItineraryImage-DyOPMh9c.js` | 124,284 | 37,029 |
| `assets/index-C06h-pi5.css` | 66,948 | 11,852 |
| `assets/WeatherPage-D520nuEx.js` | 53,157 | 13,775 |
| `assets/ItineraryPage-4g_FDmkl.js` | 51,127 | 12,790 |
| `assets/communityPages-EOf6XS3a.js` | 49,444 | 11,969 |
| `assets/GoogleMap-2QPaRY_M.js` | 20,755 | 7,741 |
| `assets/accountPages-CT_mwj7U.js` | 18,315 | 4,668 |
| `assets/CountryCard-C_vdub6o.js` | 5,349 | 2,288 |
| `assets/BrowsePage-x-TwPfam.js` | 4,749 | 1,844 |
| `assets/ItineraryDayAccordion-QQh9uwGE.js` | 2,476 | 1,020 |
| `assets/RegionPage-C1hZGJVh.js` | 1,701 | 927 |
| `assets/ItineraryCard-D7q1PIf3.js` | 1,446 | 795 |
| `assets/toast-nTgtsiRk.js` | 793 | 488 |

Vite's >500 KB raw warning now applies to deferred Lottie/data (843 KB), rather than the homepage entry. The pre-existing stale Browserslist warning remains. These are explicit remaining debt, not hidden by changing Vite warning limits.

## Eleven optional food references

| Reference | Classification / action |
| --- | --- |
| Venice `dal-moros.jpg` | Existing `.jpeg`; resolver supports actual extension |
| Munich `augustiner-keller.jpg` | Existing `Augustiner-Keller.jpg`; case-insensitive resolver |
| Medellín `carmen.jpg` | Existing `.jpeg`; resolver supports actual extension |
| Mexico City `los-danzantes.jpg` | Existing `los-danzante.jpg`; explicit confirmed typo alias |
| Sydney `icebergs-dining-room.jpg` | Existing `icebergs-dining-roo.jpg`; explicit confirmed typo alias |
| NYC `katzs-delicatessen.jpg` | Genuinely missing; retain optional content and defer asset acquisition |
| Seattle `pike-place-chowder.jpg` | Genuinely missing; defer |
| Seattle `the-pink-door.jpg` | Genuinely missing; defer |
| Seattle `taylor-shellfish-capitol-hill.jpg` | Genuinely missing; defer |
| Seattle `walrus-and-the-carpenter.jpg` | Genuinely missing; defer |
| Seattle `serious-pie.jpg` | Genuinely missing; defer |

Five references safely resolve; six remain warnings. No fake image, asset rename, backend content edit or unsupported assumption that content should be deleted.

## Regression guards and verification

- Baseline suite: 602 pass before implementation. Final suite: 605 pass, zero failures/skips, including new performance, resolver and lazy-route tests. Existing protected route test injects resolved page probes; it still exercises the unchanged real App route configuration.
- Build-based guard: initial JS ≤180 KB gzip (~18% headroom over 152 KB), CSS ≤20 KB gzip; homepage static graph excludes animation/weather/map/itinerary inventory; 258 pages remain. Logo ≤25 KB; eager hero ≤600 KB; six small cards combined ≤200 KB and large combined ≤650 KB. These allow reasonable growth without fragile exact-byte snapshots. Tests verify source provenance, production derivative existence/size and aspect ratio.
- Lazy-route test verifies no secondary pages on home, independent region loading, synchronous preloaded SSR, account/community grouping, a rejected chunk, explicit recovery and navigation after failure.
- Production build including complete prerender succeeds: 198 official +52 country +6 region +home/contact =258. API concurrency remains 4; country prerender still reuses region data. Exact before/after paths compared, including `/Oceania` casing. No route inventory change.
- Inspected home, Europe, Oceania, China and Shanghai: one H1, unique title/description/canonical, index/follow robots, two existing JSON-LD scripts, crawlable shell/content links and built asset paths; region/country/official bootstrap survives. The full suite checks metadata/content/asset contracts across generated output, not merely representative screenshots.
- Cold Chromium home desktop/mobile, Europe, China and Shanghai have no page errors. Actual Home → Europe → France → Paris official itinerary SPA navigation succeeds with one document request total, no full reload. Actual login, register, community discovery and weather cold-route smoke checks also pass with external requests blocked. Map route selection and real business/error behavior remain covered by contract tests.
- Shanghai bootstrap still has TRIP_COM / CITY / MAPPED externalId `2`. Hotel input, date, room/adult/child-age, breakfast/free-cancellation and URL-builder regressions pass. Exactly unchanged: `Allianceid=9927800`, `SID=327885881`, present-empty `trip_sub1=`, `trip_sub3=D19155586`. No live affiliate clicks. Hotel/affiliate source files and API files are unchanged.
- `git diff --check` passes; final diff reviewed for visual/routing/affiliate/API drift. No commit, push or merge.

## Future atlas budget — recommendation only

Use this as an incremental budget for a later design issue, not permission to ship an atlas in the critical path:

| Future cost | Initial cap |
| --- | ---: |
| Atlas JavaScript, compressed | 60 KB gzip |
| Simplified geography, compressed | 75 KB gzip |
| Desktop 12–16 landmark illustrations | 200 KB combined (~12–16 KB each) |
| Mobile 4–6 landmark illustrations | 100 KB combined (~17–25 KB each) |
| Deferred landmark assets | ≤25 KB each, ≤200 KB per viewport/request batch |

Existing initial JS is ~152 KB gzip; adding ≤60 KB leaves total ≤220 KB. Keep atlas outside the static shell and load after critical HTML/controls; avoid all-world landmark downloads. A simplified SVG/Canvas solution may fit; any WebGL library must prove this budget with a production prototype before adoption. No library has been installed.

The current eager hero is 507 KB. If the future atlas replaces that background, its desktop JS+geography+initial art total ≤335 KB, mobile ≤235 KB, freeing ~172/272 KB relative to current imagery. If the map is added alongside the photo instead, these savings disappear: do not silently stack both. Target representative cold local compressed homepage bodies ≤1 MB desktop /≤1.1 MB mobile, measured again with actual assets and controls. Preserve mobile 4–6 visible landmarks and progressive loading. Validate LCP≤2.5s, CLS≤0.1, INP≤200ms at the 75th percentile with field data later; these are targets, not results from this issue.

Remaining debt: huge deep-route photos and eagerly rendered itinerary images, deferred Lottie size, broad deep URL inventory, larger non-European country imagery, source/output duplicates, external assets and stale Browserslist. Broader animation replacement, global image pipeline, redesign, atlas, flights and frontend/API contract changes are deferred.

## Exact changed/new file inventory

Tracked modifications plus new files (Git's unstaged `diff --stat` omits untracked additions). All 38 derivatives are listed below; originals were not removed.

- `docs/performance-foundation.md`
- `docs/performance-measurements.json`
- `package-lock.json`
- `package.json`
- `scripts/measure-performance.mjs`
- `scripts/measure-runtime.mjs`
- `scripts/optimize-assets.mjs`
- `scripts/prerender.mjs`
- `src/App.jsx`
- `src/assets/optimized/africa-banner-1600.webp`
- `src/assets/optimized/americas-480.webp`
- `src/assets/optimized/americas-960.webp`
- `src/assets/optimized/americas-banner-1600.webp`
- `src/assets/optimized/anz-480.webp`
- `src/assets/optimized/anz-960.webp`
- `src/assets/optimized/east-asia-banner-1600.webp`
- `src/assets/optimized/eastasia-480.webp`
- `src/assets/optimized/eastasia-960.webp`
- `src/assets/optimized/europe-480.webp`
- `src/assets/optimized/europe-960.webp`
- `src/assets/optimized/europe-banner-1600.webp`
- `src/assets/optimized/france-480.webp`
- `src/assets/optimized/france-960.webp`
- `src/assets/optimized/germany-480.webp`
- `src/assets/optimized/germany-960.webp`
- `src/assets/optimized/greece-480.webp`
- `src/assets/optimized/greece-960.webp`
- `src/assets/optimized/hero-bg-1920.webp`
- `src/assets/optimized/italy-480.webp`
- `src/assets/optimized/italy-960.webp`
- `src/assets/optimized/logo-icon-224.png`
- `src/assets/optimized/manifest.json`
- `src/assets/optimized/netherlands-480.webp`
- `src/assets/optimized/netherlands-960.webp`
- `src/assets/optimized/northAfrica-480.webp`
- `src/assets/optimized/northAfrica-960.webp`
- `src/assets/optimized/oceania-banner-1600.webp`
- `src/assets/optimized/portugal-480.webp`
- `src/assets/optimized/portugal-960.webp`
- `src/assets/optimized/southeast-480.webp`
- `src/assets/optimized/southeast-960.webp`
- `src/assets/optimized/southeast-asia-banner-1600.webp`
- `src/assets/optimized/spain-480.webp`
- `src/assets/optimized/spain-960.webp`
- `src/assets/optimized/switzerland-480.webp`
- `src/assets/optimized/switzerland-960.webp`
- `src/assets/optimized/united-kingdom-480.webp`
- `src/assets/optimized/united-kingdom-960.webp`
- `src/components/CountryCard.jsx`
- `src/components/FoodRecommendations.jsx`
- `src/components/ItineraryCard.jsx`
- `src/components/LanguageSwitcher.jsx`
- `src/components/Navbar.jsx`
- `src/components/RegionCard.jsx`
- `src/locales/en/common.json`
- `src/locales/fr/common.json`
- `src/main.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/ItineraryPage.jsx`
- `src/pages/RegionPage.jsx`
- `src/pages/accountPages.js`
- `src/pages/communityPages.js`
- `src/prerenderEntry.jsx`
- `src/prerenderPages.js`
- `src/routePages.jsx`
- `src/utils/loadImage.js`
- `src/utils/loadItineraryImage.js`
- `src/utils/optimizedImages.js`
- `src/utils/rootImages.js`
- `tests/lazyRoutes.test.js`
- `tests/performance.test.js`
- `tests/routeContracts.test.js`
