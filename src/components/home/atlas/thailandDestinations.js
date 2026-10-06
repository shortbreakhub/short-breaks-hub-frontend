// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1672, H = 941;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const THAILAND_DESTINATIONS = [
    {id: 'bangkok', slug: '4-days-bangkok-temples-markets-and-city-life', hitAreas: [
        area('bangkok-landmark-1', 'landmark', 849, 414, 1031, 466),
        area('bangkok-plate', 'plate', 888, 466, 1007, 497),
    ]},
    {id: 'chiang-mai', slug: '4-days-chiang-mai-temples-mountains-and-slow-north', hitAreas: [
        area('chiang-mai-landmark-1', 'landmark', 727, 140, 812, 172),
        area('chiang-mai-plate', 'plate', 721, 172, 856, 202),
        area('chiang-mai-landmark-3', 'landmark', 738, 223, 816, 284),
    ]},
    {id: 'pattaya', slug: '3-days-pattaya-coastlines-islands-and-evening-lights', hitAreas: [
        area('pattaya-landmark-1', 'landmark', 1008, 499, 1087, 525),
        area('pattaya-plate', 'plate', 1048, 525, 1140, 555),
    ]},
    {id: 'chiang-rai', slug: '3-days-chiang-rai-where-art-meets-stillness', calloutPlacement: 'below', hitAreas: [
        area('chiang-rai-landmark-1', 'landmark', 973, 170, 1041, 229),
        area('chiang-rai-plate', 'plate', 943, 133, 1071, 162),
        area('chiang-rai-landmark-3', 'landmark', 902, 76, 968, 115),
    ]},
    {id: 'pai', slug: '3-days-pai-where-the-road-slows-down', calloutPlacement: 'below', hitAreas: [
        area('pai-landmark-1', 'landmark', 674, 75, 710, 141),
        area('pai-plate', 'plate', 699, 100, 767, 129),
    ]},
    {id: 'sukhothai', slug: '2-days-sukhothai-where-kingdoms-breathe-again', hitAreas: [
        area('sukhothai-landmark-1', 'landmark', 846, 314, 959, 357),
        area('sukhothai-plate', 'plate', 846, 282, 970, 311),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.thailandPlaces.${destination.id}`}));
