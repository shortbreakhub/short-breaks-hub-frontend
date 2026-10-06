// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const INDONESIA_DESTINATIONS = [
    {id: 'bali', slug: '5-days-bali-where-rituals-meet-the-tide', hitAreas: [
        area('bali-landmark-1', 'landmark', 830, 698, 931, 755),
        area('bali-plate', 'plate', 837, 757, 905, 792),
    ]},
    {id: 'jakarta', slug: '3-days-jakarta-beneath-the-surface-rhythm', hitAreas: [
        area('jakarta-landmark-1', 'landmark', 352, 596, 480, 669),
        area('jakarta-plate', 'plate', 376, 671, 466, 704),
    ]},
    {id: 'yogyakarta', slug: '4-days-yogyakarta-where-ancient-stories-still-walk', hitAreas: [
        area('yogyakarta-landmark-1', 'landmark', 615, 682, 736, 741),
        area('yogyakarta-plate', 'plate', 592, 752, 708, 788),
    ]},
    {id: 'bandung', slug: '3-days-bandung-where-cool-air-carries-ideas', hitAreas: [
        area('bandung-landmark-1', 'landmark', 468, 678, 514, 719),
        area('bandung-plate', 'plate', 459, 720, 542, 747),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.indonesiaPlaces.${destination.id}`}));
