import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import React from "react";
import {renderToString} from "react-dom/server";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import axios from "axios";

const shanghaiSlug = "4-days-shanghai-where-the-future-never-waits";
const parisSlug = "4-days-paris-where-icons-meet-everyday-grace";
const shanghaiDestination = {destinationKey: "china--shanghai", name: "Shanghai", provider: "TRIP_COM", entityType: "CITY", status: "MAPPED", externalId: "2"};
function detail(slug, destination) {
    const html = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
    return {...JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]).detail, hotelDestination: destination};
}

test("Official Hotel handoff hydrates safely, preserves edits, resets across itineraries and blocks unsafe searches", async t => {
    const fixed = new Date(2026, 9, 2, 12).getTime();
    t.mock.timers.enable({apis: ["Date"], now: fixed});
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}, noExternal: ["lottie-react"]},
        plugins: [{name: "test-loading-animation", enforce: "pre",
            resolveId(id) {if (id === "lottie-react") return "\0test-loading-animation";},
            load(id) {if (id === "\0test-loading-animation") return 'export default function LoadingAnimation(){return "Loading itinerary";}';},
        }],
    });
    const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {url: "https://www.shortbreakhub.com", pretendToBeVisual: true});
    const previousGlobals = Object.fromEntries(["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    const previousAdapter = axios.defaults.adapter;
    let root;
    try {
        const {default: ItineraryPage} = await vite.ssrLoadModule("/src/pages/ItineraryPage.jsx");
        const {PrerenderDataProvider} = await vite.ssrLoadModule("/src/context/PrerenderDataContext.jsx");
        const api = await vite.ssrLoadModule("/src/api.js");
        await vite.ssrLoadModule("/src/i18n.js");
        await i18n.changeLanguage("en");
        const shanghai = detail(shanghaiSlug, shanghaiDestination);
        const paris = detail(parisSlug, {...shanghaiDestination, destinationKey: "france--paris", name: "Paris", externalId: "fixture-paris-id"});
        const fixtures = new Map([[shanghaiSlug, shanghai], [parisSlug, paris]]);
        const detailCalls = [];
        api.publicApi.defaults.adapter = async config => {
            let data;
            if (config.url.startsWith("/itineraries/slug/")) {
                const slug = config.url.slice("/itineraries/slug/".length);
                detailCalls.push([slug, config.params.lang]);
                data = fixtures.get(slug);
            } else if (config.url.endsWith("/favorites/count")) data = {count: 0};
            else if (config.url.endsWith("/comments")) data = {content: []};
            else throw new Error(`Unexpected public request ${config.url}`);
            return {data, status: 200, headers: {}, config};
        };
        api.api.defaults.adapter = async () => {throw new Error("Unexpected private request");};
        axios.defaults.adapter = async config => ({data: {conversion_rates: {USD: 1}}, status: 200, headers: {}, config});
        const initialData = {type: "official-itinerary", slug: shanghaiSlug, language: "en", detail: shanghai};
        let navigate;
        function Capture() {navigate = useNavigate(); return null;}
        const tree = initial => React.createElement(React.StrictMode, null,
            React.createElement("div", {id: "page"},
                React.createElement(MemoryRouter, {initialEntries: [`/itinerary/${shanghaiSlug}`]},
                    React.createElement(PrerenderDataProvider, {initialData: initial},
                        React.createElement(Capture), React.createElement(Routes, null,
                            React.createElement(Route, {path: "/itinerary/:slug", element: React.createElement(ItineraryPage)}))))));
        const markup = renderToString(tree(initialData));
        assert.ok(!markup.includes('type="date"'), "closed prerender drawer contains no build-time dates");
        Object.assign(globalThis, {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
        const opened = [];
        window.open = (...args) => {opened.push(args); return null;};
        const {hydrateRoot, createRoot} = await import("react-dom/client");
        const start = markup.indexOf('<div id="page">');
        document.head.innerHTML = markup.slice(0, start);
        document.body.innerHTML = '<main id="mount">' + markup.slice(start) + '</main>';
        const hydrationErrors = [];
        await React.act(async () => {root = hydrateRoot(document.getElementById("mount"), tree(initialData), {onRecoverableError: error => hydrationErrors.push(error.message)});});
        assert.deepEqual(hydrationErrors, []);
        assert.equal(detailCalls.length, 0);
        const buttons = () => [...document.querySelectorAll("button")];
        const click = async text => {await React.act(async () => buttons().find(button => button.textContent === text).click());};
        const openHotel = () => click(i18n.t("itineraryPage.findHotels"));
        const search = () => click(i18n.t("tripPrepRail.mainFrame.search"));
        const drawer = () => document.querySelector('[role="dialog"]');
        const values = () => [...drawer().querySelectorAll('input[type="text"], input[type="date"]')].map(input => input.value);
        const changeInput = async (input, value) => {
            await React.act(async () => {
                Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, value);
                input.dispatchEvent(new dom.window.Event("input", {bubbles: true}));
                input.dispatchEvent(new dom.window.Event("change", {bubbles: true}));
            });
        };
        const selectAge = async value => {await React.act(async () => {
            const select = document.querySelector("select");
            select.value = value;
            select.dispatchEvent(new dom.window.Event("change", {bubbles: true}));
        });};
        await openHotel();
        const initialValues = values();
        assert.deepEqual(initialValues, ["Shanghai", "2026-11-01", "2026-11-05"]);
        await changeInput(drawer().querySelectorAll('input[type="date"]')[0], "2026-11-10");
        assert.equal(values()[2], "2026-11-14", "generated checkout follows edited check-in");
        await changeInput(drawer().querySelectorAll('input[type="date"]')[1], "2026-11-20");
        await click(i18n.t("tripPrepRail.drawer.close"));
        await openHotel();
        assert.deepEqual(values(), ["Shanghai", "2026-11-10", "2026-11-20"]);
        await changeInput(drawer().querySelector('input[type="text"]'), "Edited destination");
        await search();
        assert.equal(opened.length, 0);
        assert.equal(document.querySelector('[role="alert"]').textContent, i18n.t("tripPrepRail.hotel.destinationMismatch"));
        assert.equal(values()[0], "Edited destination");
        await changeInput(drawer().querySelector('input[type="text"]'), "Shanghai");
        await changeInput(drawer().querySelectorAll('input[type="number"]')[2], "1");
        await search();
        assert.equal(opened.length, 0);
        assert.ok(document.querySelector("select"), "missing age keeps drawer open");
        await selectAge("<1");
        assert.equal(document.querySelector("select").value, "<1");
        await search();
        assert.equal(opened.length, 1);
        assert.equal(new URL(opened[0][0]).searchParams.get("ages"), "0");
        await openHotel();
        assert.equal(document.querySelector("select").value, "<1", "handoff does not change UI age state");
        opened.length = 0;
        await selectAge("6");
        await changeInput(drawer().querySelectorAll('input[type="number"]')[0], "2");
        await changeInput(drawer().querySelectorAll('input[type="number"]')[1], "4");
        await React.act(async () => {
            for (const input of drawer().querySelectorAll('input[type="checkbox"]')) input.click();
        });
        await search();
        assert.equal(opened.length, 1);
        assert.deepEqual(opened[0].slice(1), ["_blank", "noopener,noreferrer"]);
        let url = new URL(opened[0][0]);
        for (const [key, value] of Object.entries({Allianceid: "9927800", SID: "327885881", trip_sub1: "", trip_sub3: "D19155586"})) {
            assert.deepEqual(url.searchParams.getAll(key), [value]);
        }
        assert.equal(url.searchParams.get("cityId"), "2");
        assert.equal(url.searchParams.get("cityName"), "Shanghai");
        assert.equal(url.searchParams.get("destName"), "Shanghai");
        assert.equal(url.searchParams.get("crn"), "2");
        assert.equal(url.searchParams.get("adult"), "4");
        assert.equal(url.searchParams.get("children"), "1");
        assert.equal(url.searchParams.get("ages"), "6");
        assert.equal(url.searchParams.get("checkin"), "2026-11-10");
        assert.equal(url.searchParams.get("checkout"), "2026-11-20");
        assert.equal(url.searchParams.get("listFilters"), "5~1*5*1,23~10*23*10");
        assert.equal(document.querySelectorAll('input[type="date"]').length, 0);
        await React.act(async () => navigate(`/itinerary/${parisSlug}`));
        await openHotel();
        assert.deepEqual(values(), ["Paris", "2026-11-01", "2026-11-05"], "a new itinerary discards prior overrides");
        await search();
        url = new URL(opened[1][0]);
        assert.equal(url.searchParams.get("cityId"), "fixture-paris-id");
        assert.equal(url.searchParams.get("cityName"), "Paris");
        assert.ok(!url.href.includes("Shanghai"));
        assert.ok(!url.searchParams.has("children") && !url.searchParams.has("ages"));
        // Same-itinerary localization must not lose user edits through the loading/unmount branch.
        await openHotel();
        await changeInput(drawer().querySelectorAll('input[type="date"]')[0], "2026-11-12");
        await React.act(async () => i18n.changeLanguage("fr"));
        await openHotel();
        assert.equal(values()[1], "2026-11-12");
        await search();
        assert.equal(opened.length, 3);
        // The same canonical itinerary can now be unavailable; do not invent a fallback ID.
        for (const destination of [{...shanghaiDestination, status: "SKIPPED", externalId: null}, null]) {
            fixtures.set(shanghaiSlug, {...shanghai, hotelDestination: destination});
            await React.act(async () => navigate(`/itinerary/${shanghaiSlug}`));
            await openHotel();
            await search();
            assert.equal(opened.length, 3);
            assert.equal(document.querySelector('[role="alert"]').textContent, i18n.t("tripPrepRail.hotel.destinationUnavailable"));
            assert.equal(document.querySelectorAll('input[type="date"]').length, 2);
            await React.act(async () => navigate(`/itinerary/${parisSlug}`));
        }
        await React.act(async () => root.unmount()); root = null;
        await i18n.changeLanguage("en");
        fixtures.set(shanghaiSlug, shanghai);
        document.head.innerHTML = "";
        document.body.innerHTML = '<main id="mount"></main>';
        root = createRoot(document.getElementById("mount"));
        await React.act(async () => root.render(tree(null)));
        await openHotel();
        assert.deepEqual(values(), initialValues, "normal client fetching and bootstrap hydration initialize equivalent defaults");
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        axios.defaults.adapter = previousAdapter;
        await vite.close(); dom.window.close();
        for (const [key, value] of Object.entries(previousGlobals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
        t.mock.timers.reset();
    }
});
