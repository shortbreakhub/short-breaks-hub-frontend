import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {SPAIN_DESTINATIONS} from "../src/components/home/atlas/spainDestinations.js";
import {getOfficialItineraryPath} from "../src/utils/publicNavigation.js";
import {createAtlasSceneTransition} from "../src/components/home/atlas/atlasSceneTransition.js";

// Issue #46 inventory: literal official API slugs confirmed against the live API and prerender.
const OFFICIAL = {
    barcelona: "4-days-barcelona-between-order-and-instinct",
    madrid: "4-days-madrid-after-dark-the-city-wakes",
    valencia: "3-days-valencia-light-space-and-forward-motion",
    cordoba: "2-days-cordoba-enclosure-shade-and-proportion",
    seville: "4-days-seville-living-by-ritual-and-heat",
    granada: "3-days-granada-water-shadow-and-patience",
    malaga: "3-days-malaga-sun-ground-and-everyday-life",
};
const NAMES = {barcelona: "Barcelona", madrid: "Madrid", valencia: "Valencia", cordoba: "Córdoba", seville: "Seville", granada: "Granada", malaga: "Málaga"};
const SPAIN_ART = "src/assets/atlas/countries/spain/spain-atlas.png";
const box = area => ({left: area.artworkPosition.x - area.hitArea.width / 2, right: area.artworkPosition.x + area.hitArea.width / 2,
    top: area.artworkPosition.y - area.hitArea.height / 2, bottom: area.artworkPosition.y + area.hitArea.height / 2});
const ssrServer = () => createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
    optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});

test("approved Spain artwork is the unchanged 1536×1024 owner file", () => {
    const png = readFileSync(SPAIN_ART);
    assert.equal(png.readUInt32BE(16), 1536); assert.equal(png.readUInt32BE(20), 1024);
    assert.equal(createHash("sha256").update(png).digest("hex"), "815fa0c3692352824b7acccda1b02a0d13ad2f3b4a2a2ac131e6e8d9b9ec25a6");
});

test("Spain atlas maps exactly seven destinations to their literal official itinerary slugs", () => {
    assert.equal(SPAIN_DESTINATIONS.length, 7);
    assert.deepEqual(Object.fromEntries(SPAIN_DESTINATIONS.map(d => [d.id, d.slug])), OFFICIAL);
    const data = readFileSync("src/components/home/atlas/spainDestinations.js", "utf8");
    for (const slug of Object.values(OFFICIAL)) assert.ok(data.includes(`'${slug}'`), `${slug} is stored literally`);
    assert.doesNotMatch(data, /toLowerCase|formatSlug|getCountrySlug|\.replace\(|normalize\(/);
    for (const d of SPAIN_DESTINATIONS) assert.equal(d.labelKey, `homeMagazine.atlas.spainPlaces.${d.id}`);
});

test("every Spain slug is a prerendered official itinerary in the Spain inventory", {skip: !existsSync("dist/browse/spain/index.html") && "requires a production build"}, () => {
    const html = readFileSync("dist/browse/spain/index.html", "utf8");
    const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(data.items.map(item => item.slug).sort(), Object.values(OFFICIAL).sort());
    for (const slug of Object.values(OFFICIAL)) {
        const detail = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
        assert.match(detail, new RegExp(`<link rel="canonical" href="https://www\\.shortbreakhub\\.com${getOfficialItineraryPath(slug)}"`));
    }
});

test("each Spain destination has an in-bounds landmark and name plate; dense Andalusia never overlaps", () => {
    const regions = [];
    for (const destination of SPAIN_DESTINATIONS) {
        assert.deepEqual(destination.hitAreas.map(area => area.kind), ["landmark", "plate"]);
        for (const area of destination.hitAreas) {
            const {left, right, top, bottom} = box(area);
            assert.ok(left >= 0 && right <= 1 && top >= 0 && bottom <= 1, `${area.id} stays inside the artwork`);
            regions.push({id: destination.id, ...box(area)});
        }
    }
    assert.equal(new Set(SPAIN_DESTINATIONS.flatMap(d => d.hitAreas.map(area => area.id))).size, 14);
    for (const a of regions) for (const b of regions) {
        if (a.id >= b.id) continue;
        assert.equal(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom, false, `${a.id} and ${b.id} hit regions overlap`);
    }
    // Córdoba's plate and Seville's cathedral keep their measured gap.
    const cordobaRight = Math.max(...regions.filter(r => r.id === "cordoba").map(r => r.right));
    const sevilleLeft = Math.min(...regions.filter(r => r.id === "seville" && r.top < 600 / 1024).map(r => r.left));
    assert.ok(sevilleLeft - cordobaRight >= 9 / 1536, "Córdoba and Seville stay separated");
});

test("Spain caption, story and interaction strings are localized without touching slugs", () => {
    const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")).homeMagazine.atlas;
    const fr = JSON.parse(readFileSync("src/locales/fr/common.json", "utf8")).homeMagazine.atlas;
    assert.equal(en.spainCaption, "SPAIN"); assert.equal(fr.spainCaption, "ESPAGNE");
    assert.equal(en.spainStory, "Where the sun lingers, and every evening begins again.");
    assert.equal(fr.spainStory, "Là où le soleil s’attarde, et où chaque soir recommence.");
    assert.equal(en.spainDestinations, "Explore Spain itineraries");
    assert.equal(fr.spainDestinations, "Explorer les itinéraires en Espagne");
    for (const lang of [en, fr]) {
        assert.ok(lang.spainMapLabel && lang.spainPreviewAlt);
        assert.deepEqual(lang.spainPlaces, NAMES, "accents preserved in Córdoba and Málaga");
    }
});

test("Spain is configuration only: same scene config, layer and stage", async t => {
    const stage = readFileSync("src/components/home/AtlasStage.jsx", "utf8");
    assert.doesNotMatch(stage, /spain/i, "AtlasStage has no Spain-specific branch");
    const vite = await ssrServer();
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: CountryDestinations} = await vite.ssrLoadModule("/src/components/home/atlas/CountryDestinations.jsx");
        const {COUNTRY_SCENES, sceneForCountry} = await vite.ssrLoadModule("/src/components/home/atlas/countryScenes.js");
        const {SCENE_ASSETS} = await vite.ssrLoadModule("/src/components/home/atlas/useAtlasScene.js");
        assert.equal(sceneForCountry("spain"), "spain");
        assert.equal(COUNTRY_SCENES.spain.previewClass, "atlas-spain-preview");
        assert.match(SCENE_ASSETS.spain, /spain-atlas/);
        for (const [language, nav, action] of [["en", "Explore Spain itineraries", "View itinerary"], ["fr", "Explorer les itinéraires en Espagne", "Voir l’itinéraire"]]) await t.test(language, async () => {
            await i18n.changeLanguage(language);
            const scene = COUNTRY_SCENES.spain;
            const doc = new JSDOM(renderToStaticMarkup(React.createElement(CountryDestinations, {destinations: scene.destinations, navLabelKey: scene.keys.nav, map: null}))).window.document;
            assert.equal(doc.querySelectorAll("nav").length, 1);
            assert.equal(doc.querySelector("nav").getAttribute("aria-label"), nav);
            assert.equal(doc.querySelectorAll("nav a").length, 7);
            for (const destination of SPAIN_DESTINATIONS) {
                const link = doc.querySelector(`a[data-destination="${destination.id}"]`);
                assert.equal(link.getAttribute("href"), getOfficialItineraryPath(OFFICIAL[destination.id]));
                assert.equal(link.getAttribute("aria-label"), `${NAMES[destination.id]} — ${action}`);
                assert.equal(link.querySelectorAll("a,button,[tabindex]").length, 0, "one tab stop per destination");
                assert.equal(link.querySelector(`[data-hit-area="${destination.hitAreas[1].id}"]`)?.getAttribute("aria-hidden"), "true");
                assert.equal(link.querySelector(".atlas-itinerary-callout").getAttribute("aria-hidden"), "true");
                assert.equal(link.querySelector(".atlas-itinerary-callout").textContent.replace(/\s+/g, " ").trim(), `${NAMES[destination.id]} · ${action} →`);
            }
        });
        await i18n.changeLanguage("en");
    } finally {
        await vite.close();
    }
});

