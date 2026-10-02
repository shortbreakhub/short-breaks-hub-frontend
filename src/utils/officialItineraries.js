import {projectHotelDestination} from "./hotelBooking.js";

// Official identifiers are API identities, never values to normalize into slugs.
export function validateOfficialSlug(slug) {
    if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(`Official itinerary ${String(slug)}: invalid canonical slug.`);
    }
    return slug;
}

export function getOfficialInventory(regions) {
    const inventory = new Set();
    for (const region of regions) {
        if (!Array.isArray(region.itineraries)) throw new Error("Official inventory requires Region itinerary arrays.");
        for (const item of region.itineraries) inventory.add(validateOfficialSlug(item?.slug));
    }
    if (!inventory.size) throw new Error("Official inventory contains no itineraries.");
    return [...inventory];
}

const stringFields = ["slug", "region", "country", "city", "title", "hero", "summary", "planningCity",
    "bestTimeMonths", "bestTimeNote", "worstTimeMonths", "worstTimeNote"];
const stringLists = ["highlights", "tips", "withKids", "gettingAround", "practical", "mustTry"];
const recordLists = {
    schedule: ["title", "summary", "details"],
    arrival: ["title", "note"], dayTrips: ["title", "note"], dayMoves: ["title", "note"],
    areas: ["name", "note"], places: ["name", "area", "reason"],
};
const publicFields = ["id", ...stringFields, "days", "priceFrom", ...stringLists, ...Object.keys(recordLists)];

export function validateOfficialDetail(slug, data) {
    validateOfficialSlug(slug);
    const fail = field => { throw new Error(`Official itinerary ${slug}: invalid detail ${field}.`); };
    if (!data || data.slug !== slug) fail("slug (must equal requested slug)");
    for (const field of stringFields) {
        if (typeof data[field] !== "string") fail(field);
    }
    for (const field of ["title", "summary", "region", "country", "city", "hero"]) {
        if (!data[field].trim()) fail(field);
    }
    if (!Number.isInteger(data.id) || data.id <= 0) fail("id");
    if (!Number.isInteger(data.days) || data.days <= 0) fail("days");
    if (!Number.isFinite(data.priceFrom) || data.priceFrom < 0) fail("priceFrom");
    if (!/^\/src\/assets\/itineraries\/[^/]+\/[^/]+\.jpg$/.test(data.hero)) fail("hero");
    for (const field of stringLists) {
        if (!Array.isArray(data[field]) || !data[field].every(value => typeof value === "string")) fail(field);
    }
    for (const [field, fields] of Object.entries(recordLists)) {
        if (!Array.isArray(data[field]) || !data[field].every(record => record
            && fields.every(key => typeof record[key] === "string"))) fail(field);
    }
    if (!data.schedule.length || !data.schedule.every(day => Number.isInteger(day.day) && day.day > 0)) fail("schedule");
    for (const place of data.places) {
        if (place.imageUrl != null && typeof place.imageUrl !== "string") fail("places.imageUrl");
        for (const key of ["lat", "lng"]) {
            if (place[key] != null && !Number.isFinite(place[key])) fail(`places.${key}`);
        }
        if (place.imageUrl && !/^\/src\/assets\/itineraries\/[^/]+\/[^/]+\/[^/]+\.(?:jpe?g|png|webp)$/i.test(place.imageUrl)) fail("places.imageUrl");
    }
    // Explicit projection prevents incidental API account fields from entering bootstrap.
    const detail = Object.fromEntries(publicFields.map(field => [field, data[field]]));
    for (const [field, fields] of Object.entries(recordLists)) {
        const keys = field === "schedule" ? ["day", ...fields]
            : field === "places" ? [...fields, "imageUrl", "lat", "lng"] : fields;
        detail[field] = data[field].map(record => Object.fromEntries(keys
            .filter(key => record[key] !== undefined)
            .map(key => [key, record[key]])));
    }
    detail.hotelDestination = projectHotelDestination(data.hotelDestination);
    return detail;
}

export async function fetchOfficialPages(slugs, fetchDetail, concurrency = 4) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("Invalid Official detail worker limit.");
    const pages = new Array(slugs.length);
    let next = 0;
    let failure;
    await Promise.all(Array.from({length: Math.min(concurrency, slugs.length)}, async () => {
        while (!failure && next < slugs.length) {
            const index = next++;
            const slug = validateOfficialSlug(slugs[index]);
            try {
                const detail = validateOfficialDetail(slug, await fetchDetail(slug, "en"));
                pages[index] = {type: "official-itinerary", slug, language: "en", detail};
            } catch (error) {
                failure = new Error(`Official itinerary ${slug}: detail fetch/validation failed: ${error.message}`, {cause: error});
            }
        }
    }));
    if (failure) throw failure;
    return pages;
}

export function getOfficialBootstrap(data, slug, language) {
    return data?.type === "official-itinerary" && data.slug === slug
        && data.detail?.slug === slug && data.language === language ? data : null;
}

export function getItineraryPlanning(data) {
    return {
        city: data.planningCity,
        bestTime: {months: data.bestTimeMonths, note: data.bestTimeNote},
        worstTime: {months: data.worstTimeMonths, note: data.worstTimeNote},
        tips: data.tips, withKids: data.withKids,
    };
}

export function getItineraryTransport(data) {
    return {arrival: data.arrival, gettingAround: data.gettingAround,
        dayTrips: data.dayTrips, dayMoves: data.dayMoves, practical: data.practical};
}
