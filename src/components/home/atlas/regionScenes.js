import {oceaniaRegion} from './oceaniaScenes.js';
import {southAmericaRegion} from './southAmericaScenes.js';
import {southeastAsiaRegion} from './southeastAsiaScenes.js';
import {northAmericaRegion} from './northAmericaScene.js';
import {EUROPE_DESTINATIONS} from './europeDestinations.js';
import {EAST_ASIA_DESTINATIONS} from './eastAsiaDestinations.js';
// Region configuration reuses the accepted Europe interaction layer and scene controller.
export const REGION_SCENES = {
    europe: {destinations:EUROPE_DESTINATIONS, keys:{name:'homeMagazine.atlas.europeName',
        mapLabel:'homeMagazine.atlas.mapLabel', previewAlt:'homeMagazine.atlas.previewAlt',
        caption:'homeMagazine.atlas.caption', nav:'homeMagazine.atlas.destinations', back:'homeMagazine.atlas.backEurope', error:'homeMagazine.atlas.sceneFailed'}},
    'east-asia': {destinations:EAST_ASIA_DESTINATIONS, keys:{name:'homeMagazine.atlas.eastAsiaName',
        mapLabel:'homeMagazine.atlas.eastAsiaMapLabel', previewAlt:'homeMagazine.atlas.eastAsiaPreviewAlt',
        caption:'homeMagazine.atlas.eastAsiaCaption', nav:'homeMagazine.atlas.eastAsiaDestinations', back:'homeMagazine.atlas.backEastAsia', error:'homeMagazine.atlas.eastAsiaSceneFailed'}},
    'southeast-asia': {get destinations(){return southeastAsiaRegion.destinations;},get artworkUrl(){return southeastAsiaRegion.artworkUrl;},loadDestinations:southeastAsiaRegion.loadDestinations, keys:{name:'homeMagazine.atlas.southeastAsiaName',
        mapLabel:'homeMagazine.atlas.southeastAsiaMapLabel', previewAlt:'homeMagazine.atlas.southeastAsiaPreviewAlt',
        caption:'homeMagazine.atlas.southeastAsiaCaption', nav:'homeMagazine.atlas.southeastAsiaDestinations', back:'homeMagazine.atlas.backSoutheastAsia', error:'homeMagazine.atlas.southeastAsiaSceneFailed'}},
    'north-america': {get destinations(){return northAmericaRegion.destinations;},get artworkUrl(){return northAmericaRegion.artworkUrl;},loadDestinations:northAmericaRegion.loadDestinations, keys:{name:'homeMagazine.atlas.northAmericaName',
        mapLabel:'homeMagazine.atlas.northAmericaMapLabel', previewAlt:'homeMagazine.atlas.northAmericaPreviewAlt',
        caption:'homeMagazine.atlas.northAmericaCaption', nav:'homeMagazine.atlas.northAmericaDestinations', back:'homeMagazine.atlas.backNorthAmerica', error:'homeMagazine.atlas.northAmericaSceneFailed'}},
    'south-america': {get destinations(){return southAmericaRegion.destinations;},get artworkUrl(){return southAmericaRegion.artworkUrl;},loadDestinations:southAmericaRegion.loadDestinations, keys:{name:'homeMagazine.atlas.southAmericaName',
        mapLabel:'homeMagazine.atlas.southAmericaMapLabel', previewAlt:'homeMagazine.atlas.southAmericaPreviewAlt',
        caption:'homeMagazine.atlas.southAmericaCaption', nav:'homeMagazine.atlas.southAmericaDestinations', back:'homeMagazine.atlas.backSouthAmerica', error:'homeMagazine.atlas.southAmericaSceneFailed'}},
    oceania: {get destinations(){return oceaniaRegion.destinations;},get artworkUrl(){return oceaniaRegion.artworkUrl;},loadDestinations:oceaniaRegion.loadDestinations, keys:{name:'homeMagazine.atlas.oceaniaName',mapLabel:'homeMagazine.atlas.oceaniaMapLabel',previewAlt:'homeMagazine.atlas.oceaniaPreviewAlt',caption:'homeMagazine.atlas.oceaniaCaption',nav:'homeMagazine.atlas.oceaniaDestinations',back:'homeMagazine.atlas.backOceania',error:'homeMagazine.atlas.oceaniaSceneFailed'}},
};
