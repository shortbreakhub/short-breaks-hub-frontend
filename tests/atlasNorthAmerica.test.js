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

test('North America reuses deferred region loading, native links and EN/FR labels', async () => {
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
                assert.equal(sceneForCountry(d.id),undefined,'country uses existing browse route, not a new story map');
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
