# Issue #44: France Story Map

France is the second Country Story Map. Europe → France uses the accepted cloud transition (cover 700ms, covered hold 220ms, reveal 800ms) and Back to Europe. Europe hit regions, the UK scene and its nine destinations, and all approved artwork are unchanged.

## Scene configuration

`atlas/countryScenes.js` maps each country scene (`uk`, `france`) to its Europe country id, preview class, destinations and caption/story/map/preview/nav keys. `AtlasStage` looks scenes up there instead of branching on `'uk'`. It keeps one persistent hidden `<img>` per scene, intercepts any configured Europe country, renders the caption and Back for any country scene, and on return focuses the country link the visitor came from (also after a failed load). `atlasSceneTransition.js` accepts the configured scene list (default `europe/uk`). The state machine is otherwise untouched. `UkDestinations.jsx` was renamed to the generic `CountryDestinations.jsx` with `destinations`/`navLabelKey` props and unchanged interaction code. Europe without a story map keeps native `/browse/<country>` links; France keeps `/browse/france` as its crawlable fallback and for modified clicks.

## On-demand artwork

`SCENE_ASSETS` gains `france`, but France is **not** warmed after mount (the UK warm-up is unchanged, a scope decision for #44). The France preview `<img>` is `loading="lazy"` and hidden, so the browser does not fetch it. Selecting France starts the load immediately. The clouds cover, the covered phase waits for decode (8s deadline), and the scene swaps only under cover. Failure restores Europe with the translated alert. Reduced motion skips the clouds; the swap still waits for decode. The verifier asserts no France image request before selection.

## Destinations

`atlas/franceDestinations.js` holds exactly six literal official slugs (IDs 78–83). Links use `getOfficialItineraryPath(slug)`.

| Destination | ID | Slug |
|---|---:|---|
| Paris | 78 | `4-days-paris-where-icons-meet-everyday-grace` |
| Nice | 79 | `3-days-nice-where-light-teaches-you-to-slow` |
| Lyon | 80 | `3-days-lyon-where-food-gives-structure-to-time` |
| Bordeaux | 81 | `3-days-bordeaux-where-the-river-teaches-patience` |
| Strasbourg | 82 | `3-days-strasbourg-where-borders-learn-to-breathe` |
| Marseille | 83 | `3-days-marseille-where-the-sea-refuses-to-be-quiet` |

Each is one native link (one tab stop) with a landmark anchor and the artwork's name plate. Boxes were measured in source pixels on the approved artwork and are not inflated. Marseille ends at x=1140 and Nice starts at x=1180; the bay and the Calanques stay decorative, as do Mont-Saint-Michel, lavender, vineyards, the Alps and Corsica. Paris opens its callout beneath its plate (top edge at phone width); Strasbourg and Nice align callouts to their right edge. Interaction matches the UK: hover/focus callout `<Name> · View itinerary →`, first tap arms, second navigates, tap elsewhere/Escape disarms, drags are ignored, modified clicks stay native.

Artwork: `src/assets/atlas/countries/france/france-atlas.png`, 1536×1024, 3,571,047 bytes, sha256 `ba1021e1cac38e82797b8b098004d701b7034d79a214ee163450ca6c6af9893d`. Its baked English title and slogan are accepted; the caption is localized (EN "Where time slows, and beauty learns to stay." / FR "Là où le temps ralentit, et où la beauté apprend à rester.").

## Verification

`tests/atlasFrance.test.js`: artwork bytes, inventory and literal slugs, prerender presence, region bounds/non-overlap/Nice–Marseille gap, EN/FR strings, configuration-driven rendering, lazy hidden preview and no France warm-up. `tests/atlasScenes.test.js` adds the France covered-only sequence, on-selection loading and failure rollback. `node scripts/verify-atlas.mjs` adds a France pass at 1440px/390px: no France image before selection, cover-before-swap, hero stability, initial focus on Back, all 12 regions, native activation, callouts inside the frame, keyboard order and Escape, touch arming (including Nice/Marseille independence), page scrolling from a destination, inert return transition with Back disabled, focus back on the France link, reduced motion, a Ctrl/Cmd-click new tab, and real navigation. The UK and Europe checks are unchanged. Prerender stays at 258 routes.
