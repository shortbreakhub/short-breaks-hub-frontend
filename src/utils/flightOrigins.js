import airports from "../config/flight-airports.json" with {type: "json"};

// City codes are explicit, never inferred from destination airport mappings.
// London/Paris: BA filing https://downloads.regulations.gov/DOT-OST-2024-0068-0001/attachment_1.pdf
// MAN: https://mediacentre.manchesterairport.co.uk/information-about-man/
// BHX: https://www.birminghamairport.co.uk/
const cities = [
    {name: "London", code: "LON", aliases: ["london", "londres"]},
    {name: "Manchester", code: "MAN", aliases: ["manchester"]},
    {name: "Birmingham", code: "BHX", aliases: ["birmingham"]},
    {name: "Paris", code: "PAR", aliases: ["paris"]},
];
// Additional physical airports not necessarily in the destination catalogue.
// https://www.heathrow.com/explore-the-world
// https://www.gatwickairport.com/on/demandware.static/-/Sites-Gatwick-Library/default/dw1d34163e/images/Corporate-PDFs/Sustainability/Surface-access-reports/Surface_access_strategy.pdf
// https://www.admtl.com/sites/default/files/2024/Conseils%20des%20F%C3%AAtes%202023_EN.pdf
const extraAirports = [
    {name: "London Heathrow", code: "LHR"},
    {name: "London Gatwick", code: "LGW"},
    {name: "Manchester Airport", code: "MAN"},
    {name: "Birmingham Airport", code: "BHX"},
    {name: "Montréal-Trudeau", code: "YUL"},
];
const physicalAirports = [...Object.values(airports).filter(record => record.status === "VERIFIED")
    .map(record => ({name: record.airportName, code: record.airportCode})), ...extraAirports];
const codes = new Map(physicalAirports.map(record => [record.code, record]));
export const FLIGHT_ORIGIN_SUGGESTIONS = Object.freeze(cities.map(city => city.name));

export function resolveFlightOrigin(value) {
    if (typeof value !== "string") return null;
    const input = value.trim();
    const city = cities.find(record => record.aliases.includes(input.toLowerCase()));
    if (city) return {name: city.name, code: city.code};
    const cityCode = cities.find(record => record.code === input.toUpperCase());
    if (cityCode) return {name: cityCode.name, code: cityCode.code};
    const airport = codes.get(input.toUpperCase()) || physicalAirports.find(record => record.name.toLowerCase() === input.toLowerCase());
    if (airport) return {name: airport.name, code: airport.code};
    // Preserve supported explicit name (code) input, but verify the code itself.
    const match = input.match(/^([^\r\n<>/?#()]{1,100})\s+\(([A-Za-z]{3})\)$/);
    if (match && codes.has(match[2].toUpperCase())) return {name: match[1].trim(), code: match[2].toUpperCase()};
    return null;
}
