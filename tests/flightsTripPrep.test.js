import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {JSDOM} from "jsdom";
import {createServer} from "vite";
import i18n from "i18next";

test("Flights drawer preserves four supported controls and excludes cabin/baggage from EN/FR search state", async context => {
    context.mock.timers.enable({apis: ["Date"], now: new Date(2026, 9, 12, 12).getTime()});
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
    });
    const dom = new JSDOM('<div id="root"></div>', {url: "https://www.shortbreakhub.com"});
    const globals = Object.fromEntries(["window", "document", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
    const {createRoot} = await import("react-dom/client");
    let root;
    try {
        const {default: TripPrepRail} = await vite.ssrLoadModule("/src/components/TripPrepRail.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        for (const language of ["en", "fr"]) {
            await i18n.changeLanguage(language);
            const searches = [];
            const item = {id: "flights", title: "Flights", ctaLabel: "Open Flights", done: false,
                onSearch: (filters, context) => searches.push({filters, context})};
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(TripPrepRail,
                {city: "Shanghai", country: "China", days: 4, items: [item], onMarkDone() {}, onReset() {}, onMarkAllDone() {}})));
            const buttons = () => [...document.querySelectorAll("button")];
            const open = async () => React.act(async () => buttons().find(b => b.textContent === "Open Flights").click());
            await open();
            const dialog = () => document.querySelector('[role="dialog"]');
            assert.equal(dialog().querySelectorAll("select").length, 0);
            assert.equal(dialog().querySelectorAll("input").length, 5);
            assert.doesNotMatch(dialog().textContent, /Cabin class|Baggage|Économique|Bagages|Classe|tripPrepRail\.flights\.(cabin|bags)/);
            assert.equal(dialog().querySelector('input[type="checkbox"]').checked, false);
            assert.ok(dialog().textContent.includes(i18n.t("tripPrepRail.flights.directOnly")));
            for (const key of ["from", "to", "depart", "return"]) assert.ok(dialog().textContent.includes(i18n.t(`tripPrepRail.flights.${key}`)));
            const texts = [...dialog().querySelectorAll('input[type="text"]')];
            const dates = [...dialog().querySelectorAll('input[type="date"]')];
            assert.equal(texts[1].value, "Shanghai", "existing destination default is preserved");
            assert.deepEqual(dates.map(input => input.value), ["2026-11-12", "2026-11-16"]);
            const setValue = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
            for (const [input, value] of [[texts[0], "London (LHR)"], [texts[1], "Shanghai (PVG)"], [dates[0], "2026-11-01"], [dates[1], "2026-11-05"]]) {
                await React.act(async () => {
                    setValue.call(input, value);
                    input.dispatchEvent(new dom.window.Event(input.type === "date" ? "change" : "input", {bubbles: true}));
                });
            }
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.mainFrame.search")).click());
            assert.deepEqual(searches[0], {filters: {to: "Shanghai (PVG)", from: "London (LHR)", depart: "2026-11-01", return: "2026-11-05", nonstopOnly: false}, context: {city: "Shanghai", country: "China", days: 4}});
            assert.equal(document.querySelector('[role="dialog"]'), null);
            await open();
            assert.equal(dialog().querySelector('input[type="text"]').value, "London (LHR)", "supported values survive reopening");
            await React.act(async () => dialog().querySelector('input[type="checkbox"]').click());
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.drawer.close")).click());
            await open();
            assert.equal(dialog().querySelector('input[type="checkbox"]').checked, true, "Non-stop survives reopening");
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.mainFrame.search")).click());
            assert.equal(searches[1].filters.nonstopOnly, true);
            await open();
            await React.act(async () => dialog().querySelector('input[type="checkbox"]').click());
            assert.equal(dialog().querySelector('input[type="checkbox"]').checked, false);
            await React.act(async () => dialog().querySelector('input[type="checkbox"]').click());
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.mainFrame.resetFilters")).click());
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.mainFrame.search")).click());
            assert.equal(searches.length, 2, "reset clears dates and invalid dates cannot submit");
            assert.equal(dialog().querySelector('[role="alert"]').textContent, i18n.t("tripPrepRail.flights.missingOrigin"));
            assert.deepEqual([...dialog().querySelectorAll('input[type="date"]')].map(input => input.value), ["", ""]);
            assert.equal(dialog().querySelector('input[type="checkbox"]').checked, false, "Reset clears Non-stop");
            await React.act(async () => root.unmount());
            root = null;
        }
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        await vite.close();
        dom.window.close();
        for (const [key, value] of Object.entries(globals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});

test("Flights validates EN/FR dates, preserves edits and initializes new itinerary sessions", async context => {
    context.mock.timers.enable({apis: ["Date"], now: new Date(2026, 9, 12, 12).getTime()});
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
    });
    const dom = new JSDOM('<div id="root"></div>', {url: "https://www.shortbreakhub.com"});
    const globals = Object.fromEntries(["window", "document", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
    const {createRoot} = await import("react-dom/client");
    let root;
    try {
        const {default: TripPrepRail} = await vite.ssrLoadModule("/src/components/TripPrepRail.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        for (const language of ["en", "fr"]) {
            await i18n.changeLanguage(language);
            const searches = [];
            const item = {id: "flights", title: "Flights", ctaLabel: "Open Flights", done: false,
                onSearch: filters => searches.push(filters)};
            const props = {itinerarySlug: "first-trip", city: "Shanghai", country: "China", days: 2,
                items: [item], onMarkDone() {}, onReset() {}, onMarkAllDone() {}};
            root = createRoot(document.getElementById("root"));
            const render = async changes => React.act(async () => root.render(React.createElement(TripPrepRail, {...props, ...changes})));
            const buttons = () => [...document.querySelectorAll("button")];
            const open = async () => React.act(async () => buttons().find(b => b.textContent === "Open Flights").click());
            const search = async () => React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.mainFrame.search")).click());
            const dates = () => [...document.querySelectorAll('[role="dialog"] input[type="date"]')];
            const values = () => dates().map(input => input.value);
            const setValue = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
            const editDates = async (depart, returning) => {
                for (const [index, value] of [[0, depart], [1, returning]]) {
                    await React.act(async () => {
                        const input = dates()[index];
                        setValue.call(input, value);
                        input.dispatchEvent(new dom.window.Event("change", {bubbles: true}));
                    });
                }
            };
            await render({});
            assert.equal(document.querySelector('[role="dialog"]'), null, "dates are not rendered before opening");
            await open();
            assert.deepEqual(values(), ["2026-11-12", "2026-11-14"]);
            await React.act(async () => {
                const origin = document.querySelector('[role="dialog"] input[type="text"]');
                setValue.call(origin, "New York (JFK)");
                origin.dispatchEvent(new dom.window.Event("input", {bubbles: true}));
            });
            for (const [depart, returning, key] of [
                ["2026-11-12", "2026-11-12", "returnAfterDeparture"],
                ["2026-11-12", "2026-11-11", "returnAfterDeparture"],
                ["2026-10-11", "2026-11-13", "pastDeparture"],
                ["", "2026-11-13", "invalidDeparture"],
                ["2026-11-12", "", "invalidReturn"],
            ]) {
                await editDates(depart, returning);
                await search();
                assert.equal(searches.length, 0, "invalid dates never reach the booking callback");
                assert.equal(document.querySelector('[role="alert"]').textContent, i18n.t(`tripPrepRail.flights.${key}`));
                assert.ok(document.querySelector('[role="dialog"]'), "validation leaves the drawer open");
            }
            await editDates("2026-11-20", "2026-12-25");
            await render({days: 4});
            assert.deepEqual(values(), ["2026-11-20", "2026-12-25"], "ordinary rerenders do not enforce itinerary duration");
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.drawer.close")).click());
            await open();
            assert.deepEqual(values(), ["2026-11-20", "2026-12-25"], "close/reopen preserves user edits");
            await editDates("2026-11-20", "2026-11-21");
            await search();
            assert.equal(searches.length, 1);
            assert.deepEqual(searches[0], {to: "Shanghai", from: "New York (JFK)", depart: "2026-11-20", return: "2026-11-21", nonstopOnly: false});
            await open();
            await render({itinerarySlug: "second-trip", days: 7});
            assert.equal(document.querySelector('[role="dialog"]'), null, "route reuse closes stale Flights state");
            await open();
            assert.deepEqual(values(), ["2026-11-12", "2026-11-19"], "new itinerary uses its own actual duration");
            await render({});
            await open();
            assert.deepEqual(values(), ["2026-11-12", "2026-11-14"], "return navigation initializes a fresh itinerary session");
            await React.act(async () => root.unmount());
            root = null;
        }
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        await vite.close();
        dom.window.close();
        for (const [key, value] of Object.entries(globals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
