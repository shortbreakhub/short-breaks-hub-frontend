// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const CAMBODIA_DESTINATIONS = [
    {id: 'siem-reap', slug: '4-days-siem-reap-where-stone-remembers-light', hitAreas: [
        area('siem-reap-landmark-1', 'landmark', 553, 245, 767, 316),
        area('siem-reap-plate', 'plate', 551, 315, 686, 349),
    ]},
    {id: 'phnom-penh', slug: '3-days-phnom-penh-where-history-speaks-softly', hitAreas: [
        area('phnom-penh-landmark-1', 'landmark', 764, 558, 948, 638),
        area('phnom-penh-plate', 'plate', 766, 638, 915, 670),
    ]},
    {id: 'kampot', slug: '3-days-kampot-where-river-time-drifts', hitAreas: [
        area('kampot-landmark-1', 'landmark', 676, 749, 813, 791),
        area('kampot-plate', 'plate', 599, 756, 700, 791),
        area('kampot-landmark-3', 'landmark', 527, 714, 592, 788),
    ]},
    {id: 'mondulkiri', calloutAlign: 'end', slug: '3-days-mondulkiri-where-the-land-opens-wide', hitAreas: [
        area('mondulkiri-landmark-1', 'landmark', 1214, 438, 1315, 490),
        area('mondulkiri-plate', 'plate', 1128, 489, 1280, 523),
        area('mondulkiri-landmark-3', 'landmark', 1055, 491, 1130, 535),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.cambodiaPlaces.${destination.id}`}));
