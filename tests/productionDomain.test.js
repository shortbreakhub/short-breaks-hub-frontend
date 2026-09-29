import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("Open Graph and Twitter public URLs use the production origin", () => {
    assert.match(indexHtml, /property="og:url" content="https:\/\/www\.shortbreakhub\.com\/"/);
    assert.match(indexHtml, /name="twitter:image" content="https:\/\/www\.shortbreakhub\.com\/og-cover\.jpg"/);
});

test("existing Organization and WebSite JSON-LD URLs use the production origin", () => {
    assert.match(indexHtml, /"url": "https:\/\/www\.shortbreakhub\.com\/"/);
    assert.match(indexHtml, /"logo": "https:\/\/www\.shortbreakhub\.com\/assets\/logo-wordmark\.png"/);
    assert.equal((indexHtml.match(/"url": "https:\/\/www\.shortbreakhub\.com\/"/g) || []).length, 2);
});

test("SEO/social metadata contains no absolute URL on the legacy production host", () => {
    assert.doesNotMatch(indexHtml, /https:\/\/www\.shortbreakshub\.com/i);
    assert.equal((indexHtml.match(/https:\/\/www\.shortbreakhub\.com/g) || []).length, 5);
});
