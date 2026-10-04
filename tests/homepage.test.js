import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {MemoryRouter, useLocation} from "react-router-dom";
import {createRoot} from "react-dom/client";
import {HelmetProvider} from "react-helmet-async";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";
import {readFileSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {REGIONS} from "../src/config/regions.js";

const stories = JSON.parse(readFileSync("src/content/homepage.json", "utf8"));
test("UK story-map heading and story line use the approved localized copy", () => {
    const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")).homeMagazine.atlas;
    const fr = JSON.parse(readFileSync("src/locales/fr/common.json", "utf8")).homeMagazine.atlas;
    assert.equal(en.ukCaption, "UNITED KINGDOM");
    assert.equal(en.ukStory, "Where old stones remember, and every road tells a story.");
    assert.equal(fr.ukCaption, "ROYAUME-UNI");
    assert.ok(fr.ukStory.length > 20);
});
test("homepage renders semantic, localized discovery and replaceable atlas scenery", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const doms = [];
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: Home} = await vite.ssrLoadModule("/src/pages/HomePage.jsx");
        const {default: Atlas} = await vite.ssrLoadModule("/src/components/home/AtlasStage.jsx");
        const render = node => {
            const dom = new JSDOM(renderToStaticMarkup(React.createElement(HelmetProvider, {context: {}}, React.createElement(MemoryRouter, null, node))));
            doms.push(dom); return dom.window.document;
        };
        for (const language of ["en", "fr"]) await t.test(`${language}: complete content, crawlable links, labels and responsive photos`, async () => {
            await i18n.changeLanguage(language);
            const doc = render(React.createElement(Home));
            assert.equal(doc.querySelectorAll("h1").length, 1);
            assert.equal(doc.querySelector("h1").textContent, language === "en" ? "Short Breaks. Big Stories." : "Petites escapades. Grandes histoires.");
            assert.equal(doc.querySelector(".home-page").lang, language);
            assert.equal(doc.querySelectorAll("main").length, 1);
            for (const region of REGIONS) assert.ok(doc.querySelector(`a[href="/${region.onClick}"]`));
            for (const story of stories) {
                const titleLink = [...doc.querySelectorAll("h3 a")].find(a => a.textContent === story.copy[language].title);
                assert.equal(titleLink?.getAttribute("href"), `/itinerary/${story.slug}`);
            }
            for (const control of doc.querySelectorAll("select")) assert.equal(control.labels.length, 1);
            assert.ok(doc.querySelector("#home-country").disabled);
            assert.ok(doc.querySelector('button[type="submit"]').disabled);
            assert.ok(doc.querySelector("form").getAttribute("aria-label"));
            assert.equal(doc.querySelectorAll(".atlas-destinations,.atlas-landmark,.atlas-pin,.atlas-label").length, 0);
            assert.equal(doc.querySelector('.atlas-entry,.atlas-controls'),null);
            assert.equal([...doc.querySelectorAll('.atlas-stage button')].some(button=>button.textContent.includes('Explore the map')),false);
            assert.equal(doc.querySelector('#atlas-gestures'),null);
            assert.equal(doc.querySelector('.atlas-stage').textContent.includes('Drag to pan'),false);
            for (const svg of doc.querySelectorAll(".atlas-stage svg")) assert.equal(svg.getAttribute("aria-hidden"), "true");
            const images = [...doc.querySelectorAll(".home-editorial img")];
            assert.equal(images.length, 7);
            for (const image of images) {
                assert.ok(image.alt); assert.equal(image.loading || image.getAttribute("loading"), "lazy");
                assert.ok(Number(image.width) > 0 && Number(image.height) > 0);
                assert.match(image.srcset || image.getAttribute("srcset"), /480w.*960w/);
                assert.ok(image.getAttribute("sizes"));
                assert.match(image.getAttribute("src"), /\.webp$/);
            }
            assert.doesNotMatch(doc.body.textContent, /homeMagazine\.|undefined|Loading countries|Chargement des pays/);
        });
        await t.test("naked atlas prerenders real geography and an accessible activation boundary", () => {
            const doc = render(React.createElement(Atlas));
            assert.equal(doc.querySelector('[data-atlas-stage="illustrated-europe"]').getAttribute("data-atlas-state"), "preview");
            const controls = [...doc.querySelectorAll('.atlas-country')];
            assert.equal(controls.length,9);
            assert.equal(new Set(controls.map(a=>a.getAttribute('href'))).size,9);
            for (const control of controls) {
                assert.match(control.getAttribute('href'), /^\/browse\//);
                assert.ok(control.getAttribute('aria-label'));
                assert.equal(control.getAttribute('draggable'),'false');
                for(const hit of control.querySelectorAll('[data-hit-area]')){
                    assert.equal(hit.tagName,'SPAN');assert.equal(hit.getAttribute('aria-hidden'),'true');
                    assert.equal(hit.hasAttribute('tabindex'),false);
                }
                assert.ok(control.querySelector('.atlas-country-callout strong').textContent);
            }
            const preview = doc.querySelector(".atlas-preview");
            assert.ok(preview.alt); assert.match(preview.getAttribute("src"), /europe-atlas\.png/);
            assert.equal(preview.getAttribute("loading"), "eager");
            const ukPreview = doc.querySelector('.atlas-uk-preview');
            assert.ok(ukPreview.alt); assert.equal(ukPreview.getAttribute('loading'),'lazy');
            assert.equal(ukPreview.hasAttribute('hidden'),true);
            assert.equal(doc.querySelector('.atlas-stage').getAttribute('data-atlas-scene'),'europe');
            assert.equal(doc.querySelector('.atlas-stage').getAttribute('data-atlas-transition'),'idle');
            assert.equal(doc.querySelector('.atlas-back,.atlas-cloud-transition'),null);
            assert.equal(doc.querySelector(".atlas-stage button"),null);
            assert.equal(doc.querySelectorAll("canvas,.atlas-destinations,.atlas-landmark,.atlas-pin,.atlas-label").length, 0);
            assert.ok(doc.querySelector('.atlas-map[role="region"][aria-label]'));
            assert.equal(doc.querySelector('.atlas-country-story'),null);
        });
    } finally {for (const dom of doms) dom.window.close(); await vite.close();}
});