test("Spain artwork is lazy and hidden on the homepage and never warmed up after mount", async () => {
    const hook = readFileSync("src/components/home/atlas/useAtlasScene.js", "utf8");
    const preload = hook.slice(hook.indexOf("const preload=setTimeout"), hook.indexOf("},250);"));
    assert.match(preload, /loadAtlasArtwork\(ukUrl/, "UK warm-up is unchanged");
    assert.doesNotMatch(preload, /spain|france/i, "Spain loads only on selection, under cloud cover");
    const vite = await ssrServer();
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        await i18n.changeLanguage("en");
        const {default: Atlas} = await vite.ssrLoadModule("/src/components/home/AtlasStage.jsx");
        const doc = new JSDOM(renderToStaticMarkup(React.createElement(Atlas))).window.document;
        const spain = doc.querySelector(".atlas-spain-preview");
        assert.equal(spain.getAttribute("loading"), "lazy"); assert.equal(spain.hasAttribute("hidden"), true);
        assert.match(spain.getAttribute("src"), /spain-atlas/);
        assert.equal(spain.getAttribute("alt"), "Illustrated Spain country story map");
        assert.equal(doc.querySelector('[data-country="spain"]').getAttribute("href"), "/browse/spain", "crawlable native fallback is unchanged");
    } finally {
        await vite.close();
    }
});

test("Spain joins the covered-only sequence, loads only when selected, and rolls back on failure", async () => {
    const run = loadArtwork => {
        const loads = [], swaps = [], completions = [], errors = [];
        let controller;
        controller = createAtlasSceneTransition({loadArtwork: async scene => {loads.push(scene); return loadArtwork(scene);}, loadCloud: async () => {},
            swapScene: async scene => swaps.push({scene, phase: controller.getState().phase}), onPhase: () => {}, onScene: () => {},
            onError: e => errors.push(e), onComplete: s => completions.push(s), wait: async () => {}, scenes: ["europe", "uk", "france", "spain"]});
        return {controller, loads, swaps, completions, errors};
    };
    const ok = run(scene => ({scene}));
    assert.deepEqual(ok.loads, []);
    assert.equal(await ok.controller.go("spain"), true); assert.deepEqual(ok.loads, ["spain"]);
    assert.deepEqual(ok.swaps, [{scene: "spain", phase: "covered"}]);
    assert.equal(await ok.controller.go("europe"), true); assert.deepEqual(ok.completions, ["spain", "europe"]);
    const failed = run(scene => scene === "spain" ? Promise.reject(Error("Spain unavailable")) : {scene});
    assert.equal(await failed.controller.go("spain"), false); assert.equal(failed.controller.getState().scene, "europe");
    assert.deepEqual(failed.swaps, []); assert.equal(failed.errors.at(-1), true); assert.deepEqual(failed.completions, ["europe"]);
});
