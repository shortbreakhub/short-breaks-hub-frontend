import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import {readFileSync, existsSync} from "node:fs";
import {UK_DESTINATIONS} from "../src/components/home/atlas/ukDestinations.js";
import {getOfficialItineraryPath} from "../src/utils/publicNavigation.js";

// Issue #42 inventory: literal official API slugs, confirmed against prerender data.
const OFFICIAL = {
    cambridge: "3-day-cambridge-colleges-and-river-cam",
    london: "4-days-london-beyond-the-postcards",
    bristol: "2-days-bristol-where-creativity-meets-the-harbour",
    york: "2-days-york-walls-and-whispering-streets",
    glasgow: "2-days-glasgow-grit-geometry-and-great-museums",
    "lake-district": "3-days-lake-district-water-stone-and-open-skies",
    bath: "2-days-bath-stone-curves-and-roman-roots",
    oxford: "2-days-oxford-spires-courtyards-and-slow-thoughts",
    edinburgh: "3-days-edinburgh-stone-stories-and-high-ground",
};
const box = area => ({left: area.artworkPosition.x - area.hitArea.width / 2, right: area.artworkPosition.x + area.hitArea.width / 2,
    top: area.artworkPosition.y - area.hitArea.height / 2, bottom: area.artworkPosition.y + area.hitArea.height / 2});

test("UK atlas maps exactly nine destinations to their literal official itinerary slugs", () => {
    assert.equal(UK_DESTINATIONS.length, 9);
    assert.deepEqual(Object.fromEntries(UK_DESTINATIONS.map(d => [d.id, d.slug])), OFFICIAL);
    const data = readFileSync("src/components/home/atlas/ukDestinations.js", "utf8");
    for (const slug of Object.values(OFFICIAL)) assert.ok(data.includes(`'${slug}'`), `${slug} is stored literally`);
    const layer = readFileSync("src/components/home/atlas/CountryDestinations.jsx", "utf8");
    assert.match(layer, /href=\{getOfficialItineraryPath\(destination\.slug\)\}/);
    // No destination-name-derived slugs or scene interception for itinerary links.
    for (const source of [data, layer]) assert.doesNotMatch(source, /toLowerCase|formatSlug|getCountrySlug|\.replace\(/);
    assert.doesNotMatch(layer, /onCountrySelect|transitionTo/);
});

test("every UK slug is a prerendered official itinerary in the United Kingdom inventory", {skip: !existsSync("dist/browse/united-kingdom/index.html") && "requires a production build"}, () => {
    const html = readFileSync("dist/browse/united-kingdom/index.html", "utf8");
    const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(data.items.map(item => item.slug).sort(), Object.values(OFFICIAL).sort());
    for (const slug of Object.values(OFFICIAL)) {
        const detail = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
        assert.match(detail, new RegExp(`<link rel="canonical" href="https://www\\.shortbreakhub\\.com${getOfficialItineraryPath(slug)}"`));
    }
});

test("each destination has an in-bounds landmark anchor plus its artwork name plate, never overlapping another destination", () => {
    const regions = [];
    for (const destination of UK_DESTINATIONS) {
        assert.deepEqual(destination.hitAreas.map(area => area.kind), ["landmark", "plate"]);
        for (const area of destination.hitAreas) {
            const {left, right, top, bottom} = box(area);
            assert.ok(left >= 0 && right <= 1 && top >= 0 && bottom <= 1, `${area.id} stays inside the artwork`);
            regions.push({id: destination.id, ...box(area)});
        }
    }
    assert.equal(new Set(UK_DESTINATIONS.flatMap(d => d.hitAreas.map(area => area.id))).size, 18);
    for (const a of regions) for (const b of regions) {
        if (a.id >= b.id) continue;
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        assert.equal(overlap, false, `${a.id} and ${b.id} hit regions overlap`);
    }
});

test("UK destination names and interaction strings are localized without touching slugs", () => {
    const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")).homeMagazine.atlas;
    const fr = JSON.parse(readFileSync("src/locales/fr/common.json", "utf8")).homeMagazine.atlas;
    assert.equal(en.ukDestinations, "Explore United Kingdom itineraries");
    assert.equal(en.viewItinerary, "View itinerary");
    assert.equal(fr.ukDestinations, "Explorer les itinéraires du Royaume-Uni");
    assert.equal(fr.viewItinerary, "Voir l’itinéraire");
    assert.deepEqual(Object.keys(en.ukPlaces).sort(), Object.keys(OFFICIAL).sort());
    assert.deepEqual(Object.keys(fr.ukPlaces).sort(), Object.keys(OFFICIAL).sort());
    assert.equal(fr.ukPlaces.london, "Londres");
    assert.equal(fr.ukPlaces.edinburgh, "Édimbourg");
    assert.equal(fr.ukPlaces["lake-district"], "Lake District");
});

test("UK layer renders one native link per destination with hit regions inside it", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: CountryDestinations} = await vite.ssrLoadModule("/src/components/home/atlas/CountryDestinations.jsx");
        const {COUNTRY_SCENES} = await vite.ssrLoadModule("/src/components/home/atlas/countryScenes.js");
        for (const [language, nav, action, london] of [["en", "Explore United Kingdom itineraries", "View itinerary", "London"],
            ["fr", "Explorer les itinéraires du Royaume-Uni", "Voir l’itinéraire", "Londres"]]) await t.test(language, async () => {
            await i18n.changeLanguage(language);
            const doc = new JSDOM(renderToStaticMarkup(React.createElement(CountryDestinations, {destinations: COUNTRY_SCENES.uk.destinations, navLabelKey: COUNTRY_SCENES.uk.keys.nav, map: null}))).window.document;
            assert.equal(doc.querySelectorAll("nav").length, 1);
            assert.equal(doc.querySelector("nav").getAttribute("aria-label"), nav);
            const links = [...doc.querySelectorAll("nav a")];
            assert.equal(links.length, 9);
            for (const destination of UK_DESTINATIONS) {
                const link = doc.querySelector(`a[data-destination="${destination.id}"]`);
                assert.equal(link.getAttribute("href"), getOfficialItineraryPath(OFFICIAL[destination.id]));
                assert.equal(link.getAttribute("data-hit-area"), destination.hitAreas[0].id);
                assert.ok(link.getAttribute("aria-label").endsWith(` — ${action}`));
                assert.equal(link.querySelectorAll("a,button,[tabindex]").length, 0, "one tab stop per destination");
                const plate = link.querySelector(`[data-hit-area="${destination.hitAreas[1].id}"]`);
                assert.equal(plate?.getAttribute("aria-hidden"), "true");
                assert.equal(link.querySelector(".atlas-itinerary-callout").getAttribute("aria-hidden"), "true");
            }
            assert.equal(doc.querySelector('a[data-destination="london"]').getAttribute("aria-label"), `${london} — ${action}`);
            assert.equal(doc.querySelector('a[data-destination="oxford"] .atlas-itinerary-callout').textContent.replace(/\s+/g, " ").trim(), `Oxford · ${action} →`);
        });
        await i18n.changeLanguage("en");
    } finally {
        await vite.close();
    }
});

