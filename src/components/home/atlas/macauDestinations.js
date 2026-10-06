// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const MACAU_DESTINATIONS = [
    {id: 'macau', slug: '3-days-macau-where-time-changes-language', hitAreas: [
        area('macau-st-pauls', 'landmark', 636, 146, 718, 242),
        area('macau-plate', 'plate', 594, 285, 714, 337),
        area('macau-guia-lighthouse', 'landmark', 680, 40, 739, 115),
        area('macau-penha-church', 'landmark', 878, 810, 925, 894),
        area('macau-grand-lisboa', 'landmark', 518, 311, 601, 443),
        area('macau-cotai-skyline', 'landmark', 491, 479, 1046, 673),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.macauPlaces.${destination.id}`}));
