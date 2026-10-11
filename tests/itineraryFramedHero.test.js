import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createServer} from "vite";
import React from "react";
import {renderToString} from "react-dom/server";
import {I18nextProvider} from "react-i18next";
import {JSDOM} from "jsdom";
import i18n from "i18next";

// Issue #92: the photograph is the only content inside the frame; all itinerary text follows below.
const siemReap = {
    id: 27, slug: "4-days-siem-reap-where-stone-remembers-light", title: "Siem Reap in 4 Days: Where Stone Remembers Light",
    city: "Siem Reap", country: "Cambodia", region: "southeast-asia", days: 4, priceFrom: 190,
    hero: "/src/assets/itineraries/cambodia/4-days-siem-reap-where-stone-remembers-light.jpg",
    summary: "Temples at their quietest hours.", highlights: [], schedule: [], mustTry: [], areas: [], places: [],
};
const props = data => ({
    data, planning: {bestTime: {}, worstTime: {}, tips: [], withKids: []}, transport: {arrival: [], gettingAround: [], dayTrips: [], dayMoves: []},
    city: data.city, likes: {liked: false, count: 0, saving: false}, onToggleLike() {}, fromAmount: "100", userCurrency: "USD",
    userCurrencyValue: "0", convertRate: 1, hotelBooking: {destination: data.city, rooms: 1, adults: 2, children: 0, childAges: []},
    onHotelOpen() {}, onHotelChange() {}, onHotelReset() {}, tripPrepItems: [], onMarkDone() {}, onReset() {}, onMarkAllDone() {},
});

test("framed hero keeps only the photograph inside the frame and all itinerary text below it", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: Page} = await vite.ssrLoadModule("/src/components/itinerary/ItineraryStoryPage.jsx");
        const render = data => new JSDOM(renderToString(React.createElement(I18nextProvider, {i18n}, React.createElement(Page, props(data))))).window.document;
        for (const [language, days, from, perPerson, excludes] of [
            ["en", "Days", "From", "per person", "Excludes flights and accommodation"],
            ["fr", "Jours", "À partir de", "par personne", "Vols et hébergement non inclus"],
        ]) await t.test(language, async () => {
            await i18n.changeLanguage(language);
            const doc = render({...siemReap, priceFrom: 237});
            const hero = doc.querySelector("section.itinerary-story__hero");
            const frame = hero.querySelector(":scope > figure.itinerary-story__frame");
            assert.ok(frame, "the photograph is presented in a semantic figure frame");
            assert.equal(frame.querySelectorAll("img").length, 1);
            assert.match(frame.querySelector("img").getAttribute("src"), /4-days-siem-reap-where-stone-remembers-light/);
            assert.equal(frame.querySelector("img").getAttribute("alt"), "");
            assert.equal(frame.querySelector("img").getAttribute("loading"), "eager");
            assert.equal(frame.textContent.trim(), "", "no text inside the frame");
            assert.equal(frame.querySelectorAll("h1,p,ul,li,figcaption").length, 0);
            assert.equal(hero.querySelector(".itinerary-story__hero-shade"), null, "no shade overlay over the photo");
            // Text block follows the frame, in the issue's editorial order, as real semantic HTML.
            const content = hero.querySelector(".itinerary-story__hero-content");
            assert.ok(frame.compareDocumentPosition(content) & doc.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
            const order = [".itinerary-story__hero-place", "h1#itinerary-story-title", ".itinerary-story__hero-meta", ".itinerary-story__hero-note"].map(s => content.querySelector(s));
            assert.ok(order.every(Boolean));
            for (let i = 1; i < order.length; i++) assert.ok(order[i - 1].compareDocumentPosition(order[i]) & doc.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
            assert.equal(order[0].textContent, "Siem Reap, Cambodia");
            assert.equal(order[1].textContent, siemReap.title);
            assert.equal(hero.getAttribute("aria-labelledby"), "itinerary-story-title");
            assert.deepEqual([...order[2].querySelectorAll("li")].map(li => li.textContent), [`4 ${days}`, `${from} $237 ${perPerson}`], "dynamic duration and price are unchanged");
            assert.equal(order[3].textContent, excludes);
        });
        await t.test("missing photograph falls back to text without an empty frame", async () => {
            await i18n.changeLanguage("en");
            const doc = render({...siemReap, hero: "/src/assets/itineraries/missing/does-not-exist.jpg"});
            const hero = doc.querySelector("section.itinerary-story__hero");
            assert.ok(hero.classList.contains("itinerary-story__hero--no-image"));
            assert.equal(hero.querySelector("figure, img"), null);
            assert.equal(hero.querySelector("h1").textContent, siemReap.title);
            assert.ok(hero.textContent.includes("From $190 per person"));
        });
        await t.test("long titles remain a single real heading", async () => {
            const title = "An Exceptionally Long Itinerary Title That Keeps Going to Test Elegant Wrapping Across Small Screens";
            const doc = render({...siemReap, title});
            assert.equal(doc.querySelectorAll("h1").length, 1);
            assert.equal(doc.querySelector("h1").textContent, title);
        });
    } finally { await i18n.changeLanguage("en"); await vite.close(); }
});

test("frame styling is fluid, layered and keeps text out of the photograph", () => {
    const css = readFileSync("src/styles/itinerary-story.css", "utf8");
    assert.match(css, /--frame-black:\s*#252725/);
    assert.match(css, /--mat-ivory:\s*#f7f2e8/);
    assert.match(css, /--frame-width:\s*clamp\(/, "frame thickness scales with the viewport");
    assert.match(css, /--mat-width:\s*clamp\(/, "mat width scales with the viewport");
    assert.match(css, /--hero-width:\s*min\([^;]*svh/, "frame width is bounded by viewport height to keep the title on the first screen");
    assert.match(css, /aspect-ratio:\s*3 \/ 2 !important/, "phones use a slightly taller photo window");
    const content = css.slice(css.indexOf(".itinerary-story__hero .itinerary-story__hero-content {"));
    assert.doesNotMatch(content.slice(0, content.indexOf("}")), /position:\s*absolute/, "text is never positioned over the photo");
    assert.doesNotMatch(css, /itinerary-story__hero-shade/);
    assert.doesNotMatch(css, /url\(/, "no static frame-image overlay");
});
