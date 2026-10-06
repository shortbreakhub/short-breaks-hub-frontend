// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1672, H = 941;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const VIETNAM_DESTINATIONS = [
    {id: 'ho-chi-minh-city', slug: '4-days-ho-chi-minh-city-where-the-city-never-settles', hitAreas: [
        area('ho-chi-minh-city-landmark-1', 'landmark', 942, 655, 1091, 748),
        area('ho-chi-minh-city-plate', 'plate', 938, 749, 1122, 780),
    ]},
    {id: 'hoi-an', slug: '4-days-hoi-an-where-lanterns-hold-the-evening', hitAreas: [
        area('hoi-an-landmark-1', 'landmark', 1007, 443, 1101, 498),
        area('hoi-an-plate', 'plate', 1098, 474, 1196, 507),
    ]},
    {id: 'hue', slug: '3-days-hue-where-empires-linger-in-silence', hitAreas: [
        area('hue-landmark-1', 'landmark', 898, 375, 980, 418),
        area('hue-plate', 'plate', 985, 396, 1058, 430),
    ]},
    {id: 'hanoi', slug: '4-days-hanoi-where-stories-circle-back', hitAreas: [
        area('hanoi-landmark-1', 'landmark', 806, 80, 921, 147),
        area('hanoi-plate', 'plate', 803, 148, 903, 179),
    ]},
    {id: 'ha-long-bay', slug: '3-days-ha-long-bay-where-stone-rises-from-water', hitAreas: [
        area('ha-long-bay-landmark-1', 'landmark', 969, 145, 1107, 190),
        area('ha-long-bay-plate', 'plate', 995, 191, 1139, 222),
        area('ha-long-bay-landmark-3', 'landmark', 1146, 163, 1255, 242),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.vietnamPlaces.${destination.id}`}));
