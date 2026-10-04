# Issue #40 — Europe artwork experiment

**Historical first-artwork integration:** the current approved muted artwork and interaction layer are described in [europe-atlas-interaction.md](europe-atlas-interaction.md). Source size and request measurements below refer to the earlier PNG version.

This product direction supersedes the naked-world presentation described in world-atlas-stage1.md. Europe is the only Atlas test bed. Existing non-Atlas homepage discovery remains global. No region switching, country hit areas, story maps or new landmarks are implemented.

## Surface and camera

The approved src/assets/atlas/europe/europe-atlas.png is unchanged from the staged source: 1536 × 1024, 3,345,601 bytes. No conversion, compression, crop, recoloring or artwork editing was performed. The initial semantic image and the activated MapLibre image source share one emitted PNG URL. The stage is 3:2 at all breakpoints, showing the complete composition. MapLibre renders only the raster and background; no Natural Earth layer is active. Natural Earth data, SVG, provenance and preparation tool remain intact.

MapLibre 6.11.2 remains lazy-loaded on activation, providing camera, bounded pan, cooperative gestures, resize and keyboard handling. The illustration is not georeferenced: it is placed on a synthetic Mercator rectangle whose projected aspect is exactly 3:2. Do not interpret these synthetic longitude/latitude values as real destination coordinates.

Future overlays attach through AtlasStage({onMapReady}); atlasConfig.artworkCoordinate(x,y) converts normalized artwork positions (0..1) to this camera plane for map.project(), with move/resize events. This maintains image attachment without assuming that the painted geography is survey-accurate. No overlays or country interaction are built now.

Default center is the artwork midpoint; min zoom fits the full image width. At default scale drag/keyboard pan are disabled. They are enabled above the minimum scale, with bounds constrained to the image rectangle and no world copies, rotation or pitch. Canvas dimension rounding can adjust the fitted camera by approximately 0.002 zoom units on mobile; controls use a 0.005 tolerance. Reset returns to the full composition.

Maximum relative scale is max(1, min(1.6, 1536/(frameWidth × devicePixelRatio))). This avoids adding source-pixel upsampling where possible. If the default display already exceeds the source resolution, further zoom is disabled. At 1440px desktop DPR1, the frame is 827.58 × 551.72 CSS pixels and the range is 1–1.6×. At 768px DPR2, approximately 722 × 481.33, headroom is about 1.064×. At 390px DPR2, 358 × 238.67, range is 1–1.6×. At mobile DPR3 the limit is approximately 1.43×. Desktop DPR2 has no extra resolution headroom. A larger source would be required to allow substantial zoom on those high-density larger screens without degrading raster quality.

## Validation and delivery cost

Targeted Node Atlas/homepage tests: 9 passed. Production build and complete prerender succeeded: exactly 258 routes. The lean Atlas browser verification covers 1440/768/390 widths, raster source and layer identity, image bounds during pan, conservative zoom limits, reset, keyboard focus, overflow, mobile one-finger page scrolling and two-finger pinch, plus French labels. All passed. Desktop/tablet/mobile screenshots were visually reviewed; source composition and aspect are preserved. An initial concurrent software-WebGL verification timed out during the production build; the isolated final run passed. No complete application suite was rerun for this spike.

Saved artifacts: /tmp/issue40-europe-final-tests.log, /tmp/issue40-europe-final-build.log, /tmp/issue40-europe-final-browser.log, /tmp/issue40-europe-verification.json, /tmp/issue40-europe-performance.json, /tmp/issue40-europe-production-runtime.json, and /tmp/issue40-europe-{preview,map}-*.png. Earlier world verification remains historical evidence, not proof of the changed raster surface.

The PNG is now eagerly requested initially: 3,345,601 bytes versus the previous 73,387-byte SVG, a 3,272,214-byte image increase. No optimization is claimed or attempted. Activation uses the same image URL and requests no GeoJSON. Browser cache policy determines whether the raster source reuses or downloads the PNG again; uncached activation can incur another full PNG response. The request measurements below count unique local assets, not repeated responses or compressed network transfer.

Verified production build measurements before this report-only update:

- Initial JS: 493,375 raw /159,869 gzip bytes.
- CSS: 81,651 raw /15,111 gzip bytes.
- Deferred adapter/engine: 1,017,917 raw /277,041 gzip bytes.
- Worker: 508,068 raw /147,239 gzip bytes.
- Engine plus worker: 1,525,985 raw /424,280 gzip bytes. The original 60 KB Atlas target remains unmet.
- Desktop unique cold local bodies: 4,214,170 bytes; activated: 5,740,155.
- Mobile unique cold local bodies: 4,325,868 bytes; activated: 5,851,853.

The PNG cost dominates this experiment. Keep the source untouched until human review; efficient derivatives and caching are future decisions. Physical-device/GPU checks and approval of the composition/zoom tradeoffs remain. Mobile controls cover a portion of the lower-right artwork; no country interaction has been added to make that overlap consequential yet. No protected routes, SEO strategy, metadata, backend, Hotel Search, mappings, affiliate values or itinerary behavior changed. No commit, push, merge or issue closure.
