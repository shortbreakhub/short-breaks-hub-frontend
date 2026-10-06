// Regions inspected against the immutable 1536x1024 illustrated East Asia atlas.
// Multiple actors share one native country/region link. North Korea stays inert.
const area = (id, kind, left, top, right, bottom) => ({id, kind,
    artworkPosition: {x: (left + right) / 2 / 1536, y: (top + bottom) / 2 / 1024},
    hitArea: {width: (right - left) / 1536, height: (bottom - top) / 1024}});
export const EAST_ASIA_DESTINATIONS = [
    {id:'china', country:'China', hitAreas:[
        area('temple-of-heaven','landmark',568,378,680,497),
        area('great-wall','landmark',509,283,859,367),
    ]},
    {id:'japan', country:'Japan', labelAlign:'end', hitAreas:[
        area('fuji-and-temple','landmark',1240,403,1460,510),
    ]},
    {id:'south-korea', country:'South Korea', labelAlign:'end', hitAreas:[
        area('korean-palace','landmark',1030,361,1152,455),
    ]},
    {id:'mongolia', country:'Mongolia', labelPlacement:'below', hitAreas:[
        area('ger','landmark',511,165,615,239),
        area('steppe-horses','landmark',630,198,714,246),
    ]},
    {id:'taiwan', country:'Taiwan', labelAlign:'end', hitAreas:[
        area('taipei-tower','landmark',952,687,1020,796),
        area('taiwan-island','country',910,795,990,875),
    ]},
    {id:'hong-kong', country:'Hong Kong', hitAreas:[
        area('hong-kong-skyline','landmark',675,613,867,742),
    ]},
    {id:'macau', country:'Macau', labelAlign:'start', hitAreas:[
        area('macau-church','landmark',538,745,665,815),
    ]},
].map(destination => ({...destination, labelKey:`homeMagazine.atlas.eastAsiaCountries.${destination.id}`,
    artworkPosition:destination.hitAreas[0].artworkPosition, hitArea:destination.hitAreas[0].hitArea}));
