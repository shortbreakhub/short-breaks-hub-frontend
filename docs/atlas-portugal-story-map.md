# Issue #48: Portugal Story Map

Portugal is the fourth Country Story Map. Like Spain, it is **configuration only**: `AtlasStage`, `CountryDestinations`, the scene state machine and the transition are unchanged. Europe, the UK, France, Spain and all approved artwork are unchanged.

## What was added

- `atlas/portugalDestinations.js`: five literal official slugs with landmark and name-plate regions.
- A `portugal` entry in `atlas/countryScenes.js`.
- `portugal` in `SCENE_ASSETS` (`useAtlasScene.js`), pointing at the owner's file `portugal_atlas.png` (underscore name kept as delivered). It is **not** warmed after mount; the UK warm-up is unchanged.
- EN/FR strings under `homeMagazine.atlas`: `portugalCaption` (PORTUGAL), `portugalStory`, `portugalMapLabel`, `portugalPreviewAlt`, `portugalDestinations`, `portugalPlaces.*` (FR: Lisbon → Lisbonne).

Europe → Portugal → itinerary and Portugal → Back to Europe use the accepted cloud transition. The image loads on selection, the covered phase waits for decode, and failure restores Europe with the alert and focus on the Portugal link. `/browse/portugal` remains the crawlable fallback.

## Destinations

| Destination | ID | Slug | Regions (source px: left, top, right, bottom) |
|---|---:|---|---|
| Porto | 98 | `3-days-porto-where-the-river-keeps-its-word` | Sé + Ribeira (676, 18, 940, 222); plate (734, 150, 826, 186); Dom Luís bridge (935, 150, 1180, 222) |
| Sintra | 99 | `2-days-sintra-where-forests-hold-the-dream` | Pena + Moorish castle (565, 232, 770, 348); plate (568, 350, 670, 388) |
| Lisbon | 96 | `4-days-lisbon-where-light-carries-memory` | Belém Tower + tram (488, 468, 790, 606); plate (584, 484, 690, 522) |
| Lagos | 101 | `3-days-lagos-where-the-coast-lets-go` | Ponta da Piedade cliffs (345, 700, 760, 848); plate (538, 714, 642, 756) |
| Faro | 100 | `3-days-faro-where-the-land-learns-to-rest` | Old town + harbour (790, 785, 1100, 900); plate (848, 841, 952, 883) |

Porto is split into two landmark regions so that the greyed Spain artwork (east of x≈940 above the river) stays inert. No regions overlap. The closest gaps are Porto–Sintra (10 source px), Lagos–Faro (30 px) and Sintra–Lisbon (80 px). The white villages between cities (including the one above the Lagos plate), the inland castle, boats, outer sea stacks, the 25 de Abril bridge over open water, the lagoon and Spain are decorative. Porto's callout opens beneath its regions (top edge, like Paris); all others use the default placement. Artwork: `src/assets/atlas/countries/portugal/portugal_atlas.png`, 1536×1024, sha256 `0f3c32a3686dcea7f99a8e82e224c45ccac599b8762775ee668c2c659f204b2b`.

## Verification

`tests/atlasPortugal.test.js` covers artwork bytes, inventory and literal slugs, prerender presence, bounds/non-overlap/cluster gaps/Spain clearance, EN/FR strings (Lisbonne), configuration-only rendering with one link per destination despite Porto's three regions, lazy hidden preview with no warm-up, and the covered-only sequence with failure rollback. `scripts/verify-atlas.mjs` runs the shared `checkCountryScene` for Portugal at 1440px/390px (with a per-country asset name for the underscore file, and both Sintra/Lisbon and Lagos/Faro independence) plus the real-browser image-failure check at 1440px. Prerender stays at 258 routes.
