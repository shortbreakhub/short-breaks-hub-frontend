// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const TAIWAN_DESTINATIONS = [
    {id: 'taipei', slug: '4-days-taipei-where-everyday-life-feels-kind', calloutPlacement: 'below', hitAreas: [
        area('taipei-taipei-101', 'landmark', 986, 9, 1038, 140),
        area('taipei-plate', 'plate', 984, 140, 1102, 184),
        area('taipei-temple', 'landmark', 844, 143, 971, 207),
    ]},
    {id: 'tainan', slug: '3-days-tainan-where-time-stays-to-eat-and-remember', hitAreas: [
        area('tainan-temple-and-fort', 'landmark', 552, 516, 753, 574),
        area('tainan-plate', 'plate', 594, 573, 711, 617),
    ]},
    {id: 'taichung', slug: '3-days-taichung-where-balance-finds-its-form', hitAreas: [
        area('taichung-town', 'landmark', 742, 228, 894, 303),
        area('taichung-plate', 'plate', 727, 304, 859, 345),
        area('taichung-theatre', 'landmark', 664, 356, 787, 415),
    ]},
    {id: 'kaohsiung', slug: '3-days-kaohsiung-where-the-city-turns-toward-the-light', hitAreas: [
        area('kaohsiung-harbour-and-skyline', 'landmark', 400, 620, 769, 750),
        area('kaohsiung-plate', 'plate', 568, 750, 711, 790),
    ]},
    {id: 'hualien', slug: '3-days-hualien-where-the-land-speaks-first', hitAreas: [
        area('hualien-taroko-gorge', 'landmark', 975, 357, 1069, 518),
        area('hualien-plate', 'plate', 1079, 416, 1207, 461),
        area('hualien-gorge-bridge', 'landmark', 1006, 520, 1103, 565),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.taiwanPlaces.${destination.id}`}));
