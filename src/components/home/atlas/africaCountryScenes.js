import {AFRICA_COUNTRY_ZONES} from './africaCountryZones.js';
import moroccoUrl from '../../../assets/atlas/countries/morocco/morocco-atlas.png';
import egyptUrl from '../../../assets/atlas/countries/egypt/egypt-atlas.png';
import southafricaUrl from '../../../assets/atlas/countries/south-africa/south-africa-atlas.png';
import kenyaUrl from '../../../assets/atlas/countries/kenya/kenya-atlas.png';
import tanzaniaUrl from '../../../assets/atlas/countries/tanzania/tanzania-atlas.png';
import ghanaUrl from '../../../assets/atlas/countries/ghana/ghana-atlas.png';
import senegalUrl from '../../../assets/atlas/countries/senegal/senegal-atlas.png';
import namibiaUrl from '../../../assets/atlas/countries/namibia/namibia-atlas.png';
import rwandaUrl from '../../../assets/atlas/countries/rwanda/rwanda-atlas.png';
import {validateOfficialSlug} from '../../../utils/officialItineraries.js';
const artwork={'morocco':moroccoUrl,'egypt':egyptUrl,'south-africa':southafricaUrl,'kenya':kenyaUrl,'tanzania':tanzaniaUrl,'ghana':ghanaUrl,'senegal':senegalUrl,'namibia':namibiaUrl,'rwanda':rwandaUrl};
export function loadAfricaCountry(id,items){
    if(!artwork[id]||!Array.isArray(items)||items.length!==1)throw Error('Africa country itinerary unavailable');
    return {artworkUrl:artwork[id],destinations:[{id,slug:validateOfficialSlug(items[0].slug),labelKey:`homeMagazine.atlas.africaCountries.${id}`,hitAreas:AFRICA_COUNTRY_ZONES[id],calloutPlacement:'inside'} ]};
}
