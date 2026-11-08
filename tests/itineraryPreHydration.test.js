import assert from "node:assert/strict";
import test from "node:test";
import {chromium} from "playwright";
import {preview} from "vite";

test("a Day 2 click before hydration keeps its disclosure open and mounts the image", async () => {
    const server = await preview({preview: {host: "127.0.0.1", port: 0, strictPort: false}});
    const browser = await chromium.launch({headless: true});
    const page = await browser.newPage();
    let releaseEntry;
    let entryRequested;
    const entryRequest = new Promise(resolve => {entryRequested = resolve;});
    const entryGate = new Promise(resolve => {releaseEntry = resolve;});

    try {
        await page.route("**/assets/index-*.js", async route => {
            entryRequested();
            await entryGate;
            await route.continue();
        });
        const response = await page.goto(
            `http://127.0.0.1:${server.httpServer.address().port}/itinerary/4-days-sydney-light-water-and-open-living/`,
            {waitUntil: "commit"},
        );
        assert.equal(response.status(), 200);
        await entryRequest;

        const days = page.locator(".itinerary-day-timeline__disclosure");
        const dayOne = days.nth(0);
        const dayTwo = days.nth(1);
        await dayTwo.locator("summary").waitFor({state: "visible"});
        await dayTwo.locator("summary").click();
        assert.equal(await dayTwo.evaluate(element => element.open), true,
            "the native disclosure opens before the React entry module is released");
        assert.equal(await dayTwo.locator(".itinerary-day-timeline__image img").count(), 0,
            "React has not mounted the image before hydration");

        releaseEntry();
        await dayTwo.locator(".itinerary-day-timeline__image img").waitFor({state: "visible"});
        assert.equal(await dayTwo.evaluate(element => element.open), true);
        assert.match(await dayTwo.locator(".itinerary-day-timeline__image img").getAttribute("src"),
            /day-2-sydney-harbour-bridge.*\.png$/);
        assert.equal(await dayOne.evaluate(element => element.open), true,
            "the server-rendered initial open day remains open");
        assert.equal(await dayOne.locator(".itinerary-day-timeline__image img").count(), 1);

        await dayTwo.locator("summary").click();
        await dayTwo.locator(".itinerary-day-timeline__image img").waitFor({state: "detached"});
        assert.equal(await dayTwo.evaluate(element => element.open), false);

        await dayTwo.locator("summary").evaluate(summary => {
            summary.click();
            summary.click();
            summary.click();
        });
        await dayTwo.locator(".itinerary-day-timeline__image img").waitFor({state: "visible"});
        assert.equal(await dayTwo.evaluate(element => element.open), true,
            "coalesced rapid native toggles leave React aligned with the final open state");
    } finally {
        releaseEntry();
        await browser.close();
        await server.close();
    }
});
