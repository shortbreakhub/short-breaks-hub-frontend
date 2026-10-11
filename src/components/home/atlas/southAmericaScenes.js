// Reuse the established deferred regional/country scene contract.
let regionalDestinations = [], regionalArtwork;
export const southAmericaRegion = {
    get destinations() { return regionalDestinations; },
    get artworkUrl() { return regionalArtwork; },
    async loadDestinations() {
        const module = await import('./southAmericaRegionalScene.js');
        regionalDestinations = module.SOUTH_AMERICA_DESTINATIONS;
        regionalArtwork = module.southAmericaUrl;
        return regionalDestinations;
    },
};

export const SOUTH_AMERICA_COUNTRY_SCENES = Object.fromEntries(
    ['brazil','argentina','peru','colombia','chile'].map(country => {
        let destinations = [], artworkUrl, pending;
        const key = suffix => `homeMagazine.atlas.${country}${suffix}`;
        return [country, {region:'south-america',countryId:country,artworkSize:[1536,1024],previewClass:`atlas-${country}-preview`,
            keys:{mapLabel:key('MapLabel'),previewAlt:key('PreviewAlt'),caption:key('Caption'),story:key('Story'),nav:key('Destinations')},
            get destinations() { return destinations; },
            get artworkUrl() { return artworkUrl; },
            async loadDestinations() {
                pending ||= import('./southAmericaCountryScenes.js').then(async module => {
                    const loaded = await module.loadSouthAmericaCountry(country);
                    destinations = loaded.destinations;
                    artworkUrl = loaded.artworkUrl;
                    return destinations;
                }).catch(error => {pending = undefined; throw error;});
                return pending;
            },
        }];
    }),
);
