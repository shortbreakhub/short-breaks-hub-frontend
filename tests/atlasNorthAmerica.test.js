import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NORTH_AMERICA_DESTINATIONS} from '../src/components/home/atlas/northAmericaDestinations.js';
import {getCountryBrowsePath} from '../src/utils/publicNavigation.js';
import {createAtlasSceneTransition} from '../src/components/home/atlas/atlasSceneTransition.js';

test('North America keeps its locked 3:2 artwork and three real country routes', () => {
    const png=readFileSync('src/assets/atlas/north-america/north-america-atlas.png');
    assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);
    assert.equal(createHash('sha256').update(png).digest('hex'),'19ec5da8f511d2a80ad762d03add63e1b781bdfc1efbc85e76604383eecdf65a');
    assert.deepEqual(NORTH_AMERICA_DESTINATIONS.map(d=>[d.id,d.country]),[['canada','Canada'],['united-states','United States'],['mexico','Mexico']]);
    const regions=[];
    for(const d of NORTH_AMERICA_DESTINATIONS){
        assert.equal(getCountryBrowsePath(d.country),'/browse/'+d.id);
        const html=readFileSync(`dist/browse/${d.id}/index.html`,'utf8');
        const data=JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
        assert.equal(data.countrySlug,d.id);assert.ok(data.items.length>0);
        assert.ok(data.items.every(item=>item.country===d.country));
        for(const a of d.hitAreas){
            const {x,y}=a.artworkPosition,{width,height}=a.hitArea;
            const b={left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2,id:d.id};
            assert.ok(b.left>=0&&b.right<=1&&b.top>=0&&b.bottom<=1);regions.push(b);
        }
    }
    for(const a of regions)for(const b of regions)if(a.id!==b.id)assert.ok(!(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom));
    for(const [x,y]of [[120,470],[1440,230],[1130,820],[1240,90]])assert.ok(!regions.some(b=>x/1536>b.left&&x/1536<b.right&&y/1024>b.top&&y/1024<b.bottom),'ocean and neighboring geography stay inert');
});

test('North America reuses deferred region loading, country story maps, browse fallbacks and EN/FR labels', async () => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    try{
        await vite.ssrLoadModule('/src/i18n.js');
        const {REGION_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        const scene=REGION_SCENES['north-america'];
        assert.equal(SCENE_ASSETS['north-america'],undefined);
        assert.deepEqual(scene.destinations,[]);
        const initial=new JSDOM(renderToStaticMarkup(React.createElement(Stage))).window.document;
        assert.ok(initial.querySelector('option[value="north-america"]'));
        assert.equal(initial.querySelectorAll('img[src*="north-america-atlas"]').length,0);
        await scene.loadDestinations();assert.match(SCENE_ASSETS['north-america'],/north-america-atlas\.png/);
        for(const language of ['en','fr']){
            await i18n.changeLanguage(language);
            for(const key of Object.values(scene.keys))assert.notEqual(i18n.t(key),key);
            const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:'north-america'}))).window.document;
            assert.equal(doc.querySelectorAll('.atlas-country').length,3);
            const art=doc.querySelector('img[src*="north-america-atlas"]');assert.equal(art.getAttribute('width'),'1536');assert.equal(art.getAttribute('height'),'1024');assert.equal(art.hasAttribute('hidden'),false);
            for(const d of NORTH_AMERICA_DESTINATIONS){
                assert.equal(sceneForCountry(d.id),d.id,'country opens its approved story map; the href stays the crawlable browse fallback');
                const link=doc.querySelector(`[data-country="${d.id}"]`);
                assert.equal(link.getAttribute('href'),'/browse/'+d.id);
                assert.equal(link.getAttribute('aria-label'),`${i18n.t(d.labelKey)} — ${i18n.t('homeMagazine.atlas.countryExplore')}`);
                assert.equal(link.querySelectorAll('a,button,[tabindex]').length,0);
                assert.equal(link.querySelectorAll('[data-hit-area]').length,d.hitAreas.length-1);
            }
        }
    }finally{await i18n.changeLanguage('en');await vite.close();}
});

