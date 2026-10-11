import {africaDestination} from './africaDestinations.js';
import artworkUrl from '../../../assets/atlas/africa/africa-atlas.png';
import {getItinerariesByCountry} from '../../../api.js';
import {validateOfficialSlug} from '../../../utils/officialItineraries.js';
import {AFRICA_COUNTRIES} from './africaScenes.js';
export async function loadAfricaRegion(){
    const inventory=Object.fromEntries(await Promise.all(Object.entries(AFRICA_COUNTRIES).map(async([id,country])=>{
        const items=await getItinerariesByCountry(country);
        if(!Array.isArray(items)||items.length!==1||items[0].country!==country)throw Error('Africa requires exactly one official itinerary per country');
        validateOfficialSlug(items[0].slug);return [id,items];
    })));
    // Each artistic country zone opens its dedicated Story Map.
    const destinations=Object.entries(AFRICA_COUNTRIES).map(([id,country])=>africaDestination(id,country));
    return {artworkUrl,inventory,destinations};
}
