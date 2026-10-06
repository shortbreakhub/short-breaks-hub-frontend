// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const LAOS_DESTINATIONS = [
    {id: 'luang-prabang', slug: '4-days-luang-prabang-where-mornings-arrive-quietly', hitAreas: [
        area('luang-prabang-landmark-1', 'landmark', 540, 222, 795, 317),
        area('luang-prabang-plate', 'plate', 595, 321, 780, 352),
    ]},
    {id: 'vientiane', slug: '3-days-vientiane-where-capital-life-moves-softly', hitAreas: [
        area('vientiane-landmark-1', 'landmark', 744, 647, 908, 747),
        area('vientiane-plate', 'plate', 763, 748, 901, 781),
    ]},
    {id: 'vang-vieng', slug: '3-days-vang-vieng-where-the-land-breathes-wide', hitAreas: [
        area('vang-vieng-landmark-1', 'landmark', 584, 410, 839, 524),
        area('vang-vieng-plate', 'plate', 682, 532, 829, 563),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.laosPlaces.${destination.id}`}));
