// Manually audited against the locked 1536×1024 owner artwork. Source-pixel
// boxes are stored normalized; the first landmark anchors ONE itinerary link.
// Name plates and secondary landmarks belong to that same link. Geography,
// unlabelled scenery and neighboring countries remain non-interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Literal official API identities, verified against country inventory and detail bootstrap.
export const GREECE_DESTINATIONS = [
    {id: 'thessaloniki', slug: '3-days-thessaloniki-where-layers-gather-around-the-table', calloutPlacement: 'below', hitAreas: [
        area('white-tower-and-waterfront', 'landmark', 635, 145, 724, 230),
        area('thessaloniki-plate', 'plate', 724, 178, 858, 223),
    ]},
    {id: 'athens', slug: '4-days-athens-where-every-road-begins', hitAreas: [
        area('acropolis-and-temple', 'landmark', 604, 398, 884, 562),
        area('athens-plate', 'plate', 734, 505, 844, 545),
    ]},
    {id: 'santorini', slug: '3-days-santorini-where-light-erases-the-clock', hitAreas: [
        area('blue-domed-village', 'landmark', 840, 590, 1100, 790),
        area('santorini-plate', 'plate', 946, 724, 1065, 767),
    ]},
    {id: 'crete', slug: '4-days-crete-where-the-land-remembers-longer', hitAreas: [
        area('chania-harbour', 'landmark', 742, 792, 1086, 904),
        area('crete-chania-plate', 'plate', 895, 910, 1055, 954),
    ]},
    {id: 'rhodes', slug: '3-days-rhodes-where-walls-learned-to-endure', calloutAlign: 'end', hitAreas: [
        area('rhodes-fortress', 'landmark', 1190, 546, 1472, 683),
        area('rhodes-plate', 'plate', 1328, 668, 1431, 710),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.greecePlaces.${destination.id}`}));
