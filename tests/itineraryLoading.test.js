import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import React from "react";
import {createRoot} from "react-dom/client";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import axios from "axios";

const slug = "4-days-shanghai-where-the-future-never-waits";
function officialDetail() {
    const html = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
    return JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]).detail;
}

// Real pages and child components; no real API requests or affiliate clicks.
test("official and community itinerary failures terminate loading, retry and ignore stale requests", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}, noExternal: ["lottie-react"]},
        plugins: [{name: "loading-without-canvas", enforce: "pre",
            resolveId(id) {if (id === "lottie-react") return "\0loading-without-canvas";},
            load(id) {if (id === "\0loading-without-canvas") return 'export default function Loading(){return "Loading itinerary";}';},
        }],
    });
    const savedGlobals = Object.fromEntries(["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    const savedAdapter = axios.defaults.adapter;
    let root, dom;
    try {
        const {default: Official} = await vite.ssrLoadModule("/src/pages/ItineraryPage.jsx");
        const {default: Community} = await vite.ssrLoadModule("/src/pages/CommunityItineraryPage.jsx");
        const api = await vite.ssrLoadModule("/src/api.js");
        await vite.ssrLoadModule("/src/i18n.js");
        await i18n.changeLanguage("en");
        dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>',
            {url: "https://www.shortbreakhub.com", pretendToBeVisual: true});
        Object.assign(globalThis, {window: dom.window, document: dom.window.document,
            localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
        window.open = () => assert.fail("Loading verification must not open affiliate URLs");
        api.api.defaults.adapter = async () => assert.fail("Public itineraries must not require authentication");
        axios.defaults.adapter = async config => ({data: {conversion_rates: {USD: 1}}, status: 200, headers: {}, config});

        for (const [kind, Page, prefix, endpoint] of [
            ["official", Official, "/itinerary", "/itineraries/slug/"],
            ["community", Community, "/user-itinerary", "/community-itineraries/slug/"],
        ]) await t.test(kind, async () => {
            let outcome = "network", navigate;
            const pending = [], calls = [];
            const detail = kind === "official" ? officialDetail() : {
                id: 9001, slug, title: "Community Shanghai", country: "China", city: "Shanghai", days: 4,
                summary: "A traveller's Shanghai story", highlights: "Local walks", priceFrom: 100,
                coverPhoto: "/community-cover.jpg", userId: 77, userDisplayName: "Traveller",
                userAvatarUrl: "/avatar.png", lastUpdatedAt: "2026-10-02", schedule: [],
            };
            api.publicApi.defaults.adapter = async config => {
                let data;
                if (config.url.startsWith(endpoint)) {
                    calls.push([config.url, config.params?.lang]);
                    if (config.url.endsWith("/slow")) return new Promise((resolve, reject) => pending.push({resolve, reject, config}));
                    if (outcome === "network") throw new Error("Network unavailable");
                    if (outcome === "404") throw Object.assign(new Error("Not found"), {response: {status: 404}});
                    data = outcome === "empty" ? null : {...detail, title: detail.title + (config.params?.lang === "fr" ? " FR" : "")};
                } else if (config.url.endsWith("/favorites/count")) data = {count: 0};
                else if (config.url.endsWith("/comments")) data = {content: []};
                else if (config.url.endsWith("/question-threads")) data = [];
                else assert.fail(`Unexpected request ${config.url}`);
                return {data, status: 200, headers: {}, config};
            };
            function Capture() {navigate = useNavigate(); return null;}
            root = createRoot(document.getElementById("mount"));
            await React.act(async () => root.render(React.createElement(React.StrictMode, null,
                React.createElement(MemoryRouter, {initialEntries: [`${prefix}/${slug}`]},
                    React.createElement(Capture), React.createElement(Routes, null,
                        React.createElement(Route, {path: `${prefix}/:slug`, element: React.createElement(Page)}))))));
            const assertError = key => {
                assert.equal(document.querySelector('[role="alert"]').textContent, i18n.t(`itineraryLoad.${key}`));
                assert.ok(!document.body.textContent.includes("Loading itinerary"));
                if (kind === "official") assert.equal(document.querySelector('link[rel="canonical"]').href,
                    `https://www.shortbreakhub.com${prefix}/${slug}`);
            };
            const retry = async () => {
                const button = [...document.querySelectorAll("button")].find(item => item.textContent === i18n.t("itineraryLoad.retry"));
                assert.ok(button, "explicit retry must be available");
                await React.act(async () => button.click());
            };
            assertError("failed");
            outcome = "404"; await retry(); assertError("notFound");
            outcome = "empty"; await retry(); assertError("failed");
            outcome = "success"; await retry();
            assert.ok(!document.querySelector('[role="alert"]'));
            assert.equal(document.querySelector("h1").textContent, detail.title);
            assert.ok(document.body.textContent.includes(detail.summary));
            if (kind === "official") {
                assert.ok(document.body.textContent.includes(detail.bestTimeNote));
                assert.ok(document.body.textContent.includes(detail.places[0].name));
                assert.ok(calls.some(([, language]) => language === "en"));
                outcome = "network";
                await React.act(async () => i18n.changeLanguage("fr"));
                assertError("failed");
                outcome = "success"; await retry();
                assert.equal(document.querySelector("h1").textContent, detail.title + " FR");
                assert.ok(calls.some(([, language]) => language === "fr"));
                await React.act(async () => i18n.changeLanguage("en"));
            } else {
                assert.ok(calls.every(([url]) => url.startsWith("/community-itineraries/slug/")));
                assert.ok(!document.querySelector('[role="dialog"]'), "community does not acquire official hotel UI");
            }
            await React.act(async () => navigate(`${prefix}/slow`));
            assert.ok(document.body.textContent.includes("Loading itinerary"));
            await React.act(async () => navigate(`${prefix}/${slug}`));
            assert.equal(document.querySelector("h1").textContent, detail.title);
            await React.act(async () => pending.splice(0).forEach(({reject}) => reject(new Error("Stale failure"))));
            assert.equal(document.querySelector("h1").textContent, detail.title);
            assert.ok(!document.querySelector('[role="alert"]'));
            await React.act(async () => navigate(`${prefix}/slow`));
            outcome = "network";
            await React.act(async () => navigate(`${prefix}/${slug}`));
            assertError("failed");
            await React.act(async () => pending.splice(0).forEach(({resolve, config}) => resolve({data: detail, status: 200, headers: {}, config})));
            assertError("failed");
            await React.act(async () => root.unmount()); root = null;
        });
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        axios.defaults.adapter = savedAdapter;
        await vite.close(); dom?.window.close();
        for (const [key, value] of Object.entries(savedGlobals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
