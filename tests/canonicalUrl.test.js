import assert from "node:assert/strict";
import test from "node:test";
import {getCanonicalUrl} from "../src/utils/canonicalUrl.js";

test("home and static public routes use the production origin", () => {
    assert.equal(getCanonicalUrl(), "https://www.shortbreakhub.com/");
    assert.equal(getCanonicalUrl(["contact"]), "https://www.shortbreakhub.com/contact");
    assert.equal(getCanonicalUrl(["privacy"]), "https://www.shortbreakhub.com/privacy");
    assert.equal(getCanonicalUrl(["terms"]), "https://www.shortbreakhub.com/terms");
});

test("region canonicals preserve the existing route spelling", () => {
    assert.equal(getCanonicalUrl(["southeast-asia"]), "https://www.shortbreakhub.com/southeast-asia");
    assert.equal(getCanonicalUrl(["Oceania"]), "https://www.shortbreakhub.com/Oceania");
});

test("country browse canonicals preserve the country route and encode its segment", () => {
    assert.equal(getCanonicalUrl(["browse", "united-states"]), "https://www.shortbreakhub.com/browse/united-states");
    assert.equal(getCanonicalUrl(["browse", "United States"]), "https://www.shortbreakhub.com/browse/United%20States");
});

test("official itinerary canonicals encode the slug as one route segment", () => {
    assert.equal(
        getCanonicalUrl(["itinerary", "3-days-kyoto-where-quiet-learns-to-last"]),
        "https://www.shortbreakhub.com/itinerary/3-days-kyoto-where-quiet-learns-to-last",
    );
    assert.equal(
        getCanonicalUrl(["itinerary", "city/name #1"]),
        "https://www.shortbreakhub.com/itinerary/city%2Fname%20%231",
    );
});
