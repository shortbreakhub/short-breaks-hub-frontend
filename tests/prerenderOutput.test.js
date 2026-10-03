import assert from "node:assert/strict";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {REGIONS} from "../src/config/regions.js";
import {formatSlug} from "../src/utils/formatSlug.js";
import {getRegionPageMetadata, getCountryPageMetadata, getItineraryPageMetadata} from "../src/utils/pageMetadata.js";

import {createCountryDirectory} from "../src/utils/countries.js";
import {getCountryBrowsePath} from "../src/utils/publicNavigation.js";

const dist = resolve(process.cwd(), "dist");
const routes = {
    home: readFileSync(resolve(dist, "index.html"), "utf8"),
    contact: readFileSync(resolve(dist, "contact/index.html"), "utf8"),
    ...Object.fromEntries(REGIONS.map(({onClick}) => [onClick, readFileSync(resolve(dist, onClick, "index.html"), "utf8")])),
};
function bootstrapData(html) {
    return JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
}
const directory = createCountryDirectory(REGIONS.flatMap(({onClick}) => bootstrapData(routes[onClick]).countries));
for (const slug of directory.keys()) {
    routes[`browse/${slug}`] = readFileSync(resolve(dist, "browse", slug, "index.html"), "utf8");
}
const officialSlugs = [...new Set(REGIONS.flatMap(({onClick}) => bootstrapData(routes[onClick]).itineraries.map(item => item.slug)))];
for (const slug of officialSlugs) {
    routes[`itinerary/${slug}`] = readFileSync(resolve(dist, "itinerary", slug, "index.html"), "utf8");
}
const appShell = readFileSync(resolve(dist, "app-shell.html"), "utf8");

function htmlAttribute(html, tagName, attributeName, value) {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`<${tagName}\\b(?=[^>]*\\b${attributeName}=["']${escapedValue}["'])[^>]*>`, "i"));
    return match?.[0] ?? null;
}

