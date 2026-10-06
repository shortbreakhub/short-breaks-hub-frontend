// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const CHINA_DESTINATIONS = [
    {id: 'beijing', slug: '4-days-beijing-where-history-sets-the-measure', hitAreas: [
        area('beijing-forbidden-city', 'landmark', 1050, 187, 1244, 251),
        area('beijing-plate', 'plate', 1091, 250, 1208, 291),
        area('beijing-great-wall', 'landmark', 1050, 155, 1120, 187),
    ]},
    {id: 'shanghai', calloutAlign: 'end', slug: '4-days-shanghai-where-the-future-never-waits', hitAreas: [
        area('shanghai-skyline', 'landmark', 1230, 447, 1319, 518),
        area('shanghai-plate', 'plate', 1256, 518, 1362, 553),
    ]},
    {id: 'xian', slug: '3-days-xian-where-the-road-begins-inward', hitAreas: [
        area('xian-terracotta-and-pagoda', 'landmark', 638, 372, 762, 479),
        area('xian-plate', 'plate', 749, 414, 850, 458),
        area('xian-pagoda-top', 'landmark', 705, 352, 739, 372),
    ]},
    {id: 'chengdu', slug: '3-days-chengdu-where-life-slows-to-stay', hitAreas: [
        area('chengdu-panda-and-temple', 'landmark', 646, 551, 794, 592),
        area('chengdu-plate', 'plate', 668, 585, 787, 625),
    ]},
    {id: 'guilin', slug: '3-days-guilin-where-the-land-leans-into-water', hitAreas: [
        area('guilin-karst-and-river', 'landmark', 725, 636, 980, 714),
        area('guilin-plate', 'plate', 889, 711, 987, 753),
    ]},
    {id: 'hangzhou', calloutAlign: 'end', slug: '3-days-hangzhou-where-water-teaches-patience', hitAreas: [
        area('hangzhou-west-lake', 'landmark', 1135, 564, 1290, 647),
        area('hangzhou-plate', 'plate', 1200, 570, 1318, 608),
    ]},
    {id: 'guangzhou', calloutAlign: 'end', slug: '3-days-guangzhou-where-rivers-carry-everyday-life', hitAreas: [
        area('guangzhou-canton-tower', 'landmark', 1115, 702, 1157, 815),
        area('guangzhou-plate', 'plate', 1000, 791, 1126, 834),
        area('guangzhou-river-and-temple', 'landmark', 968, 755, 1115, 791),
    ]},
    {id: 'dengfeng', slug: '2-days-dengfeng-where-discipline-finds-stillness', hitAreas: [
        area('dengfeng-shaolin-temple', 'landmark', 884, 368, 997, 429),
        area('dengfeng-plate', 'plate', 933, 426, 1053, 466),
    ]},
    {id: 'changzhou', calloutAlign: 'end', slug: '3-day-changzhou-alley-lanterns-and-pagoda-light', hitAreas: [
        area('changzhou-pagoda', 'landmark', 1143, 413, 1205, 521),
        area('changzhou-plate', 'plate', 1086, 520, 1220, 560),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.chinaPlaces.${destination.id}`}));
