import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync, readdirSync} from "node:fs";
import {createServer} from "vite";
import React from "react";
import {renderToString} from "react-dom/server";
import {hydrateRoot} from "react-dom/client";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import axios from "axios";

function bootstrap(slug) {
    const html = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
    return JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
}

// Use real page/components, mocking only network and the loading animation's canvas dependency.
test("official bootstrap renders without browser storage/network; hydration, restoration, navigation and language remain functional", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}, noExternal: ["lottie-react"]},
        plugins: [{name: "test-loading-animation", enforce: "pre",
            resolveId(id) {if (id === "lottie-react") return "\0test-loading-animation";},
            load(id) {if (id === "\0test-loading-animation") return 'export default function LoadingAnimation(){return "Loading itinerary";}';},
        }],
    });
    let root, dom;
    const previousAdapter = axios.defaults.adapter;
    const previousGlobals = Object.fromEntries(["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    try {
        const {default: ItineraryPage} = await vite.ssrLoadModule("/src/pages/ItineraryPage.jsx");
        const {PrerenderDataProvider} = await vite.ssrLoadModule("/src/context/PrerenderDataContext.jsx");
        const api = await vite.ssrLoadModule("/src/api.js");
        await vite.ssrLoadModule("/src/i18n.js");
        await i18n.changeLanguage("en");
        const slugs = readdirSync("dist/itinerary").slice(0, 3);
        const initial = bootstrap(slugs[0]);
        const requests = [];
        let resolveSlow;
        api.publicApi.defaults.adapter = async config => {
            requests.push(config);
            let data;
            if (config.url.startsWith("/itineraries/slug/")) {
                const slug = config.url.slice("/itineraries/slug/".length);
                if (slug === slugs[1]) await new Promise(resolve => {resolveSlow = resolve;});
                data = {...bootstrap(slug).detail};
                if (config.params.lang === "fr") data.title += " FR";
            } else if (config.url.endsWith("/favorites/count")) data = {count: 0};
            else if (config.url.endsWith("/comments")) data = {content: []};
            else throw new Error(`Unexpected public request: ${config.url}`);
            return {data, status: 200, headers: {}, config};
        };
        api.api.defaults.adapter = async config => {throw new Error(`Unexpected private request: ${config.url}`);};
        axios.defaults.adapter = async config => {
            requests.push(config);
            return {data: {conversion_rates: {USD: 2}}, status: 200, headers: {}, config};
        };
        let navigate;
        function Capture() {navigate = useNavigate(); return null;}
        const tree = React.createElement(React.StrictMode, null,
            React.createElement("div", {id: "page"},
                React.createElement(MemoryRouter, {initialEntries: [`/itinerary/${slugs[0]}`]},
                    React.createElement(PrerenderDataProvider, {initialData: initial},
                        React.createElement(Capture), React.createElement(Routes, null,
                            React.createElement(Route, {path: "/itinerary/:slug", element: React.createElement(ItineraryPage)}))))));
        const markup = renderToString(tree);
        assert.equal(requests.length, 0, "server rendering must make no enrichment/detail requests");
        assert.ok(markup.includes(initial.detail.slug));
        assert.ok(markup.includes(initial.detail.arrival[0]?.title || initial.detail.summary));
        await i18n.changeLanguage("fr");
        assert.ok(renderToString(tree).includes("Loading itinerary"), "English bootstrap cannot supply French initial content");
        await i18n.changeLanguage("en");
        dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {url: "https://www.shortbreakhub.com", pretendToBeVisual: true});
        Object.assign(globalThis, {window: dom.window, document: dom.window.document,
            localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
        const saved = {hotel: true, flights: true};
        localStorage.setItem("tripPrepStatus", JSON.stringify(saved));
        const writes = [];
        const originalSet = dom.window.Storage.prototype.setItem;
        dom.window.Storage.prototype.setItem = function(key, value) {
            if (key === "tripPrepStatus") writes.push(JSON.parse(value));
            return originalSet.call(this, key, value);
        };
        const start = markup.indexOf('<div id="page">');
        document.head.innerHTML = markup.slice(0, start);
        document.body.innerHTML = '<main id="mount">' + markup.slice(start) + '</main>';
        const errors = [];
        await React.act(async () => {
            root = hydrateRoot(document.getElementById("mount"), tree, {onRecoverableError: error => errors.push(error.message)});
        });
        assert.deepEqual(errors, [], "hydration must agree with deterministic server state");
        assert.ok(writes.length > 0 && writes.every(value => value.hotel && value.flights), "saved preparation must never be overwritten by defaults");
        assert.equal(requests.filter(config => config.url.startsWith("/itineraries/slug/")).length, 0);
        const reset = [...document.querySelectorAll("button")].find(button => button.textContent === "Reset");
        assert.ok(reset);
        await React.act(async () => reset.click());
        assert.equal(JSON.parse(localStorage.getItem("tripPrepStatus")).hotel, false, "normal preparation persistence continues after restoration");
        assert.ok(requests.some(config => config.url.includes("exchangerate-api")), "bootstrap must still enrich currency after mount");
        const settle = async () => {await React.act(async () => {await new Promise(resolve => setTimeout(resolve, 20));});};
        await React.act(async () => navigate(`/itinerary/${slugs[1]}`));
        assert.ok(resolveSlow, "later route needs live detail");
        await React.act(async () => navigate(`/itinerary/${slugs[2]}`));
        await settle();
        assert.ok(document.body.textContent.includes(bootstrap(slugs[2]).detail.title));
        await React.act(async () => resolveSlow());
        await settle();
        assert.ok(document.body.textContent.includes(bootstrap(slugs[2]).detail.title), "stale response must not replace current route");
        await React.act(async () => i18n.changeLanguage("fr"));
        await settle();
        assert.ok(requests.some(config => config.params?.lang === "fr"));
        assert.ok(document.body.textContent.includes(bootstrap(slugs[2]).detail.title + " FR"));
        const head = document.head;
        assert.equal(head.querySelectorAll('link[rel="canonical"]').length, 1);
        assert.equal(head.querySelector('link[rel="canonical"]').getAttribute("href"), `https://www.shortbreakhub.com/itinerary/${slugs[2]}`);
        for (const key of ["og:title", "og:description", "og:url"]) assert.equal(head.querySelectorAll(`meta[property="${key}"]`).length, 1);
        assert.ok(head.querySelector('meta[property="og:title"]').content.includes(" FR"));
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        axios.defaults.adapter = previousAdapter;
        await vite.close();
        dom?.window.close();
        for (const [key, value] of Object.entries(previousGlobals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
