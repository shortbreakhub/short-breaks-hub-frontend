// Manually audited against the approved 1536×1024 France story-map artwork. Same
// contract as the UK: source-pixel boxes (left, top, right, bottom) stored
// normalized; the landmark anchors the ONE link and the artwork's own name plate
// is a secondary region. Decorative scenery (Mont-Saint-Michel, Calanques,
// lavender, vineyards, Alps, Corsica) is deliberately not interactive.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
// Slugs are official API identities. Never derive them from destination names.
export const FRANCE_DESTINATIONS = [
    // Top-edge landmark: the callout opens beneath the name plate (like Glasgow/Edinburgh).
    {id: 'paris', slug: '4-days-paris-where-icons-meet-everyday-grace', calloutPlacement: 'below', hitAreas: [
        area('eiffel-tower-and-seine', 'landmark', 790, 82, 1000, 250),
        area('paris-plate', 'plate', 852, 246, 964, 286),
    ]},
    {id: 'strasbourg', slug: '3-days-strasbourg-where-borders-learn-to-breathe', calloutAlign: 'end', hitAreas: [
        area('cathedral-and-petite-france', 'landmark', 1170, 135, 1445, 262),
        area('strasbourg-plate', 'plate', 1205, 260, 1335, 300),
    ]},
    {id: 'bordeaux', slug: '3-days-bordeaux-where-the-river-teaches-patience', hitAreas: [
        area('place-de-la-bourse', 'landmark', 425, 478, 710, 572),
        area('bordeaux-plate', 'plate', 460, 572, 605, 610),
    ]},
    {id: 'lyon', slug: '3-days-lyon-where-food-gives-structure-to-time', hitAreas: [
        area('vieux-lyon-and-bridges', 'landmark', 900, 425, 1125, 550),
        area('lyon-plate', 'plate', 1000, 492, 1115, 528),
    ]},
    // Marseille ends at x=1140 and Nice starts at x=1180: the bay between stays unassigned.
    {id: 'marseille', slug: '3-days-marseille-where-the-sea-refuses-to-be-quiet', hitAreas: [
        area('old-port-and-notre-dame-de-la-garde', 'landmark', 800, 688, 1140, 815),
        area('marseille-plate', 'plate', 868, 812, 1008, 854),
    ]},
    {id: 'nice', slug: '3-days-nice-where-light-teaches-you-to-slow', calloutAlign: 'end', hitAreas: [
        area('promenade-and-seafront', 'landmark', 1180, 600, 1480, 745),
        area('nice-plate', 'plate', 1278, 680, 1388, 720),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.francePlaces.${destination.id}`}));
