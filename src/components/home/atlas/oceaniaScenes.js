// Reuse the existing deferred scene contract. Counts are resolved from the API, never geography.
let destinations = [], artworkUrl, inventory, pending;
export const oceaniaRegion = {
    get destinations() { return destinations; }, get artworkUrl() { return artworkUrl; },
    async loadDestinations() {
        pending ||= import('./oceaniaRegionalScene.js').then(async module => {
            const loaded = await module.loadOceaniaRegion();
            destinations = loaded.destinations; artworkUrl = loaded.artworkUrl; inventory = loaded.inventory;
            return destinations;
        }).catch(error => {pending = undefined; throw error;});
        return pending;
    },
};
export const OCEANIA_COUNTRY_SCENES = Object.fromEntries(['australia','new-zealand','fiji','french-polynesia','new-caledonia','papua-new-guinea','samoa','tonga','vanuatu'].map(country => {
    let places = [], image, loading;
    const prefix = country.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
    const key = suffix => `homeMagazine.atlas.${prefix}${suffix}`;
    return [country,{region:'oceania',countryId:country,artworkSize:[1536,1024],previewClass:`atlas-${country}-preview`,
        keys:{mapLabel:key('MapLabel'),previewAlt:key('PreviewAlt'),caption:key('Caption'),story:key('Story'),nav:key('Destinations')},
        get destinations() { return places; }, get artworkUrl() { return image; },
        async loadDestinations() {
            loading ||= oceaniaRegion.loadDestinations().then(()=>import('./oceaniaCountryScenes.js')).then(module => {
                const loaded = module.loadOceaniaCountry(country,inventory[country]);
                places = loaded.destinations; image = loaded.artworkUrl; return places;
            }).catch(error=>{loading=undefined;throw error;});
            return loading;
        },
    }];
}));
