// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1672, H = 941;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const PHILIPPINES_DESTINATIONS = [
    {id: 'manila', slug: '4-days-manila-where-history-refuses-to-fade', hitAreas: [
        area('manila-landmark-1', 'landmark', 750, 213, 843, 293),
        area('manila-plate', 'plate', 773, 293, 881, 329),
    ]},
    {id: 'cebu', slug: '4-days-cebu-where-journeys-branch-outward', hitAreas: [
        area('cebu-landmark-1', 'landmark', 907, 449, 982, 509),
        area('cebu-plate', 'plate', 938, 509, 1030, 544),
    ]},
    {id: 'palawan', slug: '4-days-palawan-where-water-forgets-the-world', hitAreas: [
        area('palawan-landmark-1', 'landmark', 450, 505, 551, 587),
        area('palawan-plate', 'plate', 522, 587, 633, 620),
        area('palawan-landmark-3', 'landmark', 391, 581, 458, 628),
    ]},
    {id: 'bohol', slug: '3-days-bohol-where-the-land-shifts-softly', hitAreas: [
        area('bohol-landmark-1', 'landmark', 973, 550, 1070, 610),
        area('bohol-plate', 'plate', 1057, 574, 1153, 610),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.philippinesPlaces.${destination.id}`}));
