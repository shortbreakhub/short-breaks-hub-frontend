import {localCalendarDate, addCalendarDays} from "./hotelBooking.js";

export function getFlightDefaults({city, days}, now = new Date()) {
    // Move to the next month before restoring the day, clamped at month end.
    const departure = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12);
    const lastDay = new Date(departure.getFullYear(), departure.getMonth() + 1, 0, 12).getDate();
    departure.setDate(Math.min(now.getDate(), lastDay));
    const depart = localCalendarDate(departure);
    return {to: city ?? "", depart, nonstopOnly: false,
        return: Number.isInteger(days) && days > 0 ? addCalendarDays(depart, days) : ""};
}

function parseDate(value) {
    if (typeof value !== "string" || !/^\d{4,}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (year < 1) return null;
    const date = new Date(0);
    date.setHours(12, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function validateFlightDates(filters, now = new Date()) {
    const departure = parseDate(filters.depart);
    if (!departure) return "tripPrepRail.flights.invalidDeparture";
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    if (departure < today) return "tripPrepRail.flights.pastDeparture";
    const returning = parseDate(filters.return);
    if (!returning) return "tripPrepRail.flights.invalidReturn";
    if (returning <= departure) return "tripPrepRail.flights.returnAfterDeparture";
    return null;
}


export function validateFlightSearch(filters, now = new Date()) {
    if (typeof filters.from !== "string" || !filters.from.trim()) return "tripPrepRail.flights.missingOrigin";
    if (typeof filters.to !== "string" || !filters.to.trim()) return "tripPrepRail.flights.missingDestination";
    return validateFlightDates(filters, now);
}
