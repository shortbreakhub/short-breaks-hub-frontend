import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';

const fixture = () => {
    const hourlyTimes = Array.from({length:48}, (_, i) => new Date(2026, 9, 10, i));
    const dailyTimes = Array.from({length:16}, (_, i) => new Date(2026, 9, 10 + i, 7));
    const values = Array(48).fill(12);
    return {current:{time:hourlyTimes[0],temperature_2m:12,apparent_temperature:11,relativeHumidity:60,wind_speed_10m:5,weather_code:0},
        hourly:{time:hourlyTimes,temperature_2m:values,weather_code:Array(48).fill(0),precipitation_probability:values,uv_index:values},
        daily:{time:dailyTimes,sunrise:dailyTimes,sunset:dailyTimes,weather_code:Array(16).fill(0),temperature_2m_max:values,temperature_2m_min:values,precipitation_probability_max:values,wind_speed_10m_max:values,uv_index_max:values}};
};

test('Fresh visits and refresh default to London; manual search survives stale forecasts without IP or browser geolocation', async () => {
    const source = await readFile('src/pages/WeatherPage.jsx','utf8');
    assert.doesNotMatch(source, /abstractGeolocationApi|navigator\.geolocation|ipgeolocation/);
    const calls = [], pending = [], fetches = [];
    const keys = ['window','document','IS_REACT_ACT_ENVIRONMENT','fetch','__weatherTest'];
    const previous = Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
    const dom = new JSDOM('<div id="root"></div>');
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true,
        __weatherTest:(lat,lon)=>{calls.push([lat,lon]);return new Promise(resolve=>pending.push(resolve));},
        fetch:async url=>{fetches.push(new URL(url).hostname);return {json:async()=>({status:'OK',results:[{address_components:[{long_name:'Paris'},{long_name:'Île-de-France'},{long_name:'France'}],geometry:{location:{lat:48.8566,lng:2.3522}}}]})};}});
    const vite = await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},plugins:[{name:'weather-request-fixture',enforce:'pre',transform(code,id){if(id.endsWith('/src/pages/WeatherPage.jsx')) return code.replace('import openMeteoApi from "../utils/openMeteoApi.js";','const openMeteoApi = (...args) => globalThis.__weatherTest(...args);').replace('import Lottie from "lottie-react";','const Lottie = () => null;');}}]});
    let root;
    try {
        const {createRoot} = await import('react-dom/client');
        const {default:Page} = await vite.ssrLoadModule('/src/pages/WeatherPage.jsx');
        await vite.ssrLoadModule('/src/i18n.js');
        root=createRoot(document.getElementById('root'));
        await React.act(async()=>root.render(React.createElement(Page)));
        assert.deepEqual(calls,[[51.5074,-0.1278]]);
        await React.act(async()=>pending.shift()(fixture()));
        assert.equal(document.querySelector('.weather-hero h2').textContent,'London');
        assert.equal(document.querySelectorAll('.weather-hour-grid li').length,12);
        // Search via the real controlled input and button.
        const input=document.querySelector('input[type="text"]');
        await React.act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'Paris');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
        await React.act(async()=>document.querySelector('.weather-search-panel button, .weather-search-controls button, button').click());
        assert.deepEqual(calls.at(-1),[48.8566,2.3522]);
        await React.act(async()=>pending.shift()(fixture()));
        assert.equal(document.querySelector('.weather-hero h2').textContent,'Paris');
        await React.act(async()=>root.unmount());
        root=createRoot(document.getElementById('root'));
        await React.act(async()=>root.render(React.createElement(Page)));
        assert.deepEqual(calls.at(-1),[51.5074,-0.1278]);
        const staleForecast = pending.shift();
        await React.act(async()=>root.unmount());
        root=createRoot(document.getElementById('root'));
        await React.act(async()=>root.render(React.createElement(Page)));
        await React.act(async()=>staleForecast(fixture()));
        assert.equal(document.querySelector('.weather-hero'),null,'unmounted request cannot finish the new page loading state');
        await React.act(async()=>pending.shift()(fixture()));
        assert.equal(document.querySelector('.weather-hero h2').textContent,'London');
        assert.equal(calls.length,4,'one forecast per location, no redundant request after weather state updates');
        assert.deepEqual(fetches,['maps.googleapis.com']);
    } finally {
        if(root) await React.act(async()=>root.unmount());
        await vite.close();dom.window.close();
        for(const k of keys){if(previous[k]===undefined) delete globalThis[k];else globalThis[k]=previous[k];}
    }
});