test("UK itineraries render only in the UK scene, inside the inert scene surface", () => {
    const stage = readFileSync("src/components/home/AtlasStage.jsx", "utf8");
    const surface = stage.slice(stage.indexOf('<div className="atlas-scene-surface" inert={locked}>'), stage.indexOf("<AtlasCloudTransition"));
    assert.match(surface, /\{country && <Suspense fallback=\{null\}><CountryDestinations key=\{scenes\.scene\} destinations=\{country\.destinations\} artworkSize=\{country\.artworkSize\} navLabelKey=\{country\.keys\.nav\} map=\{state === "ready" \? mapRef\.current : null\} \/><\/Suspense>\}/);
    assert.match(stage, /country=COUNTRY_SCENES\[scenes\.scene\]/);
    const scenesConfig = readFileSync("src/components/home/atlas/countryScenes.js", "utf8");
    assert.match(scenesConfig, /uk: \{countryId: 'united-kingdom', previewClass: 'atlas-uk-preview', destinations: UK_DESTINATIONS/);
    assert.match(scenesConfig, /nav: 'homeMagazine\.atlas\.ukDestinations'/);
    assert.match(surface, /REGION_SCENES\[scenes\.scene\]/);
    assert.match(surface, /destinations=\{region\.destinations\}/);
    // Only country scenes move focus to Back; regional return restores its country.
    assert.match(stage, /COUNTRY_SCENES\[target\]\?backButton\.current:/);
});