function assertMetadata(html, {title, description, canonical}) {
    const head = html.slice(0, html.indexOf("</head>"));
    const titleTags = head.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) ?? [];
    assert.equal(titleTags.length, 1, "expected exactly one title tag");
    assert.ok(titleTags[0].includes(title), `expected title to contain ${title}`);

    const descriptionTag = htmlAttribute(head, "meta", "name", "description");
    assert.ok(descriptionTag, "expected a meta description");
    assert.ok(descriptionTag.includes(description), `expected description to contain ${description}`);
    assert.equal((html.match(/<meta\b[^>]*\bname=["']description["']/gi) ?? []).length, 1);

    const canonicalTag = htmlAttribute(head, "link", "rel", "canonical");
    assert.ok(canonicalTag, "expected a canonical link");
    assert.ok(canonicalTag.includes(`href="${canonical}"`), `expected canonical ${canonical}`);
    assert.equal((html.match(/<link\b[^>]*\brel=["']canonical["']/gi) ?? []).length, 1);

    const robotsTag = htmlAttribute(head, "meta", "name", "robots");
    assert.ok(robotsTag, "expected a robots directive");
    assert.ok(robotsTag.includes("content=\"index,follow"), "expected index,follow policy");
    assert.equal((html.match(/<meta\b[^>]*\bname=["']robots["']/gi) ?? []).length, 1);

    assert.doesNotMatch(getRenderedRoot(html), /<title\b|name=["']description["']|name=["']robots["']|rel=["']canonical["']/i,
        "route metadata should be in the document head, not duplicated inside the React root");
}

function getRenderedRoot(html) {
    const rootStart = html.indexOf('<div id="root"');
    if (rootStart === -1) return null;

    const divTags = /<\/?div\b[^>]*>/gi;
    divTags.lastIndex = rootStart;
    let depth = 0;
    let match;
    while ((match = divTags.exec(html))) {
        depth += match[0].startsWith("</") ? -1 : 1;
        if (depth === 0) return html.slice(rootStart, divTags.lastIndex);
    }
    return null;
}

test("pre-rendered home HTML contains its route metadata and real page content", () => {
    assertMetadata(routes.home, {
        title: "Short Breaks Hub",
        description: "Discover curated city breaks",
        canonical: "https://www.shortbreakhub.com/",
    });
    assert.match(routes.home, /<h1[^>]*>[\s\S]*?Short Break Hub[\s\S]*?<\/h1>/);
    assert.match(routes.home, /href="\/europe"/);
});

test("public discovery documents retain meaningful headings and crawlable shell navigation", () => {
    for (const html of Object.values(routes)) {
        const root = getRenderedRoot(html);
        assert.equal((root.match(/<h1\b/g) || []).length, 1, "public pages must have one primary heading");
        assert.match(root, /<h1\b[^>]*>[^]*?\S[^]*?<\/h1>/);
        for (const path of ["/contact", "/live-weather", "/community-itineraries/region", "/login", "/privacy", "/terms"]) {
            assert.ok(root.includes(`href="${path}"`), `missing crawlable navigation to ${path}`);
        }
    }
    for (const {onClick} of REGIONS) assert.ok(getRenderedRoot(routes.home).includes(`href="/${onClick}"`));
});

test("pre-rendered Contact HTML contains route metadata and real Contact page content", () => {
    assertMetadata(routes.contact, {
        title: "Contact Short Breaks Hub",
        description: "Contact Short Breaks Hub",
        canonical: "https://www.shortbreakhub.com/contact",
    });
    assert.match(routes.contact, /<h1[^>]*>Contact<\/h1>/);
    assert.match(routes.contact, /name="message"/);
});

test("pre-rendered Europe HTML contains route metadata and current real Region page content", () => {
    assertMetadata(routes.europe, {
        title: "Short Breaks in Europe",
        description: "Explore countries and curated short-break itineraries across Europe",
        canonical: "https://www.shortbreakhub.com/europe",
    });
    assert.match(routes.europe, /<h1[^>]*>[\s\S]*?Discover[\s\S]*?Europe[\s\S]*?<\/h1>/);
    assert.match(routes.europe, />France<\/h2>/);
    assert.match(routes.europe, /href="\/browse\/france"/);
    assert.match(routes.europe, /href="\/itinerary\//);
    assert.doesNotMatch(routes.europe, /\/src\/assets\//, "asset URLs must point to built production assets");
});

test("route outputs contain distinct page trees and valid built JS/CSS assets", () => {
    const pageTrees = Object.values(routes).map(getRenderedRoot);
    assert.ok(pageTrees.every(Boolean));
    assert.equal(new Set(pageTrees).size, Object.keys(routes).length, "route outputs should contain distinct rendered React pages");

    for (const html of [...Object.values(routes), appShell]) {
        const js = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"/i)?.[1];
        const css = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+\.css)"/i)?.[1];
        assert.ok(js, "expected a production JavaScript bundle reference");
        assert.ok(css, "expected a production CSS bundle reference");
        assert.ok(existsSync(resolve(dist, js.replace(/^\//, ""))), `missing built JavaScript asset ${js}`);
        assert.ok(existsSync(resolve(dist, css.replace(/^\//, ""))), `missing built CSS asset ${css}`);
    }
});

test("the generic SPA fallback shell remains available for routes not pre-rendered", () => {
    assert.match(appShell, /<div id="root"><\/div>/);
    assert.doesNotMatch(appShell, /data-prerendered="true"/);
    assert.ok(existsSync(resolve(dist, "app-shell.html")));
});

for (const {onClick: region, title} of REGIONS) {
    test(`pre-rendered ${region} contains route metadata, hydration data, content and assets`, () => {
        const html = routes[region];
        assertMetadata(html, {
            ...getRegionPageMetadata(formatSlug(region)),
            canonical: `https://www.shortbreakhub.com/${region}`,
        });
        const heading = getRenderedRoot(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1];
        assert.ok(heading?.includes("Discover") && heading.includes(title), "expected Region heading");
        const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
        assert.equal(data.region, region);
        assert.ok(data.countries.length > 0);
        assert.ok(data.itineraries.length > 0);
        for (const country of data.countries) {
            assert.ok(html.includes(`href="${getCountryBrowsePath(country)}"`), `missing country link for ${country}`);
            const itinerary = data.itineraries.find(item => item.country.toLowerCase() === country.toLowerCase());
            assert.ok(itinerary, `missing itinerary data for ${country}`);
            assert.ok(html.includes(`href="/itinerary/${itinerary.slug}"`), `missing itinerary link for ${country}`);
        }
        assert.doesNotMatch(html, /\/src\/assets\/|url\(&#x27;undefined/);
        const assets = [...html.matchAll(/(?:src="|url\(&#x27;)(\/assets\/[^"&']+)/g)];
        assert.ok(assets.length > 0, "expected rendered image assets");
        for (const [, asset] of assets) {
            assert.ok(existsSync(resolve(dist, asset.slice(1))), `missing rendered asset ${asset}`);
        }
    });
}

test("only the known public routes have prerendered documents", () => {
    const documents = readdirSync(dist, {recursive: true})
        .filter(path => path === "index.html" || path.endsWith("/index.html"))
        .sort();
    assert.deepEqual(documents, ["index.html", "contact/index.html", ...REGIONS.map(({onClick}) => `${onClick}/index.html`), ...officialSlugs.map(slug => `itinerary/${slug}/index.html`), ...[...directory.keys()].map(slug => `browse/${slug}/index.html`)].sort());
    assert.equal(new Set(REGIONS.map(({onClick}) => onClick)).size, REGIONS.length);
    assert.doesNotMatch(appShell, /shortbreakhub-prerender-data|region-countries/);
});

for (const [route, html] of Object.entries(routes)) {
    test(`${route} has one consistent set of production social metadata`, () => {
        const head = html.split("</head>")[0];
        const social = new Map();
        for (const tag of head.match(/<meta\b[^>]*>/g) || []) {
            const key = tag.match(/(?:property|name)="((?:og:|twitter:)[^"]+)"/)?.[1];
            if (!key) continue;
            assert.ok(!social.has(key), `duplicate ${key}`);
            social.set(key, tag.match(/content="([^"]*)"/)?.[1]);
        }
        const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/)[1];
        const description = htmlAttribute(head, "meta", "name", "description").match(/content="([^"]*)"/)[1];
        const canonical = htmlAttribute(head, "link", "rel", "canonical").match(/href="([^"]*)"/)[1];
        assert.equal(social.get("og:title"), title);
        assert.equal(social.get("twitter:title"), title);
        assert.equal(social.get("og:description"), description);
        assert.equal(social.get("twitter:description"), description);
        assert.equal(social.get("og:url"), canonical);
        assert.equal(social.get("og:type"), "website");
        assert.equal(social.get("twitter:card"), "summary_large_image");
        for (const key of ["og:image", "twitter:image"]) {
            assert.equal(social.get(key), "https://www.shortbreakhub.com/og-cover.png");
            assert.ok(existsSync(resolve(dist, new URL(social.get(key)).pathname.slice(1))));
        }
        assert.doesNotMatch(html, /shortbreakshub\.com|currentTime-by-currentTime/);
        assert.doesNotMatch(getRenderedRoot(html), /(?:property|name)="(?:og:|twitter:)/);
    });
}

for (const [slug, name] of directory) {
    test(`Country ${slug} renders real cards with matching bootstrap and assets`, () => {
        const html = routes[`browse/${slug}`];
        assertMetadata(html, {...getCountryPageMetadata(name), canonical: `https://www.shortbreakhub.com/browse/${slug}`});
        const data = bootstrapData(html);
        assert.equal(data.type, "country");
        assert.equal(data.countrySlug, slug);
        assert.equal(data.countryName, name);
        assert.equal(data.language, "en");
        assert.deepEqual(createCountryDirectory(data.countryNames), directory);
        assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.ok(data.items.length > 0);
        assert.ok(getRenderedRoot(html).includes(name));
        for (const card of data.items) {
            assert.equal(card.country.toLowerCase(), name.toLowerCase());
            assert.ok(html.includes(`href="/itinerary/${card.slug}"`));
            assert.ok(getRenderedRoot(html).replace(/<!--[\s\S]*?-->/g, "").includes(`$${card.priceFrom}`));
            assert.ok(card.title && card.summary && card.hero && card.days > 0);
        }
        const images = [...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)];
        assert.ok(images.length >= data.items.length);
        for (const [, src] of images) assert.ok(existsSync(resolve(dist, src.slice(1))), `missing ${src}`);
        assert.doesNotMatch(getRenderedRoot(html), /\/src\/assets\/|\$undefined/);
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
test("production Shanghai bootstrap retains the backend Trip.com CITY mapping", () => {
    const data = bootstrapData(routes["itinerary/4-days-shanghai-where-the-future-never-waits"]);
    assert.deepEqual(data.detail.hotelDestination, {
        destinationKey: "china--shanghai", name: "Shanghai", provider: "TRIP_COM",
        entityType: "CITY", status: "MAPPED", externalId: "2",
    });
});
for (const slug of officialSlugs) {
    test(`Official itinerary ${slug} contains full public bootstrap, content, metadata and built assets`, () => {
        const html = routes[`itinerary/${slug}`];
        const bootstrap = bootstrapData(html);
        const data = bootstrap.detail;
        assert.equal(bootstrap.type, "official-itinerary");
        assert.equal(bootstrap.slug, slug);
        assert.equal(bootstrap.language, "en");
        assert.equal(data.slug, slug);
        assertMetadata(html, {title: escapeHtml(getItineraryPageMetadata(data, slug).title),
            description: escapeHtml(data.summary), canonical: `https://www.shortbreakhub.com/itinerary/${slug}`});
        const root = getRenderedRoot(html);
        for (const content of [data.title, data.summary, ...data.highlights,
            ...data.schedule.flatMap(day => [day.title, day.summary]), ...data.tips, ...data.mustTry,
            ...data.arrival.flatMap(item => [item.title, item.note]), ...data.places.map(place => place.name)]) {
            assert.ok(root.includes(escapeHtml(content)), `missing initial content: ${content}`);
        }
        assert.ok(data.schedule.every(day => typeof day.details === "string"));
        assert.doesNotMatch(root, /url\(undefined\)|\/src\/assets\/|fixed inset-0 z-50 bg-white/);
        for (const [, asset] of root.matchAll(/(?:src="|url\()(\/assets\/[^"&')]+)/g)) {
            assert.ok(existsSync(resolve(dist, asset.slice(1))), `missing ${asset}`);
        }
        const serialized = JSON.stringify(bootstrap);
        assert.doesNotMatch(serialized, /"(?:authToken|profile|liked|saving|prepDone|tripPrepStatus|userCurrency|comments|token)"/);
        assert.deepEqual(Object.keys(bootstrap).sort(), ["detail", "language", "slug", "type"]);
    });
}