test('North America uses covered scene swaps, locking, reduced motion and failed-image recovery', async () => {
    for(const reduced of [false,true]){
        const swaps=[],delays=[];let rejectImage=false,controller;
        controller=createAtlasSceneTransition({scenes:['europe','north-america'],loadArtwork:async()=>{if(rejectImage)throw Error('unavailable');return {};},loadCloud:async()=>{},
            wait:async duration=>delays.push(duration),swapScene:async scene=>{assert.equal(controller.getState().phase,'covered');assert.equal(await controller.go('europe'),false);swaps.push(scene);},onScene:()=>{},onPhase:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await controller.go('north-america',reduced),true);
        assert.deepEqual(delays,reduced?[0,0,0]:[700,220,800]);assert.deepEqual(swaps,['north-america']);
        rejectImage=true;assert.equal(await controller.go('europe',reduced),false);
        assert.deepEqual(controller.getState(),{scene:'north-america',phase:'idle',busy:false});
    }
});

// Genuine official country inventory fixtures; product code gets slugs from the API.
const inventory = {
    Canada:[['Toronto','4-days-toronto-many-voices-one-ground'],['Vancouver','4-days-vancouver-edges-of-city-and-wild'],['Montréal','4-days-montreal-between-language-and-desire'],['Québec City','3-days-quebec-city-enclosure-memory-and-continuity'],['Ottawa','3-days-ottawa-civic-calm-and-quiet-edges'],['Lake Louise','2-days-lake-louise-clarity-at-altitude'],['Calgary','3-days-calgary-between-prairie-and-ascent']],
    'United States':[['New York City','4-days-new-york-city-moving-through-everything'],['New Orleans','3-days-new-orleans-rhythm-memory-and-survival'],['Los Angeles','4-days-los-angeles-distance-light-and-image'],['San Francisco','3-days-san-francisco-living-on-the-edge'],['Chicago','3-days-chicago-lines-water-and-calm-strength'],['Boston','3-days-boston-ideas-stone-and-walked-time'],['Washington, D.C.','3-days-washington-dc-power-memory-and-measured-steps'],['Seattle','3-days-seattle-rain-water-and-quiet-work'],['Las Vegas','2-days-las-vegas-controlled-excess-and-illusion']],
    Mexico:[['Mexico City','4-days-mexico-city-ancient-ground-living-density'],['Oaxaca','4-days-oaxaca-ritual-flavour-and-continuity'],['San Miguel de Allende','3-days-san-miguel-held-by-light-and-craft'],['Guanajuato','3-days-guanajuato-colour-below-and-above'],['Mérida','4-days-merida-stone-shade-and-maya-continuity'],['Tulum','3-days-tulum-ruins-light-and-fragile-balance']],
};
const countryIds = {Canada:'canada','United States':'united-states',Mexico:'mexico'};
const artworkFiles = {canada:'canada-atlas',"united-states":'usa-atlas',mexico:'mexico-atlas'};
const rows = country => inventory[country].map(([city,slug])=>({country,city,slug}));
const bounds = a => ({l:a.artworkPosition.x-a.hitArea.width/2,r:a.artworkPosition.x+a.hitArea.width/2,t:a.artworkPosition.y-a.hitArea.height/2,b:a.artworkPosition.y+a.hitArea.height/2});

test('North America countries open approved story maps built from their actual API inventory', async t => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    let api,adapter,requests=[],mode='ready';
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        const {COUNTRY_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {REGION_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        await t.test('country artwork and inventory stay deferred until a country is selected',()=>{
            for(const id of Object.values(countryIds))assert.equal(SCENE_ASSETS[id],undefined);
            const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage))).window.document;
            assert.equal(doc.querySelectorAll('img[src*="canada-atlas"],img[src*="usa-atlas"],img[src*="mexico-atlas"]').length,0);
            assert.equal(requests.length,0);
        });
        api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>{
            requests.push(config);const country=decodeURIComponent(config.url.split('/').at(-1));
            if(mode==='error')throw new Error('fixture API failure');
            const data=mode==='empty'?[]:rows(country);
            // Foreign entries must never be used, even if their city matches an anchor.
            return {config,status:200,headers:{},data:[...data,...rows(country).map(r=>({...r,country:'Other country',slug:'foreign-test-fixture'}))]};
        };
        await t.test('failed country loads remain retryable and never produce fabricated empty maps',async()=>{
            const scene=COUNTRY_SCENES.canada;mode='error';await assert.rejects(scene.loadDestinations(),/fixture API failure/);assert.equal(scene.artworkUrl,undefined);
            mode='empty';await assert.rejects(scene.loadDestinations(),/inventory unavailable/);assert.deepEqual(scene.destinations,[]);mode='ready';
        });
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        for(const [name,id] of Object.entries(countryIds))await t.test(name+' uses only its actual country inventory and native itinerary links',async()=>{
            const scene=COUNTRY_SCENES[id];await scene.loadDestinations();
            assert.equal(scene.region,'north-america');assert.equal(scene.countryId,id);assert.deepEqual(scene.artworkSize,[1536,1024]);
            assert.match(scene.artworkUrl,new RegExp(artworkFiles[id]+'\\.png'));assert.match(SCENE_ASSETS[id],new RegExp(artworkFiles[id]+'\\.png'));
            assert.equal(requests.at(-1).url.split('/').at(-1),name,'existing country API filter is reused');
            assert.deepEqual(scene.destinations.map(d=>d.slug).sort(),rows(name).map(d=>d.slug).sort());
            const count=requests.length;await scene.loadDestinations();assert.equal(requests.length,count,'successful inventory is reused');
            const regions=[];
            for(const destination of scene.destinations)for(const a of destination.hitAreas){const b=bounds(a);assert.ok(b.l>=0&&b.r<=1&&b.t>=0&&b.b<=1);regions.push({...b,id:destination.id});}
            for(const a of regions)for(const b of regions)if(a.id!==b.id)assert.ok(!(a.l<b.r&&b.l<a.r&&a.t<b.b&&b.t<a.b),'logical destinations remain distinct');
            for(const lang of ['en','fr']){
                await i18n.changeLanguage(lang);for(const key of [...Object.values(scene.keys),...Object.values(REGION_SCENES['north-america'].keys)])assert.notEqual(i18n.t(key),key);
                const doc=new JSDOM(renderToStaticMarkup(React.createElement(Layer,{destinations:scene.destinations,navLabelKey:scene.keys.nav,artworkSize:scene.artworkSize}))).window.document;
                assert.equal(doc.querySelectorAll('a').length,rows(name).length);
                for(const d of scene.destinations){const link=doc.querySelector(`[data-destination="${d.id}"]`);assert.equal(link.getAttribute('href'),'/itinerary/'+d.slug);assert.equal(link.getAttribute('aria-label'),`${i18n.t(d.labelKey)} — ${i18n.t('homeMagazine.atlas.viewItinerary')}`);assert.notEqual(i18n.t(d.labelKey),d.labelKey);assert.equal(link.querySelectorAll('a,button,[tabindex]').length,0);}
            }
        });
        await t.test('artwork without a real itinerary stays inert and slugs come from the API',async()=>{
            api.defaults.adapter=async config=>({config,status:200,headers:{},data:[{country:'Mexico',city:'Oaxaca',slug:'updated-official-api-slug'}]});
            const {loadNorthAmericaCountry}=await vite.ssrLoadModule('/src/components/home/atlas/northAmericaCountryScenes.js');
            const result=await loadNorthAmericaCountry('mexico');assert.deepEqual(result.destinations.map(d=>[d.id,d.slug]),[['oaxaca','updated-official-api-slug']]);
        });
    } finally {if(api)api.defaults.adapter=adapter;await i18n.changeLanguage('en');await vite.close();}
});

