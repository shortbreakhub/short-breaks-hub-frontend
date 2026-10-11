import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {artworkFramePoint} from '../src/components/home/atlas/artworkFrame.js';
import {createAtlasSceneTransition} from '../src/components/home/atlas/atlasSceneTransition.js';
const countries={'australia':'Australia','new-zealand':'New Zealand','fiji':'Fiji','french-polynesia':'French Polynesia','new-caledonia':'New Caledonia','papua-new-guinea':'Papua New Guinea','samoa':'Samoa','tonga':'Tonga','vanuatu':'Vanuatu'};
const counts={'australia':6,'new-zealand':7,'fiji':1,'french-polynesia':1,'new-caledonia':1,'papua-new-guinea':1,'samoa':1,'tonga':1,'vanuatu':1};
const bootstrap=file=>JSON.parse(readFileSync(file,'utf8').match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const fixtures=Object.fromEntries(Object.keys(countries).map(id=>[id,bootstrap(`dist/browse/${id}/index.html`).items.map(item=>({...item,city:bootstrap(`dist/itinerary/${item.slug}/index.html`).detail.city}))]));
const ssr=()=>createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
const inside=([x,y],polygon)=>{
    let hit=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
        const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
        if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
    }
    return hit;
};

test('Oceania resolves nine API-backed destinations with nine Country Story Maps',async t=>{
    const vite=await ssr();let api,adapter,requests=[],mode='ready';
    try{
        await vite.ssrLoadModule('/src/i18n.js');api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>{
            requests.push(config.url);if(mode==='error')throw Error('fixture failure');
            const id=decodeURIComponent(config.url.split('/').at(-1)).toLowerCase().replaceAll(' ','-');
            return {config,status:200,headers:{},data:mode==='empty'?[]:fixtures[id]};
        };
        const {REGION_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        const {COUNTRY_SCENES,sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
        const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        const scene=REGION_SCENES.oceania;
        await t.test('Oceania inventory and artwork are absent from initial homepage loading',()=>{
            assert.equal(SCENE_ASSETS.oceania,undefined);for(const id of Object.keys(countries))assert.equal(SCENE_ASSETS[id],undefined);assert.equal(requests.length,0);
            const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage))).window.document;
            assert.ok(doc.querySelector('option[value="oceania"]'));assert.equal(doc.querySelectorAll('img[src*="oceania-atlas"]').length,0);
        });
        await t.test('failed/empty API results block entry and remain retryable',async()=>{
            mode='error';await assert.rejects(scene.loadDestinations(),/fixture failure/);assert.equal(scene.artworkUrl,undefined);
            mode='empty';await assert.rejects(scene.loadDestinations(),/no official itineraries/);assert.deepEqual(scene.destinations,[]);mode='ready';
        });
        await scene.loadDestinations();
        await t.test('all nine regional countries open their Story Map, regardless of itinerary count',()=>{
            assert.deepEqual(scene.destinations.map(d=>d.id),Object.keys(countries));
            for(const d of scene.destinations){
                assert.equal(d.itineraryCount,counts[d.id]);assert.equal(d.slug,undefined);
                assert.equal(sceneForCountry(d.id),d.id);assert.equal(COUNTRY_SCENES[d.id].region,'oceania');
            }
            assert.equal(scene.destinations.some(d=>d.id==='solomon-islands'),false);
        });
        await t.test('EN/FR expose exactly one native accessible anchor per destination',async()=>{
            for(const lang of ['en','fr']){
                await i18n.changeLanguage(lang);for(const key of Object.values(scene.keys))assert.notEqual(i18n.t(key),key);
                const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:'oceania'}))).window.document;
                assert.equal(doc.querySelectorAll('.atlas-country').length,9);
                for(const d of scene.destinations){const link=doc.querySelector(`[data-country="${d.id}"]`);assert.equal(link.getAttribute('href'),'/browse/'+d.id);assert.equal(link.querySelectorAll('a,button,[tabindex]').length,0);assert.equal(link.getAttribute('aria-label'),`${i18n.t(d.labelKey)} — ${i18n.t('homeMagazine.atlas.countryExplore')}`);
                    if(d.slug){assert.match(link.getAttribute('style'),/pointer-events:none/);assert.equal(link.querySelectorAll('[style*="clip-path:polygon"]').length,d.hitAreas.length);}
                }
            }
        });
        for(const id of Object.keys(countries))await t.test(id+' reuses the existing lazy country layer and real slugs',async()=>{
            const country=COUNTRY_SCENES[id];await country.loadDestinations();assert.equal(country.destinations.length,counts[id]);assert.match(country.artworkUrl,new RegExp(id+'-atlas\\.png'));assert.equal(country.region,'oceania');
            assert.deepEqual(country.destinations.map(d=>d.slug).sort(),fixtures[id].map(i=>i.slug).sort());
            for(const lang of ['en','fr']){await i18n.changeLanguage(lang);for(const key of Object.values(country.keys))assert.notEqual(i18n.t(key),key);for(const d of country.destinations)assert.notEqual(i18n.t(d.labelKey),d.labelKey);}
            const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
            const doc=new JSDOM(renderToStaticMarkup(React.createElement(Layer,{destinations:country.destinations,navLabelKey:country.keys.nav}))).window.document;
            assert.equal(doc.querySelectorAll('a').length,counts[id]);
            if(counts[id]===1){
                const d=country.destinations[0],link=doc.querySelector('a');
                assert.equal(link.getAttribute('href'),'/itinerary/'+fixtures[id][0].slug);assert.match(link.getAttribute('style'),/pointer-events:none/);
                assert.equal(link.querySelectorAll('[style*="clip-path:polygon"]').length,d.hitAreas.length);
                assert.ok(d.hitAreas.every(a=>a.outline?.length>=4));
                for(const a of d.hitAreas)for(const [x,y]of a.outline){assert.ok(x>=0&&x<=1&&y>=0&&y<=1);for(const width of [1440,1024,768,390,320]){const p=artworkFramePoint(x,y,width,width*2/3);assert.ok(Math.abs(p.x-x*width)<1e-8);}}
            }
        });
    }finally{if(api)api.defaults.adapter=adapter;await i18n.changeLanguage('en');await vite.close();}
});

