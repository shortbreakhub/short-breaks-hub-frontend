import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {FRANCE_DESTINATIONS} from "../src/components/home/atlas/franceDestinations.js";
import {UK_DESTINATIONS} from "../src/components/home/atlas/ukDestinations.js";
import {getOfficialItineraryPath} from "../src/utils/publicNavigation.js";

// Issue #44 inventory: IDs 78–83, literal official API slugs confirmed against the live API and prerender.
const OFFICIAL = {
    paris: "4-days-paris-where-icons-meet-everyday-grace",
    nice: "3-days-nice-where-light-teaches-you-to-slow",
    lyon: "3-days-lyon-where-food-gives-structure-to-time",
    bordeaux: "3-days-bordeaux-where-the-river-teaches-patience",
    strasbourg: "3-days-strasbourg-where-borders-learn-to-breathe",
    marseille: "3-days-marseille-where-the-sea-refuses-to-be-quiet",
};
const FRANCE_ART = "src/assets/atlas/countries/france/france-atlas.png";
const box = area => ({left: area.artworkPosition.x - area.hitArea.width / 2, right: area.artworkPosition.x + area.hitArea.width / 2,
    top: area.artworkPosition.y - area.hitArea.height / 2, bottom: area.artworkPosition.y + area.hitArea.height / 2});
const ssrServer = () => createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
    optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});

test("approved France artwork is the unchanged 1536×1024 owner file", () => {
    const png = readFileSync(FRANCE_ART);
    assert.equal(png.length, 3_571_047);
    assert.equal(png.readUInt32BE(16), 1536); assert.equal(png.readUInt32BE(20), 1024);
    assert.equal(createHash("sha256").update(png).digest("hex"), "ba1021e1cac38e82797b8b098004d701b7034d79a214ee163450ca6c6af9893d");
});

