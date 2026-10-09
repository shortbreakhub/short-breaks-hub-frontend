import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import getWeatherDescriptionAndEmoji, {getWeatherIllustrationCategory} from "../src/utils/weatherCodesTable.js";

test("Weather illustrations cover the existing codes without changing descriptions or implying known weather for unknown codes", () => {
    const groups = {sunny:[0,1], "partly-cloudy":[2], overcast:[3], fog:[45,48], drizzle:[51,53,55], "freezing-rain":[56,57,66,67], rain:[61,63,65,80,81,82], snow:[71,73,75,77,85,86], thunderstorm:[95,96,99]};
    for (const [category, codes] of Object.entries(groups)) for (const code of codes) {
        assert.equal(getWeatherIllustrationCategory(code), category);
        assert.ok(getWeatherDescriptionAndEmoji(code).description);
        assert.ok(getWeatherDescriptionAndEmoji(code).emoji);
    }
    assert.equal(getWeatherIllustrationCategory(1000), null);
    assert.equal(getWeatherIllustrationCategory(undefined), null);
    assert.equal(getWeatherDescriptionAndEmoji(96).description, "Thunderstorm with slight hail");
    assert.equal(getWeatherDescriptionAndEmoji(99).description, "Thunderstorm with heavy hail");
    assert.equal(getWeatherDescriptionAndEmoji(1000).description, "Unknown Weather");
});

test("Weather hero uses supported data, localized metric labels, zero-safe unit conversion and unchanged date text", async () => {
    const vite = await createServer({appType:"custom", logLevel:"error", server:{middlewareMode:true, hmr:false, ws:false}, optimizeDeps:{noDiscovery:true, include:[]}});
    try {
        const {default: Hero} = await vite.ssrLoadModule("/src/components/DetailCard.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        const data = {weatherCode:61, currentTemperature:0, feelLike:0, windSpeed:0, relativeHumidity:0, precipitationProbability:0, uxIndex:"0.00", sunrise:"07:07", sunset:"18:16", currentTime:"Thu 08 Oct 2026 21:15:00", description:"Slight rain"};
        for (const lang of ["en","fr"]) for (const celsius of [true,false]) {
            await i18n.changeLanguage(lang);
            const html = renderToStaticMarkup(React.createElement(Hero, {currentWeatherData:{city:"Paris",region:"Île-de-France",country:"France"},displayWeatherData:data,isCelsius:celsius,dailyHigh:18,dailyLow:4}));
            const dom = new JSDOM(html), doc = dom.window.document;
            assert.equal(doc.querySelector("h2").textContent,"Paris");
            assert.equal(doc.querySelector(".weather-hero-temperature").textContent,celsius ? "0°C" : "32°F");
            assert.equal(doc.querySelector(".weather-hero-date").textContent,data.currentTime);
            assert.equal(doc.querySelectorAll(".weather-hero-metric").length,6);
            assert.ok(doc.body.textContent.includes(i18n.t("weatherDetailsCard.UVIndex")));
            assert.ok(doc.body.textContent.includes("0%")); assert.ok(doc.body.textContent.includes("0 km/h"));
            assert.ok(doc.body.textContent.includes(celsius ? "18°C" : "64°F"));
            const images=[...doc.querySelectorAll("img")]; assert.equal(images.length,2);
            assert.ok(images.some(i=>i.src.includes("weather-rain-watercolor")));
            assert.ok(images.some(i=>i.src.includes("weather-village-watercolor")));
            assert.ok(images.every(i=>i.alt==="" && i.getAttribute("aria-hidden")==="true"));
            dom.window.close();
        }
        const future = renderToStaticMarkup(React.createElement(Hero, {currentWeatherData:{city:"Paris"}, displayWeatherData:{...data,weatherCode:99,currentTemperature:18,temperatureMin:4},isCelsius:true,isFutureDateSelected:true}));
        const dom = new JSDOM(future);
        assert.equal(dom.window.document.querySelectorAll(".weather-hero-metric").length,4);
        assert.ok(future.includes("Thunderstorm with heavy hail"));
        assert.ok(future.includes(i18n.t("weatherHeader.live")));
        assert.ok(future.includes("weather-thunderstorm-watercolor"));
        dom.window.close();
        const empty = renderToStaticMarkup(React.createElement(Hero, {currentWeatherData:{city:"Paris"},displayWeatherData:null,isCelsius:true}));
        assert.ok(empty.includes("—")); assert.ok(!empty.includes("NaN"));
        assert.ok(!empty.includes("weather-sunny-watercolor"));
    } finally {await i18n.changeLanguage("en");await vite.close();}
});
