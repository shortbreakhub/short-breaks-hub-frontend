import {UK_DESTINATIONS} from './ukDestinations.js';
import {FRANCE_DESTINATIONS} from './franceDestinations.js';
import {SPAIN_DESTINATIONS} from './spainDestinations.js';
import {PORTUGAL_DESTINATIONS} from './portugalDestinations.js';
import {GERMANY_DESTINATIONS} from './germanyDestinations.js';
import {GREECE_DESTINATIONS} from './greeceDestinations.js';
import {ITALY_DESTINATIONS} from './italyDestinations.js';
import {NETHERLANDS_DESTINATIONS} from './netherlandsDestinations.js';
import {SWITZERLAND_DESTINATIONS} from './switzerlandDestinations.js';

// Country Story Maps keyed by scene id. countryId is the Europe destination that
// opens the scene and receives focus again on the way back. Artwork URLs live in
// SCENE_ASSETS (useAtlasScene.js); only the UK is warmed up after mount.
export const COUNTRY_SCENES = {
    uk: {countryId: 'united-kingdom', previewClass: 'atlas-uk-preview', destinations: UK_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.ukMapLabel', previewAlt: 'homeMagazine.atlas.ukPreviewAlt',
        caption: 'homeMagazine.atlas.ukCaption', story: 'homeMagazine.atlas.ukStory', nav: 'homeMagazine.atlas.ukDestinations'}},
    france: {countryId: 'france', previewClass: 'atlas-france-preview', destinations: FRANCE_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.franceMapLabel', previewAlt: 'homeMagazine.atlas.francePreviewAlt',
        caption: 'homeMagazine.atlas.franceCaption', story: 'homeMagazine.atlas.franceStory', nav: 'homeMagazine.atlas.franceDestinations'}},
    spain: {countryId: 'spain', previewClass: 'atlas-spain-preview', destinations: SPAIN_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.spainMapLabel', previewAlt: 'homeMagazine.atlas.spainPreviewAlt',
        caption: 'homeMagazine.atlas.spainCaption', story: 'homeMagazine.atlas.spainStory', nav: 'homeMagazine.atlas.spainDestinations'}},
    portugal: {countryId: 'portugal', previewClass: 'atlas-portugal-preview', destinations: PORTUGAL_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.portugalMapLabel', previewAlt: 'homeMagazine.atlas.portugalPreviewAlt',
        caption: 'homeMagazine.atlas.portugalCaption', story: 'homeMagazine.atlas.portugalStory', nav: 'homeMagazine.atlas.portugalDestinations'}},
    germany: {countryId: 'germany', previewClass: 'atlas-germany-preview', destinations: GERMANY_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.germanyMapLabel', previewAlt: 'homeMagazine.atlas.germanyPreviewAlt',
        caption: 'homeMagazine.atlas.germanyCaption', story: 'homeMagazine.atlas.germanyStory', nav: 'homeMagazine.atlas.germanyDestinations'}},
    greece: {countryId: 'greece', previewClass: 'atlas-greece-preview', destinations: GREECE_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.greeceMapLabel', previewAlt: 'homeMagazine.atlas.greecePreviewAlt',
        caption: 'homeMagazine.atlas.greeceCaption', story: 'homeMagazine.atlas.greeceStory', nav: 'homeMagazine.atlas.greeceDestinations'}},
    italy: {countryId: 'italy', previewClass: 'atlas-italy-preview', destinations: ITALY_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.italyMapLabel', previewAlt: 'homeMagazine.atlas.italyPreviewAlt',
        caption: 'homeMagazine.atlas.italyCaption', story: 'homeMagazine.atlas.italyStory', nav: 'homeMagazine.atlas.italyDestinations'}},
    netherlands: {countryId: 'netherlands', previewClass: 'atlas-netherlands-preview', destinations: NETHERLANDS_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.netherlandsMapLabel', previewAlt: 'homeMagazine.atlas.netherlandsPreviewAlt',
        caption: 'homeMagazine.atlas.netherlandsCaption', story: 'homeMagazine.atlas.netherlandsStory', nav: 'homeMagazine.atlas.netherlandsDestinations'}},
    switzerland: {countryId: 'switzerland', previewClass: 'atlas-switzerland-preview', destinations: SWITZERLAND_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.switzerlandMapLabel', previewAlt: 'homeMagazine.atlas.switzerlandPreviewAlt',
        caption: 'homeMagazine.atlas.switzerlandCaption', story: 'homeMagazine.atlas.switzerlandStory', nav: 'homeMagazine.atlas.switzerlandDestinations'}},
};
export function sceneForCountry(countryId) {
    return Object.keys(COUNTRY_SCENES).find(scene => COUNTRY_SCENES[scene].countryId === countryId);
}
