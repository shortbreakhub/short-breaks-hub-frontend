import assert from "node:assert/strict";
import test from "node:test";
import {
    getCountryBrowsePath,
    getOfficialItineraryPath,
    getRegionPath,
} from "../src/utils/publicNavigation.js";

test("region links retain their route spelling", () => {
    assert.equal(getRegionPath("southeast-asia"), "/southeast-asia");
    assert.equal(getRegionPath("Oceania"), "/Oceania");
});

test("country cards retain the country browse route", () => {
    assert.equal(getCountryBrowsePath("Japan"), "/browse/Japan");
    assert.equal(getCountryBrowsePath("United States"), "/browse/United States");
});

test("official itinerary links retain the itinerary route", () => {
    assert.equal(getOfficialItineraryPath("3-days-kyoto"), "/itinerary/3-days-kyoto");
});