test('Oceania keeps covered transitions, reduced motion and failed-artwork recovery',async()=>{
    for(const reduced of [false,true]){
        let fail=false;const swaps=[],waits=[];
        const controller=createAtlasSceneTransition({initialScene:'oceania',scenes:['oceania','australia','new-zealand'],loadArtwork:async()=>{if(fail)throw Error('artwork failed');return {};},loadCloud:async()=>{},wait:async duration=>waits.push(duration),swapScene:async scene=>swaps.push(scene),onScene:()=>{},onPhase:()=>{},onError:()=>{},onComplete:()=>{}});
        assert.equal(await controller.go('australia',reduced),true);assert.equal(await controller.go('oceania',reduced),true);assert.deepEqual(swaps,['australia','oceania']);assert.deepEqual(waits.slice(0,3),reduced?[0,0,0]:[700,220,800]);
        fail=true;assert.equal(await controller.go('new-zealand',reduced),false);assert.equal(controller.getState().scene,'oceania');fail=false;assert.equal(await controller.go('new-zealand',reduced),true);
    }
});

test('single-itinerary country maps keep keyboard/native modifiers and touch arm-then-navigation',async()=>{
    const vite=await ssr(),dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/'});
    const keys=['window','document','ResizeObserver','IS_REACT_ACT_ENVIRONMENT'];
    const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,ResizeObserver:class{observe(){}disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true});
    let api,adapter,root;
    try{
        await vite.ssrLoadModule('/src/i18n.js');api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>({config,status:200,headers:{},data:fixtures[decodeURIComponent(config.url.split('/').at(-1)).toLowerCase().replaceAll(' ','-')]});
        const {loadOceaniaRegion}=await vite.ssrLoadModule('/src/components/home/atlas/oceaniaRegionalScene.js');
        const {inventory}=await loadOceaniaRegion();
        const {loadOceaniaCountry}=await vite.ssrLoadModule('/src/components/home/atlas/oceaniaCountryScenes.js');
        const {destinations}=loadOceaniaCountry('fiji',inventory.fiji);
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
        const {createRoot}=await import('react-dom/client');root=createRoot(document.getElementById('root'));
        let selected=0,prevented;
        await React.act(async()=>root.render(React.createElement('div',{className:'atlas-paper'},React.createElement(Layer,{destinations,navLabelKey:'homeMagazine.atlas.oceaniaDestinations',onCountrySelect:()=>{selected++;}}))));
        const link=document.querySelector('[data-destination="fiji"]'),hit=link.querySelector('span[data-hit-area]');link.focus();assert.equal(document.activeElement,link);assert.equal(link.tabIndex,0);
        assert.equal(link.getAttribute('href'),'/itinerary/'+fixtures.fiji[0].slug);
        document.addEventListener('click',event=>{prevented=event.defaultPrevented;event.preventDefault();});
        const pointer=type=>{const event=new window.Event('pointerdown',{bubbles:true});Object.assign(event,{pointerType:type,clientX:1,clientY:1});hit.dispatchEvent(event);};
        const click=options=>hit.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:1,clientY:1,...options}));
        await React.act(async()=>{pointer('mouse');click({ctrlKey:true});});assert.equal(prevented,false);assert.equal(selected,0);
        await React.act(async()=>link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,detail:0})));assert.equal(prevented,false,'keyboard activation remains native');
        await React.act(async()=>{pointer('touch');click();});assert.equal(prevented,true);assert.equal(link.dataset.revealed,'true');
        await React.act(async()=>document.body.dispatchEvent(new window.Event('pointerdown',{bubbles:true})));assert.equal(link.dataset.revealed,'false');
        await React.act(async()=>{pointer('touch');click();});assert.equal(prevented,true);
        await React.act(async()=>{pointer('touch');click();});assert.equal(prevented,false);assert.equal(selected,0,'country-level itinerary links navigate natively');
        await React.act(async()=>link.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(link.dataset.revealed,'false');
    }finally{
        if(root)await React.act(async()=>root.unmount());if(api)api.defaults.adapter=adapter;await vite.close();dom.window.close();
        for(const key of keys){if(saved[key]===undefined)delete globalThis[key];else globalThis[key]=saved[key];}
    }
});


