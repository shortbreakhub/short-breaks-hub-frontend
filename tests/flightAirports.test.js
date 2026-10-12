import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync, readdirSync} from "node:fs";
import {getFlightAirport, validateFlightAirportMappings, createFlightAirportLookup} from "../src/utils/flightAirports.js";

const text = readFileSync("src/config/flight-airports.json", "utf8");
const records = JSON.parse(text);
const evidence = JSON.parse(readFileSync("docs/research/flight-airports/evidence.json", "utf8"));

test("mapping covers all 201 canonical catalogue identities without duplicate or conflicting records", () => {
    const keys = Object.keys(records);
    assert.equal(evidence.catalogSource.uniqueDestinationCount, 201);
    assert.equal(keys.length, evidence.catalogSource.uniqueDestinationCount);
    const literalKeys = [...text.matchAll(/^  "([^"]+)": \{/gm)].map(match => match[1]);
    assert.equal(new Set(literalKeys).size, literalKeys.length, "JSON must not silently shadow duplicate keys");
    assert.deepEqual(keys.sort(), evidence.destinations.map(d => d.destinationKey).sort());
    assert.equal(new Set(evidence.destinations.map(d => d.destinationKey)).size, 201);
    for (const d of evidence.destinations) {
        assert.equal(records[d.destinationKey].status, d.status);
        assert.equal(records[d.destinationKey].airportCode, d.candidateAirport);
        assert.equal(records[d.destinationKey].mappingType, d.mappingType);
        assert.ok(d.itinerarySlugs.length > 0 && d.name && d.country);
        assert.ok(d.sources.length > 0, `${d.destinationKey} needs destination-specific evidence`);
        assert.ok(evidence.airportReferences[d.candidateAirport].sources.length > 0);
        for (const s of [...d.sources, ...evidence.airportReferences[d.candidateAirport].sources]) assert.match(s.url, /^https?:\/\//);
        if (d.status === "REVIEW_REQUIRED") assert.ok(d.reviewNotes.length > 0);
    }
});

test("existing official prerender inventory uses the same stable destination keys; three catalogue-only entries are explicit", () => {
    const seen = new Set();
    for (const slug of readdirSync("dist/itinerary")) {
        const html = readFileSync(`dist/itinerary/${slug}/index.html`, "utf8");
        const data = JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]).detail;
        const key = data.hotelDestination.destinationKey;
        seen.add(key);
        assert.ok(Object.hasOwn(records, key), `missing canonical destination ${key}`);
        const d = evidence.destinations.find(d => d.destinationKey === key);
        assert.ok(d.itinerarySlugs.includes(data.slug), `catalogue association mismatch for ${key}`);
        assert.equal(d.country, data.country);
    }
    const absent = evidence.destinations.filter(d => !seen.has(d.destinationKey));
    assert.deepEqual(absent.map(d => d.destinationKey).sort(), ["mexico--san-miguel-de-allende", "peru--arequipa", "united-states--washington-d-c"]);
    assert.ok(absent.every(d => !d.presentInPrerenderSnapshot && d.countryGatewayDecision && d.status === "VERIFIED"));
});

test("IATA-format and physical-airport records are validated independently of display names", () => {
    assert.equal(validateFlightAirportMappings(records), records);
    for (const r of Object.values(records)) {assert.match(r.airportCode, /^[A-Z]{3}$/); assert.equal(r.locationType, "AIRPORT");}
    const good = records["germany--berlin"];
    for (const bad of [{airportCode: "ber"}, {airportCode: "BER1"}, {airportCode: ""}, {airportCode: 123}, {airportName: ""}, {mappingType: "NEAREST"}, {status: "APPROVED"}, {locationType: "CITY"}, {destinationKey: "different"}, {airportCode: null}, {airportCode: null, airportName: null}]) {
        assert.throws(() => validateFlightAirportMappings({[good.destinationKey]: {...good, ...bad}}), TypeError);
    }
    assert.throws(() => validateFlightAirportMappings([]), TypeError);
    assert.throws(() => validateFlightAirportMappings(null), TypeError);
});

