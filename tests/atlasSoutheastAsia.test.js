import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CAMBODIA_DESTINATIONS} from '../src/components/home/atlas/cambodiaDestinations.js';
import {INDONESIA_DESTINATIONS} from '../src/components/home/atlas/indonesiaDestinations.js';
import {LAOS_DESTINATIONS} from '../src/components/home/atlas/laosDestinations.js';
import {MALAYSIA_DESTINATIONS} from '../src/components/home/atlas/malaysiaDestinations.js';
import {MYANMAR_DESTINATIONS} from '../src/components/home/atlas/myanmarDestinations.js';
import {PHILIPPINES_DESTINATIONS} from '../src/components/home/atlas/philippinesDestinations.js';
import {SINGAPORE_DESTINATIONS} from '../src/components/home/atlas/singaporeDestinations.js';
import {THAILAND_DESTINATIONS} from '../src/components/home/atlas/thailandDestinations.js';
import {VIETNAM_DESTINATIONS} from '../src/components/home/atlas/vietnamDestinations.js';
import {createAtlasSceneTransition} from '../src/components/home/atlas/atlasSceneTransition.js';
const DESTINATIONS = {'cambodia':CAMBODIA_DESTINATIONS, 'indonesia':INDONESIA_DESTINATIONS, 'laos':LAOS_DESTINATIONS, 'malaysia':MALAYSIA_DESTINATIONS, 'myanmar':MYANMAR_DESTINATIONS, 'philippines':PHILIPPINES_DESTINATIONS, 'singapore':SINGAPORE_DESTINATIONS, 'thailand':THAILAND_DESTINATIONS, 'vietnam':VIETNAM_DESTINATIONS};
// Literal inventory verified independently against production detail data before wiring.
const OFFICIAL = {
    "cambodia": {
        "siem-reap": "4-days-siem-reap-where-stone-remembers-light",
        "phnom-penh": "3-days-phnom-penh-where-history-speaks-softly",
        "kampot": "3-days-kampot-where-river-time-drifts",
        "mondulkiri": "3-days-mondulkiri-where-the-land-opens-wide"
    },
    "indonesia": {
        "bali": "5-days-bali-where-rituals-meet-the-tide",
        "jakarta": "3-days-jakarta-beneath-the-surface-rhythm",
        "yogyakarta": "4-days-yogyakarta-where-ancient-stories-still-walk",
        "bandung": "3-days-bandung-where-cool-air-carries-ideas"
    },
    "laos": {
        "luang-prabang": "4-days-luang-prabang-where-mornings-arrive-quietly",
        "vientiane": "3-days-vientiane-where-capital-life-moves-softly",
        "vang-vieng": "3-days-vang-vieng-where-the-land-breathes-wide"
    },
    "malaysia": {
        "kuala-lumpur": "3-days-kuala-lumpur-towers-temples-and-street-life",
        "george-town": "3-days-penang-heritage-lanes-and-hawker-smoke",
        "langkawi": "4-days-langkawi-sea-breezes-and-slow-horizons",
        "malacca": "2-days-malacca-river-stories-and-colonial-echoes",
        "ipoh": "2-days-ipoh-white-coffee-and-limestone-quiet",
        "johor-bahru": "2-days-johor-bahru-food-malls-and-border-energy"
    },
    "myanmar": {
        "yangon": "4-days-yangon-where-gold-catches-the-light",
        "mandalay": "4-days-mandalay-where-tradition-stands-its-ground",
        "bagan": "3-days-bagan-where-the-earth-holds-the-sky"
    },
    "philippines": {
        "manila": "4-days-manila-where-history-refuses-to-fade",
        "cebu": "4-days-cebu-where-journeys-branch-outward",
        "palawan": "4-days-palawan-where-water-forgets-the-world",
        "bohol": "3-days-bohol-where-the-land-shifts-softly"
    },
    "singapore": {
        "singapore": "4-days-singapore-where-the-city-breathes-in-layers"
    },
    "thailand": {
        "bangkok": "4-days-bangkok-temples-markets-and-city-life",
        "chiang-mai": "4-days-chiang-mai-temples-mountains-and-slow-north",
        "pattaya": "3-days-pattaya-coastlines-islands-and-evening-lights",
        "chiang-rai": "3-days-chiang-rai-where-art-meets-stillness",
        "pai": "3-days-pai-where-the-road-slows-down",
        "sukhothai": "2-days-sukhothai-where-kingdoms-breathe-again"
    },
    "vietnam": {
        "ho-chi-minh-city": "4-days-ho-chi-minh-city-where-the-city-never-settles",
        "hoi-an": "4-days-hoi-an-where-lanterns-hold-the-evening",
        "hue": "3-days-hue-where-empires-linger-in-silence",
        "hanoi": "4-days-hanoi-where-stories-circle-back",
        "ha-long-bay": "3-days-ha-long-bay-where-stone-rises-from-water"
    }
};
const LOCKED_HASHES = {
    "cambodia": "93485b2858a3dccc63ef8ed5cae1b7b91943b36df64b9509cb3bc926df95f71f",
    "indonesia": "3d137a24fd291d9a8e77240bb3c339f44ed97f22cf73b0a9d6c36e1028832bf1",
    "laos": "1b585df0e324da01fce7b9ff74a8922b91d6d02e5989961a0fde5cba0be4bda7",
    "malaysia": "5216d840e4b8f19b655ded93f6b5a3d35b96c4307890a98fa3ddcae975e98c75",
    "myanmar": "377a93118f5079b9bad245d7c1d7058e538edecb8152b0b9e0a5e1dc0942539f",
    "philippines": "012d48b757a293cff34846317da77357a43b392d4f0135b432fb3b6586eaf58f",
    "singapore": "ca5ffded9c121939261400261553607055cad0f8220af1976e7f1f164151c1ae",
    "thailand": "28ced234ed04c2e6ade6f314c81f992981d35c03ef3b20ba0931b79d41be1a5b",
    "vietnam": "1e6fc2e273f45838b9824ea21c7234e5e48d7280d5f045b433eb64bff24fc240"
};
const CONTEXT_POINTS = {"cambodia": [[220, 400], [1400, 650]], "indonesia": [[1300, 820], [470, 310]], "laos": [[50, 400]], "malaysia": [[1230, 420], [690, 780]], "myanmar": [[1220, 450], [650, 70]], "philippines": [[190, 440], [1500, 660]], "singapore": [[1300, 140], [1100, 800]], "thailand": [[480, 300], [1300, 500]], "vietnam": [[490, 450], [750, 620]]};
const bounds = area => ({left: area.artworkPosition.x-area.hitArea.width/2, right: area.artworkPosition.x+area.hitArea.width/2,
    top: area.artworkPosition.y-area.hitArea.height/2, bottom: area.artworkPosition.y+area.hitArea.height/2});
