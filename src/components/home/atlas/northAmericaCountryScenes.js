import i18n from 'i18next';
import en from '../../../locales/en/atlas-north-america.json';
import fr from '../../../locales/fr/atlas-north-america.json';
import {getItinerariesByCountry} from '../../../api.js';
import {validateOfficialSlug} from '../../../utils/officialItineraries.js';
import canadaUrl from '../../../assets/atlas/countries/canada/canada-atlas.png';
import usaUrl from '../../../assets/atlas/countries/usa/usa-atlas.png';
import mexicoUrl from '../../../assets/atlas/countries/mexico/mexico-atlas.png';

// Same contract as South America: artwork anchors only; itinerary records and canonical slugs
// come from the existing country API, and artwork without a real itinerary stays inert.
// Plate boxes start at each painted pin, just left of its name plate.
const countries = {canada:'Canada','united-states':'United States',mexico:'Mexico'};
const artwork = {canada:canadaUrl,'united-states':usaUrl,mexico:mexicoUrl};
const keyPrefix = {canada:'canada','united-states':'unitedStates',mexico:'mexico'};
const area = (id, kind, left, top, right, bottom) => ({id,kind,
    artworkPosition:{x:(left+right)/2/1536,y:(top+bottom)/2/1024},
    hitArea:{width:(right-left)/1536,height:(bottom-top)/1024}});
const place = (id, city, plate, landmarks) => ({id,city,hitAreas:[area(`${id}-plate`,'plate',...plate),
    ...landmarks.map((box,index)=>area(`${id}-landmark-${index}`,'landmark',...box))]});
const anchors = {
    canada:[
        place('vancouver','Vancouver',[181,686,294,720],[[196,612,330,684]]),
        place('lake-louise','Lake Louise',[348,594,466,626],[[372,628,478,668]]),
        place('calgary','Calgary',[394,695,494,729],[[400,730,530,768],[482,662,508,700]]),
        place('toronto','Toronto',[879,838,973,868],[[845,722,975,834]]),
        place('ottawa','Ottawa',[990,785,1077,818],[[1010,702,1100,782]]),
        place('montreal','Montréal',[1103,761,1221,797],[[1110,690,1215,758]]),
        place('quebec-city','Québec City',[1177,639,1304,678],[[1165,580,1290,637]]),
    ],
    'united-states':[
        place('seattle','Seattle',[130,144,226,178],[[110,88,182,140]]),
        place('san-francisco','San Francisco',[60,407,198,441],[[40,340,176,402]]),
        place('las-vegas','Las Vegas',[270,499,363,531],[]),
        place('los-angeles','Los Angeles',[93,562,228,594],[[100,462,240,556]]),
        place('chicago','Chicago',[970,372,1073,405],[[940,300,1030,368]]),
        place('boston','Boston',[1400,312,1483,343],[[1370,240,1430,305]]),
        place('new-york-city','New York City',[1330,396,1456,429],[[1255,330,1340,425]]),
        place('washington-dc','Washington, D.C.',[1245,502,1386,539],[[1220,440,1330,496]]),
        place('new-orleans','New Orleans',[943,779,1073,813],[[955,710,1025,772],[815,765,920,820]]),
    ],
    // Mexico's pins sit high on their plates; plates start 10px earlier (and higher where the pin
    // overhangs) so each pin falls inside the link's pill shape instead of its clipped corner.
    mexico:[
        place('guanajuato','Guanajuato',[620,468,743,506],[[580,370,705,440]]),
        place('san-miguel','San Miguel de Allende',[721,512,906,546],[[752,405,830,505]]),
        place('mexico-city','Mexico City',[753,643,886,683],[[720,570,870,645]]),
        place('oaxaca','Oaxaca',[910,779,1006,816],[[910,705,1030,780]]),
        place('merida','Mérida',[1265,539,1371,571],[[1235,572,1335,640]]),
        place('tulum','Tulum',[1385,621,1489,653],[[1405,570,1480,618]]),
    ],
};

for (const [language,copy] of Object.entries({en,fr})) i18n.addResourceBundle(language,'common',{homeMagazine:{atlas:copy}},true,true);

export async function loadNorthAmericaCountry(country) {
    const items = await getItinerariesByCountry(countries[country]);
    if (!Array.isArray(items)) throw new Error('Country itinerary inventory unavailable');
    const destinations = anchors[country].flatMap(anchor => {
        const matches = items.filter(item => item.country === countries[country] && item.city === anchor.city);
        if (!matches.length) return []; // No invented links for artwork without a real itinerary.
        if (matches.length !== 1) throw new Error('Ambiguous country itinerary destination');
        return [{...anchor,
            calloutAlign:anchor.hitAreas[0].artworkPosition.x > 0.6 ? 'end' : anchor.hitAreas[0].artworkPosition.x < 0.35 ? 'start' : undefined,
            calloutPlacement:anchor.hitAreas[0].artworkPosition.y < 0.15 ? 'below' : undefined,
            slug:validateOfficialSlug(matches[0].slug),labelKey:`homeMagazine.atlas.${keyPrefix[country]}Places.${anchor.id}`}];
    });
    if (!destinations.length) throw new Error('Country itinerary inventory unavailable');
    return {destinations,artworkUrl:artwork[country]};
}
