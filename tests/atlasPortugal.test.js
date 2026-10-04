import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {PORTUGAL_DESTINATIONS} from "../src/components/home/atlas/portugalDestinations.js";
import {getOfficialItineraryPath} from "../src/utils/publicNavigation.js";
import {createAtlasSceneTransition} from "../src/components/home/atlas/atlasSceneTransition.js";

// Issue #48 inventory: literal official API slugs confirmed against the live API and prerender.
const OFFICIAL = {
    porto: "3-days-porto-where-the-river-keeps-its-word",
    sintra: "2-days-sintra-where-forests-hold-the-dream",
    lisbon: "4-days-lisbon-where-light-carries-memory",
    lagos: "3-days-lagos-where-the-coast-lets-go",
    faro: "3-days-faro-where-the-land-learns-to-rest",
};
const NAMES = {
    en: {porto: "Porto", sintra: "Sintra", lisbon: "Lisbon", lagos: "Lagos", faro: "Faro"},
    fr: {porto: "Porto", sintra: "Sintra", lisbon: "Lisbonne", lagos: "Lagos", faro: "Faro"},
};
const PORTUGAL_ART = "src/assets/atlas/countries/portugal/portugal_atlas.png";
const box = area => ({left: area.artworkPosition.x - area.hitArea.width / 2, right: area.artworkPosition.x + area.hitArea.width / 2,
    top: area.artworkPosition.y - area.hitArea.height / 2, bottom: area.artworkPosition.y + area.hitArea.height / 2});
const ssrServer = () => createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
    optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});

test("approved Portugal artwork is the unchanged 1536×1024 owner file", () => {
    const png = readFileSync(PORTUGAL_ART);
    assert.equal(png.readUInt32BE(16), 1536); assert.equal(png.readUInt32BE(20), 1024);
    assert.equal(createHash("sha256").update(png).digest("hex"), "0f3c32a3686dcea7f99a8e82e224c45ccac599b8762775ee668c2c659f204b2b");
});

