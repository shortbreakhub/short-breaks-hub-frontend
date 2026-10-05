// Manually audited against the locked 1536×1024 owner artwork. Source-pixel
// boxes are stored normalized; the first landmark anchors ONE itinerary link.
// Name plates and secondary landmarks belong to that same link. Geography,
// unlabelled scenery and neighboring countries remain non-interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Literal official API identities, verified against country inventory and detail bootstrap.
export const NETHERLANDS_DESTINATIONS = [
    {id: 'haarlem', slug: '2-days-haarlem-where-craft-feels-enough', hitAreas: [
        area('grote-kerk-and-old-town', 'landmark', 615, 282, 758, 368),
        area('haarlem-plate', 'plate', 584, 364, 700, 406),
    ]},
    {id: 'amsterdam', slug: '4-days-amsterdam-where-water-teaches-balance', hitAreas: [
        area('amsterdam-canal-houses', 'landmark', 809, 339, 963, 414),
        area('amsterdam-plate', 'plate', 838, 400, 970, 443),
    ]},
    {id: 'the-hague', slug: '3-days-the-hague-where-power-speaks-softly', hitAreas: [
        area('binnenhof', 'landmark', 451, 450, 623, 548),
        area('the-hague-plate', 'plate', 488, 524, 621, 568),
    ]},
    {id: 'utrecht', slug: '2-days-utrecht-where-closeness-creates-clarity', hitAreas: [
        area('dom-tower-and-old-town', 'landmark', 802, 485, 999, 607),
        area('utrecht-plate', 'plate', 879, 595, 993, 639),
    ]},
    {id: 'rotterdam', slug: '3-days-rotterdam-where-the-city-decided-to-start-again', hitAreas: [
        area('skyline-and-erasmus-bridge', 'landmark', 472, 600, 735, 697),
        area('rotterdam-plate', 'plate', 519, 678, 644, 720),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.netherlandsPlaces.${destination.id}`}));
