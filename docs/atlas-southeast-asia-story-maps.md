# Issue #56 — Southeast Asia Story Maps

Extends the accepted Europe/East Asia scene registries, regional link layer, generic CountryDestinations, caption-strip selector, cloud controller and static illustration presentation. Exactly nine countries and 36 official itinerary destinations. Brunei, Timor-Leste, boats, surrounding geography and unrequested scenery remain inactive.

One native anchor/tab stop owns each destination’s landmark and name plate regions. Desktop hover/focus and modified clicks remain native. Touch first arms, second navigates, outside tap disarms; normal scrolling remains available. Back returns to Southeast Asia and restores the originating regional link focus. The existing 700ms cover / 220ms covered hold / 800ms reveal and short reduced-motion path remain unchanged.

## Artwork geometry

The regional PNG and Cambodia/Indonesia/Laos are 1536×1024. The other six country PNGs are 1672×941. Existing `object-fit: contain` preserves the wider artwork without cropping or stretching inside the stable 3:2 shell. `artworkFramePoint` mirrors that containment before projecting overlay coordinates. Previous 3:2 scene geometry remains unchanged. Wider scenes therefore have intentional cream letterboxing (approximately 43px above/below at the 828px desktop frame, 19px at a 358px mobile frame). No image bytes were processed.

Regional actors: Angkor Wat → Cambodia; Borobudur → Indonesia; Laos temple → Laos; Petronas Towers → Malaysia; Shwedagon Pagoda → Myanmar; church → Philippines; Marina Bay Sands → Singapore; Wat Arun → Thailand; two Ha Long island groups → Vietnam. Ten regions own nine country anchors, including the usable Singapore landmark target. Northern callouts use the existing below-anchor option; Mondulkiri and Malaysia’s western destinations use inward alignment.

## Loading/performance

The first draft exceeded the unchanged 180,000-byte initial-JS gzip guard. The final presentation uses the existing cloud cover as a loading boundary: Southeast Asia regional geometry/URL descriptors load on regional selection; country geometry, URL descriptors and country copy load when a country opens. PNG bytes remain on demand per country. CountryDestinations and the watercolor cloud component are split into small chunks. Their imports must succeed BEFORE React mounts them; country rendering code is ready before the scene swap, and cloud rendering is gated by successful readiness. Failed lazy imports therefore preserve the parent/homepage rather than throwing through React. Browser checks force both failure paths, with refresh recovery for browser-cached failed ES modules. The nine-country configuration uses one cached data loader, not bespoke country components. Failed imports reject into the existing scene-recovery controller.

Country names, preview labels and navigation remain in common EN/FR resources. The new country stories/36 destination labels merge into the SAME `common` namespace from local EN/FR JSON when the country data loads; both languages are registered before reveal. No i18n architecture or namespace change. Existing Europe/East Asia copy and UK artwork warm-up remain intact. All artwork remains self-hosted and unoptimized. MapLibre and its known ~424 KB deferred gzip cost are unchanged.

## Official mappings and hit regions

Every slug and city name was checked against the current official inventory AND detail bootstrap before wiring. Malaysia deliberately uses George Town with its existing `penang` slug. Rectangles below are source pixels (left, top, right, bottom), normalized against each PNG’s actual dimensions. Cross-destination regions do not overlap.

### cambodia

4 destinations; 10 hit regions; 1536×1024.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Siem Reap | `4-days-siem-reap-where-stone-remembers-light` | siem-reap-landmark-1: (553, 245, 767, 316); siem-reap-plate: (551, 315, 686, 349) |
| Phnom Penh | `3-days-phnom-penh-where-history-speaks-softly` | phnom-penh-landmark-1: (764, 558, 948, 638); phnom-penh-plate: (766, 638, 915, 670) |
| Kampot | `3-days-kampot-where-river-time-drifts` | kampot-landmark-1: (676, 749, 813, 791); kampot-plate: (599, 756, 700, 791); kampot-landmark-3: (527, 714, 592, 788) |
| Mondulkiri | `3-days-mondulkiri-where-the-land-opens-wide` | mondulkiri-landmark-1: (1214, 438, 1315, 490); mondulkiri-plate: (1128, 489, 1280, 523); mondulkiri-landmark-3: (1055, 491, 1130, 535) |

