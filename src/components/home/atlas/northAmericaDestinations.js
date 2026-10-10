// Artwork-relative actors reuse one accessible native link per country.
// Scenery, Greenland and the Caribbean remain decorative.
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / 1536, y: (top + bottom) / 2 / 1024},
    hitArea: {width: (right - left) / 1536, height: (bottom - top) / 1024}});

export const NORTH_AMERICA_DESTINATIONS = [
    {id:'canada', country:'Canada', hitAreas:[
        area('canadian-parliament','landmark',885,288,1070,432),
        area('canadian-moose','country',454,247,550,323),
    ]},
    {id:'united-states', country:'United States', hitAreas:[
        area('us-capitol','landmark',976,554,1100,665),
        area('western-mesas','country',385,492,695,590),
    ]},
    {id:'mexico', country:'Mexico', hitAreas:[
        area('mexican-cathedral','landmark',630,724,819,844),
    ]},
].map(destination => ({...destination, labelKey:`homeMagazine.atlas.northAmericaCountries.${destination.id}`,
    artworkPosition:destination.hitAreas[0].artworkPosition, hitArea:destination.hitAreas[0].hitArea}));
