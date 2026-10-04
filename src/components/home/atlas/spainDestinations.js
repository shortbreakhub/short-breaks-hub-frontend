// Manually audited against the approved 1536×1024 Spain story-map artwork. Same
// contract as the UK/France: source-pixel boxes (left, top, right, bottom) stored
// normalized; the landmark anchors the ONE link and the artwork's own name plate
// is a secondary region. Decorative scenery (northern monastery, castles,
// windmills, villages, palms, Balearics, Portugal/Morocco) is deliberately not interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Slugs are official API identities. Never derive them from destination names.
export const SPAIN_DESTINATIONS = [
    // East-coast landmark: callout aligns to its right edge to stay inside the frame on phones.
    {id: 'barcelona', slug: '4-days-barcelona-between-order-and-instinct', calloutAlign: 'end', hitAreas: [
        area('sagrada-familia', 'landmark', 1190, 210, 1300, 312),
        area('barcelona-plate', 'plate', 1238, 306, 1378, 344),
    ]},
    {id: 'madrid', slug: '4-days-madrid-after-dark-the-city-wakes', hitAreas: [
        area('royal-palace', 'landmark', 655, 328, 820, 442),
        area('madrid-plate', 'plate', 738, 414, 858, 454),
    ]},
    {id: 'valencia', slug: '3-days-valencia-light-space-and-forward-motion', hitAreas: [
        area('serranos-and-arts-city', 'landmark', 1040, 400, 1238, 482),
        area('valencia-plate', 'plate', 1064, 483, 1188, 520),
    ]},
    // Córdoba's plate ends at x=562 and Seville's cathedral starts at x=572.
    {id: 'cordoba', slug: '2-days-cordoba-enclosure-shade-and-proportion', hitAreas: [
        area('mezquita', 'landmark', 380, 492, 552, 590),
        area('cordoba-plate', 'plate', 438, 585, 562, 620),
    ]},
    {id: 'seville', slug: '4-days-seville-living-by-ritual-and-heat', hitAreas: [
        area('giralda-and-cathedral', 'landmark', 572, 558, 722, 668),
        area('seville-plate', 'plate', 594, 662, 702, 698),
    ]},
    {id: 'granada', slug: '3-days-granada-water-shadow-and-patience', hitAreas: [
        area('alhambra', 'landmark', 808, 615, 1005, 702),
        area('granada-plate', 'plate', 913, 694, 1042, 732),
    ]},
    {id: 'malaga', slug: '3-days-malaga-sun-ground-and-everyday-life', hitAreas: [
        area('malaga-seafront', 'landmark', 620, 735, 880, 808),
        area('malaga-plate', 'plate', 643, 808, 768, 846),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.spainPlaces.${destination.id}`}));
