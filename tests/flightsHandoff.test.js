import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import React from "react";
import {MemoryRouter, Routes, Route} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import axios from "axios";

test("experimental Flights preserves inputs and tracking IDs through safe external navigation", async context => {
    context.mock.timers.enable({apis: ["Date"], now: new Date(2026, 9, 12, 12).getTime()});
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}, noExternal: ["lottie-react"]},
        plugins: [{name: "test-loading-animation", enforce: "pre",
            resolveId(id) {if (id === "lottie-react") return "\0test-loading-animation";},
            load(id) {if (id === "\0test-loading-animation") return 'export default function LoadingAnimation(){return "Loading itinerary";}';},
        }],
    });
    const dom = new JSDOM('<div id="root"></div>', {url: "https://www.shortbreakhub.com", pretendToBeVisual: true});
    const globals = Object.fromEntries(["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    const adapter = axios.defaults.adapter;
    let root;
    try {
        Object.assign(globalThis, {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
        const opened = [];
        window.open = (...args) => {opened.push(args); return null;};
        const {createRoot} = await import("react-dom/client");
        const {default: ItineraryPage} = await vite.ssrLoadModule("/src/pages/ItineraryPage.jsx");
        const {PrerenderDataProvider} = await vite.ssrLoadModule("/src/context/PrerenderDataContext.jsx");
        const api = await vite.ssrLoadModule("/src/api.js");
        await vite.ssrLoadModule("/src/i18n.js");
        const slug = "4-days-shanghai-where-the-future-never-waits";
        const html = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
        const fixture = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
        api.publicApi.defaults.adapter = async config => {
            let data;
            if (config.url.startsWith("/itineraries/slug/")) data = fixture.detail;
            else if (config.url.endsWith("/favorites/count")) data = {count: 0};
            else if (config.url.endsWith("/comments")) data = {content: []};
            else throw new Error(`Unexpected public request ${config.url}`);
            return {data, status: 200, headers: {}, config};
        };
        api.api.defaults.adapter = async () => {throw new Error("Unexpected private request");};
        axios.defaults.adapter = async config => ({data: {conversion_rates: {USD: 1}}, status: 200, headers: {}, config});
        for (const language of ["en", "fr"]) {
            const openedBefore = opened.length;
            await i18n.changeLanguage(language);
            root = createRoot(document.getElementById("root"));
            const tree = React.createElement(MemoryRouter, {initialEntries: [`/itinerary/${slug}`]},
                React.createElement(PrerenderDataProvider, {initialData: {...fixture, language}},
                    React.createElement(Routes, null, React.createElement(Route, {path: "/itinerary/:slug", element: React.createElement(ItineraryPage)}))));
            await React.act(async () => root.render(tree));
            const click = async text => React.act(async () => [...document.querySelectorAll("button")].find(b => b.textContent === text).click());
            await click(i18n.t("itineraryPage.findFlights"));
            const dialog = () => document.querySelector('[role="dialog"]');
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.equal(document.querySelector('[role="alert"]').textContent, i18n.t("tripPrepRail.flights.missingOrigin"));
            await React.act(async () => {
                const input = dialog().querySelector('input[type="text"]');
                Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, "Unknown City");
                input.dispatchEvent(new dom.window.Event("input", {bubbles: true}));
                dialog().querySelector('input[type="checkbox"]').click();
            });
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.equal(dialog().querySelector('[role="alert"]').textContent, i18n.t("tripPrepRail.flights.invalidOrigin"));
            assert.equal(opened.length, openedBefore);
            assert.equal(dialog().querySelector('input[type="text"]').value, "Unknown City");
            assert.deepEqual([...dialog().querySelectorAll('datalist option')].map(option => option.value), ["London", "Manchester", "Birmingham", "Paris"]);
            await React.act(async () => {
                const input = dialog().querySelector('input[type="text"]');
                Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, "london");
                input.dispatchEvent(new dom.window.Event("input", {bubbles: true}));
            });
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.equal(dialog(), null);
            const [href, target, features] = opened.at(-1);
            const url = new URL(href);
            assert.equal(url.origin, "https://www.trip.com");
            assert.equal(target, "_blank");
            assert.equal(features, "noopener,noreferrer");
            for (const [key, value] of Object.entries({dcity: "LON", acity: "PVG", ddate: "2026-11-12", rdate: "2026-11-16", nonstoponly: "on", Allianceid: "9927800", SID: "327885881"})) assert.equal(url.searchParams.get(key), value);
            assert.equal(url.searchParams.has("trip_sub3"), false);
            await click(i18n.t("itineraryPage.findFlights"));
            assert.equal(dialog().querySelector('input[type="checkbox"]').checked, true);
            assert.equal(dialog().querySelector('input[type="text"]').value, "london", "readable input survives handoff and reopening");
            await click(i18n.t("tripPrepRail.drawer.close"));
            await click(i18n.t("itineraryPage.findCarRentals"));
            assert.equal(dialog().querySelectorAll('input[type="datetime-local"]').length, 2);
            assert.equal(dialog().querySelectorAll("input").length, 2);
            assert.equal(dialog().querySelector("select"), null);
            assert.ok(dialog().textContent.includes("Shanghai Pudong International Airport (PVG)"));
            assert.equal(dialog().querySelector('[role="alert"]'), null, "Flights errors do not leak into Car Rental");
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            const carUrl = new URL(opened.at(-1)[0]);
            assert.equal(carUrl.pathname, "/carhire/online/list/");
            assert.equal(carUrl.searchParams.get("pcode"), "PVG");
            assert.equal(carUrl.searchParams.get("ptime"), "2026/11/12 10:00");
            assert.equal(carUrl.searchParams.get("rtime"), "2026/11/16 10:00");
            assert.equal(carUrl.searchParams.get("trip_sub3"), "D20194372");
            assert.deepEqual(opened.at(-1).slice(1), ["_blank", "noopener,noreferrer"]);
            await click(i18n.t("itineraryPage.findCarRentals"));
            assert.deepEqual([...dialog().querySelectorAll("input")].map(input=>input.value), ["2026-11-12T10:00", "2026-11-16T10:00"]);
            await click(i18n.t("tripPrepRail.drawer.close"));
            await click(i18n.t("itineraryPage.findParking"));
            assert.deepEqual([...dialog().querySelector("select").options].map(option => option.value), ["", "parking"]);
            assert.equal(dialog().querySelector('[role="alert"]'), null);
            await click(i18n.t("tripPrepRail.drawer.close"));
            const transferCard = [...document.querySelectorAll(".itinerary-prep-rail__task")].find(card => card.textContent.includes(i18n.t("itineraryPage.airportTransfer")));
            assert.ok(transferCard);
            assert.equal(transferCard.querySelector(".itinerary-prep-rail__status").textContent.trim(), i18n.t("tripPrepRail.statusPill.optional"));
            await click(i18n.t("itineraryPage.findAirportTransfer"));
            assert.equal(dialog(), null, "Airport Transfer opens no booking drawer");
            assert.deepEqual(opened.at(-1), ["https://www.trip.com/airport-transfers/?Allianceid=9927800&SID=327885881&trip_sub1=&trip_sub3=D20194372", "_blank", "noopener,noreferrer"]);
            const attractionsCard = [...document.querySelectorAll(".itinerary-prep-rail__task")].find(card => card.textContent.includes(i18n.t("itineraryPage.attractions")));
            assert.equal(attractionsCard.querySelector(".itinerary-prep-rail__status").textContent.trim(), i18n.t("tripPrepRail.statusPill.optional"));
            await click(i18n.t("itineraryPage.exploreAttractions"));
            assert.equal(dialog(), null);
            const attractionsUrl = new URL(opened.at(-1)[0]);
            assert.equal(attractionsUrl.searchParams.get("keyword"), fixture.detail.hotelDestination.name);
            assert.equal(attractionsUrl.searchParams.get("trip_sub3"), "D20194372");
            assert.deepEqual(opened.at(-1).slice(1), ["_blank", "noopener,noreferrer"]);
            await click(i18n.t("tripPrepRail.mainFrame.markAllDone"));
            assert.ok(document.querySelector(".itinerary-prep-rail__overview").textContent.includes("6/6"));
            assert.ok(document.querySelector(".itinerary-prep-rail__next").textContent.includes(i18n.t("tripPrepRail.mainFrame.goodToGo")));
            const progress = JSON.parse(localStorage.getItem(`tripPrep:v1:${slug}`));
            assert.equal(progress.done.localTransport, false);
            assert.equal(transferCard.querySelector(".itinerary-prep-rail__status").textContent.trim(), i18n.t("tripPrepRail.statusPill.optional"));
            await React.act(async () => root.unmount());
            root = null;
        }
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        axios.defaults.adapter = adapter;
        await vite.close();
        dom.window.close();
        for (const [key, value] of Object.entries(globals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
