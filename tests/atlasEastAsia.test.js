import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CHINA_DESTINATIONS} from '../src/components/home/atlas/chinaDestinations.js';
import {JAPAN_DESTINATIONS} from '../src/components/home/atlas/japanDestinations.js';
import {SOUTH_KOREA_DESTINATIONS} from '../src/components/home/atlas/southkoreaDestinations.js';
import {MONGOLIA_DESTINATIONS} from '../src/components/home/atlas/mongoliaDestinations.js';
import {TAIWAN_DESTINATIONS} from '../src/components/home/atlas/taiwanDestinations.js';
import {HONG_KONG_DESTINATIONS} from '../src/components/home/atlas/hongkongDestinations.js';
import {MACAU_DESTINATIONS} from '../src/components/home/atlas/macauDestinations.js';
import {createAtlasSceneTransition} from '../src/components/home/atlas/atlasSceneTransition.js';
const DESTINATIONS = {'china':CHINA_DESTINATIONS, 'japan':JAPAN_DESTINATIONS, 'south-korea':SOUTH_KOREA_DESTINATIONS, 'mongolia':MONGOLIA_DESTINATIONS, 'taiwan':TAIWAN_DESTINATIONS, 'hong-kong':HONG_KONG_DESTINATIONS, 'macau':MACAU_DESTINATIONS};
// Independent literal contract: verified against real official country/detail bootstrap.
const OFFICIAL = {
    "china": {
        "beijing": "4-days-beijing-where-history-sets-the-measure",
        "shanghai": "4-days-shanghai-where-the-future-never-waits",
        "xian": "3-days-xian-where-the-road-begins-inward",
        "chengdu": "3-days-chengdu-where-life-slows-to-stay",
        "guilin": "3-days-guilin-where-the-land-leans-into-water",
        "hangzhou": "3-days-hangzhou-where-water-teaches-patience",
        "guangzhou": "3-days-guangzhou-where-rivers-carry-everyday-life",
        "dengfeng": "2-days-dengfeng-where-discipline-finds-stillness",
        "changzhou": "3-day-changzhou-alley-lanterns-and-pagoda-light"
    },
    "japan": {
        "tokyo": "4-days-tokyo-where-order-holds-the-motion",
        "kyoto": "3-days-kyoto-where-quiet-learns-to-last",
        "osaka": "3-days-osaka-where-appetite-leads-the-way",
        "fukuoka": "3-days-fukuoka-where-the-city-feeds-you-gently",
        "hiroshima": "3-days-hiroshima-where-memory-makes-space-for-life",
        "kanazawa": "3-days-kanazawa-where-craft-sets-the-pace",
        "hakone": "2-days-hakone-where-steam-slows-the-thoughts",
        "nara": "2-days-nara-where-history-walks-beside-you",
        "fujiyoshida": "2-days-fujiyoshida-where-the-mountain-sets-the-distance"
    },
    "south-korea": {
        "seoul": "4-days-seoul-where-history-keeps-up-with-speed",
        "busan": "3-days-busan-where-the-city-breathes-outward",
        "gyeongju": "3-days-gyeongju-where-history-rests-in-the-open",
        "jeonju": "2-days-jeonju-where-flavor-keeps-history-close"
    },
    "mongolia": {
        "ulaanbaatar": "3-days-ulaanbaatar-where-the-city-meets-the-steppe",
        "karakorum": "2-days-karakorum-where-empire-left-no-walls",
        "terelj": "2-days-terelj-where-the-land-opens-you"
    },
    "taiwan": {
        "taipei": "4-days-taipei-where-everyday-life-feels-kind",
        "tainan": "3-days-tainan-where-time-stays-to-eat-and-remember",
        "taichung": "3-days-taichung-where-balance-finds-its-form",
        "kaohsiung": "3-days-kaohsiung-where-the-city-turns-toward-the-light",
        "hualien": "3-days-hualien-where-the-land-speaks-first"
    },
    "hong-kong": {
        "hong-kong": "4-days-hong-kong-where-the-city-rises-and-folds-back"
    },
    "macau": {
        "macau": "3-days-macau-where-time-changes-language"
    }
};
const LOCKED_HASHES = {
    "china": "ac543e283c7a8f951180b3ca07b846efe779b58b4de92f2aba9782a6f0cc1064",
    "japan": "0b10cd1950b0e01a0a76146b9b4f03374008da4e5ecfa92a9482d6a855c21c67",
    "south-korea": "b950c0a8d2f1d2d0be1338e8f1415577aaf432d94c0ad7b15ed9c571d08705da",
    "mongolia": "ec09308bbf942f06f698242c073584d0245cb05b11946de3054c0923832e0498",
    "taiwan": "46e5ca72c86b735ab8a3553694137a9fceecc51e5947081428c1ee8211adc674",
    "hong-kong": "338a214aac7c5a0754733357fc25ac7666385446775e4bb0d6fc736589a29d10",
    "macau": "56e526082a0d41de260cd5440b106abd28154d13628d57cff4a05a7e9fe6acab"
};
const CONTEXT_POINTS = {china:[[50,50],[1310,330]],japan:[[50,50],[310,333]],'south-korea':[[50,50],[480,73]],mongolia:[[50,50],[1400,824]],taiwan:[[50,50],[150,350]],'hong-kong':[[50,50],[747,125]],macau:[[225,124],[150,550]]};
const bounds = area => ({left: area.artworkPosition.x-area.hitArea.width/2, right: area.artworkPosition.x+area.hitArea.width/2,
    top: area.artworkPosition.y-area.hitArea.height/2, bottom: area.artworkPosition.y+area.hitArea.height/2});
