// Follow Southeast Asia's deferred regional artwork/configuration loading.
let destinations = [], artworkUrl;
export const northAmericaRegion = {
    get destinations() { return destinations; },
    get artworkUrl() { return artworkUrl; },
    async loadDestinations() {
        const module = await import('./northAmericaRegionalScene.js');
        destinations = module.NORTH_AMERICA_DESTINATIONS;
        artworkUrl = module.northAmericaUrl;
        return destinations;
    },
};

// Country Story Maps open from the North America region exactly like South America's:
// metadata is immediate; anchors, API itineraries and artwork load on selection.
const keyPrefix = {canada:'canada','united-states':'unitedStates',mexico:'mexico'};
export const NORTH_AMERICA_COUNTRY_SCENES = Object.fromEntries(
    ['canada','united-states','mexico'].map(country => {
        let countryDestinations = [], countryArtwork, pending;
        const key = suffix => `homeMagazine.atlas.${keyPrefix[country]}${suffix}`;
        return [country, {region:'north-america',countryId:country,artworkSize:[1536,1024],previewClass:`atlas-${country}-preview`,
            keys:{mapLabel:key('MapLabel'),previewAlt:key('PreviewAlt'),caption:key('Caption'),story:key('Story'),nav:key('Destinations')},
            get destinations() { return countryDestinations; },
            get artworkUrl() { return countryArtwork; },
            async loadDestinations() {
                pending ||= import('./northAmericaCountryScenes.js').then(async module => {
                    const loaded = await module.loadNorthAmericaCountry(country);
                    countryDestinations = loaded.destinations;
                    countryArtwork = loaded.artworkUrl;
                    return countryDestinations;
                }).catch(error => {pending = undefined; throw error;});
                return pending;
            },
        }];
    }),
);
