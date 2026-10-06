# Issue #54 — East Asia Story Maps

Extends the existing Europe architecture with one regional configuration and seven country/region configurations. Europe remains the initial homepage scene. The caption-strip selector provides Europe / East Asia entry using the same cloud transition; it is disabled during travel and regains focus after regional changes. Country Back returns to its configured parent, restoring that country's regional link focus.

No new routes, APIs, dependencies, map engine, timing, country-specific components or artwork changes. `EuropeDestinations` accepts regional data while retaining its Europe defaults. `CountryDestinations` remains the single itinerary layer. The controller optionally accepts an initial regional scene, retaining its Europe default.

## Interaction and loading

One native link per destination owns its primary landmark, name plate and any secondary actor regions. Desktop hover/focus, modified/native click, first-touch arm/second-touch navigation, outside dismissal, inert transitions, reduced motion and failure recovery follow Europe. North Korea is absent from both registries and has no target. Decorative boats, unrequested areas and neighboring geography remain inactive. Hong Kong and Macau each have exactly one itinerary link despite several illustrated actors.

All coordinates are normalized source-artwork positions, never GIS coordinates. Supplementary regions now use the same border-aware projection and resize observer as the accepted regional layer: a 1px anchor border otherwise displaces very small percentage children on mobile. This correction is shared and verified against Europe, rather than changing artwork positions to mask drift.

Country PNGs use persistent hidden lazy previews and load/decode on selection beneath the existing clouds. Asset imports contain URL descriptors, not embedded PNG bytes. Browser checks verify no East Asia country image request before selection. Only the existing UK warm-up remains. Europe / East Asia PNGs are also not both eagerly loaded: Europe is initial, East Asia is requested on regional selection. Failures return to the previous scene and restore controls/focus. Initial-preview failure is scoped to its own region and clears when its image loads successfully.

Mongolia's regional callout opens below its top-edge ger. Existing inward alignment options keep edge callouts contained. Terelj shows the concise baked name in its callout while retaining Gorkhi–Terelj National Park in the accessible link name. Kharkhorin in the Mongolia artwork resolves to the official Karakorum itinerary; Macau's Chinese name plate resolves to the sole Macau itinerary. No slug substitutions.

## Verified official mappings and hit regions

Each supplied slug was verified against the actual official country inventory and detail bootstrap before wiring, and again by tests against the fresh production output. Rectangles below are source pixels (left, top, right, bottom) on 1536×1024 artwork, stored normalized in configuration. Same-destination areas can overlap; cross-destination areas are disjoint.

### china

9 destinations; 21 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Beijing | 50 | `4-days-beijing-where-history-sets-the-measure` | beijing-forbidden-city (landmark): (1050, 187, 1244, 251); beijing-plate (plate): (1091, 250, 1208, 291); beijing-great-wall (landmark): (1050, 155, 1120, 187) |
| Shanghai | 51 | `4-days-shanghai-where-the-future-never-waits` | shanghai-skyline (landmark): (1230, 447, 1319, 518); shanghai-plate (plate): (1256, 518, 1362, 553) |
| Xi’an | 52 | `3-days-xian-where-the-road-begins-inward` | xian-terracotta-and-pagoda (landmark): (638, 372, 762, 479); xian-plate (plate): (749, 414, 850, 458); xian-pagoda-top (landmark): (705, 352, 739, 372) |
| Chengdu | 53 | `3-days-chengdu-where-life-slows-to-stay` | chengdu-panda-and-temple (landmark): (646, 551, 794, 592); chengdu-plate (plate): (668, 585, 787, 625) |
| Guilin | 54 | `3-days-guilin-where-the-land-leans-into-water` | guilin-karst-and-river (landmark): (725, 636, 980, 714); guilin-plate (plate): (889, 711, 987, 753) |
| Hangzhou | 55 | `3-days-hangzhou-where-water-teaches-patience` | hangzhou-west-lake (landmark): (1135, 564, 1290, 647); hangzhou-plate (plate): (1200, 570, 1318, 608) |
| Guangzhou | 56 | `3-days-guangzhou-where-rivers-carry-everyday-life` | guangzhou-canton-tower (landmark): (1115, 702, 1157, 815); guangzhou-plate (plate): (1000, 791, 1126, 834); guangzhou-river-and-temple (landmark): (968, 755, 1115, 791) |
| Dengfeng | 57 | `2-days-dengfeng-where-discipline-finds-stillness` | dengfeng-shaolin-temple (landmark): (884, 368, 997, 429); dengfeng-plate (plate): (933, 426, 1053, 466) |
| Changzhou | 58 | `3-day-changzhou-alley-lanterns-and-pagoda-light` | changzhou-pagoda (landmark): (1143, 413, 1205, 521); changzhou-plate (plate): (1086, 520, 1220, 560) |

