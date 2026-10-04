# Issue #46: Spain Story Map

Spain is the third Country Story Map. Adding it was **configuration only**. `AtlasStage`, `CountryDestinations`, the scene state machine and the transition were not changed, which confirms the #44 abstraction. Europe, the UK, France and all approved artwork are unchanged.

## What was added

- `atlas/spainDestinations.js`: seven literal official slugs with landmark and name-plate regions.
- A `spain` entry in `atlas/countryScenes.js` (Europe country id `spain`, preview class, destinations, text keys).
- `spain` in `SCENE_ASSETS` (`useAtlasScene.js`). It is **not** warmed after mount; the UK warm-up is unchanged.
- EN/FR strings under `homeMagazine.atlas`: `spainCaption` (SPAIN / ESPAGNE), `spainStory`, `spainMapLabel`, `spainPreviewAlt`, `spainDestinations`, `spainPlaces.*` (accents kept: Córdoba, Málaga).

Europe → Spain → itinerary and Spain → Back to Europe use the accepted cloud transition (cover 700ms, hold 220ms, reveal 800ms). The Spain image loads on selection, the covered phase waits for decode (8s deadline), and failure restores Europe with the translated alert and focus on the Spain link. Reduced motion skips the clouds. `/browse/spain` remains the crawlable fallback and the modified-click target.

## Destinations

| Destination | ID | Slug | Landmark region (source px) | Name plate |
|---|---:|---|---|---|
| Barcelona | 90 | `4-days-barcelona-between-order-and-instinct` | Sagrada Família (1190, 210, 1300, 312) | (1238, 306, 1378, 344) |
| Madrid | 92 | `4-days-madrid-after-dark-the-city-wakes` | Royal Palace (655, 328, 820, 442) | (738, 414, 858, 454) |
| Valencia | 94 | `3-days-valencia-light-space-and-forward-motion` | Serranos towers + City of Arts (1040, 400, 1238, 482) | (1064, 483, 1188, 520) |
| Córdoba | 97 | `2-days-cordoba-enclosure-shade-and-proportion` | Mezquita (380, 492, 552, 590) | (438, 585, 562, 620) |
| Seville | 93 | `4-days-seville-living-by-ritual-and-heat` | Giralda + cathedral (572, 558, 722, 668) | (594, 662, 702, 698) |
| Granada | 95 | `3-days-granada-water-shadow-and-patience` | Alhambra (808, 615, 1005, 702) | (913, 694, 1042, 732) |
| Málaga | 91 | `3-days-malaga-sun-ground-and-everyday-life` | Seafront town (620, 735, 880, 808) | (643, 808, 768, 846) |

No regions overlap. The closest gaps are Córdoba's plate to Seville's cathedral (10 source px) and Granada to Málaga (33 px). The monastery, castles, windmills, villages, palms, Balearics, Portugal and Morocco are decorative. Barcelona's callout aligns to its right edge (it overflowed at 390px); all others use the default placement. Artwork: `src/assets/atlas/countries/spain/spain-atlas.png`, 1536×1024, sha256 `815fa0c3692352824b7acccda1b02a0d13ad2f3b4a2a2ac131e6e8d9b9ec25a6`, with the baked English title/slogan accepted.

## Verification

`tests/atlasSpain.test.js` covers artwork bytes, inventory and literal slugs, prerender presence, bounds/non-overlap/Córdoba–Seville gap, EN/FR strings, configuration-only rendering (no Spain branch in `AtlasStage`), lazy hidden preview with no warm-up, and the covered-only sequence with failure rollback. `scripts/verify-atlas.mjs` runs one shared `checkCountryScene` for France and Spain at 1440px/390px, plus a real-browser Spain image-failure check at 1440px (alert, rollback, focus, retry). Prerender stays at 258 routes.
