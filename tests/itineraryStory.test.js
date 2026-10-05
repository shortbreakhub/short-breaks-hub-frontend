import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "vite";
import React from "react";
import {renderToString} from "react-dom/server";
import {I18nextProvider} from "react-i18next";
import {JSDOM} from "jsdom";
import i18n from "i18next";

const fixture = {
    id: 417,
    slug: "four-days-lisbon-where-light-carries-memory",
    title: "4 Days Lisbon — Where Light Carries Memory",
    city: "Lisbon",
    country: "Portugal",
    region: "europe",
    days: 4,
    priceFrom: 349,
    excludes: "Flights and accommodation",
    hero: "/src/assets/itineraries/portugal/4-days-lisbon-where-light-carries-memory.jpg",
    currencyCode: "EUR",
    summary: "Lisbon gathers its stories in tiled lanes, river light and long evenings.",
    highlights: ["Ride the historic trams", "Watch sunset over the Tagus", "Taste pastéis de nata"],
    schedule: [
        {day: 1, title: "Arrive by the river", summary: "Settle into the old town.", details: "Explore Alfama and take the tram toward the river."},
        {day: 2, title: "Across the hills", summary: "Follow the city's viewpoints.", details: "Visit the castle and continue through Baixa."},
        {day: 3, title: "Belém and the water", summary: "Spend a day beside the river.", details: "Explore Belém and return by the waterfront."},
        {day: 4, title: "A slow final morning", summary: "Leave room for one last café.", details: "Enjoy breakfast before departure."},
    ],
    mustTry: ["Pastéis de nata"],
    areas: [{name: "Alfama", note: "Traditional taverns and small cafés."}],
    places: [],
    hotelDestination: {type: "CITY", externalId: "123"},
};

const prepItems = [
    {id: "hotel", title: "Find hotels", hint: "Confirm your stay.", ctaLabel: "Find hotels", done: false},
    {id: "flights", title: "Find flights", hint: "Compare routes.", ctaLabel: "Find flights", done: false},
];

const props = {
    data: fixture,
    planning: {bestTime: {months: "May–June", note: "Mild weather."}, worstTime: {months: "August", note: "Busy and hot."}, tips: ["Wear comfortable shoes."], withKids: []},
    transport: {arrival: [], gettingAround: ["Use the metro and trams."], dayTrips: [], dayMoves: []},
    city: "Lisbon",
    likes: {liked: false, count: 12, saving: false},
    onToggleLike() {},
    fromAmount: "100",
    userCurrency: "USD",
    userCurrencyValue: "108.20",
    convertRate: 1.082,
    hotelBooking: {destination: "Lisbon", rooms: 1, adults: 2, children: 0, childAges: [], breakfast: false, freeCancel: false},
    onHotelOpen() {},
    onHotelChange() {},
    onHotelReset() {},
    tripPrepItems: prepItems,
    onMarkDone() {},
    onReset() {},
    onMarkAllDone() {},
};

function pageMarkup(Component) {
    return renderToString(React.createElement(I18nextProvider, {i18n},
        React.createElement(Component, props)));
}

test("official itinerary story keeps content, native day disclosures, practical tools and planning rail", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const previousLanguage = i18n.language;
    try {
        await vite.ssrLoadModule("/src/i18n.js");
        const {default: ItineraryStoryPage} = await vite.ssrLoadModule("/src/components/itinerary/ItineraryStoryPage.jsx");
        await i18n.changeLanguage("en");

        const dom = new JSDOM(pageMarkup(ItineraryStoryPage));
        const {document} = dom.window;
        assert.equal(document.querySelector("h1")?.textContent, fixture.title);
        assert.equal(document.querySelectorAll(".itinerary-story__hero img").length, 1, "only the existing hero photograph is used");
        assert.equal(document.querySelector(".itinerary-story__hero img")?.getAttribute("alt"), "");
        assert.equal(document.querySelector(".itinerary-story__hero img")?.getAttribute("loading"), "eager");
        assert.ok(document.querySelector(".itinerary-story__hero")?.textContent.includes("Excludes flights and accommodation"));
        assert.ok(document.body.textContent.includes("Trip Highlights"));
        assert.ok(document.body.textContent.includes("Watch sunset over the Tagus"));
        assert.equal(document.body.textContent.split(fixture.summary).length - 1, 1, "summary is used once in the overview");

        const journey = document.querySelector(".itinerary-day-timeline");
        assert.ok(journey instanceof dom.window.HTMLOListElement, "journey progression is an ordered list");
        assert.equal(journey.querySelectorAll(":scope > li").length, 4);
        const disclosures = [...journey.querySelectorAll("details")];
        assert.equal(disclosures.length, 4);
        assert.ok(disclosures[0].open, "the first day starts expanded");
        for (const [index, disclosure] of disclosures.entries()) {
            assert.ok(disclosure.querySelector("summary"), `day ${index + 1} uses a native keyboard disclosure`);
            assert.ok(disclosure.querySelector(".itinerary-day-timeline__preview")?.textContent);
            assert.ok(disclosure.querySelector(".itinerary-day-timeline__details")?.textContent.includes(fixture.schedule[index].details));
        }

        for (const label of ["Practical Information", "Travel tips", "Transport", "Local Currency", "Food recommendations", "Trip Prep", "Find hotels", "Comments"]) {
            assert.ok(document.body.textContent.toLowerCase().includes(label.toLowerCase()), `${label} remains present`);
        }
        assert.equal(document.querySelectorAll(".itinerary-story__rail").length, 1);
        assert.ok([...document.querySelectorAll("h2")].some(heading => heading.textContent.includes("Comments")), "comments follow the main section heading level");
        dom.window.close();

        await i18n.changeLanguage("fr");
        const french = new JSDOM(pageMarkup(ItineraryStoryPage));
        assert.ok(french.window.document.body.textContent.includes("Points forts du voyage"));
        assert.ok(french.window.document.body.textContent.includes("Vue d’ensemble"));
        assert.ok(french.window.document.body.textContent.includes("Jour par jour"));
        assert.ok(french.window.document.body.textContent.includes("Informations pratiques"));
        assert.ok(french.window.document.body.textContent.includes("Préparation du voyage"));
        french.window.close();
    } finally {
        await i18n.changeLanguage(previousLanguage ?? "en");
        await vite.close();
    }
});