### japan

9 destinations; 23 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Tokyo | 37 | `4-days-tokyo-where-order-holds-the-motion` | tokyo-tokyo-tower-and-skyline (landmark): (1080, 514, 1275, 565); tokyo-plate (plate): (1170, 566, 1270, 607); tokyo-tower-base (landmark): (1128, 564, 1170, 624) |
| Kyoto | 38 | `3-days-kyoto-where-quiet-learns-to-last` | kyoto-pagoda-and-temple (landmark): (679, 541, 759, 614); kyoto-plate (plate): (749, 575, 851, 616) |
| Osaka | 39 | `3-days-osaka-where-appetite-leads-the-way` | osaka-osaka-castle (landmark): (628, 584, 678, 642); osaka-plate (plate): (658, 643, 755, 682) |
| Fukuoka | 40 | `3-days-fukuoka-where-the-city-feeds-you-gently` | fukuoka-fukuoka-town (landmark): (178, 686, 345, 750); fukuoka-plate (plate): (205, 749, 320, 788) |
| Hiroshima | 41 | `3-days-hiroshima-where-memory-makes-space-for-life` | hiroshima-atomic-bomb-dome (landmark): (445, 579, 506, 642); hiroshima-plate (plate): (410, 644, 535, 682); hiroshima-peace-park (landmark): (509, 604, 616, 644) |
| Kanazawa | 42 | `3-days-kanazawa-where-craft-sets-the-pace` | kanazawa-kanazawa-town (landmark): (742, 398, 820, 491); kanazawa-plate (plate): (806, 433, 936, 474) |
| Hakone | 43 | `2-days-hakone-where-steam-slows-the-thoughts` | hakone-lake-torii (landmark): (1049, 636, 1098, 704); hakone-plate (plate): (1088, 680, 1199, 722) |
| Nara | 44 | `2-days-nara-where-history-walks-beside-you` | nara-temple-and-deer (landmark): (796, 618, 939, 649); nara-plate (plate): (799, 649, 900, 687); nara-temple-roof (landmark): (851, 599, 935, 618); nara-deer (landmark): (793, 687, 861, 712) |
| Fujiyoshida | 45 | `2-days-fujiyoshida-where-the-mountain-sets-the-distance` | fujiyoshida-mount-fuji (landmark): (960, 449, 1067, 510); fujiyoshida-plate (plate): (1067, 465, 1201, 505); fujiyoshida-chureito-pagoda (landmark): (1036, 510, 1076, 559) |

### south-korea

4 destinations; 10 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Seoul | 46 | `4-days-seoul-where-history-keeps-up-with-speed` | seoul-palace (landmark): (571, 192, 734, 252); seoul-plate (plate): (559, 248, 671, 293); seoul-city-buildings (landmark): (457, 186, 571, 252) |
| Busan | 47 | `3-days-busan-where-the-city-breathes-outward` | busan-harbour (landmark): (1030, 639, 1305, 709); busan-plate (plate): (1106, 697, 1212, 740); busan-harbour-tower-top (landmark): (1100, 608, 1140, 639) |
| Gyeongju | 48 | `3-days-gyeongju-where-history-rests-in-the-open` | gyeongju-temple-and-pagoda (landmark): (977, 496, 1150, 553); gyeongju-plate (plate): (1025, 553, 1179, 599) |
| Jeonju | 49 | `2-days-jeonju-where-flavor-keeps-history-close` | jeonju-hanok-village (landmark): (581, 484, 793, 539); jeonju-plate (plate): (605, 539, 730, 582) |

