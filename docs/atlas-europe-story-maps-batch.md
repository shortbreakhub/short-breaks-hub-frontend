# Issue #52: Remaining Europe Country Story Maps

Germany, Greece, Italy, Netherlands and Switzerland complete the nine active Europe country scenes. This is a configuration extension: `AtlasStage`, `CountryDestinations`, `EuropeDestinations`, MapLibre, the transition state machine are unchanged; generic callout CSS gains a left-edge alignment option. The UK, France, Spain and Portugal destination data and artwork are unchanged.

## Scene and loading contracts

Each country is registered in `countryScenes.js` and `SCENE_ASSETS` with a dedicated destination configuration. All five PNGs use hidden `loading="lazy"` previews and decode on selection, under the existing cloud cover. They are not preloaded after mount; the UK warm-up remains unchanged. Failures restore Europe, announce the existing translated error and focus the selected country. Back stays outside the artwork. Cover/hold/reveal timing, reduced motion and interaction locking are unchanged.

All destination links use literal official itinerary slugs. Desktop hover/focus and native click, keyboard navigation, touch first-tap arm/second-tap navigation and tap-outside dismissal are inherited from the generic layer. One link/tab stop serves every landmark and name plate belonging to that destination. EN/FR structural strings and destination names use the existing translation pattern; baked artwork text is unchanged.

## Verified itinerary mapping and artwork hit regions

Resolved against each repository production country inventory and its official detail bootstrap before implementation. Coordinates below are `(left, top, right, bottom)` source pixels on the 1536×1024 artwork, normalized by each configuration’s existing helper. They are illustration positions, never GIS coordinates. All cross-destination boxes are disjoint; same-destination regions may overlap intentionally.

Crete (Chania) resolves to official `city: "Crete (Chania)"`, ID 121. Palermo resolves to `city: "Sicily (Palermo)"`, ID 89; its route is the Sicily itinerary, not a new Palermo route.

### Germany

| Destination | Official ID | Exact slug | Hit regions (source pixels) |
|---|---:|---|---|
| Hamburg | 104 | `3-days-hamburg-where-distance-creates-clarity` | harbour-and-elbphilharmonie (landmark): (718, 138, 915, 238); hamburg-plate (plate): (752, 242, 876, 282) |
| Berlin | 102 | `4-days-berlin-where-history-refuses-to-stay-silent` | brandenburg-gate-and-tv-tower (landmark): (969, 212, 1215, 378); berlin-plate (plate): (1064, 366, 1165, 409) |
| Dresden | 106 | `3-days-dresden-where-rebuilding-became-remembrance` | elbe-and-frauenkirche (landmark): (976, 428, 1240, 544); dresden-plate (plate): (1044, 541, 1166, 586) |
| Cologne | 105 | `3-days-cologne-where-continuity-outlasts-destruction` | cathedral-and-rhine-bridge (landmark): (490, 353, 782, 500); cologne-plate (plate): (584, 498, 700, 541) |
| Heidelberg | 107 | `2-days-heidelberg-where-romance-learns-restraint` | heidelberg-castle (landmark): (558, 594, 750, 702); heidelberg-plate (plate): (578, 724, 709, 768); old-town-and-neckar-bridge (landmark): (700, 695, 880, 776) |
| Munich | 103 | `3-days-munich-where-tradition-makes-room-to-breathe` | frauenkirche-and-old-town (landmark): (893, 730, 1098, 862); munich-plate (plate): (982, 850, 1095, 892) |

### Greece

| Destination | Official ID | Exact slug | Hit regions (source pixels) |
|---|---:|---|---|
| Thessaloniki | 122 | `3-days-thessaloniki-where-layers-gather-around-the-table` | white-tower-and-waterfront (landmark): (635, 145, 724, 230); thessaloniki-plate (plate): (724, 178, 858, 223) |
| Athens | 119 | `4-days-athens-where-every-road-begins` | acropolis-and-temple (landmark): (604, 398, 884, 562); athens-plate (plate): (734, 505, 844, 545) |
| Santorini | 120 | `3-days-santorini-where-light-erases-the-clock` | blue-domed-village (landmark): (840, 590, 1100, 790); santorini-plate (plate): (946, 724, 1065, 767) |
| Crete (Chania) | 121 | `4-days-crete-where-the-land-remembers-longer` | chania-harbour (landmark): (742, 792, 1086, 904); crete-chania-plate (plate): (895, 910, 1055, 954) |
| Rhodes | 123 | `3-days-rhodes-where-walls-learned-to-endure` | rhodes-fortress (landmark): (1190, 546, 1472, 683); rhodes-plate (plate): (1328, 668, 1431, 710) |

