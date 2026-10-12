import {getMappedHotelDestination} from "./hotelBooking.js";

export const TRIP_COM_ATTRACTIONS_URL = "https://www.trip.com/things-to-do/list?searchKey=1&searchType=1&Allianceid=9927800&SID=327885881&trip_sub1=&trip_sub3=D20194372";

// Trip.com's own city-name search generated pagetype=city, keyword and
// pshowcode=all (verified for Paris, Tokyo and Barcelona on 2026-10-12).
// Attractions district IDs are NOT Hotel city IDs. Reuse the mapped city name
// instead; no identifier conversion, separate catalogue or Beijing fallback.
export function buildTripComAttractionsUrl(destination) {
    const mapped = getMappedHotelDestination(destination);
    if (!mapped) return null;
    const url = new URL(TRIP_COM_ATTRACTIONS_URL);
    url.searchParams.delete("searchKey");
    url.searchParams.delete("searchType");
    url.searchParams.set("pagetype", "city");
    url.searchParams.set("keyword", mapped.name);
    url.searchParams.set("pshowcode", "all");
    return url.href;
}