### indonesia

4 destinations; 8 hit regions; 1536×1024.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Bali | `5-days-bali-where-rituals-meet-the-tide` | bali-landmark-1: (830, 698, 931, 755); bali-plate: (837, 757, 905, 792) |
| Jakarta | `3-days-jakarta-beneath-the-surface-rhythm` | jakarta-landmark-1: (352, 596, 480, 669); jakarta-plate: (376, 671, 466, 704) |
| Yogyakarta | `4-days-yogyakarta-where-ancient-stories-still-walk` | yogyakarta-landmark-1: (615, 682, 736, 741); yogyakarta-plate: (592, 752, 708, 788) |
| Bandung | `3-days-bandung-where-cool-air-carries-ideas` | bandung-landmark-1: (468, 678, 514, 719); bandung-plate: (459, 720, 542, 747) |

### laos

3 destinations; 6 hit regions; 1536×1024.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Luang Prabang | `4-days-luang-prabang-where-mornings-arrive-quietly` | luang-prabang-landmark-1: (540, 222, 795, 317); luang-prabang-plate: (595, 321, 780, 352) |
| Vientiane | `3-days-vientiane-where-capital-life-moves-softly` | vientiane-landmark-1: (744, 647, 908, 747); vientiane-plate: (763, 748, 901, 781) |
| Vang Vieng | `3-days-vang-vieng-where-the-land-breathes-wide` | vang-vieng-landmark-1: (584, 410, 839, 524); vang-vieng-plate: (682, 532, 829, 563) |

### malaysia

6 destinations; 13 hit regions; 1672×941.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Kuala Lumpur | `3-days-kuala-lumpur-towers-temples-and-street-life` | kuala-lumpur-landmark-1: (411, 446, 558, 530); kuala-lumpur-plate: (428, 532, 595, 558) |
| George Town | `3-days-penang-heritage-lanes-and-hawker-smoke` | george-town-landmark-1: (223, 281, 345, 336); george-town-plate: (152, 249, 295, 281) |
| Langkawi | `4-days-langkawi-sea-breezes-and-slow-horizons` | langkawi-landmark-1: (70, 177, 185, 213); langkawi-plate: (110, 132, 228, 164) |
| Malacca | `2-days-malacca-river-stories-and-colonial-echoes` | malacca-landmark-1: (449, 563, 600, 622); malacca-plate: (470, 623, 575, 651) |
| Ipoh | `2-days-ipoh-white-coffee-and-limestone-quiet` | ipoh-landmark-1: (346, 389, 465, 439); ipoh-plate: (342, 355, 415, 383); ipoh-landmark-3: (424, 335, 540, 389) |
| Johor Bahru | `2-days-johor-bahru-food-malls-and-border-energy` | johor-bahru-landmark-1: (612, 646, 722, 713); johor-bahru-plate: (609, 717, 757, 748) |

### myanmar

3 destinations; 6 hit regions; 1672×941.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Yangon | `4-days-yangon-where-gold-catches-the-light` | yangon-landmark-1: (818, 631, 985, 699); yangon-plate: (839, 699, 952, 730) |
| Mandalay | `4-days-mandalay-where-tradition-stands-its-ground` | mandalay-landmark-1: (879, 189, 1059, 267); mandalay-plate: (890, 268, 1022, 300) |
| Bagan | `3-days-bagan-where-the-earth-holds-the-sky` | bagan-landmark-1: (645, 307, 735, 378); bagan-plate: (731, 346, 831, 380) |

### philippines

4 destinations; 9 hit regions; 1672×941.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Manila | `4-days-manila-where-history-refuses-to-fade` | manila-landmark-1: (750, 213, 843, 293); manila-plate: (773, 293, 881, 329) |
| Cebu | `4-days-cebu-where-journeys-branch-outward` | cebu-landmark-1: (907, 449, 982, 509); cebu-plate: (938, 509, 1030, 544) |
| Palawan | `4-days-palawan-where-water-forgets-the-world` | palawan-landmark-1: (450, 505, 551, 587); palawan-plate: (522, 587, 633, 620); palawan-landmark-3: (391, 581, 458, 628) |
| Bohol | `3-days-bohol-where-the-land-shifts-softly` | bohol-landmark-1: (973, 550, 1070, 610); bohol-plate: (1057, 574, 1153, 610) |

