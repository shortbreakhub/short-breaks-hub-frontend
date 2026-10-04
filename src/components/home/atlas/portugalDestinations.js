// Manually audited against the approved 1536×1024 Portugal story-map artwork. Same
// contract as the UK/France/Spain: source-pixel boxes (left, top, right, bottom)
// stored normalized; the landmark anchors the ONE link and the artwork's own name
// plate is a secondary region. Decorative scenery (the white villages between cities,
// the inland castle, boats, sea stacks, lagoon, Spain) is deliberately not interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Slugs are official API identities. Never derive them from destination names.
export const PORTUGAL_DESTINATIONS = [
    // Top-edge landmark: the callout opens beneath the name plate (like Paris).
    {id: 'porto', slug: '3-days-porto-where-the-river-keeps-its-word', calloutPlacement: 'below', hitAreas: [
        area('se-and-ribeira', 'landmark', 676, 18, 940, 222),
        area('porto-plate', 'plate', 734, 150, 826, 186),
        // The bridge runs along the river below the greyed Spain artwork, which stays inert.
        area('dom-luis-bridge', 'landmark', 935, 150, 1180, 222),
    ]},
    // Sintra's plate ends at y=388; Lisbon starts at y=468.
    {id: 'sintra', slug: '2-days-sintra-where-forests-hold-the-dream', hitAreas: [
        area('pena-and-moorish-castle', 'landmark', 565, 232, 770, 348),
        area('sintra-plate', 'plate', 568, 350, 670, 388),
    ]},
    {id: 'lisbon', slug: '4-days-lisbon-where-light-carries-memory', hitAreas: [
        area('belem-tower-and-tram', 'landmark', 488, 468, 790, 606),
        area('lisbon-plate', 'plate', 584, 484, 690, 522),
    ]},
    // Lagos's cliffs end at x=760; Faro's town starts at x=790.
    {id: 'lagos', slug: '3-days-lagos-where-the-coast-lets-go', hitAreas: [
        area('ponta-da-piedade-cliffs', 'landmark', 345, 700, 760, 848),
        area('lagos-plate', 'plate', 538, 714, 642, 756),
    ]},
    {id: 'faro', slug: '3-days-faro-where-the-land-learns-to-rest', hitAreas: [
        area('faro-old-town-and-harbour', 'landmark', 790, 785, 1100, 900),
        area('faro-plate', 'plate', 848, 841, 952, 883),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.portugalPlaces.${destination.id}`}));
