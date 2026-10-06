// Manually audited source-artwork pixels; one native destination link owns all regions.
const W = 1672, H = 941;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const MALAYSIA_DESTINATIONS = [
    {id: 'kuala-lumpur', calloutAlign: 'start', slug: '3-days-kuala-lumpur-towers-temples-and-street-life', hitAreas: [
        area('kuala-lumpur-landmark-1', 'landmark', 411, 446, 558, 530),
        area('kuala-lumpur-plate', 'plate', 428, 532, 595, 558),
    ]},
    {id: 'george-town', slug: '3-days-penang-heritage-lanes-and-hawker-smoke', calloutAlign: 'start', hitAreas: [
        area('george-town-landmark-1', 'landmark', 223, 281, 345, 336),
        area('george-town-plate', 'plate', 152, 249, 295, 281),
    ]},
    {id: 'langkawi', slug: '4-days-langkawi-sea-breezes-and-slow-horizons', calloutAlign: 'start', hitAreas: [
        area('langkawi-landmark-1', 'landmark', 70, 177, 185, 213),
        area('langkawi-plate', 'plate', 110, 132, 228, 164),
    ]},
    {id: 'malacca', slug: '2-days-malacca-river-stories-and-colonial-echoes', hitAreas: [
        area('malacca-landmark-1', 'landmark', 449, 563, 600, 622),
        area('malacca-plate', 'plate', 470, 623, 575, 651),
    ]},
    {id: 'ipoh', slug: '2-days-ipoh-white-coffee-and-limestone-quiet', hitAreas: [
        area('ipoh-landmark-1', 'landmark', 346, 389, 465, 439),
        area('ipoh-plate', 'plate', 342, 355, 415, 383),
        area('ipoh-landmark-3', 'landmark', 424, 335, 540, 389),
    ]},
    {id: 'johor-bahru', slug: '2-days-johor-bahru-food-malls-and-border-energy', hitAreas: [
        area('johor-bahru-landmark-1', 'landmark', 612, 646, 722, 713),
        area('johor-bahru-plate', 'plate', 609, 717, 757, 748),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.malaysiaPlaces.${destination.id}`}));