test("DIRECT and GATEWAY classifications distinguish serving airports from onward journeys", () => {
    assert.equal(getFlightAirport("japan--osaka").mappingType, "DIRECT");
    assert.equal(getFlightAirport("japan--kyoto").mappingType, "GATEWAY");
    assert.equal(records["french-polynesia--tahiti-bora-bora"].mappingType, "GATEWAY");
    assert.equal(records["canada--lake-louise"].mappingType, "GATEWAY");
    assert.equal(records["cambodia--phnom-penh"].airportCode, "KTI", "retired PNH must not be proposed");
    assert.equal(records["cambodia--siem-reap"].airportCode, "SAI", "retired REP must not be proposed");
    assert.equal(records["mongolia--ulaanbaatar"].airportCode, "UBN", "do not confuse old ULN with current international airport");
});

test("runtime returns only VERIFIED, immutable mappings; unresolved, unavailable and unknown values fail closed", () => {
    for (const [key, r] of Object.entries(records)) {
        const result = getFlightAirport(key);
        if (r.status === "VERIFIED") {assert.deepEqual(result, r); assert.ok(Object.isFrozen(result));}
        else assert.equal(result, null);
    }
    const unavailable = {...records["germany--berlin"], airportCode: null, airportName: null, status: "UNAVAILABLE"};
    assert.equal(createFlightAirportLookup({[unavailable.destinationKey]: unavailable})(unavailable.destinationKey), null, "UNAVAILABLE records cannot reach runtime consumers");
    for (const key of [undefined, null, {}, "Berlin", "BER", "__proto__", "constructor", "unknown--destination"]) assert.equal(getFlightAirport(key), null);
    assert.throws(() => {getFlightAirport("germany--berlin").airportCode = "XXX";}, TypeError);
});

test("gateway reassessment preserves runtime schema and records every physical-airport candidate", () => {
    const fields = ["destinationKey", "airportCode", "airportName", "locationType", "mappingType", "status"].sort();
    const codes = new Set();
    for (const d of evidence.destinations) {
        const r = records[d.destinationKey];
        assert.deepEqual(Object.keys(r).sort(), fields);
        assert.equal(d.previousMapping.destinationKey, d.destinationKey);
        assert.equal(d.gatewayAssessment.selectedDefault, r.airportCode);
        assert.ok(d.gatewayAssessment.decision && d.gatewayAssessment.proximityQualification);
        const candidates = d.gatewayAssessment.candidates;
        assert.equal(new Set(candidates.map(c => c.airportCode)).size, candidates.length);
        assert.ok(candidates.some(c => c.airportCode === r.airportCode));
        assert.ok(candidates.length >= 2, `${d.destinationKey} needs a meaningful comparison`);
        for (const c of candidates) {
            codes.add(c.airportCode);
            assert.match(c.airportCode, /^[A-Z]{3}$/);
            assert.ok(c.referenceName && c.referenceCountry);
            assert.equal(c.identityConfidence, "PHYSICAL_AIRPORT_SECONDARY_REFERENCE_MATCH");
            assert.ok(evidence.airportReferences[c.airportCode]);
        }
    }
    assert.equal(codes.size, evidence.gatewayReassessment.airportCodesIdentityCrossChecked);
});