const bootstrap = file => JSON.parse(readFileSync(file,'utf8').match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

for (const [country, destinations] of Object.entries(DESTINATIONS)) {
    test(`${country}: locked artwork and exact official inventory`, () => {
        const png=readFileSync(`src/assets/atlas/countries/${country}/${country}-atlas.png`);
        assert.equal(png.readUInt32BE(16),country==='cambodia'||country==='indonesia'||country==='laos'?1536:1672);assert.equal(png.readUInt32BE(20),country==='cambodia'||country==='indonesia'||country==='laos'?1024:941);
        assert.equal(createHash('sha256').update(png).digest('hex'),LOCKED_HASHES[country]);
        assert.deepEqual(Object.fromEntries(destinations.map(d=>[d.id,d.slug])),OFFICIAL[country]);
        const inventory=bootstrap(`dist/browse/${country}/index.html`);
        assert.deepEqual(inventory.items.map(d=>d.slug).sort(),Object.values(OFFICIAL[country]).sort());
        for(const d of destinations){
            const detail=bootstrap(`dist/itinerary/${d.slug}/index.html`).detail;
            assert.equal(detail.slug,d.slug);assert.equal(detail.country.toLowerCase().replaceAll(' ','-'),country);
            assert.equal(d.labelKey,`homeMagazine.atlas.${country.replaceAll('-','')}Places.${d.id}`);
            assert.ok(readFileSync(`src/components/home/atlas/${country.replaceAll('-','')}Destinations.js`,'utf8').includes(`'${d.slug}'`));
        }
    });
    test(`${country}: artwork-relative landmarks/plates stay bounded, distinct and clear of decorative context`, () => {
        const regions=[];
        for(const d of destinations){
            assert.equal(d.hitAreas[0].kind,'landmark');assert.equal(d.hitAreas.filter(a=>a.kind==='plate').length,1);
            for(const a of d.hitAreas){
                const b=bounds(a);assert.ok(a.hitArea.width>0&&a.hitArea.height>0);
                assert.ok(b.left>=0&&b.right<=1&&b.top>=0&&b.bottom<=1,`${d.id}/${a.id} stays in artwork`);
                regions.push({destination:d.id,id:a.id,...b});
            }
        }
        assert.equal(new Set(regions.map(r=>r.id)).size,regions.length);
        for(const a of regions)for(const b of regions){
            if(a.destination>=b.destination)continue;
            assert.equal(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom,false,`${a.id} overlaps ${b.id}`);
        }
        for(const [x,y] of CONTEXT_POINTS[country])assert.ok(!regions.some(r=>x/(country==='cambodia'||country==='indonesia'||country==='laos'?1536:1672)>=r.left&&x/(country==='cambodia'||country==='indonesia'||country==='laos'?1536:1672)<=r.right&&y/(country==='cambodia'||country==='indonesia'||country==='laos'?1024:941)>=r.top&&y/(country==='cambodia'||country==='indonesia'||country==='laos'?1024:941)<=r.bottom),'decorative context stays inert');
    });
    test(`${country}: same covered-only transition, Back and failure rollback`, async () => {
        const swaps=[];let controller;
        const scenes=['southeast-asia',...Object.keys(DESTINATIONS)];
        controller=createAtlasSceneTransition({scenes,initialScene:'southeast-asia',loadArtwork:async scene=>scene,loadCloud:async()=>{},wait:async()=>{},
            swapScene:async scene=>swaps.push([scene,controller.getState().phase]),onPhase:()=>{},onScene:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await controller.go(country),true);assert.equal(await controller.go('southeast-asia'),true);
        assert.deepEqual(swaps,[[country,'covered'],['southeast-asia','covered']]);
        const failed=createAtlasSceneTransition({scenes,initialScene:'southeast-asia',loadArtwork:async()=>{throw Error('Image unavailable')},loadCloud:async()=>{},wait:async()=>{},
            swapScene:async()=>assert.fail('unloaded art must never swap'),onPhase:()=>{},onScene:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await failed.go(country),false);assert.deepEqual(failed.getState(),{scene:'southeast-asia',phase:'idle',busy:false});
    });
}

test('nine Southeast Asia scenes provide 36 localized native links and on-demand artwork', async () => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},
        optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        const {COUNTRY_SCENES,sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {REGION_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        for(const country of Object.keys(DESTINATIONS)){assert.equal(SCENE_ASSETS[country],undefined,'new country URL descriptors stay deferred');assert.deepEqual(COUNTRY_SCENES[country].destinations,[],'new country geometry stays deferred');}
        await REGION_SCENES['southeast-asia'].loadDestinations();
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        assert.equal(Object.values(DESTINATIONS).flat().length,36);
        assert.equal(Object.values(COUNTRY_SCENES).filter(scene=>scene.region==='southeast-asia').length,9);
        for(const language of ['en','fr']){
            await i18n.changeLanguage(language);
            const stage=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:'southeast-asia'}))).window.document;
            for(const [country,destinations] of Object.entries(DESTINATIONS)){
                const scene=COUNTRY_SCENES[country];await scene.loadDestinations();assert.equal(sceneForCountry(country),country);
                assert.match(SCENE_ASSETS[country],new RegExp(`${country}-atlas`));assert.equal(scene.region,'southeast-asia');
                const preview=stage.querySelector(`.atlas-${country}-preview`);
                assert.equal(preview.getAttribute('loading'),'lazy');assert.equal(preview.hasAttribute('hidden'),true);
                for(const key of Object.values(scene.keys))assert.notEqual(i18n.t(key),key,`${language}: ${key} exists`);
                assert.equal(i18n.t('homeMagazine.atlas.malaysiaPlaces.george-town'),'George Town','official city name must not become Penang');
                const doc=new JSDOM(renderToStaticMarkup(React.createElement(Layer,{destinations:scene.destinations,navLabelKey:scene.keys.nav,map:null}))).window.document;
                assert.equal(doc.querySelector('nav').getAttribute('aria-label'),i18n.t(scene.keys.nav));
                assert.equal(doc.querySelectorAll('a').length,destinations.length);
                for(const d of destinations){
                    const link=doc.querySelector(`[data-destination="${d.id}"]`);
                    assert.equal(link.getAttribute('href'),`/itinerary/${OFFICIAL[country][d.id]}`);
                    assert.equal(link.getAttribute('aria-label'),`${i18n.t(d.labelKey)} — ${i18n.t('homeMagazine.atlas.viewItinerary')}`);
                    assert.equal(link.querySelectorAll('a,button,[tabindex]').length,0);
                    assert.equal(link.querySelectorAll('.atlas-itinerary-hit').length,d.hitAreas.length-1);
                    assert.equal(stage.querySelector(`[data-country="${country}"]`).getAttribute('href'),`/browse/${country}`);
                }
            }
        }
        const hook=readFileSync('src/components/home/atlas/useAtlasScene.js','utf8');
        const warmup=hook.slice(hook.indexOf('const preload=setTimeout'),hook.indexOf('},250);'));
        for(const country of Object.keys(DESTINATIONS))assert.doesNotMatch(warmup,new RegExp(country),'new art is not warmed up');
        const stageSource=readFileSync('src/components/home/AtlasStage.jsx','utf8');
        for(const country of Object.keys(DESTINATIONS))assert.doesNotMatch(stageSource,new RegExp(country),'no country-specific stage fork');
    } finally {await i18n.changeLanguage('en');await vite.close()}
});

