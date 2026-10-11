import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import React from "react";
import {renderToString} from "react-dom/server";
import {MemoryRouter} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";

// Issue #94: layout/styling redesign of the Create Itinerary editor; behaviour hooks unchanged.
const ssr = () => createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
    optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});

test("journal editor renders a landscape workspace with extras and actions below, in reading order", async () => {
    const vite = await ssr();
    try {
        const {default: Form} = await vite.ssrLoadModule("/src/components/CreateItineraryForm.jsx");
        const doc = new JSDOM(renderToString(React.createElement(MemoryRouter, {initialEntries: ["/create-itinerary"]}, React.createElement(Form)))).window.document;
        const root = doc.querySelector(".journal-editor");
        assert.ok(root.classList.contains("sbh-editorial"), "reuses the existing editorial tokens");
        const form = root.querySelector("fieldset.journal-editor__form");
        const workspace = form.querySelector(":scope > .journal-editor__workspace");
        const extras = form.querySelector(":scope > .journal-editor__extras");
        assert.deepEqual([...workspace.children].map(section => section.querySelector("h2").textContent), ["Basic info", "Day-by-Day plan"]);
        assert.deepEqual([...extras.children].map(section => section.querySelector("h2").textContent), ["Cover photo", "Extras"]);
        assert.deepEqual([...form.querySelectorAll("section h2")].map(h => h.textContent), ["Basic info", "Day-by-Day plan", "Cover photo", "Extras"],
            "DOM (reading and tab) order follows the visual layout");
        for (const h2 of form.querySelectorAll("section > h2, .journal-panel__header > h2")) assert.ok(h2.classList.contains("journal-panel__title"));
        // Existing behaviour hooks are all preserved.
        for (const field of ["title", "country", "region", "days", "priceFrom", "summary", "heroFile", "tags", "visibility", "currentTime-title", "currentTime-details"])
            assert.ok(doc.querySelector(`[data-field="${field}"]`), `data-field="${field}" preserved`);
        for (const action of ["add-day", "remove-day", "discard", "save-draft", "publish"])
            assert.ok(doc.querySelector(`[data-action="${action}"]`), `data-action="${action}" preserved`);
        assert.ok(doc.querySelector('[data-list="days"] [data-item="day"]'));
        assert.ok(doc.querySelector('[data-preview="hero"]'));
        assert.equal(doc.querySelector('[data-field="region"]').disabled, true, "region stays derived and read-only");
        // Actions sit below the form, outside the disabled fieldset, with a clear hierarchy.
        const actions = root.querySelector(":scope > .journal-actions");
        assert.ok(actions && !form.contains(actions));
        assert.deepEqual([...actions.querySelectorAll("button")].map(b => [b.dataset.action, b.className.split(" ").at(-1)]),
            [["discard", "journal-button--discard"], ["save-draft", "journal-button--draft"], ["publish", "journal-button--publish"]]);
        assert.equal(actions.querySelector('[data-action="discard"]').disabled, true, "discard remains disabled without a saved draft");
        assert.equal(doc.querySelector('[data-field="country"]').closest(".journal-field--country") !== null, true, "suggestions anchor to the country field");
        assert.equal(doc.querySelectorAll('img:not([alt="itinerary photo preview"])').length, 0, "no decorative images");
    } finally { await vite.close(); }
});

test("day entries use two-digit journal labels and keep the existing delete rule", async () => {
    const vite = await ssr();
    try {
        const {default: Day} = await vite.ssrLoadModule("/src/components/DayPlanTextArea.jsx");
        const render = (day, plan = "", submitted = false) => new JSDOM(renderToString(React.createElement(Day, {day, plan, title: "", submitted,
            handleUpdateDayPlanContent() {}, handleUpdateDayPlanTitle() {}, handleDeleteDay() {}}))).window.document;
        const first = render(1), fifth = render(5);
        assert.equal(first.querySelector(".journal-day h3.journal-day__label").textContent, "Day 01");
        assert.equal(fifth.querySelector("h3").textContent, "Day 05");
        assert.equal(first.querySelector('[data-action="delete-currentTime"]'), null, "day 1 has no delete (unchanged)");
        assert.ok(fifth.querySelector('[data-action="delete-currentTime"].journal-day__delete'));
        const invalid = render(2, "short", true);
        assert.match(invalid.querySelector(".journal-error").textContent, /^Please make sure your details description/, "existing message unchanged");
    } finally { await vite.close(); }
});

test("editor styles: responsive grid, growing day list, accessible focus and CSS-only decoration", () => {
    const css = readFileSync("src/styles/journal-editor.css", "utf8");
    assert.match(css, /width:\s*min\(100%,\s*85rem\)/, "landscape workspace about 1360px wide");
    assert.match(css, /@media \(min-width: 1024px\)\s*\{\s*\.journal-editor__workspace\s*\{\s*grid-template-columns:\s*minmax\(0, 43fr\) minmax\(0, 57fr\)/,
        "two columns (43/57) from 1024px, stacked below");
    const days = css.slice(css.indexOf(".journal-days {"), css.indexOf("}", css.indexOf(".journal-days {")));
    assert.doesNotMatch(days, /height|overflow/, "day plan grows naturally without inner scrolling");
    assert.match(css, /\.journal-input:focus-visible\s*\{\s*border-color:\s*var\(--je-green\);\s*outline:\s*none;\s*box-shadow:\s*0 0 0 3px/);
    assert.match(css, /\.journal-input\.border-red-700\s*\{\s*border-color:\s*var\(--sbh-error\)/, "existing validation state stays visible");
    assert.match(css, /\.journal-button:focus-visible/);
    assert.match(css, /\.journal-panel__title::after/, "bronze heading underline");
    assert.match(css, /\.journal-day::before/, "slim green day accent");
    assert.doesNotMatch(css, /url\(/, "no image assets");
    assert.doesNotMatch(css, /position:\s*sticky/, "actions are not sticky");
});
