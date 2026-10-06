// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1672, H = 941;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const MYANMAR_DESTINATIONS = [
    {id: 'yangon', slug: '4-days-yangon-where-gold-catches-the-light', hitAreas: [
        area('yangon-landmark-1', 'landmark', 818, 631, 985, 699),
        area('yangon-plate', 'plate', 839, 699, 952, 730),
    ]},
    {id: 'mandalay', slug: '4-days-mandalay-where-tradition-stands-its-ground', hitAreas: [
        area('mandalay-landmark-1', 'landmark', 879, 189, 1059, 267),
        area('mandalay-plate', 'plate', 890, 268, 1022, 300),
    ]},
    {id: 'bagan', slug: '3-days-bagan-where-the-earth-holds-the-sky', hitAreas: [
        area('bagan-landmark-1', 'landmark', 645, 307, 735, 378),
        area('bagan-plate', 'plate', 731, 346, 831, 380),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.myanmarPlaces.${destination.id}`}));
