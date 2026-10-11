import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {artworkFramePoint} from '../src/components/home/atlas/artworkFrame.js';
import {createAtlasSceneTransition} from '../src/components/home/atlas/atlasSceneTransition.js';

// Genuine official country inventory fixtures; product code gets slugs from the API.
const inventory = {
    Brazil:[['Rio de Janeiro','4-days-rio-release-between-mountain-and-sea'],['São Paulo','4-days-sao-paulo-density-appetite-and-collision'],['Salvador','4-days-salvador-rhythm-faith-and-atlantic-memory'],['Barreirinhas & Atins','3-days-lencois-impermanence-in-light-and-water'],['Manaus & Amazon Rainforest','4-days-amazon-life-beyond-scale-and-control']],
    Argentina:[['Buenos Aires','4-days-buenos-aires-gesture-heat-and-memory'],['Mendoza','3-days-mendoza-patience-poured-under-the-andes'],['El Calafate & El Chaltén','5-days-patagonia-wind-distance-and-truth'],['Puerto Iguazú','2-days-iguazu-inevitability-in-motion']],
    Peru:[['Lima','4-days-lima-ocean-memory-and-living-flavour'],['Cusco','4-days-cusco-stone-altitude-and-ritual'],['Sacred Valley (Pisac, Ollantaytambo, Moray)','3-days-sacred-valley-alignment-work-and-breath'],['Machu Picchu','2-days-machu-picchu-exposure-effort-and-awe'],['Arequipa','3-days-arequipa-white-stone-and-volcanic-order']],
    Colombia:[['Bogotá','4-days-bogota-altitude-ideas-and-renewal'],['Medellín','4-days-medellin-stitching-a-city-back-together'],['Cartagena','3-days-cartagena-walls-heat-and-caribbean-memory'],['Salento & Cocora Valley','3-days-coffee-region-worked-land-and-green-rhythm']],
    Chile:[['Santiago','4-days-santiago-length-light-and-discipline'],['Valparaíso','3-days-valparaiso-vertical-life-in-colour'],['San Pedro de Atacama','3-days-atacama-absolute-dryness-and-sky'],['Torres del Paine National Park','4-days-torres-del-paine-form-wind-and-exposure']],
};
const names = ['Brazil','Argentina','Peru','Colombia','Chile'];
const rows = country => inventory[country].map(([city,slug])=>({country,city,slug}));
const bounds = a => ({l:a.artworkPosition.x-a.hitArea.width/2,r:a.artworkPosition.x+a.hitArea.width/2,t:a.artworkPosition.y-a.hitArea.height/2,b:a.artworkPosition.y+a.hitArea.height/2});