test('single-itinerary countries include their major landmasses and exclude ocean/neighboring countries',async()=>{
    const {OCEANIA_ISLANDS}=await import('../src/components/home/atlas/oceaniaIslands.js');
    const samples={fiji:{land:[[400,520],[670,300],[900,348]],ocean:[[400,280],[1300,350]]},
        'french-polynesia':{land:[[510,515],[1095,220]],ocean:[[800,300],[1440,480]]},
        'new-caledonia':{land:[[660,440],[1250,850]],ocean:[[680,700],[1400,450]]},
        'papua-new-guinea':{land:[[580,440],[987,438]],ocean:[[120,310],[1440,510],[600,150]]},
        samoa:{land:[[450,320],[1070,650]],ocean:[[480,700],[1180,300]]},
        tonga:{land:[[550,680],[835,180]],ocean:[[470,400],[1270,690]]},
        vanuatu:{land:[[390,145],[744,496],[1180,810]],ocean:[[290,500],[1390,690]]}};
    for(const [country,{land,ocean}]of Object.entries(samples)){
        const hits=point=>OCEANIA_ISLANDS[country].some(a=>inside(point.map((v,i)=>v/[1536,1024][i]),a.outline));
        for(const point of land)assert.ok(hits(point),country+' landmass');
        for(const point of ocean)assert.equal(hits(point),false,country+' ocean/neighbor must be inactive');
    }
});