test("country gateway approvals preserve comparison history and Myanmar safety exceptions fail closed", () => {
    for (const [key, selected, required] of [
        ["malaysia--ipoh", "KUL", ["IPH", "PEN", "KUL"]],
        ["myanmar--bagan", "RGN", ["NYU", "MDL", "RGN"]],
        ["thailand--sukhothai", "BKK", ["THS", "BKK"]],
        ["chile--torres-del-paine-national-park", "SCL", ["PNT", "PUQ", "SCL"]],
        ["new-zealand--rotorua", "WLG", ["ROT", "AKL"]],
        ["philippines--palawan", "MNL", ["ENI", "USU", "PPS", "MNL", "CEB"]],
    ]) {
        const d = evidence.destinations.find(d => d.destinationKey === key);
        assert.equal(records[key].airportCode, selected);
        assert.equal(records[key].mappingType, "GATEWAY");
        const blocked = key === "myanmar--bagan";
        assert.equal(records[key].status, blocked ? "REVIEW_REQUIRED" : "VERIFIED");
        if (blocked) assert.equal(getFlightAirport(key), null);
        else {
            assert.equal(d.countryGatewayDecision.countryLevelFallback, true);
            assert.equal(d.countryGatewayDecision.onwardTransportRequired, false);
            assert.deepEqual(getFlightAirport(key), records[key]);
        }
        for (const code of required) assert.ok(d.gatewayAssessment.candidates.some(c => c.airportCode === code));
    }
    const palawan = evidence.destinations.find(d => d.destinationKey === "philippines--palawan");
    assert.match(palawan.itineraryContext.planningCity, /El Nido.*Coron/);
    const southIsland = evidence.destinations.find(d => d.destinationKey === "new-zealand--south-island");
    assert.equal(records[southIsland.destinationKey].airportCode, "CHC");
    assert.match(southIsland.itineraryContext.scheduleTitles[0], /Christchurch/);
});


test("owner policy accounts for all 71 decisions and country-entry fallbacks never claim DIRECT arrival", () => {
    const decisions = evidence.destinations.filter(d => d.countryGatewayDecision);
    assert.equal(decisions.length, 71);
    const fallbacks = decisions.filter(d => d.countryGatewayDecision.countryLevelFallback);
    assert.equal(fallbacks.length, 60);
    for (const d of fallbacks) {
        const decision = d.countryGatewayDecision;
        assert.equal(records[d.destinationKey].mappingType, "GATEWAY");
        assert.equal(records[d.destinationKey].status, "VERIFIED");
        assert.equal(decision.onwardTransportRequired, false);
        assert.ok(decision.sourcesReviewed.length > 0);
        assert.match(decision.decisionReason, /entry point/);
        assert.match(decision.onwardTransportClaim, /instructions remain unchanged/);
    }
    assert.equal(decisions.filter(d => d.countryGatewayDecision.decisionBasis === "DEFENSIBLE_LOCAL_PASSENGER_AIRPORT").length, 8);
    assert.deepEqual(evidence.destinations.filter(d => d.status === "REVIEW_REQUIRED").map(d => d.destinationKey).sort(), ["myanmar--bagan", "myanmar--mandalay", "myanmar--yangon"]);
    assert.deepEqual(evidence.statusCounts, {VERIFIED: 198, REVIEW_REQUIRED: 3, UNAVAILABLE: 0});
});

test("fallback selects operational capital entry points or explicitly documented primary gateway exceptions", () => {
    for (const [key, code] of [
        ["brazil--manaus-amazon-rainforest", "BSB"],
        ["new-zealand--rotorua", "WLG"],
        ["philippines--palawan", "MNL"],
        ["south-africa--cape-town-winelands-cape-peninsula", "JNB"],
        ["tanzania--arusha-serengeti-ngorongoro", "DAR"],
        ["fiji--fiji-islands", "NAN"],
        ["new-caledonia--noumea-outer-lagoons", "NOU"],
    ]) {
        assert.equal(getFlightAirport(key).airportCode, code);
        assert.equal(getFlightAirport(key).mappingType, "GATEWAY");
    }
    for (const [key, code] of [["peru--cusco", "CUZ"], ["china--chengdu", "TFU"], ["laos--luang-prabang", "LPQ"]]) {
        assert.equal(getFlightAirport(key).airportCode, code);
        assert.equal(getFlightAirport(key).mappingType, "DIRECT");
    }
});
