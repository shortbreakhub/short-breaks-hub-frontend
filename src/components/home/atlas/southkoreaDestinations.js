// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const SOUTH_KOREA_DESTINATIONS = [
    {id: 'seoul', slug: '4-days-seoul-where-history-keeps-up-with-speed', hitAreas: [
        area('seoul-palace', 'landmark', 571, 192, 734, 252),
        area('seoul-plate', 'plate', 559, 248, 671, 293),
        area('seoul-city-buildings', 'landmark', 457, 186, 571, 252),
    ]},
    {id: 'busan', slug: '3-days-busan-where-the-city-breathes-outward', hitAreas: [
        area('busan-harbour', 'landmark', 1030, 639, 1305, 709),
        area('busan-plate', 'plate', 1106, 697, 1212, 740),
        area('busan-harbour-tower-top', 'landmark', 1100, 608, 1140, 639),
    ]},
    {id: 'gyeongju', slug: '3-days-gyeongju-where-history-rests-in-the-open', hitAreas: [
        area('gyeongju-temple-and-pagoda', 'landmark', 977, 496, 1150, 553),
        area('gyeongju-plate', 'plate', 1025, 553, 1179, 599),
    ]},
    {id: 'jeonju', slug: '2-days-jeonju-where-flavor-keeps-history-close', hitAreas: [
        area('jeonju-hanok-village', 'landmark', 581, 484, 793, 539),
        area('jeonju-plate', 'plate', 605, 539, 730, 582),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.southkoreaPlaces.${destination.id}`}));
