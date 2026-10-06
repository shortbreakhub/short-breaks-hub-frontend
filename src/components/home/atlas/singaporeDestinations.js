// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1672, H = 941;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const SINGAPORE_DESTINATIONS = [
    {id: 'singapore', slug: '4-days-singapore-where-the-city-breathes-in-layers', hitAreas: [
        area('singapore-landmark-1', 'landmark', 887, 503, 1046, 584),
        area('singapore-plate', 'plate', 923, 582, 1067, 624),
        area('singapore-landmark-3', 'landmark', 1043, 605, 1115, 660),
        area('singapore-landmark-4', 'landmark', 726, 534, 781, 582),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.singaporePlaces.${destination.id}`}));
