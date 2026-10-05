// Manually audited against the locked 1536×1024 owner artwork. Source-pixel
// boxes are stored normalized; the first landmark anchors ONE itinerary link.
// Name plates and secondary landmarks belong to that same link. Geography,
// unlabelled scenery and neighboring countries remain non-interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Literal official API identities, verified against country inventory and detail bootstrap.
export const SWITZERLAND_DESTINATIONS = [
    {id: 'zurich', slug: '3-days-zurich-precision-without-coldness', calloutPlacement: 'below', hitAreas: [
        area('zurich-old-town', 'landmark', 831, 147, 1025, 253),
        area('zurich-plate', 'plate', 896, 216, 992, 257),
    ]},
    {id: 'lucerne', slug: '2-days-lucerne-lake-bridge-and-alignment', hitAreas: [
        area('chapel-bridge-and-water-tower', 'landmark', 775, 270, 925, 381),
        area('lucerne-plate', 'plate', 859, 363, 969, 405),
    ]},
    {id: 'bern', slug: '2-days-bern-continuity-along-the-bend', hitAreas: [
        area('bern-old-town', 'landmark', 520, 351, 622, 457),
        area('bern-plate', 'plate', 612, 411, 697, 452),
    ]},
    {id: 'interlaken', slug: '3-days-interlaken-exposed-to-scale', hitAreas: [
        area('interlaken-church-and-village', 'landmark', 800, 410, 915, 508),
        area('interlaken-plate', 'plate', 681, 533, 805, 574),
        area('interlaken-spire', 'landmark', 839, 394, 855, 410),
    ]},
    {id: 'geneva', slug: '3-days-geneva-water-diplomacy-and-balance', calloutAlign: 'start', hitAreas: [
        area('jet-deau', 'landmark', 278, 545, 321, 650),
        area('geneva-plate', 'plate', 177, 658, 285, 701),
        area('geneva-old-town', 'landmark', 100, 642, 186, 708),
    ]},
    {id: 'zermatt', slug: '3-days-zermatt-altitude-silence-and-effort', hitAreas: [
        area('matterhorn', 'landmark', 548, 638, 749, 798),
        area('zermatt-plate', 'plate', 667, 796, 778, 840),
        area('zermatt-chalets', 'landmark', 508, 791, 651, 850),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.switzerlandPlaces.${destination.id}`}));
