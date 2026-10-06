// Scene metadata is immediately available to the existing regional/Back UI.
// Destination geometry is requested only when a Southeast Asia country opens.
let itineraryModule;
export function southeastAsiaScene(country, artworkSize) {
    let destinations = [], artworkUrl;
    const key = suffix => `homeMagazine.atlas.${country}${suffix}`;
    return {region:'southeast-asia',countryId:country,artworkSize,previewClass:`atlas-${country}-preview`,
        keys:{mapLabel:key('MapLabel'),previewAlt:key('PreviewAlt'),caption:key('Caption'),story:key('Story'),nav:key('Destinations')},
        get destinations() { return destinations; },
        get artworkUrl() { return artworkUrl; },
        async loadDestinations() {
            itineraryModule ||= import('./southeastAsiaItineraries.js').catch(error => {
                itineraryModule = undefined;
                throw error;
            });
            const module = await itineraryModule;
            destinations = module.SOUTHEAST_ASIA_ITINERARIES[country];
            artworkUrl = module.SOUTHEAST_ASIA_ARTWORK[country];
            return destinations;
        },
    };
}

let regionalDestinations = [], regionalArtwork;
export const southeastAsiaRegion = {
    get destinations() { return regionalDestinations; },
    get artworkUrl() { return regionalArtwork; },
    async loadDestinations() {
        const module = await import('./southeastAsiaRegionalScene.js');
        regionalDestinations = module.SOUTHEAST_ASIA_DESTINATIONS;
        regionalArtwork = module.southeastAsiaUrl;
        return regionalDestinations;
    },
};

export const SOUTHEAST_ASIA_COUNTRY_SCENES = Object.fromEntries(
    ['cambodia','indonesia','laos','malaysia','myanmar','philippines','singapore','thailand','vietnam']
        .map(country => [country, southeastAsiaScene(country,
            ['cambodia','indonesia','laos'].includes(country) ? [1536,1024] : [1672,941])]),
);