test('North America country swaps retain covered locking, return navigation, reduced motion and image recovery',async()=>{
    for(const reduced of [false,true]){
        let broken=false,controller;const scenes=['north-america','canada','united-states','mexico'],seen=[];
        controller=createAtlasSceneTransition({scenes,initialScene:'north-america',loadArtwork:async()=>{if(broken)throw Error('image unavailable');return {};},loadCloud:async()=>{},wait:async()=>{},
            swapScene:async scene=>{assert.equal(controller.getState().phase,'covered');assert.equal(await controller.go('north-america'),false);seen.push(scene);},onScene:()=>{},onPhase:()=>{},onError:()=>{},onComplete:()=>{}});
        for(const scene of scenes.slice(1)){assert.equal(await controller.go(scene,reduced),true);assert.equal(await controller.go('north-america',reduced),true);}
        assert.equal(seen.length,6);broken=true;assert.equal(await controller.go('canada',reduced),false);assert.equal(controller.getState().scene,'north-america');assert.equal(controller.getState().busy,false);
        broken=false;assert.equal(await controller.go('canada',reduced),true);
    }
});

test('Mexico hotspots: every painted pin, plate and landmark opens its own API itinerary', async () => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    let api,adapter;
    try{
        await vite.ssrLoadModule('/src/i18n.js');
        api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>({config,status:200,headers:{},data:rows('Mexico')});
        const {loadNorthAmericaCountry}=await vite.ssrLoadModule('/src/components/home/atlas/northAmericaCountryScenes.js');
        const {destinations}=await loadNorthAmericaCountry('mexico');
        assert.deepEqual(Object.fromEntries(destinations.map(d=>[d.id,d.slug])),{
            guanajuato:'3-days-guanajuato-colour-below-and-above','san-miguel':'3-days-san-miguel-held-by-light-and-craft',
            'mexico-city':'4-days-mexico-city-ancient-ground-living-density',oaxaca:'4-days-oaxaca-ritual-flavour-and-continuity',
            merida:'4-days-merida-stone-shade-and-maya-continuity',tulum:'3-days-tulum-ruins-light-and-fragile-balance'});
        // Links are pills (border-radius clamps to half the height), so a hit must fall inside the pill, not just the box.
        const px=a=>{const w=a.hitArea.width*1536,h=a.hitArea.height*1024,l=a.artworkPosition.x*1536-w/2,t=a.artworkPosition.y*1024-h/2;return {l,t,r:l+w,b:t+h,h};};
        const inPill=(a,x,y)=>{const b=px(a),r=b.h/2,cy=b.t+r;if(y<b.t||y>b.b||x<b.l||x>b.r)return false;const cx=Math.min(Math.max(x,b.l+r),b.r-r);return Math.hypot(x-cx,y-cy)<=r;};
        const target=(x,y)=>destinations.filter(d=>d.hitAreas.some((a,i)=>i===0?inPill(a,x,y):(()=>{const b=px(a);return x>=b.l&&x<=b.r&&y>=b.t&&y<=b.b;})()));
        // Painted pin centres (with their ~6px radius) and visible plate/landmark points, measured on the approved artwork.
        const probes={guanajuato:[[638,478],[695,490],[640,405]],'san-miguel':[[737,519],[825,529],[790,455]],'mexico-city':[[771,653],[832,665],[795,605]],
            oaxaca:[[924,788],[970,800],[970,740]],merida:[[1288,546],[1330,555],[1285,605]],tulum:[[1410,627],[1450,637],[1442,594]]};
        for(const [id,points] of Object.entries(probes))for(const [x,y] of points)for(const [dx,dy] of [[0,0],[-5,0],[0,-5],[0,5]]){
            const hits=target(x+dx,y+dy).map(d=>d.id);
            assert.deepEqual(hits,[id],`${id} point ${x+dx},${y+dy} must open only ${id}`);
        }
    }finally{if(api)api.defaults.adapter=adapter;await vite.close();}
});
