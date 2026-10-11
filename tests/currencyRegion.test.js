import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import React from "react";
import {createRoot} from "react-dom/client";
import {renderToStaticMarkup} from "react-dom/server";
import {MemoryRouter, Routes, Route} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import axios from "axios";
import getCurrencyCode, {getCurrencyBaseCode} from "../src/utils/countryToCurrency.js";

// Real records that crashed the itinerary page with non-canonical region values, plus
// existing Peru, working countries and unknown values. Expected = local currency or none.
const CASES = [
    {name: "San Miguel de Allende", region: "north_america", country: "Mexico", expected: "MXN"},
    {name: "Washington, D.C.", region: "america", country: "United States", expected: "USD"},
    {name: "Arequipa", region: "south_america", country: "Peru", expected: "PEN"},
    {name: "Lima (existing Peru)", region: "americas", country: "Peru", expected: "PEN"},
    {name: "Guanajuato", region: "americas", country: "Mexico", expected: "MXN"},
    {name: "Paris", region: "europe", country: "France", expected: "EUR"},
    {name: "Tokyo", region: "east-asia", country: "Japan", expected: "JPY"},
    {name: "Kigali", region: "africa", country: "Rwanda", expected: "RWF"},
    {name: "Unknown region and country", region: "mars", country: "Atlantis", expected: null},
];
const ssr = extra => createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
    optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}, ...extra?.ssr}, plugins: extra?.plugins});

test("currencies resolve by country, independent of the itinerary region value", () => {
    for (const {region, country, expected} of CASES) {
        assert.equal(getCurrencyBaseCode(country), expected, country);
        assert.equal(getCurrencyCode(region, country)?.["Base Code"] ?? null, expected, `${region}/${country}`);
    }
    assert.deepEqual(getCurrencyCode("americas", "Peru"), {"Base Code": "PEN", "Symbol": "S/"});
    for (const value of [undefined, null, "", "toString", "__proto__", "constructor", "mexico"]) {
        assert.equal(getCurrencyBaseCode(value), null, String(value));
        assert.equal(getCurrencyCode("americas", value), null, String(value));
    }
    assert.equal(getCurrencyCode(undefined, "Mexico")["Base Code"], "MXN", "a missing region no longer matters");
});

test("CurrencyConverter renders valid codes and never renders undefined", async () => {
    const vite = await ssr();
    try {
        await vite.ssrLoadModule("/src/i18n.js"); await i18n.changeLanguage("en");
        const {default: Converter} = await vite.ssrLoadModule("/src/components/CurrencyConverter.jsx");
        for (const {name, region, country, expected} of CASES) {
            const html = renderToStaticMarkup(React.createElement(Converter, {data: {region, country}, fromAmount: "100", userCurrency: "USD", userCurrencyValue: 0, convertRate: 1}));
            assert.doesNotMatch(html, /undefined|No Code Found/, name);
            if (expected) assert.ok(html.includes(`(${expected})`) && html.includes(`1 ${expected} ≈`), name);
            else assert.equal(html, "", `${name}: no converter without a known currency`);
        }
    } finally { await vite.close(); }
});

test("itinerary pages render for every case and only request valid exchange-rate codes", async t => {
    const vite = await ssr({ssr: {noExternal: ["lottie-react"]}, plugins: [{name: "loading-without-canvas", enforce: "pre",
        resolveId(id) {if (id === "lottie-react") return "\0loading-without-canvas";},
        load(id) {if (id === "\0loading-without-canvas") return 'export default function Loading(){return "Loading itinerary";}';}}]});
    const keys = ["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"];
    const saved = Object.fromEntries(keys.map(k => [k, globalThis[k]]));
    const savedAdapter = axios.defaults.adapter;
    let root, dom, api, publicAdapter;
    // Real official detail shape (prerendered), retargeted per case; no live API or affiliate traffic.
    const html = readFileSync("dist/itinerary/4-days-shanghai-where-the-future-never-waits/index.html", "utf8");
    const base = JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]).detail;
    try {
        const {default: Page} = await vite.ssrLoadModule("/src/pages/ItineraryPage.jsx");
        api = await vite.ssrLoadModule("/src/api.js"); publicAdapter = api.publicApi.defaults.adapter;
        await vite.ssrLoadModule("/src/i18n.js"); await i18n.changeLanguage("en");
        dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>', {url: "https://www.shortbreakhub.com", pretendToBeVisual: true});
        Object.assign(globalThis, {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
        window.open = () => assert.fail("Currency verification must not open affiliate URLs");
        const rateRequests = [];
        axios.defaults.adapter = async config => {rateRequests.push(config.url); return {data: {conversion_rates: {USD: 1}}, status: 200, headers: {}, config};};
        for (const [index, {name, region, country, expected}] of CASES.entries()) await t.test(name, async () => {
            const slug = `currency-case-${index}`, detail = {...base, id: 9100 + index, slug, region, country, city: name, title: `${name} itinerary`};
            api.publicApi.defaults.adapter = async config => {
                let data;
                if (config.url === `/itineraries/slug/${slug}`) data = detail;
                else if (config.url.endsWith("/favorites/count")) data = {count: 0};
                else if (config.url.endsWith("/comments")) data = {content: []};
                else assert.fail(`Unexpected request ${config.url}`);
                return {data, status: 200, headers: {}, config};
            };
            rateRequests.length = 0;
            root = createRoot(document.getElementById("mount"));
            await React.act(async () => root.render(React.createElement(MemoryRouter, {initialEntries: [`/itinerary/${slug}`]},
                React.createElement(Routes, null, React.createElement(Route, {path: "/itinerary/:slug", element: React.createElement(Page)})))));
            assert.equal(document.querySelector("h1").textContent, detail.title, "page renders instead of crashing");
            assert.ok(!document.querySelector('[role="alert"]'));
            assert.ok(!/\(undefined\)|1 undefined|No Code Found/.test(document.body.textContent));
            const exchange = rateRequests.filter(url => url.includes("exchangerate-api"));
            if (expected) {
                assert.deepEqual(exchange.map(url => url.split("/").at(-1)), [expected]);
                assert.ok(document.body.textContent.includes(`(${expected})`));
            } else assert.deepEqual(exchange, [], "no request with an invalid currency code");
            await React.act(async () => root.unmount()); root = null;
        });
    } finally {
        if (root) await React.act(async () => root.unmount());
        if (api) api.publicApi.defaults.adapter = publicAdapter;
        axios.defaults.adapter = savedAdapter;
        await i18n.changeLanguage("en"); await vite.close(); dom?.window.close();
        for (const key of keys) {if (saved[key] === undefined) delete globalThis[key]; else globalThis[key] = saved[key];}
    }
});
