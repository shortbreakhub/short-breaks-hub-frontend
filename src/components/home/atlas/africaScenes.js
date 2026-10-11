// Metadata only: Africa inventory and artwork are deferred until selection.
export const AFRICA_COUNTRIES = {'morocco':'Morocco','egypt':'Egypt','south-africa':'South Africa','kenya':'Kenya','tanzania':'Tanzania','ghana':'Ghana','senegal':'Senegal','namibia':'Namibia','rwanda':'Rwanda'};
let destinations=[],artworkUrl,inventory,pending;
export const africaRegion={get destinations(){return destinations;},get artworkUrl(){return artworkUrl;},
    async loadDestinations(){
        pending ||= import('./africaRegionalScene.js').then(async module=>{
            const loaded=await module.loadAfricaRegion();
            destinations=loaded.destinations;artworkUrl=loaded.artworkUrl;inventory=loaded.inventory;return destinations;
        }).catch(error=>{pending=undefined;throw error;});
        return pending;
    },
};
export const AFRICA_COUNTRY_SCENES=Object.fromEntries(Object.keys(AFRICA_COUNTRIES).map(id=>{
    let places=[],image,pending;
    const prefix=id.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
    const key=suffix=>`homeMagazine.atlas.${prefix}${suffix}`;
    return [id,{region:'africa',countryId:id,previewClass:`atlas-${id}-preview`,
        keys:{mapLabel:key('MapLabel'),previewAlt:key('PreviewAlt'),caption:key('Caption'),story:key('Story'),nav:key('Destinations')},
        get destinations(){return places;},get artworkUrl(){return image;},
        async loadDestinations(){
            pending ||= africaRegion.loadDestinations().then(()=>import('./africaCountryScenes.js')).then(module=>{
                const loaded=module.loadAfricaCountry(id,inventory[id]);places=loaded.destinations;image=loaded.artworkUrl;return places;
            }).catch(error=>{pending=undefined;throw error;});
            return pending;
        },
    }];
}));
