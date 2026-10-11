import vanuatuUrl from '../../../assets/atlas/countries/vanuatu/vanuatu-atlas.png';
import tongaUrl from '../../../assets/atlas/countries/tonga/tonga-atlas.png';
import samoaUrl from '../../../assets/atlas/countries/samoa/samoa-atlas.png';
import papuanewguineaUrl from '../../../assets/atlas/countries/papua-new-guinea/papua-new-guinea-atlas.png';
import newcaledoniaUrl from '../../../assets/atlas/countries/new-caledonia/new-caledonia-atlas.png';
import frenchpolynesiaUrl from '../../../assets/atlas/countries/french-polynesia/french-polynesia-atlas.png';
import fijiUrl from '../../../assets/atlas/countries/fiji/fiji-atlas.png';
import i18n from 'i18next';
import en from '../../../locales/en/atlas-oceania.json';
import fr from '../../../locales/fr/atlas-oceania.json';
import australiaUrl from '../../../assets/atlas/countries/australia/australia-atlas.png';
import newZealandUrl from '../../../assets/atlas/countries/new-zealand/new-zealand-atlas.png';
import {OCEANIA_ISLANDS} from './oceaniaIslands.js';
import {validateOfficialSlug} from '../../../utils/officialItineraries.js';
const artwork={australia:australiaUrl,'new-zealand':newZealandUrl,fiji:fijiUrl,'french-polynesia':frenchpolynesiaUrl,'new-caledonia':newcaledoniaUrl,'papua-new-guinea':papuanewguineaUrl,samoa:samoaUrl,tonga:tongaUrl,vanuatu:vanuatuUrl};
const area=(id,box)=>({id,kind:'landmark',artworkPosition:{x:(box[0]+box[2])/2/1536,y:(box[1]+box[3])/2/1024},hitArea:{width:(box[2]-box[0])/1536,height:(box[3]-box[1])/1024}});
const place=(id,city,box,extra=[])=>({id,city,hitAreas:[area(id,box),...extra.map((b,index)=>area(`${id}-${index}`,b))]});
const anchors={
    australia:[
        place('sydney','Sydney',[1040,608,1142,646],[[931,558,1180,605]]),
        place('melbourne','Melbourne',[863,717,990,759],[[736,656,1004,713]]),
        place('brisbane','Brisbane',[1082,432,1202,474],[[971,366,1080,430]]),
        place('perth','Perth',[118,570,214,606],[[114,496,258,566]]),
        place('tasmania','Tasmania',[908,892,1012,930],[[802,807,1092,888]]),
        // Canberra has no baked name plate; this quiet area between Sydney and Melbourne
        // receives its real name through the existing accessible/focus/hover callout.
        place('canberra','Canberra',[1001,669,1045,703]),
    ],
    'new-zealand':[
        place('auckland','Auckland',[820,180,935,220],[[813,119,977,178]]),
        place('wellington','Wellington',[886,499,1014,539],[[894,424,1032,495]]),
        place('queenstown','Queenstown',[455,809,592,848],[[404,766,580,804]]),
        place('christchurch','Christchurch',[707,659,847,700],[[706,593,829,655]]),
        place('rotorua','Rotorua',[981,301,1087,341],[[1001,254,1118,299]]),
        place('fiordland','Fiordland',[311,700,404,768]),
        place('south-island','South Island',[483,567,579,619]),
    ],
};
for(const [language,copy] of Object.entries({en,fr}))i18n.addResourceBundle(language,'common',{homeMagazine:{atlas:copy}},true,true);
export function loadOceaniaCountry(country,items) {
    if(items.length===1) {
        const hitAreas=OCEANIA_ISLANDS[country];
        if(!hitAreas?.length)throw Error('Oceania whole-country interaction unavailable');
        return {artworkUrl:artwork[country],destinations:[{id:country,slug:validateOfficialSlug(items[0].slug),hitAreas,
            labelKey:`homeMagazine.atlas.oceaniaCountries.${country}`,calloutPlacement:'below'}]};
    }
    if(!anchors[country])throw Error('Oceania destination requires multiple-itinerary hotspots');
    const destinations=anchors[country].flatMap(anchor=>{
        const matches=items.filter(item=>item.city===anchor.city);
        if(!matches.length)return [];
        if(matches.length!==1)throw Error('Ambiguous Oceania destination');
        return [{...anchor,slug:validateOfficialSlug(matches[0].slug),labelKey:`homeMagazine.atlas.${country==='australia'?'australia':'newZealand'}Places.${anchor.id}`,calloutAlign:anchor.hitAreas[0].artworkPosition.x>.6?'end':undefined}];
    });
    if(!destinations.length)throw Error('Oceania country itinerary inventory unavailable');
    return {destinations,artworkUrl:artwork[country]};
}
