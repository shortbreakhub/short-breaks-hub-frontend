// Manually audited against the locked 1536×1024 owner artwork. Source-pixel
// boxes are stored normalized; the first landmark anchors ONE itinerary link.
// Name plates and secondary landmarks belong to that same link. Geography,
// unlabelled scenery and neighboring countries remain non-interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Literal official API identities, verified against country inventory and detail bootstrap.
export const ITALY_DESTINATIONS = [
    {id: 'milan', slug: '3-days-milan-where-precision-sets-the-tone', calloutPlacement: 'below', hitAreas: [
        area('milan-duomo', 'landmark', 546, 112, 662, 215),
        area('milan-plate', 'plate', 578, 196, 660, 236),
    ]},
    {id: 'venice', slug: '3-days-venice-where-the-city-floats-on-patience', calloutPlacement: 'below', hitAreas: [
        area('grand-canal-and-palaces', 'landmark', 800, 180, 1048, 236),
        area('venice-plate', 'plate', 881, 210, 974, 251),
        area('venice-campanile', 'landmark', 941, 121, 980, 191),
    ]},
    {id: 'florence', slug: '3-days-florence-where-proportion-teaches-calm', hitAreas: [
        area('florence-duomo', 'landmark', 637, 243, 863, 343),
        area('florence-plate', 'plate', 704, 328, 807, 367),
        area('florence-dome-top', 'landmark', 729, 211, 795, 243),
    ]},
    {id: 'rome', slug: '4-days-rome-where-time-refuses-to-move-on', hitAreas: [
        area('colosseum', 'landmark', 671, 413, 871, 528),
        area('rome-plate', 'plate', 770, 517, 853, 556),
    ]},
    {id: 'naples', slug: '3-days-naples-where-life-stands-too-close', hitAreas: [
        area('castel-nuovo', 'landmark', 1015, 601, 1139, 675),
        area('naples-plate', 'plate', 941, 595, 1025, 638),
        area('naples-harbour', 'landmark', 957, 641, 1202, 700),
    ]},
    {id: 'palermo', slug: '4-days-sicily-where-every-civilization-stayed-awhile', hitAreas: [
        area('palermo-cathedral', 'landmark', 722, 759, 880, 855),
        area('palermo-plate', 'plate', 765, 839, 870, 879),
        area('palermo-palace', 'landmark', 853, 803, 993, 917),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.italyPlaces.${destination.id}`}));
