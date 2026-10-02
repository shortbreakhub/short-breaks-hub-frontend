import assert from "node:assert/strict";
import test from "node:test";
import {getHotelDefaults, initializeHotelBooking, resolveHotelBooking, changeHotelBooking,
    getMappedHotelDestination, projectHotelDestination, addCalendarDays, validateHotelSearch,
    buildTripComHotelUrl, TRIP_COM_HOTEL_AFFILIATE_URL} from "../src/utils/hotelBooking.js";
import {validateOfficialDetail} from "../src/utils/officialItineraries.js";

const now = new Date(2026, 9, 2, 23, 45);
const shanghai = {destinationKey: "china--shanghai", name: "Shanghai", provider: "TRIP_COM", entityType: "CITY", status: "MAPPED", externalId: "2"};
const context = {slug: "shanghai-trip", city: "Shanghai display", days: 4, hotelDestination: shanghai};
const defaults = getHotelDefaults(context, now);

test("Hotel defaults use canonical mapped name and local +30-day/+days dates", () => {
    assert.equal(defaults.destination, "Shanghai");
    assert.equal(defaults.checkIn, "2026-11-01");
    assert.equal(defaults.checkOut, "2026-11-05");
    assert.ok(defaults.checkIn > "2026-10-02");
    assert.equal(addCalendarDays("2028-02-28", 2), "2028-03-01");
    assert.equal(addCalendarDays("2026-03-28", 2), "2026-03-30");
    assert.equal(addCalendarDays("2026-12-30", 4), "2027-01-03");
    assert.equal(addCalendarDays("2026-02-30", 1), "");
    assert.equal(getHotelDefaults({...context, hotelDestination: null}, now).destination, "Shanghai display");
    const localNow = {getFullYear: () => 2026, getMonth: () => 9, getDate: () => 2};
    assert.equal(getHotelDefaults(context, localNow).checkIn, "2026-11-01", "defaults depend on local calendar fields, not UTC ISO conversion");
});

test("explicit overrides survive same-itinerary initialization, generated checkout follows check-in, new itinerary starts fresh", () => {
    let state = initializeHotelBooking(null, context, now);
    state = changeHotelBooking(state, "checkIn", "2026-11-10", context.days);
    assert.equal(resolveHotelBooking(state, 4).checkOut, "2026-11-14");
    state = changeHotelBooking(state, "checkOut", "2026-11-20", 4);
    state = changeHotelBooking(state, "destination", "Edited", 4);
    state = initializeHotelBooking(state, context, new Date(2026, 9, 3));
    assert.equal(resolveHotelBooking(state, 4).checkIn, "2026-11-10");
    assert.equal(resolveHotelBooking(state, 4).checkOut, "2026-11-20");
    assert.equal(resolveHotelBooking(state, 4).destination, "Edited");
    const paris = {...context, slug: "paris-trip", days: 3, city: "Paris", hotelDestination: {...shanghai, name: "Paris", externalId: "fixture-paris-id", destinationKey: "france--paris"}};
    state = initializeHotelBooking(state, paris, now);
    assert.deepEqual(state.overrides, {});
    assert.equal(resolveHotelBooking(state, 3).destination, "Paris");
    assert.equal(resolveHotelBooking(state, 3).checkOut, "2026-11-04");
});

test("builder emits verified search parameters and preserves affiliate values, including empty trip_sub1", () => {
    const hotel = {...defaults, rooms: 2, adults: 4, children: 2, childAges: ["6", "11"], breakfast: true, freeCancel: true};
    const url = new URL(buildTripComHotelUrl(shanghai, hotel, {now}));
    assert.equal(url.origin + url.pathname, "https://www.trip.com/hotels/list");
    const expected = {cityId: "2", cityName: "Shanghai", destName: "Shanghai", searchType: "CT",
        checkin: "2026-11-01", checkout: "2026-11-05", crn: "2", adult: "4", children: "2", ages: "6,11"};
    for (const [key, value] of Object.entries(expected)) assert.equal(url.searchParams.get(key), value);
    const original = new URL(TRIP_COM_HOTEL_AFFILIATE_URL);
    for (const key of ["Allianceid", "SID", "trip_sub1", "trip_sub3"]) {
        assert.ok(url.searchParams.has(key));
        assert.equal(url.searchParams.get(key), original.searchParams.get(key));
    }
    assert.equal(url.searchParams.get("listFilters"), "5~1*5*1,23~10*23*10");
    for (const key of ["city", "display", "optionId", "optionType", "optionName"]) assert.ok(!url.searchParams.has(key));
});

test("verified Hotel filters compose independently and discard every stale base filter", () => {
    const baseUrl = TRIP_COM_HOTEL_AFFILIATE_URL + "&listFilters=29~1*29*1~2*2,unverified&listFilters=stale";
    const hotel = {...defaults, children: 2, childAges: ["6", "11"]};
    for (const [breakfast, freeCancel, expected] of [
        [false, false, null], [true, false, "5~1*5*1"],
        [false, true, "23~10*23*10"], [true, true, "5~1*5*1,23~10*23*10"],
        [false, true, "23~10*23*10"], [true, false, "5~1*5*1"], [false, false, null],
    ]) {
        const url = new URL(buildTripComHotelUrl(shanghai, {...hotel, breakfast, freeCancel}, {now, baseUrl}));
        assert.equal(url.searchParams.get("listFilters"), expected);
        assert.equal(url.searchParams.getAll("listFilters").length, expected === null ? 0 : 1);
        assert.equal(url.searchParams.get("children"), "2");
        assert.equal(url.searchParams.get("ages"), "6,11");
        for (const key of ["provinceId", "countryId", "curr", "locale", "old", "fixedDate", "flexType"]) {
            assert.equal(url.searchParams.has(key), false);
        }
    }
    const url = new URL(buildTripComHotelUrl(shanghai, {...defaults, breakfast: true}, {now, baseUrl}));
    assert.equal(url.searchParams.get("listFilters"), "5~1*5*1");
    assert.equal(url.searchParams.has("children"), false);
    assert.equal(url.searchParams.has("ages"), false);
});

