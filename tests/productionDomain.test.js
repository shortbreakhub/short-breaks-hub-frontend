import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import test from "node:test";
import {CANONICAL_ORIGIN} from "../src/utils/canonicalUrl.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const schemas = [...indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json));

test("Organization and WebSite retain the production site identity with a real logo", () => {
    const organization = schemas.find(schema => schema["@type"] === "Organization");
    const website = schemas.find(schema => schema["@type"] === "WebSite");
    assert.equal(organization.url, `${CANONICAL_ORIGIN}/`);
    assert.equal(website.url, `${CANONICAL_ORIGIN}/`);
    assert.equal(organization.contactPoint[0].email, "contact@shortbreakhub.com");
    const logo = new URL(organization.logo);
    assert.equal(logo.origin, CANONICAL_ORIGIN);
    assert.ok(existsSync(new URL(`../public${logo.pathname}`, import.meta.url)));
    assert.ok(existsSync(new URL(`../dist${logo.pathname}`, import.meta.url)));
});

test("static template leaves social ownership to React and contains no legacy metadata", () => {
    assert.doesNotMatch(indexHtml, /shortbreakshub\.com|currentTime-by-currentTime/);
    assert.doesNotMatch(indexHtml, /<meta\b[^>]*(?:og:|twitter:)/);
    assert.doesNotMatch(indexHtml, /rel="canonical"/);
});
