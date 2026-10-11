import i18n from 'i18next';
import en from '../../../locales/en/atlas-south-america.json';
import fr from '../../../locales/fr/atlas-south-america.json';
import {getItinerariesByCountry} from '../../../api.js';
import {validateOfficialSlug} from '../../../utils/officialItineraries.js';
import brazilUrl from '../../../assets/atlas/countries/brazil/brazil-atlas.png';
import argentinaUrl from '../../../assets/atlas/countries/argentina/argentina-atlas.png';
import peruUrl from '../../../assets/atlas/countries/peru/peru-atlas.png';
import colombiaUrl from '../../../assets/atlas/countries/colombia/colombia-atlas.png';
import chileUrl from '../../../assets/atlas/countries/chile/chile-atlas.png';

const countries = {brazil:'Brazil',argentina:'Argentina',peru:'Peru',colombia:'Colombia',chile:'Chile'};
const artwork = {brazil:brazilUrl,argentina:argentinaUrl,peru:peruUrl,colombia:colombiaUrl,chile:chileUrl};
const area = (id, kind, left, top, right, bottom) => ({id,kind,
    artworkPosition:{x:(left+right)/2/1536,y:(top+bottom)/2/1024},
    hitArea:{width:(right-left)/1536,height:(bottom-top)/1024}});
const place = (id, city, plate, landmarks) => ({id,city,hitAreas:[area(`${id}-plate`,'plate',...plate),
    ...landmarks.map((box,index)=>area(`${id}-landmark-${index}`,'landmark',...box))]});
// Artwork anchors only. Itinerary records and canonical slugs come from the existing country API.
const anchors = {
    brazil:[
        place('rio','Rio de Janeiro',[1058,728,1209,766],[[1093,604,1149,702],[1200,635,1287,713]]),
        place('sao-paulo','São Paulo',[833,693,950,735],[[850,638,1017,691]]),
        place('salvador','Salvador',[1108,439,1218,480],[[1008,381,1125,436]]),
        place('lencois','Barreirinhas & Atins',[926,283,1108,326],[[917,225,1038,280]]),
        place('amazon','Manaus & Amazon Rainforest',[407,215,506,255],[[361,177,408,263]]),
    ],
    argentina:[
        place('buenos-aires','Buenos Aires',[871,437,1020,479],[[760,331,1017,434]]),
        place('mendoza','Mendoza',[447,267,568,311],[[465,182,614,263]]),
        place('patagonia','El Calafate & El Chaltén',[397,711,525,753],[[405,610,523,655],[529,690,660,766]]),
        place('iguazu','Puerto Iguazú',[833,138,974,181],[[807,184,1003,259]]),
    ],
    peru:[
        place('lima','Lima',[537,549,623,589],[[428,494,581,547]]),
        place('cusco','Cusco',[1031,611,1121,653],[[1020,566,1138,608]]),
        place('sacred-valley','Sacred Valley (Pisac, Ollantaytambo, Moray)',[892,520,1018,560],[[918,472,1064,514]]),
        place('machu-picchu','Machu Picchu',[785,471,915,507],[[728,439,826,469]]),
        place('arequipa','Arequipa',[976,794,1078,839],[[917,744,1063,788]]),
    ],
    colombia:[
        place('bogota','Bogotá',[886,522,991,566],[[840,426,995,519]]),
        place('medellin','Medellín',[603,373,718,415],[[571,323,812,369]]),
        place('cartagena','Cartagena',[545,181,671,225],[[535,93,694,178]]),
        place('coffee-region','Salento & Cocora Valley',[619,509,771,553],[[553,439,779,501]]),
    ],
    chile:[
        place('santiago','Santiago',[777,358,895,404],[[708,288,905,355]]),
        place('valparaiso','Valparaíso',[575,287,699,331],[[562,229,660,281]]),
        place('atacama','San Pedro de Atacama',[726,73,857,129],[[670,76,722,125]]),
        place('torres-del-paine','Torres del Paine National Park',[661,712,834,757],[[728,646,854,709]]),
    ],
};

for (const [language,copy] of Object.entries({en,fr})) i18n.addResourceBundle(language,'common',{homeMagazine:{atlas:copy}},true,true);

export async function loadSouthAmericaCountry(country) {
    const items = await getItinerariesByCountry(countries[country]);
    if (!Array.isArray(items)) throw new Error('Country itinerary inventory unavailable');
    const destinations = anchors[country].flatMap(anchor => {
        const matches = items.filter(item => item.country === countries[country] && item.city === anchor.city);
        if (!matches.length) return []; // No invented links for artwork without a real itinerary.
        if (matches.length !== 1) throw new Error('Ambiguous country itinerary destination');
        return [{...anchor,
            calloutAlign:anchor.hitAreas[0].artworkPosition.x > 0.6 ? 'end' : anchor.hitAreas[0].artworkPosition.x < 0.35 ? 'start' : undefined,
            calloutPlacement:anchor.hitAreas[0].artworkPosition.y < 0.15 ? 'below' : undefined,
            slug:validateOfficialSlug(matches[0].slug),labelKey:`homeMagazine.atlas.${country}Places.${anchor.id}`}];
    });
    if (!destinations.length) throw new Error('Country itinerary inventory unavailable');
    return {destinations,artworkUrl:artwork[country]};
}