test("Portugal atlas maps exactly five destinations to their literal official itinerary slugs", () => {
    assert.equal(PORTUGAL_DESTINATIONS.length, 5);
    assert.deepEqual(Object.fromEntries(PORTUGAL_DESTINATIONS.map(d => [d.id, d.slug])), OFFICIAL);
    const data = readFileSync("src/components/home/atlas/portugalDestinations.js", "utf8");
    for (const slug of Object.values(OFFICIAL)) assert.ok(data.includes(`'${slug}'`), `${slug} is stored literally`);
    assert.doesNotMatch(data, /toLowerCase|formatSlug|getCountrySlug|\.replace\(|normalize\(/);
    for (const d of PORTUGAL_DESTINATIONS) assert.equal(d.labelKey, `homeMagazine.atlas.portugalPlaces.${d.id}`);
});

test("every Portugal slug is a prerendered official itinerary in the Portugal inventory", {skip: !existsSync("dist/browse/portugal/index.html") && "requires a production build"}, () => {
    const html = readFileSync("dist/browse/portugal/index.html", "utf8");
    const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(data.items.map(item => item.slug).sort(), Object.values(OFFICIAL).sort());
    for (const slug of Object.values(OFFICIAL)) {
        const detail = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
        assert.match(detail, new RegExp(`<link rel="canonical" href="https://www\\.shortbreakhub\\.com${getOfficialItineraryPath(slug)}"`));
    }
});

test("each Portugal destination has an in-bounds landmark and name plate; close clusters never overlap", () => {
    const regions = [];
    for (const destination of PORTUGAL_DESTINATIONS) {
        const kinds = destination.hitAreas.map(area => area.kind);
        assert.equal(kinds[0], "landmark"); assert.equal(kinds.filter(kind => kind === "plate").length, 1);
        for (const area of destination.hitAreas) {
            const {left, right, top, bottom} = box(area);
            assert.ok(left >= 0 && right <= 1 && top >= 0 && bottom <= 1, `${area.id} stays inside the artwork`);
            regions.push({id: destination.id, ...box(area)});
        }
    }
    // Porto adds its bridge as a second landmark region of the same link.
    assert.deepEqual(PORTUGAL_DESTINATIONS.find(d => d.id === "porto").hitAreas.map(area => area.kind), ["landmark", "plate", "landmark"]);
    assert.equal(new Set(PORTUGAL_DESTINATIONS.flatMap(d => d.hitAreas.map(area => area.id))).size, 11);
    for (const a of regions) for (const b of regions) {
        if (a.id >= b.id) continue;
        assert.equal(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom, false, `${a.id} and ${b.id} hit regions overlap`);
    }
    const bottom = id => Math.max(...regions.filter(r => r.id === id).map(r => r.bottom));
    const top = id => Math.min(...regions.filter(r => r.id === id).map(r => r.top));
    const right = id => Math.max(...regions.filter(r => r.id === id).map(r => r.right));
    const left = id => Math.min(...regions.filter(r => r.id === id).map(r => r.left));
    assert.ok(top("lisbon") - bottom("sintra") >= 79 / 1024, "Sintra and Lisbon keep their measured gap");
    assert.ok(left("faro") - right("lagos") >= 29 / 1536, "Lagos and Faro keep their measured gap");
    // The greyed Spain artwork (east of x≈940 above the river) stays inert.
    for (const r of regions) if (r.top < 150 / 1024) assert.ok(r.right <= 940 / 1536, `${r.id} stays clear of the Spain artwork`);
});

test("Portugal caption, story and interaction strings are localized without touching slugs", () => {
    const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")).homeMagazine.atlas;
    const fr = JSON.parse(readFileSync("src/locales/fr/common.json", "utf8")).homeMagazine.atlas;
    assert.equal(en.portugalCaption, "PORTUGAL"); assert.equal(fr.portugalCaption, "PORTUGAL");
    assert.equal(en.portugalStory, "Where the land ends, and the horizon begins.");
    assert.equal(fr.portugalStory, "Là où la terre s’achève, et où commence l’horizon.");
    assert.equal(en.portugalDestinations, "Explore Portugal itineraries");
    assert.equal(fr.portugalDestinations, "Explorer les itinéraires au Portugal");
    assert.deepEqual(en.portugalPlaces, NAMES.en); assert.deepEqual(fr.portugalPlaces, NAMES.fr);
    for (const lang of [en, fr]) assert.ok(lang.portugalMapLabel && lang.portugalPreviewAlt);
});

test("Portugal is configuration only: same scene config, layer and stage", async t => {
    const stage = readFileSync("src/components/home/AtlasStage.jsx", "utf8");
    assert.doesNotMatch(stage, /portugal/i, "AtlasStage has no Portugal-specific branch");
    const vite = await ssrServer();
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: CountryDestinations} = await vite.ssrLoadModule("/src/components/home/atlas/CountryDestinations.jsx");
        const {COUNTRY_SCENES, sceneForCountry} = await vite.ssrLoadModule("/src/components/home/atlas/countryScenes.js");
        const {SCENE_ASSETS} = await vite.ssrLoadModule("/src/components/home/atlas/useAtlasScene.js");
        assert.equal(sceneForCountry("portugal"), "portugal");
        assert.equal(COUNTRY_SCENES.portugal.previewClass, "atlas-portugal-preview");
        assert.match(SCENE_ASSETS.portugal, /portugal_atlas/);
        for (const [language, nav, action] of [["en", "Explore Portugal itineraries", "View itinerary"], ["fr", "Explorer les itinéraires au Portugal", "Voir l’itinéraire"]]) await t.test(language, async () => {
            await i18n.changeLanguage(language);
            const scene = COUNTRY_SCENES.portugal;
            const doc = new JSDOM(renderToStaticMarkup(React.createElement(CountryDestinations, {destinations: scene.destinations, navLabelKey: scene.keys.nav, map: null}))).window.document;
            assert.equal(doc.querySelectorAll("nav").length, 1);
            assert.equal(doc.querySelector("nav").getAttribute("aria-label"), nav);
            assert.equal(doc.querySelectorAll("nav a").length, 5, "one link per destination, not per region");
            for (const destination of PORTUGAL_DESTINATIONS) {
                const link = doc.querySelector(`a[data-destination="${destination.id}"]`), name = NAMES[language][destination.id];
                assert.equal(link.getAttribute("href"), getOfficialItineraryPath(OFFICIAL[destination.id]));
                assert.equal(link.getAttribute("aria-label"), `${name} — ${action}`);
                assert.equal(link.querySelectorAll("a,button,[tabindex]").length, 0, "one tab stop per destination");
                for (const area of destination.hitAreas.slice(1)) assert.equal(link.querySelector(`[data-hit-area="${area.id}"]`)?.getAttribute("aria-hidden"), "true");
                assert.equal(link.querySelector(".atlas-itinerary-callout").getAttribute("aria-hidden"), "true");
                assert.equal(link.querySelector(".atlas-itinerary-callout").textContent.replace(/\s+/g, " ").trim(), `${name} · ${action} →`);
            }
        });
        await i18n.changeLanguage("en");
    } finally {
        await vite.close();
    }
});

