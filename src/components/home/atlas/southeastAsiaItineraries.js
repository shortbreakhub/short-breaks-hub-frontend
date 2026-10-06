import i18n from 'i18next';
import en from '../../../locales/en/atlas-southeast-asia.json';
import fr from '../../../locales/fr/atlas-southeast-asia.json';
import cambodiaUrl from '../../../assets/atlas/countries/cambodia/cambodia-atlas.png';
import indonesiaUrl from '../../../assets/atlas/countries/indonesia/indonesia-atlas.png';
import laosUrl from '../../../assets/atlas/countries/laos/laos-atlas.png';
import malaysiaUrl from '../../../assets/atlas/countries/malaysia/malaysia-atlas.png';
import myanmarUrl from '../../../assets/atlas/countries/myanmar/myanmar-atlas.png';
import philippinesUrl from '../../../assets/atlas/countries/philippines/philippines-atlas.png';
import singaporeUrl from '../../../assets/atlas/countries/singapore/singapore-atlas.png';
import thailandUrl from '../../../assets/atlas/countries/thailand/thailand-atlas.png';
import vietnamUrl from '../../../assets/atlas/countries/vietnam/vietnam-atlas.png';
import {CAMBODIA_DESTINATIONS} from './cambodiaDestinations.js';
import {INDONESIA_DESTINATIONS} from './indonesiaDestinations.js';
import {LAOS_DESTINATIONS} from './laosDestinations.js';
import {MALAYSIA_DESTINATIONS} from './malaysiaDestinations.js';
import {MYANMAR_DESTINATIONS} from './myanmarDestinations.js';
import {PHILIPPINES_DESTINATIONS} from './philippinesDestinations.js';
import {SINGAPORE_DESTINATIONS} from './singaporeDestinations.js';
import {THAILAND_DESTINATIONS} from './thailandDestinations.js';
import {VIETNAM_DESTINATIONS} from './vietnamDestinations.js';
export const SOUTHEAST_ASIA_ITINERARIES = {
    cambodia:CAMBODIA_DESTINATIONS,
    indonesia:INDONESIA_DESTINATIONS,
    laos:LAOS_DESTINATIONS,
    malaysia:MALAYSIA_DESTINATIONS,
    myanmar:MYANMAR_DESTINATIONS,
    philippines:PHILIPPINES_DESTINATIONS,
    singapore:SINGAPORE_DESTINATIONS,
    thailand:THAILAND_DESTINATIONS,
    vietnam:VIETNAM_DESTINATIONS,
};
export const SOUTHEAST_ASIA_ARTWORK = {cambodia:cambodiaUrl, indonesia:indonesiaUrl, laos:laosUrl, malaysia:malaysiaUrl, myanmar:myanmarUrl, philippines:philippinesUrl, singapore:singaporeUrl, thailand:thailandUrl, vietnam:vietnamUrl};

// Populate the existing common namespace before any new country story is revealed.
for(const [language,copy]of Object.entries({en,fr}))i18n.addResourceBundle(language,'common',{homeMagazine:{atlas:copy}},true,true);
