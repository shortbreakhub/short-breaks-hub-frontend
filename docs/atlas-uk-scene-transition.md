# Issue #40: Europe ↔ UK scene transition

Europe interaction is owner accepted. Its nine countries and 34 artwork hit regions are unchanged. Only United Kingdom now enters a country scene. The other eight retain native `/browse/<country>` links; modified clicks retain normal new-tab behavior. `onCountrySelect(destination)` remains the selection seam, including every UK hit region. A supplied callback may intercept selection; returning `false` preserves native navigation.

## Scene lifecycle

`useAtlasScene` owns the React state and delegates orchestration to `atlasSceneTransition.js`: `idle → preparing → covering → covered → revealing → idle`. Duplicate starts are ignored. The artwork/destination surface is inert throughout; Back is disabled during travel. Only `covered` may swap scenes. Decode must complete before swapping; the optional renderer path must finish before reveal. No route navigation occurs for normal UK selection.

The persistent Europe/UK DOM images serve static fallback and supply decoded images directly to MapLibre's image source. This avoids another UK image request for GPU upload. UK preload starts 250ms after mounting Europe. No assets were added or changed for the current visual polish. Both assets remain local, untouched 1536×1024 PNGs. UK is 3,735,551 bytes; Europe is 3,574,321 bytes. UK initially remains hidden/lazy in prerendered HTML. A cached decode promise is shared across selections. Failed loads can retry; load/upload deadlines are eight seconds. UK failure restores Europe, clears clouds and the interaction lock, and announces a translated alert. Renderer failure falls back to the decoded DOM preview.

MapLibre 6.11.2 and its deferred adapter remain in the repository. This fixed-illustration presentation disables its pan, wheel, touch, double-click and keyboard map handlers; no map navigation controls or gesture instructions are exposed. Destination hit areas continue using the accepted artwork-relative layout. No UK hit regions, itinerary links, geographic layers or other scenes were added. Back sits in the fixed caption strip, outside the artwork, and uses the same transition.

## Clouds and accessibility

`AtlasCloudTransition` renders four moving banks from one local transparent watercolor sprite above the inert scene. CSS transforms bring them in from different edges; overlapping banks cover the frame before artwork replacement and continue outward to reveal it. The layer is clipped, decorative, untabbable, and removed after completion. Cover takes 700ms, the fully covered hold takes at least 220ms, and reveal takes 800ms (about 1.72s with a ready image). A slow image extends the covered phase; cached images cannot shorten these minimums. There is no opacity fade or rectangular masking layer.

New asset: `src/assets/atlas/transitions/watercolor-cloud.webp`, 960×640, 128,904 bytes. Created with the imagegen skill/tool, then resized/encoded as a reusable transparent WebP; only this new sprite was processed. Prompt: a broad irregular soft watercolor ivory cloud bank, pale blue/warm shadows, a dense opaque center and translucent wispy edges on a transparent background; no photography, emoji, rectangle, map, landmarks or text. Approved Europe and UK artworks were never edited.

Back receives focus after entering UK; the existing UK country link receives focus on return/recovery, without scrolling. EN/FR labels/status/error/Back are translated. Reduced motion skips clouds and uses near-instant functional swapping. One-finger page scrolling and browser pinch zoom remain available; Atlas artwork itself cannot pan or zoom. UK artwork itself is intentionally non-interactive.

## Measurements

Measured using `scripts/measure-performance.mjs`, level-9 gzip, against the starting accepted Europe build:

| Output | Before polish | After polish | Delta |
|---|---:|---:|---:|
| Initial JS raw | 505,823 | 504,485 | −1,338 bytes |
| Initial JS gzip | 164,153 | 163,892 | −261 bytes |
| CSS raw | 85,021 | 86,369 | +1,348 bytes |
| CSS gzip | 15,725 | 15,997 | +272 bytes |
| Deferred adapter + worker gzip | 424,362 | 424,335 | −27 bytes |

The known ~424 KB deferred engine remains materially above the old 60 KB target. New warm-up image delivery adds the full-quality UK PNG plus the 128,904-byte cloud sprite (3,864,455 bytes combined); neither enters the JS/CSS byte counts. Reduced motion avoids cloud preload. Desktop/mobile browser verification observed one actual UK PNG download per page, reused through scene changes and UK-first map activation. Vite's development `?import` URL is a small JS asset-reference module, not another PNG download. No new external service or runtime network dependency is introduced. Artwork optimization remains deliberately deferred.

## Verification / review

17 focused Atlas/homepage/scene tests passed. Production build and complete prerender succeeded with exactly 258 unchanged routes. Homepage/Europe/China/Shanghai metadata, canonical and JSON-LD comparisons passed; crawlable content and Shanghai CITY externalId "2" remain intact. Performance regression guards passed. No protected affiliate code was changed and no live affiliate clicks were generated.

`node scripts/verify-atlas-polish.mjs` passes at 1440px and 390px: no map controls or instructions, UK scene and return, minimum timing, covered-only swaps, caption/Back semantics, <=1px hero document-position change, mobile page scrolling and no horizontal overflow. Screenshots of both scenes and cloud cover were inspected under `/tmp/issue40-polish-*.png`. The earlier scene test also covered slow-image gating, decode failure recovery, reduced motion and duplicate-transition locking.

UK itinerary interaction remains out of scope for this polish pass. Physical-device gesture review remains desirable. UK PNG preload has a substantial intentional transfer cost. Do not start UK itinerary interaction, other country scenes, regional navigation, artwork optimization, or old world/MapLibre cleanup in this iteration. No commit, push, merge or issue closure.
