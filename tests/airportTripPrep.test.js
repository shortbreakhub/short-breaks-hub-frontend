import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {JSDOM} from "jsdom";
import {createServer} from "vite";
import i18n from "i18next";

test("Airport booking removes Shuttle but preserves Parking and Transfers in English and French", async () => {
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
            const item = {id: "airport", title: "Airport", ctaLabel: "Open Airport", done: false,
                hint: i18n.t("itineraryPage.airportHint"), onSearch: filters => searches.push(filters)};
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(TripPrepRail,
                {city: "Shanghai", country: "China", days: 4, items: [item], onMarkDone() {}, onReset() {}, onMarkAllDone() {}})));
            const buttons = () => [...document.querySelectorAll("button")];
            await React.act(async () => buttons().find(b => b.textContent === "Open Airport").click());
            const dialog = document.querySelector('[role="dialog"]');
            const select = dialog.querySelector("select");
            assert.deepEqual([...select.options].map(o => o.value), ["", "parking", "transfer"]);
            assert.ok(dialog.textContent.includes(i18n.t("tripPrepRail.parking.transfer")));
            assert.doesNotMatch(document.body.textContent, /Shuttle|Navette|navette|shuttle/);
            assert.equal(dialog.querySelectorAll('input[type="text"]').length, 3);
            for (const type of ["parking", "transfer"]) {
                await React.act(async () => {
                    select.value = type;
                    select.dispatchEvent(new dom.window.Event("change", {bubbles: true}));
                });
            }
            await React.act(async () => buttons().find(b => b.textContent === i18n.t("tripPrepRail.mainFrame.search")).click());
            assert.deepEqual(searches, [{type: "transfer"}], "the separate Transfer choice still submits");
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
