import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {measurePerformance} from "../scripts/measure-performance.mjs";
import {createServer} from "vite";
import {REGIONS} from "../src/config/regions.js";
import {getCountrySlug} from "../src/utils/countries.js";

test("production initial graph stays deferred and shared assets stay bounded", async () => {
    const report = measurePerformance();
    const regions=REGIONS.map(({onClick})=>{
        const html=readFileSync(`dist/${onClick}/index.html`,"utf8");
        return JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    });
    const countries=new Set(regions.flatMap(r=>r.countries.map(getCountrySlug)));
    const officialSlugs=new Set(regions.flatMap(r=>r.itineraries.map(item=>item.slug)));
    assert.ok(countries.size>0 && officialSlugs.size>0);
    assert.equal(report.prerenderedPages, 2+REGIONS.length+countries.size+officialSlugs.size,
        "build must preserve the complete current region/country/official route inventory");
    assert.ok(report.chunks.some(chunk => /loading-animation/.test(chunk.file)));
    assert.ok(!report.initialFiles.some(file => /loading-animation|WeatherPage|GoogleMap|loadItineraryImage/.test(file)),
        "animation/weather/maps/itinerary inventory must remain outside the static homepage graph");
    const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
    const assets = JSON.parse(readFileSync("src/assets/optimized/manifest.json", "utf8"));
    for (const [name, item] of Object.entries(assets)) {
        const source = readFileSync(`src/assets/${item.source}`);
        assert.equal(createHash("sha256").update(source).digest("hex"), item.sourceSha256,
            `regenerate optimized ${name} after changing its source`);
        for (const variant of item.variants) {
            const path = `src/assets/optimized/${variant.file}`;
            const entry = manifest[path];
            assert.ok(entry?.file, `missing production derivative ${path}`);
            assert.equal(statSync(`dist/${entry.file}`).size, variant.bytes);
            const metadata = await sharp(path).metadata();
            assert.equal(metadata.width, variant.width); assert.equal(metadata.height, variant.height);
            assert.ok(Math.abs(metadata.width / metadata.height - item.width / item.height) < 0.01, "derivatives must preserve aspect ratio");
        }
    }
    assert.ok(assets["logo-icon"].variants[0].bytes <= 25_000, "shared logo must not return to megabyte delivery");
    assert.ok(assets["hero-bg"].variants[0].bytes <= 600_000, "hero is eager; enforce a bounded delivery cost");
    const cards = ["southeast", "eastasia", "europe", "americas", "anz", "northafrica"];
    assert.ok(cards.reduce((sum, name) => sum + assets[name].variants[0].bytes, 0) <= 200_000);
    assert.ok(cards.reduce((sum, name) => sum + assets[name].variants.at(-1).bytes, 0) <= 650_000);
});

test("optional food images resolve supported case/extensions/aliases without inventing missing content", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []}});
    try {
        const {loadSubFolderImages} = await vite.ssrLoadModule("/src/utils/loadItineraryImage.js");
        for (const [folder, name, actual] of [
            ["italy/venice-food", "dal-moros", "dal-moros.jpeg"],
            ["germany/munich-food", "augustiner-keller", "Augustiner-Keller.jpg"],
            ["colombia/medellin-food", "carmen", "carmen.jpeg"],
            ["mexico/mexico-city-food", "los-danzantes", "los-danzante.jpg"],
            ["australia/sydney-food", "icebergs-dining-room", "icebergs-dining-roo.jpg"],
        ]) {
            assert.ok(loadSubFolderImages(`itineraries/${folder}`, name).endsWith(actual));
        }
        for (const name of ["pike-place-chowder", "the-pink-door", "taylor-shellfish-capitol-hill", "walrus-and-the-carpenter", "serious-pie"])
            assert.equal(loadSubFolderImages("itineraries/united-states/seattle-food", name), undefined);
        assert.equal(loadSubFolderImages("itineraries/united-states/new-york-city-food", "katzs-delicatessen"), undefined);
    } finally {await vite.close();}
});