### singapore

1 destinations; 4 hit regions; 1672×941.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Singapore | `4-days-singapore-where-the-city-breathes-in-layers` | singapore-landmark-1: (887, 503, 1046, 584); singapore-plate: (923, 582, 1067, 624); singapore-landmark-3: (1043, 605, 1115, 660); singapore-landmark-4: (726, 534, 781, 582) |

### thailand

6 destinations; 14 hit regions; 1672×941.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Bangkok | `4-days-bangkok-temples-markets-and-city-life` | bangkok-landmark-1: (849, 414, 1031, 466); bangkok-plate: (888, 466, 1007, 497) |
| Chiang Mai | `4-days-chiang-mai-temples-mountains-and-slow-north` | chiang-mai-landmark-1: (727, 140, 812, 172); chiang-mai-plate: (721, 172, 856, 202); chiang-mai-landmark-3: (738, 223, 816, 284) |
| Pattaya | `3-days-pattaya-coastlines-islands-and-evening-lights` | pattaya-landmark-1: (1008, 499, 1087, 525); pattaya-plate: (1048, 525, 1140, 555) |
| Chiang Rai | `3-days-chiang-rai-where-art-meets-stillness` | chiang-rai-landmark-1: (973, 170, 1041, 229); chiang-rai-plate: (943, 133, 1071, 162); chiang-rai-landmark-3: (902, 76, 968, 115) |
| Pai | `3-days-pai-where-the-road-slows-down` | pai-landmark-1: (674, 75, 710, 141); pai-plate: (699, 100, 767, 129) |
| Sukhothai | `2-days-sukhothai-where-kingdoms-breathe-again` | sukhothai-landmark-1: (846, 314, 959, 357); sukhothai-plate: (846, 282, 970, 311) |

### vietnam

5 destinations; 11 hit regions; 1672×941.

| Destination | Exact official slug | Source hit rectangles |
|---|---|---|
| Ho Chi Minh City | `4-days-ho-chi-minh-city-where-the-city-never-settles` | ho-chi-minh-city-landmark-1: (942, 655, 1091, 748); ho-chi-minh-city-plate: (938, 749, 1122, 780) |
| Hoi An | `4-days-hoi-an-where-lanterns-hold-the-evening` | hoi-an-landmark-1: (1007, 443, 1101, 498); hoi-an-plate: (1098, 474, 1196, 507) |
| Huế | `3-days-hue-where-empires-linger-in-silence` | hue-landmark-1: (898, 375, 980, 418); hue-plate: (985, 396, 1058, 430) |
| Hanoi | `4-days-hanoi-where-stories-circle-back` | hanoi-landmark-1: (806, 80, 921, 147); hanoi-plate: (803, 148, 903, 179) |
| Ha Long Bay | `3-days-ha-long-bay-where-stone-rises-from-water` | ha-long-bay-landmark-1: (969, 145, 1107, 190); ha-long-bay-plate: (995, 191, 1139, 222); ha-long-bay-landmark-3: (1146, 163, 1255, 242) |

## Locked artwork — SHA-256 before = after

All 28 Atlas PNGs were hashed before/after, including the 18 existing Europe/East Asia PNGs. The ten supplied PNGs below are unchanged.