### Italy

| Destination | Official ID | Exact slug | Hit regions (source pixels) |
|---|---:|---|---|
| Milan | 87 | `3-days-milan-where-precision-sets-the-tone` | milan-duomo (landmark): (546, 112, 662, 215); milan-plate (plate): (578, 196, 660, 236) |
| Venice | 86 | `3-days-venice-where-the-city-floats-on-patience` | grand-canal-and-palaces (landmark): (800, 180, 1048, 236); venice-plate (plate): (881, 210, 974, 251); venice-campanile (landmark): (941, 121, 980, 191) |
| Florence | 85 | `3-days-florence-where-proportion-teaches-calm` | florence-duomo (landmark): (637, 243, 863, 343); florence-plate (plate): (704, 328, 807, 367); florence-dome-top (landmark): (729, 211, 795, 243) |
| Rome | 84 | `4-days-rome-where-time-refuses-to-move-on` | colosseum (landmark): (671, 413, 871, 528); rome-plate (plate): (770, 517, 853, 556) |
| Naples | 88 | `3-days-naples-where-life-stands-too-close` | castel-nuovo (landmark): (1015, 601, 1139, 675); naples-plate (plate): (941, 595, 1025, 638); naples-harbour (landmark): (957, 641, 1202, 700) |
| Palermo | 89 | `4-days-sicily-where-every-civilization-stayed-awhile` | palermo-cathedral (landmark): (722, 759, 880, 855); palermo-plate (plate): (765, 839, 870, 879); palermo-palace (landmark): (853, 803, 993, 917) |

### Netherlands

| Destination | Official ID | Exact slug | Hit regions (source pixels) |
|---|---:|---|---|
| Haarlem | 112 | `2-days-haarlem-where-craft-feels-enough` | grote-kerk-and-old-town (landmark): (615, 282, 758, 368); haarlem-plate (plate): (584, 364, 700, 406) |
| Amsterdam | 108 | `4-days-amsterdam-where-water-teaches-balance` | amsterdam-canal-houses (landmark): (809, 339, 963, 414); amsterdam-plate (plate): (838, 400, 970, 443) |
| The Hague | 111 | `3-days-the-hague-where-power-speaks-softly` | binnenhof (landmark): (451, 450, 623, 548); the-hague-plate (plate): (488, 524, 621, 568) |
| Utrecht | 110 | `2-days-utrecht-where-closeness-creates-clarity` | dom-tower-and-old-town (landmark): (802, 485, 999, 607); utrecht-plate (plate): (879, 595, 993, 639) |
| Rotterdam | 109 | `3-days-rotterdam-where-the-city-decided-to-start-again` | skyline-and-erasmus-bridge (landmark): (472, 600, 735, 697); rotterdam-plate (plate): (519, 678, 644, 720) |

### Switzerland

| Destination | Official ID | Exact slug | Hit regions (source pixels) |
|---|---:|---|---|
| Zurich | 113 | `3-days-zurich-precision-without-coldness` | zurich-old-town (landmark): (831, 147, 1025, 253); zurich-plate (plate): (896, 216, 992, 257) |
| Lucerne | 114 | `2-days-lucerne-lake-bridge-and-alignment` | chapel-bridge-and-water-tower (landmark): (775, 270, 925, 381); lucerne-plate (plate): (859, 363, 969, 405) |
| Bern | 116 | `2-days-bern-continuity-along-the-bend` | bern-old-town (landmark): (520, 351, 622, 457); bern-plate (plate): (612, 411, 697, 452) |
| Interlaken | 115 | `3-days-interlaken-exposed-to-scale` | interlaken-church-and-village (landmark): (800, 410, 915, 508); interlaken-plate (plate): (681, 533, 805, 574); interlaken-spire (landmark): (839, 394, 855, 410) |
| Geneva | 117 | `3-days-geneva-water-diplomacy-and-balance` | jet-deau (landmark): (278, 545, 321, 650); geneva-plate (plate): (177, 658, 285, 701); geneva-old-town (landmark): (100, 642, 186, 708) |
| Zermatt | 118 | `3-days-zermatt-altitude-silence-and-effort` | matterhorn (landmark): (548, 638, 749, 798); zermatt-plate (plate): (667, 796, 778, 840); zermatt-chalets (landmark): (508, 791, 651, 850) |

