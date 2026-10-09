import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

test("Community journal preserves real routes and distinguishes loading, empty, error and populated states", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const dom = new JSDOM('<div id="root"></div>', {url: "http://localhost:5173"});
    const keys = ["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
    let root, api, adapter, navigate;
    try {
        const {createRoot} = await import("react-dom/client");
        const {default: Landing} = await vite.ssrLoadModule("/src/pages/CommunityTripsPage.jsx");
        const {default: Region} = await vite.ssrLoadModule("/src/pages/CommunityRegionPage.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        api = (await vite.ssrLoadModule("/src/api.js")).publicApi; adapter = api.defaults.adapter;
        let outcome = "empty"; const requests = [], deferred = [];
        // Same legitimate isolated community detail fixture used by itineraryLoading.test.js.
        const itinerary = {id: 9001, slug: "community-shanghai", title: "Community Shanghai", country: "China", summary: "A traveller's Shanghai story"};
        api.defaults.adapter = async config => {
            requests.push(config.url);
            assert.ok(config.url.startsWith("/community-itineraries/"), "never load official detail data for community previews");
            if (outcome === "pending") return new Promise(resolve => deferred.push(() => resolve({data: [], status: 200, headers: {}, config})));
            if (outcome === "error") throw new Error("API unavailable");
            const data = outcome === "populated" ? (config.url.includes("/region/") ? ["China"] : [itinerary]) : [];
            return {data, status: 200, headers: {}, config};
        };
        function Capture() {navigate = useNavigate(); return null;}
        const mount = async path => {
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(MemoryRouter, {initialEntries: [path]}, React.createElement(Capture), React.createElement(Routes, null,
                React.createElement(Route, {path: "/community-itineraries/region", element: React.createElement(Landing)}),
                React.createElement(Route, {path: "/community-itineraries/region/:region", element: React.createElement(Region)})))));
        };
        const unmount = async () => {await React.act(async () => root.unmount()); root = null;};
        await t.test("six genuine photographs and native links keep the existing order and destinations", async () => {
            await i18n.changeLanguage("en"); await mount("/community-itineraries/region");
            const links = [...document.querySelectorAll(".community-landing .grid > a")];
            assert.deepEqual(links.map(a => a.getAttribute("href")), ["southeast-asia", "east-asia-community", "EUROPE", "americas-community", "anz-community", "africa-community"].map(region => `/community-itineraries/region/${region}`));
            assert.equal(document.querySelectorAll("img").length, 6);
            assert.ok(document.querySelector(".grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3"));
            assert.equal(document.querySelector("h1").textContent, i18n.t("communityTripsPage.exploreByRegion"));
            await unmount();
        });
        for (const lang of ["en", "fr"]) await t.test(`${lang} localized region-aware honest empty state and existing creation route`, async () => {
            await i18n.changeLanguage(lang); outcome = "empty";
            for (const [region, key] of [["southeast-asia", "southeastAsia"], ["east-asia-community", "eastAsia"], ["EUROPE", "europe"], ["americas-community", "americas"], ["anz-community", "oceania"], ["africa-community", "africa"]]) {
            await mount(`/community-itineraries/region/${region}`);
            const name = i18n.t(`communityTripsPage.${key}.title`);
            assert.ok(document.querySelector(".community-journal-heading p").textContent.includes(name), "region labels must remain readable, including literal ampersands");
            assert.ok(!document.querySelector(".community-journal-heading p").textContent.includes("&amp;"));
            assert.equal(document.querySelector(".community-journal-empty h2").textContent, i18n.t("communityJournal.emptyHeading"));
            assert.equal(document.querySelector(".community-journal-action").getAttribute("href"), "/create-itinerary");
            assert.equal(document.querySelectorAll("img").length, 0, "no photographic hero or invented previews");
            assert.equal(document.querySelectorAll('a[href^="/user-itinerary/"]').length, 0);
            await unmount();
            }
        });
        await t.test("API errors never become empty states and retry restores genuine populated links", async () => {
            await i18n.changeLanguage("en"); outcome = "error"; await mount("/community-itineraries/region/east-asia-community");
            assert.equal(document.querySelector('[role="alert"]').textContent, i18n.t("communityJournal.failed"));
            assert.equal(document.querySelector(".community-journal-empty"), null);
            outcome = "populated"; await React.act(async () => document.querySelector("button").click());
            assert.equal(document.querySelector(".community-journal-empty"), null);
            const link = document.querySelector('a[href="/user-itinerary/community-shanghai"]');
            assert.equal(link.textContent, itinerary.title); assert.ok(document.body.textContent.includes(itinerary.summary));
            assert.equal(document.querySelectorAll('a[href^="/user-itinerary/"]').length, 1);
            await unmount();
        });
        await t.test("pending and stale requests cannot flash empty content or replace a newer region", async () => {
            outcome = "pending"; await mount("/community-itineraries/region/EUROPE");
            assert.ok(document.querySelector('[role="status"]')); assert.equal(document.querySelector(".community-journal-empty"), null);
            outcome = "populated"; await React.act(async () => navigate("/community-itineraries/region/east-asia-community"));
            await React.act(async () => deferred.forEach(resolve => resolve()));
            assert.ok(document.querySelector('a[href="/user-itinerary/community-shanghai"]'));
            assert.equal(document.querySelector(".community-journal-empty"), null);
            await unmount();
        });
        assert.ok(requests.every(url => url.startsWith("/community-itineraries/")));
    } finally {
        if (root) await React.act(async () => root.unmount());
        if (api) api.defaults.adapter = adapter;
        await i18n.changeLanguage("en"); await vite.close(); dom.window.close();
        for (const key of keys) {if (previous[key] === undefined) delete globalThis[key]; else globalThis[key] = previous[key];}
    }
});
