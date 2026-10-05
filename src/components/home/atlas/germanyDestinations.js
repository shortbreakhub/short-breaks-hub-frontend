// Manually audited against the locked 1536×1024 owner artwork. Source-pixel
// boxes are stored normalized; the first landmark anchors ONE itinerary link.
// Name plates and secondary landmarks belong to that same link. Geography,
// unlabelled scenery and neighboring countries remain non-interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Literal official API identities, verified against country inventory and detail bootstrap.
export const GERMANY_DESTINATIONS = [
    {id: 'hamburg', slug: '3-days-hamburg-where-distance-creates-clarity', calloutPlacement: 'below', hitAreas: [
        area('harbour-and-elbphilharmonie', 'landmark', 718, 138, 915, 238),
        area('hamburg-plate', 'plate', 752, 242, 876, 282),
    ]},
    {id: 'berlin', slug: '4-days-berlin-where-history-refuses-to-stay-silent', hitAreas: [
        area('brandenburg-gate-and-tv-tower', 'landmark', 969, 212, 1215, 378),
        area('berlin-plate', 'plate', 1064, 366, 1165, 409),
    ]},
    {id: 'dresden', slug: '3-days-dresden-where-rebuilding-became-remembrance', hitAreas: [
        area('elbe-and-frauenkirche', 'landmark', 976, 428, 1240, 544),
        area('dresden-plate', 'plate', 1044, 541, 1166, 586),
    ]},
    {id: 'cologne', slug: '3-days-cologne-where-continuity-outlasts-destruction', hitAreas: [
        area('cathedral-and-rhine-bridge', 'landmark', 490, 353, 782, 500),
        area('cologne-plate', 'plate', 584, 498, 700, 541),
    ]},
    {id: 'heidelberg', slug: '2-days-heidelberg-where-romance-learns-restraint', hitAreas: [
        area('heidelberg-castle', 'landmark', 558, 594, 750, 702),
        area('heidelberg-plate', 'plate', 578, 724, 709, 768),
        area('old-town-and-neckar-bridge', 'landmark', 700, 695, 880, 776),
    ]},
    {id: 'munich', slug: '3-days-munich-where-tradition-makes-room-to-breathe', hitAreas: [
        area('frauenkirche-and-old-town', 'landmark', 893, 730, 1098, 862),
        area('munich-plate', 'plate', 982, 850, 1095, 892),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.germanyPlaces.${destination.id}`}));