test('South America reuses deferred scenes, API country filtering, canonical links and EN/FR', async t => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    let api,adapter,requests=[],mode='ready';
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        const {REGION_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        const {COUNTRY_SCENES,sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        const region=REGION_SCENES['south-america'];
        await t.test('initial homepage never loads South America or country artwork/inventory',()=>{
            assert.equal(SCENE_ASSETS['south-america'],undefined);assert.deepEqual(region.destinations,[]);
            for(const name of names)assert.equal(SCENE_ASSETS[name.toLowerCase()],undefined);
            const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage))).window.document;
            assert.ok(doc.querySelector('option[value="south-america"]'));assert.equal(doc.querySelectorAll('img[src*="south-america-atlas"],img[src*="brazil-atlas"]').length,0);
            assert.equal(doc.querySelector('select').value,'europe');assert.equal(requests.length,0);
        });
        api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>{
            requests.push(config);const country=config.url.split('/').at(-1);
            if(mode==='error')throw new Error('fixture API failure');
            const data=mode==='empty'?[]:rows(country);
            // Foreign entries must never be used, even if their city matches an anchor.
            return {config,status:200,headers:{},data:[...data,...rows(country).map(r=>({...r,country:'Other country',slug:'foreign-test-fixture'}))]};
        };
        await region.loadDestinations();
        await t.test('regional scene exposes exactly five accessible countries with native browse fallbacks',()=>{
            assert.deepEqual(region.destinations.map(d=>d.country),names);assert.match(SCENE_ASSETS['south-america'],/south-america-atlas\.png/);
            const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:'south-america'}))).window.document;
            assert.equal(doc.querySelectorAll('.atlas-country').length,5);
            for(const name of names){const id=name.toLowerCase();assert.equal(sceneForCountry(id),id);assert.equal(doc.querySelector(`[data-country="${id}"]`).getAttribute('href'),'/browse/'+id);}
        });
        await t.test('failed country loads remain retryable and never produce fabricated empty maps',async()=>{
            const scene=COUNTRY_SCENES.brazil;mode='error';await assert.rejects(scene.loadDestinations(),/fixture API failure/);assert.equal(scene.artworkUrl,undefined);
            mode='empty';await assert.rejects(scene.loadDestinations(),/inventory unavailable/);assert.deepEqual(scene.destinations,[]);mode='ready';
        });
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        for(const name of names)await t.test(name+' uses only its actual country inventory and native itinerary links',async()=>{
            const id=name.toLowerCase(),scene=COUNTRY_SCENES[id];await scene.loadDestinations();
            assert.equal(scene.region,'south-america');assert.deepEqual(scene.artworkSize,[1536,1024]);assert.match(scene.artworkUrl,new RegExp(id+'-atlas\\.png'));
            assert.deepEqual(scene.destinations.map(d=>d.slug).sort(),rows(name).map(d=>d.slug).sort());
            const count=requests.length;await scene.loadDestinations();assert.equal(requests.length,count,'successful inventory is reused');
            const regions=[];
            for(const destination of scene.destinations)for(const a of destination.hitAreas){const b=bounds(a);assert.ok(b.l>=0&&b.r<=1&&b.t>=0&&b.b<=1);regions.push({...b,id:destination.id});}
            for(const a of regions)for(const b of regions)if(a.id!==b.id)assert.ok(!(a.l<b.r&&b.l<a.r&&a.t<b.b&&b.t<a.b),'logical destinations remain distinct');
            for(const lang of ['en','fr']){
                await i18n.changeLanguage(lang);for(const key of [...Object.values(scene.keys),...Object.values(region.keys)])assert.notEqual(i18n.t(key),key);
                const doc=new JSDOM(renderToStaticMarkup(React.createElement(Layer,{destinations:scene.destinations,navLabelKey:scene.keys.nav,artworkSize:scene.artworkSize}))).window.document;
                assert.equal(doc.querySelectorAll('a').length,rows(name).length);
                for(const d of scene.destinations){const link=doc.querySelector(`[data-destination="${d.id}"]`);assert.equal(link.getAttribute('href'),'/itinerary/'+d.slug);assert.equal(link.getAttribute('aria-label'),`${i18n.t(d.labelKey)} — ${i18n.t('homeMagazine.atlas.viewItinerary')}`);assert.equal(link.querySelectorAll('a,button,[tabindex]').length,0);}
            }
        });
        await t.test('slug changes come from the API rather than duplicated itinerary records',async()=>{
            api.defaults.adapter=async config=>({config,status:200,headers:{},data:[{country:'Chile',city:'Santiago',slug:'updated-official-api-slug'}]});
            const {loadSouthAmericaCountry}=await vite.ssrLoadModule('/src/components/home/atlas/southAmericaCountryScenes.js');
            const result=await loadSouthAmericaCountry('chile');assert.equal(result.destinations.length,1);assert.equal(result.destinations[0].slug,'updated-official-api-slug');
        });
    } finally {if(api)api.defaults.adapter=adapter;await i18n.changeLanguage('en');await vite.close();}
});

