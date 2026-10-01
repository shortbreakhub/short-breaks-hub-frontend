import assert from "node:assert/strict";
import test from "node:test";
import {getCountrySlug, createCountryDirectory, resolveCountryName, buildCountryPages, getCountryBootstrap, toCountryCard} from "../src/utils/countries.js";
import {getCountryBrowsePath} from "../src/utils/publicNavigation.js";

const item = {slug: "rome", title: "Rome", summary: "Explore Rome", country: "Italy", days: 4,
    hero: "/src/assets/itineraries/italy/rome.jpg", priceFrom: 260};
const region = {countries: ["Italy"], itineraries: [item]};

test("one Country slug strategy handles all words, punctuation and frontend links", () => {
    for (const [name, slug] of [["Italy", "italy"], ["United Kingdom", "united-kingdom"],
        ["United States", "united-states"], ["South Korea", "south-korea"],
        ["Papua New Guinea", "papua-new-guinea"], ["Côte d’Ivoire", "cote-divoire"]]) {
        assert.equal(getCountrySlug(name), slug);
        assert.equal(getCountryBrowsePath(name), `/browse/${slug}`);
        assert.equal(resolveCountryName(slug, [name]), name);
    }
    assert.equal(resolveCountryName("asdfasdf", ["Italy"]), undefined);
    assert.equal(resolveCountryName("Italy!", ["Italy"]), undefined);
    assert.equal(resolveCountryName("United States", ["United States"]), "United States");
});

test("Country grouping keeps every card field and supplies the legitimate directory", () => {
    const pages = buildCountryPages([region, region]);
    assert.equal(pages.length, 1);
    assert.deepEqual(pages[0].items, [item]);
    assert.deepEqual(toCountryCard({...item, id: 1}), item);
    assert.deepEqual(pages[0].countryNames, ["Italy"]);
    assert.equal(pages[0].countryName, "Italy");
    assert.equal(pages[0].countrySlug, "italy");
    assert.equal(pages[0].language, "en");
});

test("invalid names, collisions, empty content and missing fields fail clearly", () => {
    assert.throws(() => createCountryDirectory(["Foo Bar", "Foo-Bar"]), /collision/);
    assert.throws(() => createCountryDirectory([""]), /invalid name/);
    assert.throws(() => createCountryDirectory(["東京"]), /usable slug/);
    assert.throws(() => buildCountryPages([]), /requires Region/);
    assert.throws(() => buildCountryPages([{countries: ["Italy"], itineraries: []}]), /Italy.*no usable/);
    for (const field of ["slug", "title", "summary", "country", "hero", "days", "priceFrom"]) {
        const bad = {...item}; delete bad[field];
        assert.throws(() => buildCountryPages([{...region, itineraries: [bad]}]), /missing|invalid/);
    }
    assert.throws(() => buildCountryPages([{...region, itineraries: [{...item, hero: "https://example.com/a.jpg"}]}]), /hero path/);
});

test("bootstrap only matches its Country and language; later navigation cannot reuse it", () => {
    const data = buildCountryPages([region])[0];
    assert.equal(getCountryBootstrap(data, "italy", "en"), data);
    assert.equal(getCountryBootstrap(data, "italy", "fr"), null);
    assert.equal(getCountryBootstrap(data, "japan", "en"), null);
    assert.equal(getCountryBootstrap({region: "europe"}, "italy", "en"), null);
});
