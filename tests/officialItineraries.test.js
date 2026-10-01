import assert from "node:assert/strict";
import test from "node:test";
import {getOfficialInventory, validateOfficialSlug, validateOfficialDetail, fetchOfficialPages,
    getOfficialBootstrap, getItineraryPlanning, getItineraryTransport} from "../src/utils/officialItineraries.js";

export function fixture(slug = "three-days-city") {
    return {id: 1, slug, region: "europe", country: "Italy", city: "Rome", title: "Rome trip",
        days: 3, priceFrom: 200, hero: "/src/assets/itineraries/italy/rome.jpg", summary: "City overview",
        highlights: ["Ancient streets"], schedule: [{day: 1, title: "Explore", summary: "Day overview", details: "Full details"}],
        planningCity: "Rome", bestTimeMonths: "April", bestTimeNote: "Mild", worstTimeMonths: "August", worstTimeNote: "Hot",
        tips: ["Book ahead"], withKids: ["Take breaks"], arrival: [{title: "Airport", note: "Train"}],
        gettingAround: ["Walk"], dayTrips: [], dayMoves: [], practical: ["Tickets"], mustTry: ["Pasta"],
        areas: [{name: "Centre", note: "Restaurants"}], places: [{name: "Cafe", area: "Centre", reason: "Local food", imageUrl: "", lat: 1, lng: 2}]};
}

test("official inventory derives/deduplicates only supplied Region data", () => {
    assert.deepEqual(getOfficialInventory([{itineraries: [{slug: "city-one"}, {slug: "city-two"}]},
        {itineraries: [{slug: "city-one"}]}]), ["city-one", "city-two"]);
    assert.throws(() => getOfficialInventory([{itineraries: []}]), /no itineraries/);
    assert.throws(() => getOfficialInventory([{itineraries: [{slug: ".."}]}]), /invalid canonical slug/);
});

test("official slugs are validated identities, never normalized", () => {
    for (const slug of ["", null, " City", "city ", "CITY", "a/b", "a\\b", "%2F", "a%20b", ".", "..", "a--b", "-a", "a-", "é-city", "a?b"]) {
        assert.throws(() => validateOfficialSlug(slug), /invalid canonical slug/);
    }
    assert.equal(validateOfficialSlug("3-days-city-2026"), "3-days-city-2026");
});

test("detail validates rendering shape and projects only public editorial data", () => {
    const raw = {...fixture(), authToken: "secret", profile: {email: "private"}, liked: true};
    raw.places[0].user = "private";
    const detail = validateOfficialDetail(raw.slug, raw);
    assert.equal(detail.title, raw.title);
    assert.equal(detail.authToken, undefined);
    assert.equal(detail.places[0].user, undefined);
    assert.equal(getItineraryPlanning(detail).bestTime.months, "April");
    assert.equal(getItineraryTransport(detail).arrival[0].note, "Train");
    for (const field of ["schedule", "title", "arrival", "tips", "hero", "id", "days", "places"]) {
        assert.throws(() => validateOfficialDetail(raw.slug, {...raw, [field]: null}), new RegExp(`${raw.slug}.*${field}`));
    }
    assert.throws(() => validateOfficialDetail(raw.slug, {...raw, slug: "other-city"}), /must equal requested slug/);
});

test("detail requests use bounded workers, English, once per inventory slug", async () => {
    const slugs = Array.from({length: 9}, (_, i) => `city-${i}`);
    let active = 0, max = 0;
    const calls = [];
    const pages = await fetchOfficialPages(slugs, async (slug, lang) => {
        calls.push([slug, lang]);
        max = Math.max(max, ++active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active--;
        return fixture(slug);
    });
    assert.equal(max, 4);
    assert.deepEqual(calls.map(([slug]) => slug), slugs);
    assert.ok(calls.every(([, lang]) => lang === "en"));
    assert.deepEqual(pages.map(page => page.slug), slugs);
    assert.ok(getOfficialBootstrap(pages[0], slugs[0], "en"));
    assert.equal(getOfficialBootstrap(pages[0], slugs[0], "fr"), null);
    assert.equal(getOfficialBootstrap(pages[0], slugs[1], "en"), null);
    assert.equal(getOfficialBootstrap({...pages[0], type: "community"}, slugs[0], "en"), null);
});

test("fetch failure identifies itinerary and never silently omits it", async () => {
    await assert.rejects(fetchOfficialPages(["broken-city"], async () => {throw new Error("API unavailable");}), /broken-city.*API unavailable/);
    await assert.rejects(fetchOfficialPages(["wrong-city"], async () => fixture("other-city")), /wrong-city.*slug/);
});