test('all nine regional centres are independently clickable in Chromium, including narrow mobile',async()=>{
    const {chromium}=await import('playwright');
    const {createRoot}=await import('react-dom/client');
    const {act}=await import('react');
    const vite=await ssr();let api,adapter,browser;
    const saved=Object.fromEntries(['window','document','HTMLElement','ResizeObserver','IS_REACT_ACT_ENVIRONMENT'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
    try {
        await vite.ssrLoadModule('/src/i18n.js');api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>({config,status:200,headers:{},data:fixtures[decodeURIComponent(config.url.split('/').at(-1)).toLowerCase().replaceAll(' ','-')]});
        const {destinations}=await (await vite.ssrLoadModule('/src/components/home/atlas/oceaniaRegionalScene.js')).loadOceaniaRegion();
        const {default:Layer}=await vite.ssrLoadModule('/src/components/home/atlas/EuropeDestinations.jsx');
        browser=await chromium.launch({headless:true});
        for(const lang of ['en','fr'])for(const viewport of [1440,768,390,320]) {
            await i18n.changeLanguage(lang);
            const width=Math.min(850,viewport-32),height=width*2/3;
            const dom=new JSDOM('<div class="atlas-paper" id="root"></div>');
            Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,ResizeObserver:class {observe(){} disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true});
            const frame=document.getElementById('root');
            Object.defineProperties(frame,{clientWidth:{value:width},clientHeight:{value:height}});
            frame.style.cssText=`width:${width}px;margin:0`;
            const root=createRoot(frame);
            await act(async()=>root.render(React.createElement(Layer,{destinations})));
            const page=await browser.newPage({viewport:{width:viewport,height:1000}});
            await page.setContent(`<style>body{margin:0}${readFileSync('src/styles/homepage.css','utf8')}</style>${frame.outerHTML}`);
            await page.evaluate(()=>document.addEventListener('click',event=>{event.preventDefault();window.clicked=event.target.closest('[data-country]')?.dataset.country;}));
            assert.equal(await page.locator('.atlas-country').count(),9);
            for(const d of destinations){
                const link=page.locator(`[data-country="${d.id}"]`),x=d.artworkPosition.x*width,y=d.artworkPosition.y*height;
                assert.equal(await link.getAttribute('href'),'/browse/'+d.id);
                assert.equal(await link.getAttribute('aria-label'),`${i18n.t(d.labelKey)} — ${i18n.t('homeMagazine.atlas.countryExplore')}`);
                await page.mouse.click(x,y);
                assert.equal(await page.evaluate(()=>window.clicked),d.id,`${lang} ${viewport}: ${d.id} must not be obscured`);
                await link.focus();assert.equal(await link.evaluate(el=>el===document.activeElement),true);
                await page.mouse.move(x,y);
                assert.equal(await link.locator('.atlas-country-callout').evaluate(el=>getComputedStyle(el).visibility),'visible');
                await page.waitForTimeout(200); // Wait only for the existing CSS callout transition.
                const visibleBounds=await link.locator('.atlas-country-callout').evaluate(el=>{
                    const r=el.getBoundingClientRect(),frame=el.closest('.atlas-paper').getBoundingClientRect();
                    return r.left>=frame.left && r.top>=frame.top && r.right<=frame.right && r.bottom<=frame.bottom;
                });
                assert.equal(visibleBounds,true,`${lang} ${viewport}: ${d.id} country label must remain inside the artwork frame`);

            }
            assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
            await page.close();await act(async()=>root.unmount());dom.window.close();
        }
    } finally {
        if(api)api.defaults.adapter=adapter;await browser?.close();await vite.close();
        for(const [key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
    }
});
