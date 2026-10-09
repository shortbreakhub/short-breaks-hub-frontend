import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

test("Weather journal preserves localized search/date callbacks, feedback and unit selection", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []}});
    const dom = new JSDOM('<div id="root"></div>');
    const keys = ["window", "document", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = Object.fromEntries(keys.map(k => [k, globalThis[k]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
    let root;
    try {
        const {createRoot} = await import("react-dom/client");
        const {default: Panel} = await vite.ssrLoadModule("/src/components/WeatherSearchPanel.jsx");
        const {default: Header} = await vite.ssrLoadModule("/src/components/Header.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        root = createRoot(document.getElementById("root"));
        let searches = 0, shows = 0, units = [];
        const props = {locationQuery: "Paris", setLocationQuery: () => {}, handleLocationSearch: () => searches++, handleDateChange: () => shows++, setSelectedDate: () => {}, selectedDate: "2026-10-09", minDate: "2026-10-09", maxDate: "2026-10-22", isCelsius: true, setIsCelsius: v => units.push(v)};
        const render = async extra => React.act(async () => root.render(React.createElement(Panel, {...props, ...extra})));
        for (const lang of ["en", "fr"]) {
            await React.act(async () => i18n.changeLanguage(lang)); await render();
            assert.equal(document.querySelector("h1").textContent, i18n.t("weatherPage.journalHeading"));
            for (const input of document.querySelectorAll("input")) assert.equal(input.labels.length, 1);
            assert.equal(document.querySelector('input[type="text"]').value, "Paris");
            const date = document.querySelector('input[type="date"]');
            assert.equal(date.value, props.selectedDate); assert.equal(date.min, props.minDate); assert.equal(date.max, props.maxDate);
            const buttons = [...document.querySelectorAll("button")];
            await React.act(async () => buttons.forEach(b => b.click()));
            assert.equal(buttons[2].getAttribute("aria-pressed"), "true");
            assert.equal(document.querySelector(".weather-postal-decoration").getAttribute("aria-hidden"), "true");
            await render({isDataFetching: true, noLocationQueryResults: true, invalidDatePicked: true});
            assert.ok(document.querySelector("button").disabled);
            assert.ok(document.body.textContent.includes(i18n.t("weatherSearchBar.noWeatherData")));
            assert.ok(document.body.textContent.includes(i18n.t("weatherDatePicker.invalidDateMessage")));
        }
        assert.equal(searches, 2); assert.equal(shows, 2); assert.deepEqual(units, [true, false, true, false]);
        await React.act(async () => root.render(React.createElement(Header, {...props, currentWeatherData: {region: "Paris", country: "France"}, showTemperatureControl: false})));
        assert.equal(document.querySelectorAll('[aria-pressed]').length, 0, "unit controls moved without duplicating them in the forecast");
        assert.ok(document.querySelector("h2").textContent.includes("Paris"));
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en"); await vite.close(); dom.window.close();
        for (const k of keys) {if (previous[k] === undefined) delete globalThis[k]; else globalThis[k] = previous[k];}
    }
});
