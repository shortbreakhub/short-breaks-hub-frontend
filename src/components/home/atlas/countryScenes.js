import {CHINA_DESTINATIONS} from './chinaDestinations.js';
import {JAPAN_DESTINATIONS} from './japanDestinations.js';
import {SOUTH_KOREA_DESTINATIONS} from './southkoreaDestinations.js';
import {MONGOLIA_DESTINATIONS} from './mongoliaDestinations.js';
import {TAIWAN_DESTINATIONS} from './taiwanDestinations.js';
import {HONG_KONG_DESTINATIONS} from './hongkongDestinations.js';
import {MACAU_DESTINATIONS} from './macauDestinations.js';
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
    'china': {region: 'east-asia', countryId: 'china', previewClass: 'atlas-china-preview', destinations: CHINA_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.chinaMapLabel', previewAlt: 'homeMagazine.atlas.chinaPreviewAlt',
        caption: 'homeMagazine.atlas.chinaCaption', story: 'homeMagazine.atlas.chinaStory', nav: 'homeMagazine.atlas.chinaDestinations'}},
    'japan': {region: 'east-asia', countryId: 'japan', previewClass: 'atlas-japan-preview', destinations: JAPAN_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.japanMapLabel', previewAlt: 'homeMagazine.atlas.japanPreviewAlt',
        caption: 'homeMagazine.atlas.japanCaption', story: 'homeMagazine.atlas.japanStory', nav: 'homeMagazine.atlas.japanDestinations'}},
    'south-korea': {region: 'east-asia', countryId: 'south-korea', previewClass: 'atlas-south-korea-preview', destinations: SOUTH_KOREA_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.southkoreaMapLabel', previewAlt: 'homeMagazine.atlas.southkoreaPreviewAlt',
        caption: 'homeMagazine.atlas.southkoreaCaption', story: 'homeMagazine.atlas.southkoreaStory', nav: 'homeMagazine.atlas.southkoreaDestinations'}},
    'mongolia': {region: 'east-asia', countryId: 'mongolia', previewClass: 'atlas-mongolia-preview', destinations: MONGOLIA_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.mongoliaMapLabel', previewAlt: 'homeMagazine.atlas.mongoliaPreviewAlt',
        caption: 'homeMagazine.atlas.mongoliaCaption', story: 'homeMagazine.atlas.mongoliaStory', nav: 'homeMagazine.atlas.mongoliaDestinations'}},
    'taiwan': {region: 'east-asia', countryId: 'taiwan', previewClass: 'atlas-taiwan-preview', destinations: TAIWAN_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.taiwanMapLabel', previewAlt: 'homeMagazine.atlas.taiwanPreviewAlt',
        caption: 'homeMagazine.atlas.taiwanCaption', story: 'homeMagazine.atlas.taiwanStory', nav: 'homeMagazine.atlas.taiwanDestinations'}},
    'hong-kong': {region: 'east-asia', countryId: 'hong-kong', previewClass: 'atlas-hong-kong-preview', destinations: HONG_KONG_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.hongkongMapLabel', previewAlt: 'homeMagazine.atlas.hongkongPreviewAlt',
        caption: 'homeMagazine.atlas.hongkongCaption', story: 'homeMagazine.atlas.hongkongStory', nav: 'homeMagazine.atlas.hongkongDestinations'}},
    'macau': {region: 'east-asia', countryId: 'macau', previewClass: 'atlas-macau-preview', destinations: MACAU_DESTINATIONS, keys: {
        mapLabel: 'homeMagazine.atlas.macauMapLabel', previewAlt: 'homeMagazine.atlas.macauPreviewAlt',
        caption: 'homeMagazine.atlas.macauCaption', story: 'homeMagazine.atlas.macauStory', nav: 'homeMagazine.atlas.macauDestinations'}},
};
export function sceneForCountry(countryId) {
    return Object.keys(COUNTRY_SCENES).find(scene => COUNTRY_SCENES[scene].countryId === countryId);
}
