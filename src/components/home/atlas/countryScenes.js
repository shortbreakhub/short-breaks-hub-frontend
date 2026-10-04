import {UK_DESTINATIONS} from './ukDestinations.js';
import {FRANCE_DESTINATIONS} from './franceDestinations.js';
import {SPAIN_DESTINATIONS} from './spainDestinations.js';

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
};
export function sceneForCountry(countryId) {
    return Object.keys(COUNTRY_SCENES).find(scene => COUNTRY_SCENES[scene].countryId === countryId);
}