test('South America country swaps retain covered locking, return navigation, reduced motion and image recovery',async()=>{
    for(const reduced of [false,true]){
        let broken=false,controller;const scenes=['south-america',...names.map(n=>n.toLowerCase())],seen=[];
        controller=createAtlasSceneTransition({scenes,initialScene:'south-america',loadArtwork:async()=>{if(broken)throw Error('image unavailable');return {};},loadCloud:async()=>{},wait:async()=>{},
            swapScene:async scene=>{assert.equal(controller.getState().phase,'covered');assert.equal(await controller.go('south-america'),false);seen.push(scene);},onScene:()=>{},onPhase:()=>{},onError:()=>{},onComplete:()=>{}});
        for(const scene of scenes.slice(1)){assert.equal(await controller.go(scene,reduced),true);assert.equal(await controller.go('south-america',reduced),true);}
        assert.equal(seen.length,10);broken=true;assert.equal(await controller.go('brazil',reduced),false);assert.equal(controller.getState().scene,'south-america');assert.equal(controller.getState().busy,false);
        broken=false;assert.equal(await controller.go('brazil',reduced),true);
    }
});

test('South America uses the shared undistorted responsive artwork projection',()=>{
    for(const width of [1440,1024,768,390,320]){
        const height=width*2/3,center=artworkFramePoint(0.5,0.5,width,height,[1536,1024]);
        assert.equal(center.x,width/2);assert.equal(center.y,height/2);
        const a=artworkFramePoint(0,0,width,height),b=artworkFramePoint(1,1,width,height);
        assert.ok(Math.abs((b.x-a.x)/(b.y-a.y)-1.5)<1e-10);
    }
});

test('South America itinerary overlays preserve focus, native modified clicks and touch arm/disarm',async()=>{
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/'});
    const keys=['window','document','ResizeObserver','IS_REACT_ACT_ENVIRONMENT'];
    const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,ResizeObserver:class{observe(){}disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true});
    let root,api,adapter;
    try{
        await vite.ssrLoadModule('/src/i18n.js');
        api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>({config,status:200,headers:{},data:rows('Brazil')});
        const {loadSouthAmericaCountry}=await vite.ssrLoadModule('/src/components/home/atlas/southAmericaCountryScenes.js');
        const {destinations}=await loadSouthAmericaCountry('brazil');
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        const {createRoot}=await import('react-dom/client');root=createRoot(document.getElementById('root'));
        await React.act(async()=>root.render(React.createElement('div',{className:'atlas-paper'},React.createElement(Layer,{destinations,artworkSize:[1536,1024],navLabelKey:'homeMagazine.atlas.brazilDestinations'}))));
        const link=document.querySelector('[data-destination="rio"]');
        assert.equal(document.querySelectorAll('.atlas-itinerary').length,5);
        link.focus();assert.equal(document.activeElement,link);assert.equal(link.tabIndex,0);
        let prevented;
        document.addEventListener('click',event=>{prevented=event.defaultPrevented;event.preventDefault();});
        const pointer=type=>{const event=new window.Event('pointerdown',{bubbles:true});Object.assign(event,{pointerType:type,clientX:1,clientY:1});link.dispatchEvent(event);};
        const click=options=>link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:1,clientY:1,...options}));
        await React.act(async()=>{pointer('mouse');click({ctrlKey:true});});assert.equal(prevented,false,'modified desktop click remains native');
        await React.act(async()=>{pointer('touch');click();});assert.equal(prevented,true);assert.equal(link.dataset.revealed,'true');
        await React.act(async()=>document.body.dispatchEvent(new window.Event('pointerdown',{bubbles:true})));assert.equal(link.dataset.revealed,'false');
        await React.act(async()=>{pointer('touch');click();});assert.equal(prevented,true);
        await React.act(async()=>{pointer('touch');click();});assert.equal(prevented,false,'second touch follows the canonical native link');
        await React.act(async()=>link.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(link.dataset.revealed,'false');
    }finally{
        if(root)await React.act(async()=>root.unmount());if(api)api.defaults.adapter=adapter;await vite.close();dom.window.close();
        for(const key of keys){if(saved[key]===undefined)delete globalThis[key];else globalThis[key]=saved[key];}
    }
});