Decorative Alps, waterways, villages, unnamed monuments, ships, title banners/compasses and neighboring-country artwork stay inert. Italy’s Sardinia has no requested official node and is non-interactive. Greece’s mainland decorative temple is not assigned to Athens; only the labeled Acropolis node is interactive. Heidelberg’s bridge, Venice’s campanile, Naples’s harbor, Palermo’s second building, Geneva’s old town and Zermatt’s chalets are secondary regions of the same single destination link.

Hamburg, Thessaloniki, Milan, Venice and Zurich use the existing below-callout option for top-edge clearance. Rhodes uses the existing end alignment for the right edge. Geneva anchors its link on the Jet d’Eau, with its western town/plate as secondary regions. It uses a small generic `calloutAlign: "start"` CSS option, matching the existing right-edge option, to keep its mobile callout inside the frame without expanding its hit area into unrelated scenery.

## Immutable artwork provenance

All five source PNGs were supplied and locked by the owner. No image processing or filename changes were performed. These hashes were recorded before implementation and are asserted by `tests/atlasEuropeBatch.test.js`.

| Country / source path | Dimensions | Bytes | SHA-256 before and after |
|---|---|---:|---|
| `src/assets/atlas/countries/germany/germany-atlas.png` | 1536×1024 | 3,559,376 | `5a9dad915c7078ca9cb215e59a4e3f68c0ca2475b716f0717dc5709353eb703d` |
| `src/assets/atlas/countries/greece/greece-atlas.png` | 1536×1024 | 3,625,563 | `d0f7a132a77d32a69686911f3ea08fe622e51cb1aab21e52f6b23f56280c9066` |
| `src/assets/atlas/countries/italy/italy-atlas.png` | 1536×1024 | 3,726,981 | `24987f0978b87cb433509a3b0fad5b22d956ae38145982437c723beac3909e48` |
| `src/assets/atlas/countries/netherlands/netherlands-atlas.png` | 1536×1024 | 3,557,300 | `8e0fd2bfaba90ba62dc7012b71f8fc3afdbdc3f2e4aa056ee90b51bd06bdd1ca` |
| `src/assets/atlas/countries/switzerland/switzerland-atlas.png` | 1536×1024 | 3,596,953 | `119332c17778f214953ad054dc6b35143e42274ff609f557fc8d162b14e46612` |

## Validation

`tests/atlasEuropeBatch.test.js` covers all 28 exact official mappings, immutable PNG hashes/dimensions, inventory/detail bootstrap, bounds and invalid overlaps, inert contextual locations, localized generic rendering, single native links, hidden lazy previews, absence of country-specific stage forks, covered-only swaps, Back and failure rollback. Existing Atlas tests protect the previous four scenes.

The established tracked `scripts/verify-atlas.mjs` now runs its existing country-scene checks for all eight non-UK scenes; its UK checks remain. New scenes receive desktop and mobile landmark/plate resolution, native navigation/modified click, hover/focus, touch arm/disarm, neighbor independence, page scrolling, callout containment, Back/focus restoration, reduced motion and image-failure/retry checks. The inherited untracked `scripts/verify-atlas-scenes.mjs` is intentionally excluded and untouched.

Final automated results: 66 Atlas tests passed; the complete frontend suite passed all 690 tests with `node --test --test-concurrency=1 tests/*.test.js`. The default concurrent suite stalled in the pre-existing itinerary-loading test; that test passed independently and in the serial suite. The established `npm run atlas:verify` passed all nine scenes at 1440px and 390px, including the new scenes’ failure/retry checks. Verifier focus restoration and reduced-motion measurement use readiness/animation-frame synchronization without relaxing the timing limit. Production build succeeded and emitted exactly 258 prerendered routes. Existing large-chunk and optional-food-image warnings remain.

Source assets remain approximately 3.6 MB each. This adds about 18 MB to generated asset storage, not the initial page transfer: a new country image is requested only when selected. Artwork optimization is deliberately outside this issue.