test('Paris forecast remains current when the older default London request resolves last', async () => {
    const pending = [], geocodingQueries = [];
    const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT', 'fetch', '__weatherTest', '__weatherSearch'];
    const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    const dom = new JSDOM('<div id="root"></div>');
    Object.assign(globalThis, {
        window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true,
        __weatherTest: (latitude, longitude) => new Promise(resolve => pending.push({latitude, longitude, resolve})),
        fetch: async url => {
            const request = new URL(url);
            assert.equal(request.hostname, 'maps.googleapis.com');
            geocodingQueries.push(request.searchParams.get('address'));
            return {json: async () => ({status: 'OK', results: [{
                address_components: [{long_name: 'Paris'}, {long_name: 'Île-de-France'}, {long_name: 'France'}],
                geometry: {location: {lat: 48.8566, lng: 2.3522}},
            }]})};
        },
    });
    const vite = await createServer({
        appType: 'custom', logLevel: 'error',
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        plugins: [{name: 'weather-race-fixture', enforce: 'pre', transform(code, id) {
            if (!id.endsWith('/src/pages/WeatherPage.jsx')) return;
            // The initial loading overlay hides the search UI. Expose its existing
            // setter/handler only in this test, without replacing the search logic.
            return code
                .replace('import openMeteoApi from "../utils/openMeteoApi.js";', 'const openMeteoApi = (...args) => globalThis.__weatherTest(...args);')
                .replace('import Lottie from "lottie-react";', 'const Lottie = () => null;')
                .replace('    if (loading) {', '    globalThis.__weatherSearch = {setLocationQuery, handleLocationSearch};\n    if (loading) {');
        }}],
    });
    let root;
    try {
        const {createRoot} = await import('react-dom/client');
        const {default: Page} = await vite.ssrLoadModule('/src/pages/WeatherPage.jsx');
        await vite.ssrLoadModule('/src/i18n.js');
        root = createRoot(document.getElementById('root'));
        await React.act(async () => root.render(React.createElement(Page)));
        assert.equal(pending.length, 1);
        const london = pending[0];
        assert.deepEqual([london.latitude, london.longitude], [51.5074, -0.1278]);

        await React.act(async () => globalThis.__weatherSearch.setLocationQuery('Paris'));
        await React.act(async () => globalThis.__weatherSearch.handleLocationSearch());
        assert.deepEqual(geocodingQueries, ['Paris']);
        assert.equal(pending.length, 2);
        const paris = pending[1];
        assert.deepEqual([paris.latitude, paris.longitude], [48.8566, 2.3522]);
        const parisWeather = fixture();
        parisWeather.current.temperature_2m = 23;
        await React.act(async () => paris.resolve(parisWeather));
        assert.equal(document.querySelector('.weather-hero h2').textContent, 'Paris');
        assert.equal(document.querySelector('.weather-hero-temperature').textContent, '23°C');
        const parisContent = document.querySelector('.weather-journal').textContent;

        const londonWeather = fixture();
        londonWeather.current.temperature_2m = 5;
        await React.act(async () => london.resolve(londonWeather));
        assert.equal(document.querySelector('.weather-hero h2').textContent, 'Paris');
        assert.equal(document.querySelector('.weather-hero-temperature').textContent, '23°C');
        assert.equal(document.querySelector('.weather-journal').textContent, parisContent);
        assert.equal(pending.length, 2, 'no additional forecast is triggered by resolving either request');
    } finally {
        if (root) await React.act(async () => root.unmount());
        await vite.close(); dom.window.close();
        for (const key of keys) {
            if (previous[key] === undefined) delete globalThis[key];
            else globalThis[key] = previous[key];
        }
    }
});
