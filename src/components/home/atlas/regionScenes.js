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
};
