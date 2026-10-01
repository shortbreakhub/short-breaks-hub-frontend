import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {createServer} from "vite";
import i18n from "i18next";
import {REGIONS} from "../src/config/regions.js";

const html = readFileSync("dist/browse/italy/index.html", "utf8");
const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

test("BrowsePage renders matching bootstrap immediately and rejects another Country/language", async () => {
    const vite = await createServer({
        appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}, noExternal: ["lottie-react"]},
        // The loading animation is irrelevant to this bootstrap contract.
        plugins: [{name: "test-loading-animation", enforce: "pre",
            resolveId(id) { if (id === "lottie-react") return "\0test-loading-animation"; },
            load(id) { if (id === "\0test-loading-animation") return "export default function LoadingAnimation(){return null;}"; },
        }],
    });
    try {
        const {renderRoute} = await vite.ssrLoadModule("/src/prerenderEntry.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        const initial = renderRoute("/browse/italy", data).markup;
        assert.ok(initial.includes(data.items[0].title));
        assert.ok(initial.includes(`/itinerary/${data.items[0].slug}`));
        assert.ok(!renderRoute("/browse/south-korea", data).markup.includes(`/itinerary/${data.items[0].slug}`));
        assert.ok(!renderRoute("/browse/italy", null).markup.includes(`/itinerary/${data.items[0].slug}`));
        await i18n.changeLanguage("fr");
        assert.ok(!renderRoute("/browse/italy", data).markup.includes(`/itinerary/${data.items[0].slug}`),
            "English bootstrap must not supply cards for French rendering");
        await i18n.changeLanguage("en");
        const api = await vite.ssrLoadModule("/src/api.js");
        const requests = [];
        api.publicApi.defaults.adapter = async config => {
            requests.push(config.url);
            const region = config.url.slice("/itineraries/region/".length);
            const regionHtml = readFileSync(`dist/${region}/index.html`, "utf8");
            const payload = JSON.parse(regionHtml.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
            return {data: payload.countries, status: 200, statusText: "OK", headers: {}, config};
        };
        const names = await api.getPublicCountryNames();
        assert.deepEqual(new Set(names), new Set(data.countryNames));
        assert.equal(await api.getPublicCountryNames(), names, "SPA discovery should be cached");
        assert.equal(requests.length, REGIONS.length);
        assert.ok(requests.every(url => url.startsWith("/itineraries/region/")));
    } finally {
        await vite.close();
    }
});
