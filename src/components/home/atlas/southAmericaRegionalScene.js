export {default as southAmericaUrl} from '../../../assets/atlas/south-america/south-america-atlas.png';
const area = (id, left, top, right, bottom) => ({id, kind:'landmark',
    artworkPosition:{x:(left+right)/2/1536,y:(top+bottom)/2/1024},
    hitArea:{width:(right-left)/1536,height:(bottom-top)/1024}});
export const SOUTH_AMERICA_DESTINATIONS = [
    {id:'brazil',country:'Brazil',hitAreas:[area('christ-the-redeemer',1008,336,1110,464)]},
    {id:'argentina',country:'Argentina',hitAreas:[area('buenos-aires-palace',622,573,814,676)]},
    {id:'peru',country:'Peru',hitAreas:[area('machu-picchu',475,322,633,402)]},
    {id:'colombia',country:'Colombia',labelPlacement:'below',hitAreas:[area('cartagena-cathedral',449,94,600,194)]},
    {id:'chile',country:'Chile',hitAreas:[area('chilean-mountains',532,700,624,808)]},
].map(destination => ({...destination,labelKey:`homeMagazine.atlas.southAmericaCountries.${destination.id}`,
    artworkPosition:destination.hitAreas[0].artworkPosition,hitArea:destination.hitAreas[0].hitArea}));
