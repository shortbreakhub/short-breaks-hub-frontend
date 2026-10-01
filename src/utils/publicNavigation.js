import {getCountrySlug} from "./countries.js";

export function getRegionPath(region) {
    return `/${region}`;
}

export function getCountryBrowsePath(country) {
    return `/browse/${getCountrySlug(country)}`;
}

export function getOfficialItineraryPath(slug) {
    return `/itinerary/${slug}`;
}
