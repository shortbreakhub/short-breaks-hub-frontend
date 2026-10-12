import mappings from "../config/flight-airports.json" with {type: "json"};

// Validate reviewed data without guessing identities or deriving airport codes.
export function validateFlightAirportMappings(records) {
    if (!records || typeof records !== "object" || Array.isArray(records)) throw new TypeError("Expected mappings keyed by destinationKey");
    for (const [key, record] of Object.entries(records)) {
        if (!record || record.destinationKey !== key || !/^[a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)
            || !["DIRECT", "GATEWAY"].includes(record.mappingType)
            || !["VERIFIED", "REVIEW_REQUIRED", "UNAVAILABLE"].includes(record.status)
            || !["AIRPORT", "METROPOLITAN_AREA"].includes(record.locationType)
            || !(record.airportCode === null || typeof record.airportCode === "string" && /^[A-Z]{3}$/.test(record.airportCode))
            || !(record.airportName === null || typeof record.airportName === "string" && record.airportName.trim())
            || (record.airportCode === null) !== (record.airportName === null)
            || record.status === "VERIFIED" && record.airportCode === null) {
            throw new TypeError(`Invalid flight airport mapping: ${key}`);
        }
    }
    return records;
}

export function createFlightAirportLookup(records) {
    const airports = Object.freeze(Object.fromEntries(Object.entries(validateFlightAirportMappings(records))
        .map(([key, record]) => [key, Object.freeze({...record})])));
    return destinationKey => {
        if (typeof destinationKey !== "string" || !Object.hasOwn(airports, destinationKey)) return null;
        const record = airports[destinationKey];
        return record.status === "VERIFIED" ? record : null;
    };
}

export const getFlightAirport = createFlightAirportLookup(mappings);