test("Portugal artwork is lazy and hidden on the homepage and never warmed up after mount", async () => {
    const hook = readFileSync("src/components/home/atlas/useAtlasScene.js", "utf8");
    const preload = hook.slice(hook.indexOf("const preload=setTimeout"), hook.indexOf("},250);"));
    assert.match(preload, /loadAtlasArtwork\(ukUrl/, "UK warm-up is unchanged");
    assert.doesNotMatch(preload, /portugal|spain|france/i, "Portugal loads only on selection, under cloud cover");
    const vite = await ssrServer();
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        await i18n.changeLanguage("en");
        const {default: Atlas} = await vite.ssrLoadModule("/src/components/home/AtlasStage.jsx");
        const doc = new JSDOM(renderToStaticMarkup(React.createElement(Atlas))).window.document;
        const portugal = doc.querySelector(".atlas-portugal-preview");
        assert.equal(portugal.getAttribute("loading"), "lazy"); assert.equal(portugal.hasAttribute("hidden"), true);
        assert.match(portugal.getAttribute("src"), /portugal_atlas/);
        assert.equal(portugal.getAttribute("alt"), "Illustrated Portugal country story map");
        assert.equal(doc.querySelector('[data-country="portugal"]').getAttribute("href"), "/browse/portugal", "crawlable native fallback is unchanged");
    } finally {
        await vite.close();
    }
});

test("Portugal joins the covered-only sequence, loads only when selected, and rolls back on failure", async () => {
    const run = loadArtwork => {
        const loads = [], swaps = [], completions = [], errors = [];
        let controller;
        controller = createAtlasSceneTransition({loadArtwork: async scene => {loads.push(scene); return loadArtwork(scene);}, loadCloud: async () => {},
            swapScene: async scene => swaps.push({scene, phase: controller.getState().phase}), onPhase: () => {}, onScene: () => {},
            onError: e => errors.push(e), onComplete: s => completions.push(s), wait: async () => {}, scenes: ["europe", "uk", "france", "spain", "portugal"]});
        return {controller, loads, swaps, completions, errors};
    };
    const ok = run(scene => ({scene}));
    assert.deepEqual(ok.loads, []);
    assert.equal(await ok.controller.go("portugal"), true); assert.deepEqual(ok.loads, ["portugal"]);
    assert.deepEqual(ok.swaps, [{scene: "portugal", phase: "covered"}]);
    assert.equal(await ok.controller.go("europe"), true); assert.deepEqual(ok.completions, ["portugal", "europe"]);
    const failed = run(scene => scene === "portugal" ? Promise.reject(Error("Portugal unavailable")) : {scene});
    assert.equal(await failed.controller.go("portugal"), false); assert.equal(failed.controller.getState().scene, "europe");
    assert.deepEqual(failed.swaps, []); assert.equal(failed.errors.at(-1), true); assert.deepEqual(failed.completions, ["europe"]);
});
