import {resolveFlightOrigin} from "./flightOrigins.js";
import {getFlightAirport} from "./flightAirports.js";
import {validateFlightSearch} from "./flightDates.js";
import {TRIP_COM_HOTEL_AFFILIATE_URL} from "./hotelBooking.js";

// Owner-authorized experiment. Route parameters and commission attribution
// require provider/owner verification; trip_sub3 cannot be inferred from a route.
export const FLIGHT_ATTRIBUTION_STATUS = "EXPERIMENTAL_UNCONFIRMED";
export function flightAirportLabel(destinationKey) {
    const airport = getFlightAirport(destinationKey);
    return airport ? `${airport.airportName} (${airport.airportCode})` : "";
}
export function validateFlightBooking(destinationKey, filters, now = new Date()) {
    const error = validateFlightSearch(filters, now);
    if (error) return error;
    if (!resolveFlightOrigin(filters.from)) return "tripPrepRail.flights.invalidOrigin";
    const airport = getFlightAirport(destinationKey);
    if (!airport) return "tripPrepRail.flights.destinationUnavailable";
    if (![airport.airportCode, flightAirportLabel(destinationKey)].includes(filters.to.trim())) return "tripPrepRail.flights.destinationMismatch";
    return null;
}
export function buildTripComFlightUrl(destinationKey, filters, now = new Date()) {
    if (validateFlightBooking(destinationKey, filters, now)) return null;
    const origin = resolveFlightOrigin(filters.from);
    const airport = getFlightAirport(destinationKey);
    const url = new URL(`https://www.trip.com/flights/${encodeURIComponent(origin.name)}-to-${encodeURIComponent(airport.airportName)}/tickets-${origin.code}-${airport.airportCode}`);
    const tracking = new URL(TRIP_COM_HOTEL_AFFILIATE_URL).searchParams;
    url.search = new URLSearchParams({dcity: origin.code, acity: airport.airportCode,
        triptype: "rt", ddate: filters.depart, rdate: filters.return,
        nonstoponly: filters.nonstopOnly ? "on" : "off",
        Allianceid: tracking.get("Allianceid"), SID: tracking.get("SID"), trip_sub1: ""}).toString();
    return url.href;
}
