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
