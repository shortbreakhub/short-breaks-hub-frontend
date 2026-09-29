import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import test from "node:test";

const robotsTxtPath = fileURLToPath(new URL("../public/robots.txt", import.meta.url));

test("robots.txt allows crawling and advertises the production sitemap", async () => {
    const robotsTxt = await readFile(robotsTxtPath, "utf8");

    assert.match(robotsTxt, /^User-agent: \*$/m);
    assert.match(robotsTxt, /^Allow: \/$/m);
    assert.match(robotsTxt, /^Sitemap: https:\/\/www\.shortbreakhub\.com\/sitemap\.xml$/m);
    assert.doesNotMatch(robotsTxt, /^Disallow:/m);
    assert.doesNotMatch(robotsTxt, /shortbreakshub\.com/i);
});

test("public content route paths are covered by the allow-all policy", async () => {
    const robotsTxt = await readFile(robotsTxtPath, "utf8");

    for (const route of ["/", "/southeast-asia", "/browse/france", "/itinerary/example", "/contact", "/privacy", "/terms"]) {
        assert.equal(robotsTxt.includes(`Disallow: ${route}`), false, `${route} must not be blocked`);
    }
});
