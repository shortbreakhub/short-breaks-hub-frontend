// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const MONGOLIA_DESTINATIONS = [
    {id: 'ulaanbaatar', slug: '3-days-ulaanbaatar-where-the-city-meets-the-steppe', hitAreas: [
        area('ulaanbaatar-monastery', 'landmark', 712, 330, 1002, 436),
        area('ulaanbaatar-plate', 'plate', 822, 433, 982, 474),
    ]},
    {id: 'karakorum', slug: '2-days-karakorum-where-empire-left-no-walls', hitAreas: [
        area('karakorum-erdene-zuu', 'landmark', 340, 513, 699, 584),
        area('karakorum-plate', 'plate', 449, 579, 608, 620),
    ]},
    {id: 'terelj', calloutAlign: 'end', calloutLabelKey: 'homeMagazine.atlas.tereljCallout', slug: '2-days-terelj-where-the-land-opens-you', hitAreas: [
        area('terelj-turtle-rock', 'landmark', 1174, 295, 1294, 385),
        area('terelj-plate', 'plate', 1227, 384, 1337, 426),
        area('terelj-ger-camp', 'landmark', 1136, 418, 1224, 470),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.mongoliaPlaces.${destination.id}`}));