const bootstrap = file => JSON.parse(readFileSync(file,'utf8').match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

for (const [country, destinations] of Object.entries(DESTINATIONS)) {
    test(`${country}: locked artwork and exact official inventory`, () => {
        const png=readFileSync(`src/assets/atlas/countries/${country}/${country}-atlas.png`);
        assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);
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
        for(const [x,y] of CONTEXT_POINTS[country])assert.ok(!regions.some(r=>x/1536>=r.left&&x/1536<=r.right&&y/1024>=r.top&&y/1024<=r.bottom),'decorative context stays inert');
    });
    test(`${country}: same covered-only transition, Back and failure rollback`, async () => {
        const swaps=[];let controller;
        const scenes=['east-asia',...Object.keys(DESTINATIONS)];
        controller=createAtlasSceneTransition({scenes,initialScene:'east-asia',loadArtwork:async scene=>scene,loadCloud:async()=>{},wait:async()=>{},
            swapScene:async scene=>swaps.push([scene,controller.getState().phase]),onPhase:()=>{},onScene:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await controller.go(country),true);assert.equal(await controller.go('east-asia'),true);
        assert.deepEqual(swaps,[[country,'covered'],['east-asia','covered']]);
        const failed=createAtlasSceneTransition({scenes,initialScene:'east-asia',loadArtwork:async()=>{throw Error('Image unavailable')},loadCloud:async()=>{},wait:async()=>{},
            swapScene:async()=>assert.fail('unloaded art must never swap'),onPhase:()=>{},onScene:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await failed.go(country),false);assert.deepEqual(failed.getState(),{scene:'east-asia',phase:'idle',busy:false});
    });
}

test('seven East Asia scenes provide 32 localized native links and on-demand artwork', async () => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},
        optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        const {COUNTRY_SCENES,sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        assert.equal(Object.values(DESTINATIONS).flat().length,32);
        assert.equal(Object.values(COUNTRY_SCENES).filter(scene=>scene.region==='east-asia').length,7);
        for(const language of ['en','fr']){
            await i18n.changeLanguage(language);
            const stage=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:'east-asia'}))).window.document;
            for(const [country,destinations] of Object.entries(DESTINATIONS)){
                const scene=COUNTRY_SCENES[country];assert.equal(sceneForCountry(country),country);
                assert.match(SCENE_ASSETS[country],new RegExp(`${country}-atlas`));assert.equal(scene.region,'east-asia');
                const preview=stage.querySelector(`.atlas-${country}-preview`);
                assert.equal(preview.getAttribute('loading'),'lazy');assert.equal(preview.hasAttribute('hidden'),true);
                for(const key of Object.values(scene.keys))assert.notEqual(i18n.t(key),key,`${language}: ${key} exists`);
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

// Regional geography is not a country inventory: North Korea and scenery are inert.
test('East Asia regional layer exposes exactly seven countries and immutable artwork', async()=>{
    const {EAST_ASIA_DESTINATIONS}=await import('../src/components/home/atlas/eastAsiaDestinations.js');
    assert.deepEqual(EAST_ASIA_DESTINATIONS.map(d=>d.id),Object.keys(DESTINATIONS));
    const png=readFileSync('src/assets/atlas/east-asia/east-asia-atlas.png');
    assert.equal(createHash('sha256').update(png).digest('hex'),'6e6630ee7f2d99edf2aeafaeead31d01040ca52f8002d28e1b684c4080352e42');
    for(const point of [[1080/1536,295/1024],[1450/1536,780/1024]]){
        for(const d of EAST_ASIA_DESTINATIONS)for(const area of d.hitAreas){const b=bounds(area);
            assert.ok(!(point[0]>=b.left&&point[0]<=b.right&&point[1]>=b.top&&point[1]<=b.bottom),'North Korea/ocean stays inactive');}
    }
});
