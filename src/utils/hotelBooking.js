// Verified Trip.com Hotel UI options. "<1" is an explicit draft value;
// it becomes "0" only at the verified Trip.com serialization boundary.
export const HOTEL_CHILD_AGE_OPTIONS = ["<1", ...Array.from({length: 17}, (_, index) => String(index + 1))];
export const MAX_HOTEL_CHILDREN = 6;

export function isValidHotelChildCount(count) {
    return Number.isInteger(count) && count >= 0 && count <= MAX_HOTEL_CHILDREN;
}

export function resizeHotelChildAges(ages = [], count = 0) {
    if (!isValidHotelChildCount(count)) return [];
    return Array.from({length: count}, (_, index) => ages[index] ?? null);
}

export function validateHotelChildAges(hotel) {
    const count = hotel.children ?? 0;
    if (!isValidHotelChildCount(count)) return "tripPrepRail.hotel.invalidChildren";
    const ages = hotel.childAges ?? [];
    if (!Array.isArray(ages) || ages.length !== count
        || Array.from({length: count}, (_, index) => ages[index])
            .some(age => !HOTEL_CHILD_AGE_OPTIONS.includes(age))) {
        return "tripPrepRail.hotel.missingChildAges";
    }
    return null;
}

// Approved affiliate configuration; destination/search values are replaced below.
export const TRIP_COM_HOTEL_AFFILIATE_URL = "https://www.trip.com/hotels/list?city=2&display=Shanghai&optionId=2&optionType=City&optionName=Shanghai&Allianceid=9927800&SID=327885881&trip_sub1=&trip_sub3=D19155586";

// Verified 2026-10-02 against Trip.com's public /hotels/list page data:
// Breakfast included = filterID 5|1; Free cancellation = filterID 23|10.
// Each fragment alone selects only its named checkbox; comma composition selects
// both. Guest state is derived by Trip.com from adult/children/ages/crn separately.
const TRIP_COM_HOTEL_FILTERS = {breakfast: "5~1*5*1", freeCancel: "23~10*23*10"};

export function getMappedHotelDestination(destination) {
    return destination?.provider === "TRIP_COM" && destination.entityType === "CITY"
        && destination.status === "MAPPED"
        && typeof destination.externalId === "string" && destination.externalId.trim()
        && typeof destination.name === "string" && destination.name.trim()
        && typeof destination.destinationKey === "string" && destination.destinationKey.trim()
        ? destination : null;
}

// Keep the narrow public descriptor in bootstrap, never internal mapping entities.
export function projectHotelDestination(destination) {
    if (!destination || !["destinationKey", "name", "provider", "entityType", "status"]
        .every(key => typeof destination[key] === "string")
        || !(destination.externalId === null || typeof destination.externalId === "string")) return null;
    return Object.fromEntries(["destinationKey", "name", "provider", "entityType", "status", "externalId"]
        .map(key => [key, destination[key]]));
}

export function localCalendarDate(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function parseCalendarDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    // Local noon avoids daylight-saving transitions at midnight.
    const date = new Date(year, month - 1, day, 12);
    return localCalendarDate(date) === value ? date : null;
}

export function addCalendarDays(value, days) {
    const date = parseCalendarDate(value);
    if (!date || !Number.isInteger(days) || days < 0) return "";
    date.setDate(date.getDate() + days);
    return localCalendarDate(date);
}

export function getHotelDefaults({city, days, hotelDestination}, now = new Date()) {
    const checkIn = addCalendarDays(localCalendarDate(now), 30);
    return {
        destination: getMappedHotelDestination(hotelDestination)?.name || city || "",
        checkIn, checkOut: addCalendarDays(checkIn, Number.isInteger(days) && days > 0 ? days : 3),
        rooms: 1, adults: 2, children: 0, childAges: [], breakfast: false, freeCancel: false,
    };
}

export function initializeHotelBooking(previous, context, now = new Date()) {
    return {
        slug: context.slug,
        defaults: getHotelDefaults(context, now),
        overrides: previous?.slug === context.slug ? previous.overrides : {},
    };
}

export function resolveHotelBooking(state, days) {
    if (!state) return {};
    const values = {...state.defaults, ...state.overrides};
    if (!Object.hasOwn(state.overrides, "checkOut")) {
        values.checkOut = addCalendarDays(values.checkIn, Number.isInteger(days) && days > 0 ? days : 3);
    }
    return values;
}

export function changeHotelBooking(state, field, value, days) {
    const values = resolveHotelBooking(state, days);
    const overrides = {...state.overrides, [field]: value};
    if (field === "children") overrides.childAges = resizeHotelChildAges(values.childAges, value);
    return {...state, overrides};
}

export function validateHotelSearch(destination, hotel, now = new Date()) {
    const childError = validateHotelChildAges(hotel);
    if (childError) return childError;
    const mapped = getMappedHotelDestination(destination);
    if (!mapped) return "tripPrepRail.hotel.destinationUnavailable";
    // An edited name cannot supply a new canonical provider identity.
    if (hotel.destination !== mapped.name) return "tripPrepRail.hotel.destinationMismatch";
    if (!parseCalendarDate(hotel.checkIn) || !parseCalendarDate(hotel.checkOut)
        || hotel.checkIn < localCalendarDate(now) || hotel.checkOut <= hotel.checkIn) {
        return "tripPrepRail.hotel.invalidDates";
    }
    if (!Number.isInteger(hotel.rooms) || hotel.rooms < 1 || hotel.rooms > 5
        || !Number.isInteger(hotel.adults) || hotel.adults < 1 || hotel.adults > 10) {
        return "tripPrepRail.hotel.invalidGuests";
    }
    return null;
}

export function buildTripComHotelUrl(destination, hotel, {now = new Date(), baseUrl = TRIP_COM_HOTEL_AFFILIATE_URL} = {}) {
    const error = validateHotelSearch(destination, hotel, now);
    if (error) throw new Error(error);
    const url = new URL(baseUrl);
    // Remove the legacy destination keys and all stale/unsupported search values.
    for (const key of ["city", "display", "optionId", "optionType", "optionName", "children", "ages", "listFilters"]) {
        url.searchParams.delete(key);
    }
    for (const [key, value] of Object.entries({
        cityId: destination.externalId, cityName: destination.name, destName: destination.name,
        searchType: "CT", checkin: hotel.checkIn, checkout: hotel.checkOut, crn: hotel.rooms, adult: hotel.adults,
    })) url.searchParams.set(key, String(value));
    if (hotel.children > 0) {
        url.searchParams.set("children", String(hotel.children));
        // Manual Trip.com search: UI <1 produced children=1&ages=0.
        url.searchParams.set("ages", hotel.childAges.map(age => age === "<1" ? "0" : age).join(","));
    }
    const filters = Object.entries(TRIP_COM_HOTEL_FILTERS)
        .filter(([field]) => hotel[field] === true)
        .map(([, fragment]) => fragment);
    if (filters.length) url.searchParams.set("listFilters", filters.join(","));
    return url.href;
}