### mongolia

3 destinations; 7 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Ulaanbaatar | 66 | `3-days-ulaanbaatar-where-the-city-meets-the-steppe` | ulaanbaatar-monastery (landmark): (712, 330, 1002, 436); ulaanbaatar-plate (plate): (822, 433, 982, 474) |
| Karakorum | 67 | `2-days-karakorum-where-empire-left-no-walls` | karakorum-erdene-zuu (landmark): (340, 513, 699, 584); karakorum-plate (plate): (449, 579, 608, 620) |
| Gorkhi–Terelj National Park | 68 | `2-days-terelj-where-the-land-opens-you` | terelj-turtle-rock (landmark): (1174, 295, 1294, 385); terelj-plate (plate): (1227, 384, 1337, 426); terelj-ger-camp (landmark): (1136, 418, 1224, 470) |

### taiwan

5 destinations; 13 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Taipei | 59 | `4-days-taipei-where-everyday-life-feels-kind` | taipei-taipei-101 (landmark): (986, 9, 1038, 140); taipei-plate (plate): (984, 140, 1102, 184); taipei-temple (landmark): (844, 143, 971, 207) |
| Tainan | 60 | `3-days-tainan-where-time-stays-to-eat-and-remember` | tainan-temple-and-fort (landmark): (552, 516, 753, 574); tainan-plate (plate): (594, 573, 711, 617) |
| Taichung | 61 | `3-days-taichung-where-balance-finds-its-form` | taichung-town (landmark): (742, 228, 894, 303); taichung-plate (plate): (727, 304, 859, 345); taichung-theatre (landmark): (664, 356, 787, 415) |
| Kaohsiung | 62 | `3-days-kaohsiung-where-the-city-turns-toward-the-light` | kaohsiung-harbour-and-skyline (landmark): (400, 620, 769, 750); kaohsiung-plate (plate): (568, 750, 711, 790) |
| Hualien | 63 | `3-days-hualien-where-the-land-speaks-first` | hualien-taroko-gorge (landmark): (975, 357, 1069, 518); hualien-plate (plate): (1079, 416, 1207, 461); hualien-gorge-bridge (landmark): (1006, 520, 1103, 565) |

### hong-kong

1 destinations; 6 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Hong Kong | 64 | `4-days-hong-kong-where-the-city-rises-and-folds-back` | hong-kong-victoria-harbour-skyline (landmark): (818, 395, 1193, 478); hong-kong-plate (plate): (912, 470, 1059, 512); hong-kong-kowloon-buildings (landmark): (742, 249, 868, 391); hong-kong-peak-tram (landmark): (817, 681, 882, 738); hong-kong-island-skyline (landmark): (707, 528, 1199, 682); hong-kong-buddha (landmark): (299, 448, 356, 539) |

### macau

1 destinations; 6 hit regions.

| Destination | Official ID | Exact slug | Hit regions |
|---|---:|---|---|
| Macau | 65 | `3-days-macau-where-time-changes-language` | macau-st-pauls (landmark): (636, 146, 718, 242); macau-plate (plate): (594, 285, 714, 337); macau-guia-lighthouse (landmark): (680, 40, 739, 115); macau-penha-church (landmark): (878, 810, 925, 894); macau-grand-lisboa (landmark): (518, 311, 601, 443); macau-cotai-skyline (landmark): (491, 479, 1046, 673) |

## Immutable artwork

All eight source PNGs are 1536×1024 and owner-supplied. No byte processing or filename changes. The before hashes are independently pinned in Atlas tests and compared again at completion.

