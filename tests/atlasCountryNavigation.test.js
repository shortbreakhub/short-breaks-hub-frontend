import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';

// Regression: a continent's country link must open that country's approved story map
// (Europe/East Asia/Southeast Asia pattern) instead of jumping straight to /browse/<country>.
const ssr = () => createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});

test('every continent country link resolves to a story map in the same continent', async () => {
    const vite = await ssr();
    let api,adapter;
    try {
        api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>{
            const country=decodeURIComponent(config.url.split('/').at(-1));
            const id=country.toLowerCase().replaceAll(' ','-');
            const html=readFileSync(`dist/browse/${id}/index.html`,'utf8');
            const data=JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
            return {config,status:200,headers:{},data:data.items};
        };
        const {REGION_SCENES} = await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        const {COUNTRY_SCENES, sceneForCountry} = await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
        assert.deepEqual(Object.keys(REGION_SCENES), ['europe','east-asia','southeast-asia','north-america','south-america','oceania']);
        for (const [region, scene] of Object.entries(REGION_SCENES)) {
            await scene.loadDestinations?.();
            assert.ok(scene.destinations.length > 0, region + ' has country links');
            for (const destination of scene.destinations) {
                const country = sceneForCountry(destination.id);
                assert.ok(country, `${region}: ${destination.id} must open its country story map, not skip to browse`);
                assert.equal(COUNTRY_SCENES[country].region || 'europe', region, `${destination.id} returns to ${region}`);
            }
        }
    } finally { if(api)api.defaults.adapter=adapter;await vite.close(); }
});

test('clicking an Americas or Oceania country starts its story-map transition instead of navigating', async () => {
    const vite = await ssr();
    const dom = new JSDOM('<div id="root"></div>', {url:'http://localhost:5173/', pretendToBeVisual:true});
    const keys = ['window','document','ResizeObserver','IS_REACT_ACT_ENVIRONMENT','requestAnimationFrame','cancelAnimationFrame','Image'];
    const saved = Object.fromEntries(keys.map(k => [k, globalThis[k]]));
    Object.assign(globalThis, {window:dom.window, document:dom.window.document, ResizeObserver:class{observe(){}disconnect(){}}, IS_REACT_ACT_ENVIRONMENT:true,
        requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window), Image:dom.window.Image});
    let root, api, adapter;
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        api = (await vite.ssrLoadModule('/src/api.js')).publicApi; adapter = api.defaults.adapter;
        // No live network: country inventories resolve to an empty fixture.
        api.defaults.adapter = async config => {
            const country=decodeURIComponent(config.url.split('/').at(-1));
            const id=country.toLowerCase().replaceAll(' ','-');
            const oceania=['australia','new-zealand','fiji','french-polynesia','new-caledonia','papua-new-guinea','samoa','tonga','vanuatu'];
            const html=oceania.includes(id)?readFileSync(`dist/browse/${id}/index.html`,'utf8'):null;
            const data=html?JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]).items:[];
            return {config,status:200,headers:{},data};
        };
        const {REGION_SCENES} = await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
        const {default:Stage} = await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
        const {createRoot} = await import('react-dom/client');
        for (const [region, countries] of [['north-america',['canada','united-states','mexico']], ['south-america',['brazil','argentina','peru','colombia','chile']], ['oceania',['australia','new-zealand','fiji','french-polynesia','new-caledonia','papua-new-guinea','samoa','tonga','vanuatu']], ['europe',['france']]]) {
            for (const country of countries) {
                await REGION_SCENES[region].loadDestinations?.();
                root = createRoot(document.getElementById('root'));
                await React.act(async () => root.render(React.createElement(Stage, {initialRegion:region})));
                const link = document.querySelector(`[data-country="${country}"]`);
                assert.equal(link.getAttribute('href'), '/browse/' + country, 'crawlable fallback href is preserved');
                let prevented;
                const record = event => {prevented = event.defaultPrevented; event.preventDefault();};
                document.addEventListener('click', record);
                const pointer = new window.Event('pointerdown', {bubbles:true}); Object.assign(pointer, {pointerType:'mouse', clientX:1, clientY:1});
                await React.act(async () => {link.dispatchEvent(pointer); link.dispatchEvent(new window.MouseEvent('click', {bubbles:true, cancelable:true, detail:1, clientX:1, clientY:1}));});
                document.removeEventListener('click', record);
                assert.equal(prevented, true, `${region}/${country} is intercepted for the story map`);
                assert.notEqual(document.querySelector('.atlas-stage').dataset.atlasTransition, 'idle', `${region}/${country} begins the cloud transition`);
                await React.act(async () => root.unmount()); root = undefined;
            }
        }
    } finally {
        if (root) await React.act(async () => root.unmount());
        if (api) api.defaults.adapter = adapter;
        await vite.close(); dom.window.close();
        for (const key of keys) {if (saved[key] === undefined) delete globalThis[key]; else globalThis[key] = saved[key];}
    }
});
