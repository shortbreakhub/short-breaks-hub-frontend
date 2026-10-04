// Manually audited against the approved 1536×1024 UK story-map artwork. Regions
// are written as source-pixel boxes (left, top, right, bottom) for auditability
// and stored normalized like Europe. The first region (landmark) anchors the ONE
// link; the artwork's own name plate is a secondary region of the same link.
// Boxes are deliberately NOT inflated to 44px: Bristol/Oxford/Bath sit too close.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Slugs are official API identities. Never derive them from destination names.
export const UK_DESTINATIONS = [
    {id: 'glasgow', slug: '2-days-glasgow-grit-geometry-and-great-museums', calloutPlacement: 'below', hitAreas: [
        area('glasgow-cathedral', 'landmark', 600, 150, 704, 238),
        area('glasgow-plate', 'plate', 620, 236, 702, 274),
    ]},
    {id: 'edinburgh', slug: '3-days-edinburgh-stone-stories-and-high-ground', calloutPlacement: 'below', hitAreas: [
        area('edinburgh-castle', 'landmark', 798, 58, 1012, 212),
        area('edinburgh-plate', 'plate', 852, 210, 972, 250),
    ]},
    {id: 'lake-district', slug: '3-days-lake-district-water-stone-and-open-skies', hitAreas: [
        area('lake-district-fells', 'landmark', 690, 352, 878, 438),
        area('lake-district-plate', 'plate', 734, 438, 896, 478),
    ]},
    {id: 'york', slug: '2-days-york-walls-and-whispering-streets', hitAreas: [
        area('york-minster', 'landmark', 962, 342, 1180, 458),
        area('york-plate', 'plate', 998, 458, 1092, 496),
    ]},
    {id: 'cambridge', slug: '3-day-cambridge-colleges-and-river-cam', hitAreas: [
        area('cambridge-college', 'landmark', 1036, 532, 1220, 606),
        area('cambridge-plate', 'plate', 1074, 604, 1208, 644),
    ]},
    {id: 'bristol', slug: '2-days-bristol-where-creativity-meets-the-harbour', hitAreas: [
        area('clifton-bridge', 'landmark', 620, 598, 820, 684),
        area('bristol-plate', 'plate', 700, 684, 802, 720),
    ]},
    {id: 'oxford', slug: '2-days-oxford-spires-courtyards-and-slow-thoughts', hitAreas: [
        area('radcliffe-camera', 'landmark', 838, 602, 1024, 714),
        area('oxford-plate', 'plate', 930, 714, 1030, 752),
    ]},
    {id: 'bath', slug: '2-days-bath-stone-curves-and-roman-roots', hitAreas: [
        area('roman-baths', 'landmark', 738, 740, 906, 826),
        area('bath-plate', 'plate', 784, 826, 868, 864),
    ]},
    {id: 'london', slug: '4-days-london-beyond-the-postcards', calloutAlign: 'end', hitAreas: [
        area('westminster-and-eye', 'landmark', 1040, 664, 1424, 812),
        area('london-plate', 'plate', 1138, 798, 1252, 836),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.ukPlaces.${destination.id}`}));
