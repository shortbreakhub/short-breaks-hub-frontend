import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {GERMANY_DESTINATIONS} from '../src/components/home/atlas/germanyDestinations.js';
import {GREECE_DESTINATIONS} from '../src/components/home/atlas/greeceDestinations.js';
import {ITALY_DESTINATIONS} from '../src/components/home/atlas/italyDestinations.js';
import {NETHERLANDS_DESTINATIONS} from '../src/components/home/atlas/netherlandsDestinations.js';
import {SWITZERLAND_DESTINATIONS} from '../src/components/home/atlas/switzerlandDestinations.js';
import {createAtlasSceneTransition} from '../src/components/home/atlas/atlasSceneTransition.js';
const DESTINATIONS = {germany: GERMANY_DESTINATIONS, greece: GREECE_DESTINATIONS,
    italy: ITALY_DESTINATIONS, netherlands: NETHERLANDS_DESTINATIONS, switzerland: SWITZERLAND_DESTINATIONS};
// Independent literal contract: verified against real official country/detail bootstrap.
const OFFICIAL = {
    "germany": {
        "hamburg": "3-days-hamburg-where-distance-creates-clarity",
        "berlin": "4-days-berlin-where-history-refuses-to-stay-silent",
        "dresden": "3-days-dresden-where-rebuilding-became-remembrance",
        "cologne": "3-days-cologne-where-continuity-outlasts-destruction",
        "heidelberg": "2-days-heidelberg-where-romance-learns-restraint",
        "munich": "3-days-munich-where-tradition-makes-room-to-breathe"
    },
    "greece": {
        "thessaloniki": "3-days-thessaloniki-where-layers-gather-around-the-table",
        "athens": "4-days-athens-where-every-road-begins",
        "santorini": "3-days-santorini-where-light-erases-the-clock",
        "crete": "4-days-crete-where-the-land-remembers-longer",
        "rhodes": "3-days-rhodes-where-walls-learned-to-endure"
    },
    "italy": {
        "milan": "3-days-milan-where-precision-sets-the-tone",
        "venice": "3-days-venice-where-the-city-floats-on-patience",
        "florence": "3-days-florence-where-proportion-teaches-calm",
        "rome": "4-days-rome-where-time-refuses-to-move-on",
        "naples": "3-days-naples-where-life-stands-too-close",
        "palermo": "4-days-sicily-where-every-civilization-stayed-awhile"
    },
    "netherlands": {
        "haarlem": "2-days-haarlem-where-craft-feels-enough",
        "amsterdam": "4-days-amsterdam-where-water-teaches-balance",
        "the-hague": "3-days-the-hague-where-power-speaks-softly",
        "utrecht": "2-days-utrecht-where-closeness-creates-clarity",
        "rotterdam": "3-days-rotterdam-where-the-city-decided-to-start-again"
    },
    "switzerland": {
        "zurich": "3-days-zurich-precision-without-coldness",
        "lucerne": "2-days-lucerne-lake-bridge-and-alignment",
        "bern": "2-days-bern-continuity-along-the-bend",
        "interlaken": "3-days-interlaken-exposed-to-scale",
        "geneva": "3-days-geneva-water-diplomacy-and-balance",
        "zermatt": "3-days-zermatt-altitude-silence-and-effort"
    }
};
const LOCKED_HASHES = {
    "germany": "5a9dad915c7078ca9cb215e59a4e3f68c0ca2475b716f0717dc5709353eb703d",
    "greece": "d0f7a132a77d32a69686911f3ea08fe622e51cb1aab21e52f6b23f56280c9066",
    "italy": "24987f0978b87cb433509a3b0fad5b22d956ae38145982437c723beac3909e48",
    "netherlands": "8e0fd2bfaba90ba62dc7012b71f8fc3afdbdc3f2e4aa056ee90b51bd06bdd1ca",
    "switzerland": "119332c17778f214953ad054dc6b35143e42274ff609f557fc8d162b14e46612"
};
const CONTEXT_POINTS = {germany: [[50,50],[1450,400]], greece: [[50,50],[1450,230]],
    italy: [[50,50],[450,700]], netherlands: [[50,50],[1400,300]], switzerland: [[50,50],[1450,200]]};
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
            assert.equal(detail.slug,d.slug);assert.equal(detail.country.toLowerCase(),country);
            assert.equal(d.labelKey,`homeMagazine.atlas.${country}Places.${d.id}`);
            assert.ok(readFileSync(`src/components/home/atlas/${country}Destinations.js`,'utf8').includes(`'${d.slug}'`));
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
        const scenes=['europe','uk','france','spain','portugal',...Object.keys(DESTINATIONS)];
        controller=createAtlasSceneTransition({scenes,loadArtwork:async scene=>scene,loadCloud:async()=>{},wait:async()=>{},
            swapScene:async scene=>swaps.push([scene,controller.getState().phase]),onPhase:()=>{},onScene:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await controller.go(country),true);assert.equal(await controller.go('europe'),true);
        assert.deepEqual(swaps,[[country,'covered'],['europe','covered']]);
        const failed=createAtlasSceneTransition({scenes,loadArtwork:async()=>{throw Error('Image unavailable')},loadCloud:async()=>{},wait:async()=>{},
            swapScene:async()=>assert.fail('unloaded art must never swap'),onPhase:()=>{},onScene:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await failed.go(country),false);assert.deepEqual(failed.getState(),{scene:'europe',phase:'idle',busy:false});
    });
}

test('all nine country scenes use one generic layer; five new scenes have localized native links and on-demand previews', async () => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},
        optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        const {COUNTRY_SCENES,sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        assert.equal(Object.keys(COUNTRY_SCENES).length,9);
        for(const language of ['en','fr']){
            await i18n.changeLanguage(language);
            const stage=new JSDOM(renderToStaticMarkup(React.createElement(Stage))).window.document;
            for(const [country,destinations] of Object.entries(DESTINATIONS)){
                const scene=COUNTRY_SCENES[country];assert.equal(sceneForCountry(country),country);
                assert.match(SCENE_ASSETS[country],new RegExp(`${country}-atlas`));
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
