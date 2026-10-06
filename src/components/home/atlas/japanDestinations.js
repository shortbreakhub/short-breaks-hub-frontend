// Manually audited against the locked 1536x1024 artwork. One native link
// owns all landmark/name-plate regions; scenery and neighboring geography stay inert.
const W = 1536, H = 1024;
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / W, y: (top + bottom) / 2 / H},
    hitArea: {width: (right - left) / W, height: (bottom - top) / H}});
export const JAPAN_DESTINATIONS = [
    {id: 'tokyo', calloutAlign: 'end', slug: '4-days-tokyo-where-order-holds-the-motion', hitAreas: [
        area('tokyo-tokyo-tower-and-skyline', 'landmark', 1080, 514, 1275, 565),
        area('tokyo-plate', 'plate', 1170, 566, 1270, 607),
        area('tokyo-tower-base', 'landmark', 1128, 564, 1170, 624),
    ]},
    {id: 'kyoto', slug: '3-days-kyoto-where-quiet-learns-to-last', hitAreas: [
        area('kyoto-pagoda-and-temple', 'landmark', 679, 541, 759, 614),
        area('kyoto-plate', 'plate', 749, 575, 851, 616),
    ]},
    {id: 'osaka', slug: '3-days-osaka-where-appetite-leads-the-way', hitAreas: [
        area('osaka-osaka-castle', 'landmark', 628, 584, 678, 642),
        area('osaka-plate', 'plate', 658, 643, 755, 682),
    ]},
    {id: 'fukuoka', calloutAlign: 'start', slug: '3-days-fukuoka-where-the-city-feeds-you-gently', hitAreas: [
        area('fukuoka-fukuoka-town', 'landmark', 178, 686, 345, 750),
        area('fukuoka-plate', 'plate', 205, 749, 320, 788),
    ]},
    {id: 'hiroshima', slug: '3-days-hiroshima-where-memory-makes-space-for-life', hitAreas: [
        area('hiroshima-atomic-bomb-dome', 'landmark', 445, 579, 506, 642),
        area('hiroshima-plate', 'plate', 410, 644, 535, 682),
        area('hiroshima-peace-park', 'landmark', 509, 604, 616, 644),
    ]},
    {id: 'kanazawa', slug: '3-days-kanazawa-where-craft-sets-the-pace', hitAreas: [
        area('kanazawa-kanazawa-town', 'landmark', 742, 398, 820, 491),
        area('kanazawa-plate', 'plate', 806, 433, 936, 474),
    ]},
    {id: 'hakone', slug: '2-days-hakone-where-steam-slows-the-thoughts', hitAreas: [
        area('hakone-lake-torii', 'landmark', 1049, 636, 1098, 704),
        area('hakone-plate', 'plate', 1088, 680, 1199, 722),
    ]},
    {id: 'nara', slug: '2-days-nara-where-history-walks-beside-you', hitAreas: [
        area('nara-temple-and-deer', 'landmark', 796, 618, 939, 649),
        area('nara-plate', 'plate', 799, 649, 900, 687),
        area('nara-temple-roof', 'landmark', 851, 599, 935, 618),
        area('nara-deer', 'landmark', 793, 687, 861, 712),
    ]},
    {id: 'fujiyoshida', slug: '2-days-fujiyoshida-where-the-mountain-sets-the-distance', hitAreas: [
        area('fujiyoshida-mount-fuji', 'landmark', 960, 449, 1067, 510),
        area('fujiyoshida-plate', 'plate', 1067, 465, 1201, 505),
        area('fujiyoshida-chureito-pagoda', 'landmark', 1036, 510, 1076, 559),
    ]},
].map(destination => ({...destination, labelKey: `homeMagazine.atlas.japanPlaces.${destination.id}`}));
