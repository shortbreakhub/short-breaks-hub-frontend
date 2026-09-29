import assert from "node:assert/strict";
import test from "node:test";
import {
    getCountryPageMetadata,
    getItineraryPageMetadata,
    getRegionPageMetadata,
    HOME_PAGE_METADATA,
    STATIC_PAGE_METADATA,
} from "../src/utils/pageMetadata.js";

test("home metadata describes the site's short-break offer", () => {
    assert.equal(HOME_PAGE_METADATA.title, "Short Breaks Hub – Curated City Breaks & Weekend Getaways");
    assert.match(HOME_PAGE_METADATA.description, /city breaks and weekend getaways/);
});

test("region metadata uses the region name in the title and description", () => {
    const metadata = getRegionPageMetadata("Southeast Asia");

    assert.equal(metadata.title, "Short Breaks in Southeast Asia | Regional Itineraries | Short Breaks Hub");
    assert.match(metadata.description, /across Southeast Asia/);
});

test("country metadata uses the current country name", () => {
    const metadata = getCountryPageMetadata("United States");

    assert.equal(metadata.title, "Short Breaks in United States | Short Breaks Hub");
    assert.match(metadata.description, /itineraries in United States/);
});

test("official itinerary metadata uses its loaded title, country, and summary", () => {
    const metadata = getItineraryPageMetadata({
        title: "Three Days in Kyoto",
        country: "Japan",
        days: 3,
        summary: "Explore Kyoto's temples, markets, and traditional streets over three days.",
    }, "three-days-kyoto");

    assert.equal(metadata.title, "Three Days in Kyoto | Japan | Short Breaks Hub");
    assert.equal(metadata.description, "Explore Kyoto's temples, markets, and traditional streets over three days.");
});

test("itinerary fallback metadata uses the route slug and available trip details", () => {
    const metadata = getItineraryPageMetadata({country: "Japan", days: 3}, "three-days-kyoto");

    assert.equal(metadata.title, "Three Days Kyoto | Japan | Short Breaks Hub");
    assert.match(metadata.description, /in Japan, a 3-day short-break itinerary/);
});

test("static public pages each have specific metadata", () => {
    assert.match(STATIC_PAGE_METADATA.contact.title, /Contact/);
    assert.match(STATIC_PAGE_METADATA.contact.description, /partnership enquiries/);
    assert.match(STATIC_PAGE_METADATA.privacy.title, /Privacy Policy/);
    assert.match(STATIC_PAGE_METADATA.privacy.description, /personal information/);
    assert.match(STATIC_PAGE_METADATA.terms.title, /Terms of Service/);
    assert.match(STATIC_PAGE_METADATA.terms.description, /planning features/);
});
