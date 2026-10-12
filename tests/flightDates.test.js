import assert from "node:assert/strict";
import test from "node:test";
import {spawnSync} from "node:child_process";
import {getFlightDefaults, validateFlightDates, validateFlightSearch} from "../src/utils/flightDates.js";

const today = new Date(2026, 9, 12, 23, 30);

test("flight dates add one calendar month and actual 2/4/7-day itinerary durations", () => {
    for (const [days, returning] of [[2, "2026-11-14"], [4, "2026-11-16"], [7, "2026-11-19"]]) {
        assert.deepEqual(getFlightDefaults({city: "Shanghai", days}, today), {to: "Shanghai", depart: "2026-11-12", return: returning, nonstopOnly: false});
    }
    assert.equal(getFlightDefaults({city: "Shanghai"}, today).return, "", "never invent a missing itinerary duration");
});

test("one-month defaults clamp month ends and support leap years and year boundaries", () => {
    for (const [date, departure, returning] of [
        [new Date(2026, 0, 31, 23), "2026-02-28", "2026-03-02"],
        [new Date(2028, 0, 31, 23), "2028-02-29", "2028-03-02"],
        [new Date(2026, 2, 31, 23), "2026-04-30", "2026-05-02"],
        [new Date(2026, 11, 31, 23), "2027-01-31", "2027-02-02"],
    ]) {
        const defaults = getFlightDefaults({days: 2}, date);
        assert.equal(defaults.depart, departure);
        assert.equal(defaults.return, returning);
    }
});

test("flight defaults use the visitor's local calendar even when the UTC day differs", () => {
    const moduleUrl = new URL("../src/utils/flightDates.js", import.meta.url).href;
    for (const [tz, instant, departure] of [
        ["America/Los_Angeles", "2026-10-13T01:00:00Z", "2026-11-12"],
        ["Pacific/Auckland", "2026-10-11T13:00:00Z", "2026-11-12"],
        ["Europe/London", "2026-02-28T23:00:00Z", "2026-03-28"],
    ]) {
        const result = spawnSync(process.execPath, ["--input-type=module", "-e",
            `import {getFlightDefaults} from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(getFlightDefaults({days: 4}, new Date(${JSON.stringify(instant)}))));`],
        {env: {...process.env, TZ: tz}, encoding: "utf8"});
        assert.equal(result.status, 0, result.stderr);
        assert.equal(JSON.parse(result.stdout).depart, departure);
    }
});

test("validation rejects malformed/impossible calendar dates, past departure and non-later return", () => {
    for (const depart of ["", null, "bad", "2026-02-30", "2026-13-01", "2026-1-01"]) {
        assert.equal(validateFlightDates({depart, return: "2026-11-13"}, today), "tripPrepRail.flights.invalidDeparture");
    }
    for (const returning of ["", undefined, "2026-02-29", "2026-04-31"]) {
        assert.equal(validateFlightDates({depart: "2026-11-12", return: returning}, today), "tripPrepRail.flights.invalidReturn");
    }
    for (const returning of ["2026-11-12", "2026-11-11"]) {
        assert.equal(validateFlightDates({depart: "2026-11-12", return: returning}, today), "tripPrepRail.flights.returnAfterDeparture");
    }
    assert.equal(validateFlightDates({depart: "2026-10-11", return: "2026-11-13"}, today), "tripPrepRail.flights.pastDeparture");
});

test("today and a one-day-later return are valid; edits have no maximum or itinerary-duration constraint", () => {
    for (const values of [
        {depart: "2026-10-12", return: "2026-10-13"},
        {depart: "2026-11-12", return: "2026-11-13"},
        {depart: "2026-11-12", return: "2126-11-12"},
        {depart: "2026-11-12", return: "10000-11-12"},
    ]) assert.equal(validateFlightDates(values, today), null);
});


test("Flights requires explicitly entered origin and destination without assuming London", () => {
    const values = {depart: "2026-11-12", return: "2026-11-13", from: "New York (JFK)", to: "Shanghai (PVG)"};
    for (const from of [undefined, "", "   "]) assert.equal(validateFlightSearch({...values, from}, today), "tripPrepRail.flights.missingOrigin");
    for (const to of [undefined, "", "   "]) assert.equal(validateFlightSearch({...values, to}, today), "tripPrepRail.flights.missingDestination");
    assert.equal(validateFlightSearch(values, today), null);
});
