import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

test("Forecast preserves chronological hours, seven days, original icons and localized Celsius/Fahrenheit values", async () => {
    const vite = await createServer({appType:"custom", logLevel:"error", server:{middlewareMode:true, hmr:false, ws:false}, optimizeDeps:{noDiscovery:true, include:[]}});
    try {
        const {default: Hour} = await vite.ssrLoadModule('/src/components/HourlySummaryCard.jsx');
        const {default: Day} = await vite.ssrLoadModule('/src/components/DailySummaryCard.jsx');
        await vite.ssrLoadModule('/src/i18n.js');
        const hours = Array.from({length:12}, (_,i)=>({time:`${String((18+i)%24).padStart(2,'0')}:00`,emoji:'☁️',temperature:0}));
        const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>({day,emoji:'☁️',temperatureMax:20,temperatureMin:0,precipitationProbabilityMax:0}));
        for (const language of ['en','fr']) for(const isCelsius of [true,false]) {
            await i18n.changeLanguage(language);
            const html=renderToStaticMarkup(React.createElement('div',null,
                React.createElement('ol',null,hours.map(hour=>React.createElement(Hour,{...hour,isCelsius,key:hour.time}))),
                React.createElement('ul',null,days.map(day=>React.createElement(Day,{dayWeatherSummary:day,isCelsius,key:day.day})))));
            const dom=new JSDOM(html), doc=dom.window.document;
            assert.equal(doc.querySelectorAll('ol li').length,12);
            assert.deepEqual([...doc.querySelectorAll('.weather-hour-time')].map(el=>el.textContent),hours.map(h=>h.time));
            assert.ok([...doc.querySelectorAll('.weather-hour-temperature')].every(el=>el.textContent===(isCelsius?'0°':'32°')));
            assert.equal(doc.querySelectorAll('ul li button').length,7);
            assert.equal(doc.querySelector('ul button').type,'button');
            assert.ok(doc.querySelector('ul button').textContent.includes(i18n.t('dailySummaryCard.Mon')));
            assert.ok(doc.querySelector('.weather-day-rain').textContent.includes(i18n.t('weatherDetailsCard.precipitation')));
            assert.ok(doc.querySelector('.weather-day-rain').textContent.includes('0%'));
            assert.equal(doc.querySelectorAll('.weather-day-rain svg').length,7);
            assert.equal(doc.querySelector('.weather-day-rain svg').getAttribute('aria-hidden'),'true');
            assert.ok(doc.querySelector('.weather-day-rain .sr-only').textContent.includes(i18n.t('weatherDetailsCard.precipitation')));
            assert.ok(doc.querySelector('.weather-day-temperature').textContent.includes(isCelsius?'20°':'68°'));
            assert.ok([...doc.querySelectorAll('.weather-forecast-icon')].every(el=>el.textContent==='☁️'));
            assert.equal(doc.querySelectorAll('img').length,0,'forecast never loads large watercolor illustrations');
            dom.window.close();
        }
    } finally {await i18n.changeLanguage('en');await vite.close();}
});
