import {getFlightAirport} from "./flightAirports.js";
import {getFlightDefaults} from "./flightDates.js";

export const TRIP_COM_CAR_AFFILIATE_URL = "https://www.trip.com/carhire/online/list/?serverRoute=1&pcode=PEN&Allianceid=9927800&SID=327885881&trip_sub1=&trip_sub3=D20194372";

export function getCarDefaults({days}, now = new Date()) {
    const dates = getFlightDefaults({days}, now);
    return {pickupTime: `${dates.depart}T10:00`, returnTime: dates.return ? `${dates.return}T10:00` : ""};
}
function parseLocalDateTime(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
    if (year < 1) return null;
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(hour, minute, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
        && date.getHours() === hour && date.getMinutes() === minute ? date : null;
}
export function validateCarBooking(destinationKey, values) {
    if (!getFlightAirport(destinationKey)) return "tripPrepRail.car.unavailable";
    const pickup = parseLocalDateTime(values?.pickupTime);
    if (!pickup) return "tripPrepRail.car.invalidPickup";
    const returning = parseLocalDateTime(values?.returnTime);
    if (!returning) return "tripPrepRail.car.invalidReturn";
    return returning > pickup ? null : "tripPrepRail.car.returnAfterPickup";
}
export function buildTripComCarUrl(destinationKey, values) {
    if (validateCarBooking(destinationKey, values)) return null;
    const url = new URL(TRIP_COM_CAR_AFFILIATE_URL);
    url.searchParams.set("pcode", getFlightAirport(destinationKey).airportCode);
    for (const [parameter, value] of [["ptime", values.pickupTime], ["rtime", values.returnTime]]) {
        url.searchParams.set(parameter, value.replaceAll("-", "/").replace("T", " "));
    }
    return url.href;
}
