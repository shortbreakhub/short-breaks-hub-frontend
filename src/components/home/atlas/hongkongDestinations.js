// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const HONG_KONG_DESTINATIONS = [
    {id: 'hong-kong', slug: '4-days-hong-kong-where-the-city-rises-and-folds-back', hitAreas: [
        area('hong-kong-victoria-harbour-skyline', 'landmark', 818, 395, 1193, 478),
        area('hong-kong-plate', 'plate', 912, 470, 1059, 512),
        area('hong-kong-kowloon-buildings', 'landmark', 742, 249, 868, 391),
        area('hong-kong-peak-tram', 'landmark', 817, 681, 882, 738),
        area('hong-kong-island-skyline', 'landmark', 707, 528, 1199, 682),
        area('hong-kong-buddha', 'landmark', 299, 448, 356, 539),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.hongkongPlaces.${destination.id}`}));