test("France atlas maps exactly six destinations to their literal official itinerary slugs", () => {
    assert.equal(FRANCE_DESTINATIONS.length, 6);
    assert.deepEqual(Object.fromEntries(FRANCE_DESTINATIONS.map(d => [d.id, d.slug])), OFFICIAL);
    const data = readFileSync("src/components/home/atlas/franceDestinations.js", "utf8");
    for (const slug of Object.values(OFFICIAL)) assert.ok(data.includes(`'${slug}'`), `${slug} is stored literally`);
    assert.doesNotMatch(data, /toLowerCase|formatSlug|getCountrySlug|\.replace\(/);
    for (const d of FRANCE_DESTINATIONS) assert.equal(d.labelKey, `homeMagazine.atlas.francePlaces.${d.id}`);
});

test("every France slug is a prerendered official itinerary in the France inventory", {skip: !existsSync("dist/browse/france/index.html") && "requires a production build"}, () => {
    const html = readFileSync("dist/browse/france/index.html", "utf8");
    const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(data.items.map(item => item.slug).sort(), Object.values(OFFICIAL).sort());
    for (const slug of Object.values(OFFICIAL)) {
        const detail = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
        assert.match(detail, new RegExp(`<link rel="canonical" href="https://www\\.shortbreakhub\\.com${getOfficialItineraryPath(slug)}"`));
    }
});

test("each France destination has an in-bounds landmark and name plate, never overlapping another destination", () => {
    const regions = [];
    for (const destination of FRANCE_DESTINATIONS) {
        assert.deepEqual(destination.hitAreas.map(area => area.kind), ["landmark", "plate"]);
        for (const area of destination.hitAreas) {
            const {left, right, top, bottom} = box(area);
            assert.ok(left >= 0 && right <= 1 && top >= 0 && bottom <= 1, `${area.id} stays inside the artwork`);
            regions.push({id: destination.id, ...box(area)});
        }
    }
    assert.equal(new Set(FRANCE_DESTINATIONS.flatMap(d => d.hitAreas.map(area => area.id))).size, 12);
    for (const a of regions) for (const b of regions) {
        if (a.id >= b.id) continue;
        assert.equal(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom, false, `${a.id} and ${b.id} hit regions overlap`);
    }
    // The bay between Marseille and Nice stays unassigned (Calanques remain decorative).
    const right = id => Math.max(...regions.filter(r => r.id === id).map(r => r.right));
    const left = id => Math.min(...regions.filter(r => r.id === id).map(r => r.left));
    assert.ok(left("nice") - right("marseille") >= 39 / 1536, "Nice and Marseille keep their measured gap");
});

test("France caption, story and interaction strings are localized without touching slugs", () => {
    const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")).homeMagazine.atlas;
    const fr = JSON.parse(readFileSync("src/locales/fr/common.json", "utf8")).homeMagazine.atlas;
    assert.equal(en.franceCaption, "FRANCE"); assert.equal(fr.franceCaption, "FRANCE");
    assert.equal(en.franceStory, "Where time slows, and beauty learns to stay.");
    assert.equal(fr.franceStory, "Là où le temps ralentit, et où la beauté apprend à rester.");
    assert.equal(en.franceDestinations, "Explore France itineraries");
    assert.equal(fr.franceDestinations, "Explorer les itinéraires en France");
    for (const lang of [en, fr]) {
        assert.ok(lang.franceMapLabel && lang.francePreviewAlt);
        assert.deepEqual(Object.keys(lang.francePlaces).sort(), Object.keys(OFFICIAL).sort());
    }
});

test("France and UK scenes share one configuration-driven layer", async t => {
    const vite = await ssrServer();
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: CountryDestinations} = await vite.ssrLoadModule("/src/components/home/atlas/CountryDestinations.jsx");
        const {COUNTRY_SCENES, sceneForCountry} = await vite.ssrLoadModule("/src/components/home/atlas/countryScenes.js");
        const {SCENE_ASSETS} = await vite.ssrLoadModule("/src/components/home/atlas/useAtlasScene.js");
        assert.deepEqual(Object.keys(COUNTRY_SCENES).filter(id => !COUNTRY_SCENES[id].region), ["uk", "france", "spain", "portugal", "germany", "greece", "italy", "netherlands", "switzerland"]);
        assert.deepEqual(Object.keys(SCENE_ASSETS).filter(id => id === 'europe' || (COUNTRY_SCENES[id] && !COUNTRY_SCENES[id].region)), ["europe", "uk", "france", "spain", "portugal", "germany", "greece", "italy", "netherlands", "switzerland"]);
        assert.equal(sceneForCountry("france"), "france"); assert.equal(sceneForCountry("united-kingdom"), "uk");
        assert.equal(sceneForCountry("italy"), "italy");
        assert.equal(sceneForCountry("austria"), undefined);
        assert.equal(COUNTRY_SCENES.uk.destinations.length, UK_DESTINATIONS.length);
        for (const [language, nav, action] of [["en", "Explore France itineraries", "View itinerary"], ["fr", "Explorer les itinéraires en France", "Voir l’itinéraire"]]) await t.test(language, async () => {
            await i18n.changeLanguage(language);
            const scene = COUNTRY_SCENES.france;
            const doc = new JSDOM(renderToStaticMarkup(React.createElement(CountryDestinations, {destinations: scene.destinations, navLabelKey: scene.keys.nav, map: null}))).window.document;
            assert.equal(doc.querySelectorAll("nav").length, 1);
            assert.equal(doc.querySelector("nav").getAttribute("aria-label"), nav);
            assert.equal(doc.querySelectorAll("nav a").length, 6);
            for (const destination of FRANCE_DESTINATIONS) {
                const link = doc.querySelector(`a[data-destination="${destination.id}"]`);
                assert.equal(link.getAttribute("href"), getOfficialItineraryPath(OFFICIAL[destination.id]));
                assert.equal(link.getAttribute("data-hit-area"), destination.hitAreas[0].id);
                assert.ok(link.getAttribute("aria-label").endsWith(` — ${action}`));
                assert.equal(link.querySelectorAll("a,button,[tabindex]").length, 0, "one tab stop per destination");
                assert.equal(link.querySelector(`[data-hit-area="${destination.hitAreas[1].id}"]`)?.getAttribute("aria-hidden"), "true");
                assert.equal(link.querySelector(".atlas-itinerary-callout").getAttribute("aria-hidden"), "true");
            }
            assert.equal(doc.querySelector('a[data-destination="paris"] .atlas-itinerary-callout').textContent.replace(/\s+/g, " ").trim(), `Paris · ${action} →`);
            assert.equal(doc.querySelector('a[data-destination="strasbourg"]').getAttribute("data-callout-align"), "end");
        });
        await i18n.changeLanguage("en");
    } finally {
        await vite.close();
    }
});

test("France artwork is lazy and hidden on the homepage and never warmed up after mount", async () => {
    const hook = readFileSync("src/components/home/atlas/useAtlasScene.js", "utf8");
    const preload = hook.slice(hook.indexOf("const preload=setTimeout"), hook.indexOf("},250);"));
    assert.match(preload, /loadAtlasArtwork\(ukUrl/);
    assert.doesNotMatch(preload, /france/i, "France loads only on selection, under cloud cover");
    const vite = await ssrServer();
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        await i18n.changeLanguage("en");
        const {default: Atlas} = await vite.ssrLoadModule("/src/components/home/AtlasStage.jsx");
        const doc = new JSDOM(renderToStaticMarkup(React.createElement(Atlas))).window.document;
        const france = doc.querySelector(".atlas-france-preview");
        assert.equal(france.getAttribute("loading"), "lazy"); assert.equal(france.hasAttribute("hidden"), true);
        assert.match(france.getAttribute("src"), /france-atlas/);
        assert.equal(france.getAttribute("alt"), "Illustrated France country story map");
        assert.equal(doc.querySelector(".atlas-stage").getAttribute("data-atlas-scene"), "europe");
        assert.equal(doc.querySelectorAll(".atlas-itinerary").length, 0, "no country itinerary links over Europe");
        assert.equal(doc.querySelector('[data-country="france"]').getAttribute("href"), "/browse/france", "crawlable native fallback is unchanged");
    } finally {
        await vite.close();
    }
});