test("editorial selection matches real official inventory and bounded photo provenance", async () => {
    const html = readFileSync("dist/index.html", "utf8");
    const doc = new JSDOM(html).window.document;
    try {
        for (const item of stories) {
            const detailHtml = readFileSync(`dist/itinerary/${item.slug}/index.html`, "utf8");
            const detail = JSON.parse(detailHtml.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]).detail;
            assert.equal(detail.title, item.copy.en.title);
            assert.equal(detail.days, item.days); assert.equal(detail.city, item.city);
            assert.equal(detail.hero.replace(/^\//, ""), item.source);
            const original = readFileSync(item.source);
            assert.equal(createHash("sha256").update(original).digest("hex"), item.sourceSha256);
            for (const variant of item.variants) {
                const path = `src/assets/homepage/${variant.file}`;
                const metadata = await sharp(path).metadata();
                assert.equal(metadata.width, variant.width); assert.equal(metadata.height, variant.height);
                assert.equal(statSync(path).size, variant.bytes);
                assert.ok(variant.bytes < 200_000, "bounded derivatives, not multi-megabyte originals");
                assert.ok(Math.abs(metadata.width / metadata.height - item.width / item.height) < 0.01);
                assert.ok(doc.querySelector(`img[srcset*="${item.key}-${variant.width}-"]`), "derivative available in prerendered responsive sources");
            }
            assert.ok(doc.querySelector(`h3 a[href='/itinerary/${item.slug}']`), "editorial content must not become client-only");
        }
        assert.equal(doc.querySelectorAll('[type="application/ld+json"]').length, 2);
        assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute("href"), "https://www.shortbreakhub.com/");
    } finally {doc.defaultView.close();}
});

// Exercise the actual discovery component without a network or navigation provider.
test("destination discovery recovers, resets selection and ignores stale requests", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const globals = Object.fromEntries(["window", "document", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    let root, dom;
    try {
        await vite.ssrLoadModule("/src/i18n.js"); await i18n.changeLanguage("en");
        const {default: Discovery} = await vite.ssrLoadModule("/src/components/home/HomeDiscovery.jsx");
        const {publicApi} = await vite.ssrLoadModule("/src/api.js");
        const pending = [];
        publicApi.defaults.adapter = config => new Promise((resolve, reject) => pending.push({config, resolve, reject}));
        dom = new JSDOM('<div id="mount"></div>', {url: "https://www.shortbreakhub.com"});
        Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
        root = createRoot(document.getElementById("mount"));
        function Location() {return React.createElement("output", null, useLocation().pathname);}
        await React.act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(Discovery), React.createElement(Location))));
        const select = async (id, value) => React.act(async () => {
            const el = document.getElementById(id); el.value = value; el.dispatchEvent(new window.Event("change", {bubbles: true}));
        });
        const succeed = async (index, data) => React.act(async () => pending[index].resolve({data, status: 200, headers: {}, config: pending[index].config}));
        await select("home-region", "east-asia");
        assert.ok(document.querySelector('[role="status"]'));
        assert.ok(document.getElementById("home-country").disabled);
        await React.act(async () => pending[0].reject(new Error("offline")));
        assert.ok(document.querySelector('[role="alert"]')); assert.equal(document.querySelector('[role="status"]'), null);
        await React.act(async () => document.querySelector(".discovery-feedback button").click());
        assert.equal(pending[1].config.url, "/itineraries/region/east-asia");
        await succeed(1, ["China", "Japan"]);
        await select("home-country", "China");
        assert.equal(document.querySelector('button[type="submit"]').disabled, false);
        await React.act(async () => i18n.changeLanguage("fr"));
        assert.equal(document.getElementById("home-country").value, "China");
        assert.equal(document.querySelector('option[value="China"]').textContent, "Chine");
        await select("home-region", "europe");
        assert.equal(document.getElementById("home-country").value, "");
        assert.ok(document.querySelector('button[type="submit"]').disabled);
        await select("home-region", "east-asia");
        await succeed(3, ["China"]); // newer request wins
        await succeed(2, ["France"]); // older region resolves later
        assert.equal(document.querySelector('option[value="France"]'), null);
        await select("home-country", "China");
        await React.act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", {bubbles: true, cancelable: true})));
        assert.equal(document.querySelector("output").textContent, "/browse/china");
    } finally {
        if (root) await React.act(async () => root.unmount()); dom?.window.close(); Object.assign(globalThis, globals); await vite.close();
    }
});
