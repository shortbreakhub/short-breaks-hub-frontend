const selections = new WeakMap();
export const HOME_PLANNING_DATA_ID = "shortbreakhub-home-planning-data";

// Project the existing validated, published prerender results; no separate catalogue.
export function getHomePlanningDestinations(pages) {
    const destinations = new Map();
    for (const {detail} of pages) {
        if (!detail || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(detail.slug)
            || typeof detail.city !== "string" || !detail.city.trim()
            || typeof detail.country !== "string" || !detail.country.trim()) continue;
        const key = JSON.stringify([detail.country, detail.city]);
        if (!destinations.has(key)) destinations.set(key, {city: detail.city, slug: detail.slug});
    }
    return [...destinations.values()];
}

export function selectHomePlanningDestination(destinations, random = Math.random) {
    const valid = destinations.filter(item => item && typeof item.city === "string" && item.city.trim()
        && typeof item.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug));
    if (!valid.length) return null;
    return valid[Math.min(valid.length - 1, Math.max(0, Math.floor(random() * valid.length)))];
}

export function getPagePlanningDestination(document, fallback) {
    if (!selections.has(document)) {
        let destinations = [];
        try {destinations = JSON.parse(document.getElementById(HOME_PLANNING_DATA_ID)?.textContent || "[]");} catch { /* Existing valid CTA remains available without a bootstrap. */ }
        const selected = Array.isArray(destinations) ? selectHomePlanningDestination(destinations) : null;
        selections.set(document, selected || fallback);
    }
    return selections.get(document);
}