test('Southeast Asia has exactly nine native country links; Brunei and Timor-Leste are inert', async()=>{
    const {SOUTHEAST_ASIA_DESTINATIONS}=await import('../src/components/home/atlas/southeastAsiaDestinations.js');
    assert.deepEqual(SOUTHEAST_ASIA_DESTINATIONS.map(d=>d.id),Object.keys(DESTINATIONS));
    const png=readFileSync('src/assets/atlas/southeast-asia/southeast-asia-atlas.png');
    assert.equal(createHash('sha256').update(png).digest('hex'),'968161fa998bfe2d622d100297d5b7fbc51376e3c8c4efef2fb7b65e9ed6e9cc');
    for(const point of [[885/1536,555/1024],[1160/1536,930/1024]]){
        for(const d of SOUTHEAST_ASIA_DESTINATIONS)for(const area of d.hitAreas){const b=bounds(area);
            assert.ok(!(point[0]>=b.left&&point[0]<=b.right&&point[1]>=b.top&&point[1]<=b.bottom),'inactive Brunei/Timor-Leste');}
    }
});

test('contain projection preserves source aspect ratio and responsive overlay alignment', async()=>{
    const {artworkFramePoint}=await import('../src/components/home/atlas/artworkFrame.js');
    for(const width of [850,600,358]){
        const height=width*2/3,size=[1672,941];
        const first=artworkFramePoint(0,0,width,height,size),last=artworkFramePoint(1,1,width,height,size);
        assert.equal(first.x,0);assert.ok(first.y>0);
        assert.ok(Math.abs((last.x-first.x)/(last.y-first.y)-1672/941)<1e-10);
        assert.deepEqual(artworkFramePoint(.5,.5,width,height,size),{x:width/2,y:height/2});
        const original=artworkFramePoint(.3,.4,width,height);
        assert.ok(Math.abs(original.x-width*.3)<1e-10&&Math.abs(original.y-height*.4)<1e-10,'Europe/East Asia projection unchanged');
    }
});

