import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {JSDOM} from "jsdom";
import {createServer} from "vite";
import i18n from "i18next";

test("Hotel drawer and search state exclude the removed landmark field in English and French", async () => {
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
            const item = {id: "hotel", title: "Hotel", ctaLabel: "Open Hotel", done: false,
                onSearch: filters => searches.push(filters)};
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(TripPrepRail,
                {city: "Shanghai", country: "China", days: 4, items: [item], onMarkDone() {}, onReset() {}, onMarkAllDone() {}})));
            const buttons = () => [...document.querySelectorAll("button")];
            await React.act(async () => buttons().find(button => button.textContent === "Open Hotel").click());
            assert.doesNotMatch(document.body.textContent, /Near landmark|Près d’un lieu|KLCC|Shinjuku/);
            assert.equal(document.querySelectorAll('input[type="text"]').length, 1);
            assert.equal(document.querySelector('input[type="text"]').value, "Shanghai");
            assert.equal(document.querySelectorAll('input[type="date"]').length, 2);
            assert.equal(document.querySelectorAll('input[type="number"]').length, 3);
            assert.equal(document.querySelectorAll('input[type="checkbox"]').length, 2);
            assert.ok(document.body.textContent.includes("Shanghai"), "unrelated destination display remains intact");
            await React.act(async () => buttons().find(button => button.textContent === i18n.t("tripPrepRail.mainFrame.search")).click());
            assert.equal(searches.length, 1);
            assert.deepEqual([searches[0].rooms, searches[0].adults, searches[0].children, searches[0].childAges], [1, 2, 0, []]);
            assert.ok(!("landmark" in searches[0]));
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

test("Hotel child ages resize without invented defaults and validate only verified options", async () => {
    const {resizeHotelChildAges, validateHotelChildAges} = await import("../src/utils/hotelBooking.js");
    assert.deepEqual(resizeHotelChildAges(["6"], 2), ["6", null]);
    assert.deepEqual(resizeHotelChildAges(["6", "11"], 1), ["6"]);
    assert.deepEqual(resizeHotelChildAges(["6", "11"], 0), []);
    assert.deepEqual(resizeHotelChildAges(["<1"], 2), ["<1", null]);
    assert.equal(validateHotelChildAges({children: 2, childAges: ["6", "11"]}), null);
    assert.equal(validateHotelChildAges({children: 1, childAges: ["<1"]}), null);
    for (const ages of [["6", null], ["6"], ["6", "18"], ["6", "0"]]) {
        assert.equal(validateHotelChildAges({children: 2, childAges: ages}), "tripPrepRail.hotel.missingChildAges");
    }
    for (const count of [-1, 7, 1.5, ""]) {
        assert.equal(validateHotelChildAges({children: count}), "tripPrepRail.hotel.invalidChildren");
    }
});

test("Hotel selectors preserve explicit ages, block incomplete searches, and translate labels/feedback", async () => {
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
            const item = {id: "hotel", title: "Hotel", ctaLabel: "Open Hotel", done: false,
                onSearch: filters => searches.push(filters)};
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(TripPrepRail,
                {city: "Shanghai", country: "China", days: 4, items: [item], onMarkDone() {}, onReset() {}, onMarkAllDone() {}})));
            const button = text => [...document.querySelectorAll("button")].find(node => node.textContent === text);
            const click = async text => {await React.act(async () => button(text).click());};
            const selectors = () => [...document.querySelectorAll("select")];
            const changeChildren = async count => {
                const input = document.querySelectorAll('input[type="number"]')[2];
                await React.act(async () => {
                    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, String(count));
                    input.dispatchEvent(new dom.window.Event("input", {bubbles: true}));
                });
            };
            const selectAge = async (index, age) => {
                await React.act(async () => {
                    selectors()[index].value = age;
                    selectors()[index].dispatchEvent(new dom.window.Event("change", {bubbles: true}));
                });
            };
            await click("Open Hotel");
            assert.equal(selectors().length, 0);
            await changeChildren(1);
            assert.equal(selectors().length, 1);
            assert.deepEqual([...selectors()[0].options].slice(1).map(option => [option.value, option.textContent]),
                ["<1", ...Array.from({length: 17}, (_, i) => String(i + 1))].map(value => [value, value]));
            assert.equal(selectors()[0].value, "", "new children have no invented age");
            assert.ok(selectors()[0].required);
            assert.ok(document.body.textContent.includes(language === "en" ? "Child 1 age" : "Âge de l’enfant 1"));
            await selectAge(0, "6");
            await changeChildren(2);
            assert.deepEqual(selectors().map(select => select.value), ["6", ""]);
            assert.ok(document.body.textContent.includes(language === "en" ? "Child 2 age" : "Âge de l’enfant 2"));
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.equal(searches.length, 0);
            assert.equal(selectors().length, 2, "invalid search leaves drawer open");
            assert.equal(document.querySelector('[role="alert"]').textContent,
                language === "en" ? "Please select an age for each child." : "Veuillez sélectionner un âge pour chaque enfant.");
            assert.equal(selectors()[1].getAttribute("aria-invalid"), "true");
            await selectAge(1, "11");
            await changeChildren(6);
            assert.deepEqual(selectors().map(select => select.value), ["6", "11", "", "", "", ""]);
            await changeChildren(2);
            assert.deepEqual(selectors().map(select => select.value), ["6", "11"]);
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.equal(selectors().length, 0, "valid search closes drawer");
            assert.deepEqual(searches[0].childAges, ["6", "11"]);
            assert.equal(searches[0].children, 2);
            assert.ok(!("landmark" in searches[0]));
            await click("Open Hotel");
            assert.deepEqual(selectors().map(select => select.value), ["6", "11"]);
            await changeChildren(1);
            assert.deepEqual(selectors().map(select => select.value), ["6"]);
            await selectAge(0, "<1");
            await changeChildren(2);
            assert.deepEqual(selectors().map(select => select.value), ["<1", ""]);
            await changeChildren(1);
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.deepEqual(searches[1].childAges, ["<1"], "infant remains an explicit draft option, not numeric zero");
            await click("Open Hotel");
            await changeChildren(0);
            assert.equal(selectors().length, 0);
            await click(i18n.t("tripPrepRail.mainFrame.search"));
            assert.deepEqual(searches[2].childAges, []);
            assert.equal(searches[2].children, 0);
            await click("Open Hotel");
            await changeChildren(1);
            assert.equal(selectors()[0].value, "", "cleared ages must not return when adding a child again");
            await click(i18n.t("tripPrepRail.mainFrame.resetFilters"));
            assert.equal(selectors().length, 0);
            assert.doesNotMatch(document.body.textContent, /Near landmark|Près d’un lieu/);
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