| Path | Dimensions | Bytes | SHA-256 |
|---|---|---:|---|
| `src/assets/atlas/southeast-asia/southeast-asia-atlas.png` | 1536×1024 | 3,703,545 | `968161fa998bfe2d622d100297d5b7fbc51376e3c8c4efef2fb7b65e9ed6e9cc` |
| `src/assets/atlas/countries/cambodia/cambodia-atlas.png` | 1536×1024 | 3,613,053 | `93485b2858a3dccc63ef8ed5cae1b7b91943b36df64b9509cb3bc926df95f71f` |
| `src/assets/atlas/countries/indonesia/indonesia-atlas.png` | 1536×1024 | 3,695,779 | `3d137a24fd291d9a8e77240bb3c339f44ed97f22cf73b0a9d6c36e1028832bf1` |
| `src/assets/atlas/countries/laos/laos-atlas.png` | 1536×1024 | 3,711,550 | `1b585df0e324da01fce7b9ff74a8922b91d6d02e5989961a0fde5cba0be4bda7` |
| `src/assets/atlas/countries/malaysia/malaysia-atlas.png` | 1672×941 | 3,441,848 | `5216d840e4b8f19b655ded93f6b5a3d35b96c4307890a98fa3ddcae975e98c75` |
| `src/assets/atlas/countries/myanmar/myanmar-atlas.png` | 1672×941 | 3,383,741 | `377a93118f5079b9bad245d7c1d7058e538edecb8152b0b9e0a5e1dc0942539f` |
| `src/assets/atlas/countries/philippines/philippines-atlas.png` | 1672×941 | 3,362,428 | `012d48b757a293cff34846317da77357a43b392d4f0135b432fb3b6586eaf58f` |
| `src/assets/atlas/countries/singapore/singapore-atlas.png` | 1672×941 | 3,321,034 | `ca5ffded9c121939261400261553607055cad0f8220af1976e7f1f164151c1ae` |
| `src/assets/atlas/countries/thailand/thailand-atlas.png` | 1672×941 | 3,443,992 | `28ced234ed04c2e6ade6f314c81f992981d35c03ef3b20ba0931b79d41be1a5b` |
| `src/assets/atlas/countries/vietnam/vietnam-atlas.png` | 1672×941 | 3,446,153 | `1e6fc2e273f45838b9824ea21c7234e5e48d7280d5f045b433eb64bff24fc240` |

## Validation

Focused tests verify exact inventories, names, single native links, EN/FR resources, bounds/non-overlap, inactive context, parent scene transitions/failure rollback, containment projection, lazy previews and immutable artwork. The established `scripts/verify-atlas.mjs` uses common regional/country checks, including the new nine-country matrix, every hit region, hover/focus, callout containment inside the clipped paper (including letterbox space), native/modified clicks, mobile two-tap/outside dismissal/scrolling, reduced motion, inert transitions, Back/focus and blocked-image retry. Default execution retains Europe and East Asia coverage, adds actual French-language checks for every new country at both widths, and verifies lazy rendering-module failures. The verifier uses an isolated temporary Vite cache to avoid collisions with the active dev/test servers. Optional ATLAS_REGION=southeast-asia supports iteration only.

The inherited unrelated untracked `scripts/verify-atlas-scenes.mjs` remains excluded and untouched. Routes, SEO, Hotel Search, Trip.com, backend, itinerary presentation and MapLibre are out of scope and unchanged.

Remaining debt: full-quality PNG transfer, small baked labels on mobile, physical-device review, intentional letterboxing of the six wider sources, limited initial-JS headroom and inherited MapLibre payload. No directional region arrows.

## Final results

- Focused Atlas tests: 120 passed, zero failed/skipped.
- Full frontend suite: 744 passed, zero failed/skipped (`node --test --test-concurrency=1 tests/*.test.js`).
- Default unfiltered `npm run atlas:verify`: passed, exit 0. All 25 country scenes and three regional surfaces at 1440px and 390px; French UI/callouts checked for every new country; established image-retry checks plus both new rendering-module failure/refresh checks passed. Screenshots of all nine new scenes reviewed at both widths.
- Production build and complete prerender: passed, exactly 258 generated HTML documents. Existing optional-food-image/large-chunk/Browserslist warnings remain.
- Homepage, Southeast Asia, Malaysia, George Town and Shanghai generated canonical/JSON-LD checks passed.
- Initial JS: 555,274 raw / 178,413 gzip bytes. The unchanged 180,000-byte guard passes. Compared with the documented #54 baseline (176,756 gzip), +1,657 bytes; country data/copy and rendering chunks are deferred. No dependency changes.
- Ten supplied and eighteen inherited PNG SHA-256 hashes match the before records; inherited Europe/East Asia artwork also matches HEAD.
- Working/staged `git diff --check` passes. No commit, push, PR or merge.

Development failures were inspected rather than ignored: draft cross-destination overlaps and clipped edge callouts were corrected in configuration; wider-image callouts are checked against the actual clipped Atlas paper rather than the inner letterboxed image; French navigation assertions respect existing uppercase styling. Browser startup cache collisions are avoided with an isolated temporary verifier cache. No production guard/interaction assertion was weakened.
