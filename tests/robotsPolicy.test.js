import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {getRobotsPolicy} from "../src/utils/robotsPolicy.js";

const projectRoot = new URL("../", import.meta.url);
const readProjectFile = (path) => readFile(fileURLToPath(new URL(path, projectRoot)), "utf8");
const INDEX_POLICY = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";

test("main public SEO routes remain indexable", () => {
    for (const pathname of [
        "/",
        "/europe",
        "/browse/france",
        "/itinerary/three-days-in-paris",
        "/contact",
        "/privacy",
        "/terms",
    ]) {
        assert.equal(getRobotsPolicy(pathname), INDEX_POLICY, `${pathname} should remain indexable`);
    }
});

test("account and transient action routes use noindex,follow", () => {
    for (const pathname of [
        "/login",
        "/register",
        "/profile",
        "/create-itinerary",
        "/verify-email",
        "/api/auth/verify-email",
        "/forgot-password",
        "/reset-password",
    ]) {
        assert.equal(getRobotsPolicy(pathname), "noindex,follow", `${pathname} should not be indexed`);
    }
});

test("ambiguous weather, map, and community routes keep the existing index policy", () => {
    for (const pathname of [
        "/live-weather",
        "/map",
        "/user-itinerary/community-trip",
        "/community-itineraries/region",
        "/community-itineraries/region/europe",
    ]) {
        assert.equal(getRobotsPolicy(pathname), INDEX_POLICY, `${pathname} should remain unchanged`);
    }
});

test("the global robots tag is removed and robots.txt still permits crawling", async () => {
    const [indexHtml, routeRobots, robotsTxt] = await Promise.all([
        readProjectFile("index.html"),
        readProjectFile("src/components/RouteRobots.jsx"),
        readProjectFile("public/robots.txt"),
    ]);

    assert.doesNotMatch(indexHtml, /<meta\s+name=["']robots["']/i);
    assert.equal((routeRobots.match(/name="robots"/g) || []).length, 1);
    assert.match(robotsTxt, /^User-agent: \*\r?\nAllow: \/$/m);
    assert.doesNotMatch(robotsTxt, /^Disallow:/m);
});