test("all locked Atlas PNGs match the pre-implementation hashes",()=>{
    const hashes={
    "src/assets/atlas/southeast-asia/southeast-asia-atlas.png": "968161fa998bfe2d622d100297d5b7fbc51376e3c8c4efef2fb7b65e9ed6e9cc",
    "src/assets/atlas/europe/europe-atlas.png": "feb60451ed034791c9cf6db3f366c316c5bc05bb9678bd5659a6084f763ee7e0",
    "src/assets/atlas/east-asia/east-asia-atlas.png": "6e6630ee7f2d99edf2aeafaeead31d01040ca52f8002d28e1b684c4080352e42",
    "src/assets/atlas/countries/spain/spain-atlas.png": "815fa0c3692352824b7acccda1b02a0d13ad2f3b4a2a2ac131e6e8d9b9ec25a6",
    "src/assets/atlas/countries/uk/uk-atlas.png": "3d7ba77fc12f4d6b1454c09a0b2ef2196dddf2c5370e164f830c38461e6b3bc4",
    "src/assets/atlas/countries/portugal/portugal_atlas.png": "0f3c32a3686dcea7f99a8e82e224c45ccac599b8762775ee668c2c659f204b2b",
    "src/assets/atlas/countries/hong-kong/hong-kong-atlas.png": "338a214aac7c5a0754733357fc25ac7666385446775e4bb0d6fc736589a29d10",
    "src/assets/atlas/countries/france/france-atlas.png": "ba1021e1cac38e82797b8b098004d701b7034d79a214ee163450ca6c6af9893d",
    "src/assets/atlas/countries/switzerland/switzerland-atlas.png": "119332c17778f214953ad054dc6b35143e42274ff609f557fc8d162b14e46612",
    "src/assets/atlas/countries/cambodia/cambodia-atlas.png": "93485b2858a3dccc63ef8ed5cae1b7b91943b36df64b9509cb3bc926df95f71f",
    "src/assets/atlas/countries/thailand/thailand-atlas.png": "28ced234ed04c2e6ade6f314c81f992981d35c03ef3b20ba0931b79d41be1a5b",
    "src/assets/atlas/countries/vietnam/vietnam-atlas.png": "1e6fc2e273f45838b9824ea21c7234e5e48d7280d5f045b433eb64bff24fc240",
    "src/assets/atlas/countries/greece/greece-atlas.png": "d0f7a132a77d32a69686911f3ea08fe622e51cb1aab21e52f6b23f56280c9066",
    "src/assets/atlas/countries/japan/japan-atlas.png": "0b10cd1950b0e01a0a76146b9b4f03374008da4e5ecfa92a9482d6a855c21c67",
    "src/assets/atlas/countries/taiwan/taiwan-atlas.png": "46e5ca72c86b735ab8a3553694137a9fceecc51e5947081428c1ee8211adc674",
    "src/assets/atlas/countries/netherlands/netherlands-atlas.png": "8e0fd2bfaba90ba62dc7012b71f8fc3afdbdc3f2e4aa056ee90b51bd06bdd1ca",
    "src/assets/atlas/countries/macau/macau-atlas.png": "56e526082a0d41de260cd5440b106abd28154d13628d57cff4a05a7e9fe6acab",
    "src/assets/atlas/countries/malaysia/malaysia-atlas.png": "5216d840e4b8f19b655ded93f6b5a3d35b96c4307890a98fa3ddcae975e98c75",
    "src/assets/atlas/countries/china/china-atlas.png": "ac543e283c7a8f951180b3ca07b846efe779b58b4de92f2aba9782a6f0cc1064",
    "src/assets/atlas/countries/myanmar/myanmar-atlas.png": "377a93118f5079b9bad245d7c1d7058e538edecb8152b0b9e0a5e1dc0942539f",
    "src/assets/atlas/countries/germany/germany-atlas.png": "5a9dad915c7078ca9cb215e59a4e3f68c0ca2475b716f0717dc5709353eb703d",
    "src/assets/atlas/countries/singapore/singapore-atlas.png": "ca5ffded9c121939261400261553607055cad0f8220af1976e7f1f164151c1ae",
    "src/assets/atlas/countries/mongolia/mongolia-atlas.png": "ec09308bbf942f06f698242c073584d0245cb05b11946de3054c0923832e0498",
    "src/assets/atlas/countries/laos/laos-atlas.png": "1b585df0e324da01fce7b9ff74a8922b91d6d02e5989961a0fde5cba0be4bda7",
    "src/assets/atlas/countries/italy/italy-atlas.png": "24987f0978b87cb433509a3b0fad5b22d956ae38145982437c723beac3909e48",
    "src/assets/atlas/countries/indonesia/indonesia-atlas.png": "3d137a24fd291d9a8e77240bb3c339f44ed97f22cf73b0a9d6c36e1028832bf1",
    "src/assets/atlas/countries/philippines/philippines-atlas.png": "012d48b757a293cff34846317da77357a43b392d4f0135b432fb3b6586eaf58f",
    "src/assets/atlas/countries/south-korea/south-korea-atlas.png": "b950c0a8d2f1d2d0be1338e8f1415577aaf432d94c0ad7b15ed9c571d08705da"
};
    for(const [path,expected]of Object.entries(hashes))assert.equal(createHash("sha256").update(readFileSync(path)).digest("hex"),expected,path);
});