| Source | Bytes | SHA-256 before = after |
|---|---:|---|
| `src/assets/atlas/east-asia/east-asia-atlas.png` | 3,815,992 | `6e6630ee7f2d99edf2aeafaeead31d01040ca52f8002d28e1b684c4080352e42` |
| `src/assets/atlas/countries/china/china-atlas.png` | 3,565,667 | `ac543e283c7a8f951180b3ca07b846efe779b58b4de92f2aba9782a6f0cc1064` |
| `src/assets/atlas/countries/japan/japan-atlas.png` | 3,454,799 | `0b10cd1950b0e01a0a76146b9b4f03374008da4e5ecfa92a9482d6a855c21c67` |
| `src/assets/atlas/countries/south-korea/south-korea-atlas.png` | 3,794,430 | `b950c0a8d2f1d2d0be1338e8f1415577aaf432d94c0ad7b15ed9c571d08705da` |
| `src/assets/atlas/countries/mongolia/mongolia-atlas.png` | 3,501,382 | `ec09308bbf942f06f698242c073584d0245cb05b11946de3054c0923832e0498` |
| `src/assets/atlas/countries/taiwan/taiwan-atlas.png` | 3,643,228 | `46e5ca72c86b735ab8a3553694137a9fceecc51e5947081428c1ee8211adc674` |
| `src/assets/atlas/countries/hong-kong/hong-kong-atlas.png` | 3,668,069 | `338a214aac7c5a0754733357fc25ac7666385446775e4bb0d6fc736589a29d10` |
| `src/assets/atlas/countries/macau/macau-atlas.png` | 3,717,380 | `56e526082a0d41de260cd5440b106abd28154d13628d57cff4a05a7e9fe6acab` |

## Validation and remaining debt

Focused Atlas tests protect seven East Asia scenes, 32 literal itinerary slugs, all eight artwork hashes, bounds/non-overlap, inert context, localized single-link semantics, lazy previews, covered-only swaps, Back and recovery. The established browser verifier checks all nine Europe scenes plus East Asia on desktop (1440px) and mobile (390px), including all hit-region centers, scenic points, callout containment, keyboard/focus, native/modified navigation, touch arm/disarm, normal scrolling, reduced motion and blocked-image retry. Optional `ATLAS_REGION=east-asia` / `ATLAS_COUNTRIES=...` supports targeted iteration; the default command still checks every scene. HMR/watch are disabled during browser verification to avoid unrelated file writes reloading test pages.

EN/FR Atlas UI and accessible names are translated; baked labels remain immutable. Screenshots are captured under /tmp/issue54-*. Dense baked labels are necessarily small on mobile; readable semantic callouts and name-plate interaction remain available. Physical-device review remains useful.

Source PNGs remain approximately 3.5–3.8 MB each; the eight assets add 29,160,947 bytes to build storage, not initial transfer. No optimization was performed. The inherited deferred MapLibre adapter/worker cost (~424 KB gzip) remains unchanged debt. The inherited untracked `scripts/verify-atlas-scenes.mjs` is excluded and untouched.

## Final results

- Focused Atlas suite: 89 passed, 0 failed.
- Full frontend suite against fresh production output: 713 passed, 0 failed (`node --test --test-concurrency=1 tests/*.test.js`).
- Default, unfiltered `npm run atlas:verify`: passed all 16 country scenes and both regional surfaces at 1440px and 390px, with existing configured failure/retry checks plus all seven new scene failures. Screenshots manually reviewed for every new scene.
- Production build: passed; 258 generated HTML documents, matching the protected inventory. Existing large-chunk/optional-food-image warnings remain.
- Homepage, Europe, East Asia, China and Shanghai generated HTML: each has one correct canonical and two valid JSON-LD blocks.
- All eight before/after artwork hashes match; `git diff --check` passes.
- Initial JS: 529,920 → 551,618 bytes raw; 171,233 → 176,756 bytes gzip (+5,523). Existing 180,000-byte guard remains unchanged and passes.
- Initial CSS: 88,363 → 89,006 bytes raw; 16,198 → 16,325 bytes gzip (+127).

The default verifier now explicitly clears the pointer before asserting no permanent callouts: a regional click can legitimately land on an actor in the next scene. Native modified clicks still have their original assertions; timing limits were not weakened. Earlier development-run failures were corrected/rechecked. The full suite was rerun after build completion because running it while `dist` was being replaced caused missing-fixture errors.

Ready for owner manual review; nothing committed, pushed or merged.
