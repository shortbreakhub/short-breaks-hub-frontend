// Manually inspected against the locked 1536x1024 regional artwork.
// Country actors share one accessible link; boats, Brunei and Timor-Leste are inert.
const area = (id, left, top, right, bottom) => ({id, kind:'landmark',
    artworkPosition:{x:(left+right)/2/1536,y:(top+bottom)/2/1024},
    hitArea:{width:(right-left)/1536,height:(bottom-top)/1024}});
export const SOUTHEAST_ASIA_DESTINATIONS = [
    {id:'cambodia', country:'Cambodia', hitAreas:[area('angkor-wat',483,320,667,424)]},
    {id:'indonesia', country:'Indonesia', hitAreas:[area('borobudur',510,766,670,859)]},
    {id:'laos', labelPlacement:'below', country:'Laos', hitAreas:[area('laos-temple',523,122,641,235)]},
    {id:'malaysia', country:'Malaysia', hitAreas:[area('petronas-towers',330,425,415,588)]},
    {id:'myanmar', country:'Myanmar', labelPlacement:'below', labelAlign:'start', hitAreas:[area('shwedagon-pagoda',106,80,259,194)]},
    {id:'philippines', country:'Philippines', labelAlign:'end', hitAreas:[area('philippines-church',1170,280,1303,397)]},
    {id:'singapore', country:'Singapore', hitAreas:[area('marina-bay-sands',480,590,625,681)]},
    {id:'thailand', labelPlacement:'below', country:'Thailand', hitAreas:[area('wat-arun',259,185,415,322)]},
    {id:'vietnam', labelPlacement:'below', country:'Vietnam', hitAreas:[area('ha-long-west',705,148,838,239),area('ha-long-east',849,169,1013,281)]},
].map(destination=>({...destination,labelKey:`homeMagazine.atlas.southeastAsiaCountries.${destination.id}`,
    artworkPosition:destination.hitAreas[0].artworkPosition,hitArea:destination.hitAreas[0].hitArea}));