test("builder uses opaque IDs, safely encodes another destination, and removes stale destination/child/filter parameters", () => {
    const destination = {...shanghai, name: "Paris & Île + City", externalId: "000213/A+B", destinationKey: "france--paris"};
    const baseUrl = TRIP_COM_HOTEL_AFFILIATE_URL + "&children=2&ages=6,11&listFilters=unverified&cityId=2&cityName=Shanghai&destName=Shanghai";
    const url = new URL(buildTripComHotelUrl(destination, {...defaults, destination: destination.name}, {now, baseUrl}));
    assert.equal(url.searchParams.get("cityId"), "000213/A+B");
    assert.equal(url.searchParams.get("cityName"), destination.name);
    assert.equal(url.searchParams.get("destName"), destination.name);
    for (const key of ["children", "ages", "listFilters"]) assert.ok(!url.searchParams.has(key));
    assert.ok(!url.href.includes("Shanghai"));
    assert.ok(url.href.includes("%26") && url.href.includes("%2B"));
    assert.equal(typeof destination.externalId, "string");
});

test("unusable mappings, missing ages, mismatched edited names, dates and guest counts fail safely", () => {
    for (const destination of [null, {...shanghai, status: "SKIPPED", externalId: null},
        {...shanghai, provider: "OTHER"}, {...shanghai, entityType: "HOTEL"}, {...shanghai, externalId: " "}, {...shanghai, externalId: 2}]) {
        assert.equal(getMappedHotelDestination(destination), null);
        assert.equal(validateHotelSearch(destination, defaults, now), "tripPrepRail.hotel.destinationUnavailable");
        assert.throws(() => buildTripComHotelUrl(destination, defaults, {now}), /destinationUnavailable/);
    }
    assert.throws(() => buildTripComHotelUrl(shanghai, {...defaults, children: 1, childAges: [null]}, {now}), /missingChildAges/);
    assert.equal(validateHotelSearch(shanghai, {...defaults, destination: "Kyoto"}, now), "tripPrepRail.hotel.destinationMismatch");
    for (const dates of [{checkIn: "2026-10-01"}, {checkOut: defaults.checkIn}, {checkIn: "2026-02-30"}]) {
        assert.equal(validateHotelSearch(shanghai, {...defaults, ...dates}, now), "tripPrepRail.hotel.invalidDates");
    }
    assert.equal(validateHotelSearch(shanghai, {...defaults, rooms: 0}, now), "tripPrepRail.hotel.invalidGuests");
});

test("provider bootstrap projection retains exactly public descriptor fields and supports null/older APIs", () => {
    assert.deepEqual(projectHotelDestination({...shanghai, id: 1, reason: "internal", updatedAt: "internal"}), shanghai);
    assert.equal(projectHotelDestination(undefined), null);
    assert.equal(projectHotelDestination({...shanghai, externalId: 2}), null);
    const skipped = {...shanghai, status: "SKIPPED", externalId: null};
    assert.deepEqual(projectHotelDestination(skipped), skipped);
    // Real public detail fixture from current output, passed through the actual build projection.
    return import("node:fs").then(({readFileSync}) => {
        const html = readFileSync("dist/itinerary/4-days-shanghai-where-the-future-never-waits/index.html", "utf8");
        const data = JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]).detail;
        const projected = validateOfficialDetail(data.slug, {...data, hotelDestination: {...shanghai, reason: "internal"}});
        assert.deepEqual(projected.hotelDestination, shanghai);
        assert.equal(validateOfficialDetail(data.slug, {...data, hotelDestination: undefined}).hotelDestination, null);
    });
});


test("infant serialization changes only the provider value and preserves numeric UI ages", () => {
    for (const ages of [["<1"], ["<1", "6", "11"], ...Array.from({length: 17}, (_, i) => [String(i + 1)])]) {
        const hotel = {...defaults, children: ages.length, childAges: [...ages]};
        assert.equal(validateHotelSearch(shanghai, hotel, now), null);
        const url = new URL(buildTripComHotelUrl(shanghai, hotel, {now}));
        assert.equal(url.searchParams.get("children"), String(ages.length));
        assert.equal(url.searchParams.get("ages"), ages.map(age => age === "<1" ? "0" : age).join(","));
        assert.deepEqual(hotel.childAges, ages);
        assert.equal(url.searchParams.has("listFilters"), false, "no guest filter fragments emitted");
        const original = new URL(TRIP_COM_HOTEL_AFFILIATE_URL);
        for (const key of ["Allianceid", "SID", "trip_sub1", "trip_sub3"]) {
            assert.equal(url.searchParams.get(key), original.searchParams.get(key));
        }
    }
});

test("malformed and sparse child ages fail validation without throwing or navigating", () => {
    for (const ages of [undefined, null, "6", {length: 1, 0: "6"}, new Array(1), [undefined], [null], ["0"], ["18"]]) {
        const hotel = {...defaults, children: 1, childAges: ages};
        assert.equal(validateHotelSearch(shanghai, hotel, now), "tripPrepRail.hotel.missingChildAges");
        assert.throws(() => buildTripComHotelUrl(shanghai, hotel, {now}), /missingChildAges/);
    }
    const sparse = ["6", , "11"];
    assert.equal(validateHotelSearch(shanghai, {...defaults, children: 3, childAges: sparse}, now), "tripPrepRail.hotel.missingChildAges");
});
