# Issue #42: UK Story Map itinerary destinations

Supersedes the #40 note that UK artwork is non-interactive. Europe interaction, the cloud transition, Back to Europe and initial UK focus (Back) are unchanged. Approved artwork is untouched.

## Inventory

`src/components/home/atlas/ukDestinations.js` stores exactly nine literal official API slugs; nothing is derived from destination names. Links use `getOfficialItineraryPath(slug)` → existing `/itinerary/:slug` pages (prerendered, canonical, language-neutral).

| Destination | ID | Slug |
|---|---:|---|
| Cambridge | 69 | `3-day-cambridge-colleges-and-river-cam` |
| London | 70 | `4-days-london-beyond-the-postcards` |
| Bristol | 71 | `2-days-bristol-where-creativity-meets-the-harbour` |
| York | 72 | `2-days-york-walls-and-whispering-streets` |
| Glasgow | 73 | `2-days-glasgow-grit-geometry-and-great-museums` |
| Lake District | 74 | `3-days-lake-district-water-stone-and-open-skies` |
| Bath | 75 | `2-days-bath-stone-curves-and-roman-roots` |
| Oxford | 76 | `2-days-oxford-spires-courtyards-and-slow-thoughts` |
| Edinburgh | 77 | `3-days-edinburgh-stone-stories-and-high-ground` |

## Hit regions and interaction

Each destination is one native `<a>` (one tab stop) with two artwork-relative regions audited on the 1536×1024 artwork: the illustrated landmark (anchor) and the artwork's own name plate (aria-hidden child). Regions are source-pixel boxes stored normalized. They are deliberately not inflated to 44px: at ~358px rendered width Bristol's plate and Bath's landmark are ~5px apart, so inflation would create ambiguous overlap. No two destinations' regions overlap (closest gap: London ↔ Oxford plate, 10 source px); two-tap touch confirmation guards the dense cluster.

`UkDestinations.jsx` mirrors the accepted Europe semantics without sharing code: hover/focus/armed callout `<Name> · View itinerary →` (no day count, no permanent labels), first touch arms and the second navigates, tap elsewhere or Escape disarms, drags over 8px are ignored, and modified clicks stay native. It renders only when `scene === 'uk'`, inside the inert scene surface, so it is inactive during cloud travel. Glasgow/Edinburgh callouts open beneath their name plates (top edge); London's aligns to its right edge. EN/FR strings live under `homeMagazine.atlas` (`ukDestinations`, `viewItinerary`, `ukPlaces`; FR: Londres, Édimbourg, Lake District).

## Verification

`tests/atlasUk.test.js` covers inventory, prerender presence, region bounds/non-overlap, EN/FR and rendered link semantics. `node scripts/verify-atlas.mjs` (1440px/390px) checks that every landmark and plate resolves to its own link, native activation, opaque hover/focus callouts, keyboard order and Escape, independent touch arming of Bristol/Oxford/Bath, Glasgow/Edinburgh and Cambridge/London, outside-tap disarm, one-finger page scrolling from a destination, inertness during the return transition, a Ctrl/Cmd-click new tab, and real navigation to London (desktop) and Bristol (two taps, mobile). Production build prerenders exactly 258 routes.
