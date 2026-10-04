# Issue #40 — Europe destination interaction

Europe remains the only Atlas test bed. This iteration uses the CURRENT approved muted watercolor PNG (1536 × 1024, 3,574,321 bytes). Its bytes were checked before and after implementation and are unchanged. Earlier experiment measurements describe the earlier artwork version, not this current source.

## Configuration and selection

`src/components/home/atlas/europeDestinations.js` defines exactly nine destinations: France, Germany, Greece, Italy, Netherlands, Portugal, Spain, Switzerland and United Kingdom. Each record has an id, existing country name, existing EN/FR translation key, normalized `hitAreas` (country geography, primary and secondary landmarks/motifs) and optional label alignment. The first hit region retains the existing country focus/callout anchor. Positions were inspected against the current illustration, not inherited from geographic data. Future countries and Nordics have no controls.

`AtlasStage({onCountrySelect})` forwards the selected record to a supplied callback. With no callback, the real anchor navigates to the existing `/browse/<country-slug>` route via `getCountryBrowsePath`. Modified clicks retain ordinary new-tab behavior. No routes were invented. The real homepage currently uses this browse fallback; no cloud transition or country scene is implemented.

## Rendering and accessibility

`EuropeDestinations.jsx` renders DOM links, including prerendered semantic destinations before map activation. The idle controls are transparent; the illustrated landmarks remain the actors. Hover/focus/touch reveal a warm small two-line label and a subtle outline/shadow. Transitions are 180ms and removed under reduced-motion preference. No cutouts, permanent pins, borders, GIS layers or additional artwork are used. Existing zoom/reset controls moved into the caption row so they cannot cover Greece’s landmark or touch target.

Static framing uses normalized percentages. Activated framing projects normalized artwork positions using `artworkCoordinate`, on MapLibre render/resize events. Hit widths/heights derive from the same projected illustration and retain a minimum 44px target. The DOM layer is portalled into MapLibre's canvas container, so gestures on hit areas reach the existing interaction handlers. Listeners are cleaned up on teardown. These synthetic camera coordinates are not geographic country coordinates.

Links provide translated accessible names and native Enter activation. Focus reveals labels independently of hover. Keyboard focus on a destination clipped by a zoomed camera brings that artwork point into view, within the existing bounds. Escape dismisses the active control. Touch first tap reveals the label; second tap selects. Selecting another country, tapping elsewhere or moving the map dismisses the armed label. Drag movement does not trigger selection. One-finger page scrolling and two-finger map zoom remain usable.

MapLibre 6.11.2 is retained solely for the existing raster camera/gestures/resize. The PNG, global infrastructure and Natural Earth assets/provenance are retained. The known approximately 424 KB gzip deferred engine remains debt, not compliance with the original 60 KB target.

## Validation and visual review

Focused Atlas/homepage tests: **10 passed**. The tests cover exactly nine supported destinations, normalized configuration and hit bounds, existing canonical country paths, semantic translated controls, the projection/portal lifecycle and existing Europe camera contracts. Browser verification tests callback selection with Enter and touch, alignment at default/zoom/pan/resize, focus on a previously clipped destination, mobile scrolling/pinch and EN/FR labels. Final browser checks passed at 1440/768/390, including first/second taps on the centers of all nine destinations. A synchronous camera-state assertion initially raced the next canvas paint; the check now waits for rendered frames while retaining its <1px alignment threshold.

Review artifacts: `/tmp/issue40-interaction-default-{1440,768,390}.png`, `/tmp/issue40-interaction-hover-desktop.png`, `/tmp/issue40-interaction-zoom-desktop.png`, `/tmp/issue40-interaction-tap-mobile.png`. Desktop default/hover/zoom and mobile default/tap were inspected. At rest there are no permanent labels. Active callouts temporarily cover some nearby artwork on narrow screens; only one touch destination is armed. Minimum 44px targets have limited overlap around Switzerland/Italy on mobile, with distinct usable centers. These micro-interaction choices await owner visual acceptance and physical-device review.

Do not proceed to CloudTransition, CountryStoryMap, UK itinerary landmarks, region navigation or image optimization until reviewed. No protected APIs, routes, SEO strategy, Hotel Search, Trip.com mappings/tracking, itinerary behavior or EN/FR architecture were changed. No commit, push, merge or issue closure.

Final production build and complete prerender succeeded with exactly 258 unchanged routes. Saved homepage/Europe/China/Shanghai metadata, canonical and JSON-LD comparisons passed; Shanghai CITY externalId remains "2". Initial JS/CSS size guards pass; no full application matrix was rerun for this focused interaction step. `git diff --check` and unchanged artwork hash verification pass.

## Locked landmark coverage rule

Every clearly identifiable active-country landmark is an entry point to the same country destination. Each country has ONE anchor/accessibility stop. Supplementary empty spans extend that anchor’s pointer/touch coverage, without adding links, labels, focus stops or visual styling. All regions use the existing illustration projection. Supplementary regions keep artwork-sized extents in dense areas; the existing primary 44px targets remain unchanged.

| Country | Audited hit regions |
|---|---|
| United Kingdom | westminster, edinburgh-castle, scotland, england |
| France | eiffel-tower, mont-saint-michel, lavender-fields, northern-france, corsica |
| Netherlands | windmill, windmill-blades, canal-houses, tulip-fields, dutch-coast |
| Germany | neuschwanstein, german-countryside |
| Switzerland | alps-and-chalet, alpine-peaks, swiss-country |
| Italy | colosseum, southern-town, italian-mainland, sicily, sardinia |
| Greece | blue-domed-churches, island-village, greek-mainland |
| Portugal | pena-palace, palace-buildings, portuguese-coast |
| Spain | sagrada-familia, sagrada-complex, central-spain, southern-spain |

Coverage correction verification: 11 targeted Atlas/homepage tests passed. Actual browser verification at 1440px and 390px passed clicks/two-tap selection for every hit region, Edinburgh → United Kingdom, both Italian landmark groups → Italy, and independent dense Netherlands/Germany/Switzerland landmark samples. Every region passed <1px alignment checks after zoom, pan and resize. The artwork hash and visual CSS/camera/routes are unchanged. No production build, prerender or full suite was repeated for this small correction. The prior 258-route build is the existing baseline.
