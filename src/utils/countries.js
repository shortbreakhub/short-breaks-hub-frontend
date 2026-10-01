// Names remain API/display values; slugs are only public route identifiers.
export function getCountrySlug(name) {
    return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .trim().toLowerCase().replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function createCountryDirectory(names) {
    if (!Array.isArray(names) || !names.length) throw new Error("Country data contains no names.");
    const directory = new Map();
    for (const name of names) {
        if (typeof name !== "string" || !name.trim()) {
            throw new Error("Country data contains an invalid name.");
        }
        const slug = getCountrySlug(name);
        if (!slug) throw new Error(`Country ${name} has no usable slug.`);
        if (directory.has(slug) && directory.get(slug) !== name) {
            throw new Error(`Country slug collision: ${directory.get(slug)} and ${name} map to ${slug}.`);
        }
        directory.set(slug, name);
    }
    return directory;
}

export function resolveCountryName(routeCountry, names) {
    const directory = createCountryDirectory(names);
    // Accept canonical slugs or existing API-name links; never reconstruct a name from arbitrary text.
    return directory.get(routeCountry)
        || names.find(name => name.toLowerCase() === routeCountry.toLowerCase());
}

export function getCountryBootstrap(data, countrySlug, language) {
    return data?.type === "country" && data.countrySlug === countrySlug && data.language === language
        ? data : null;
}

// Use the same card shape for build data and localized browser responses.
export function toCountryCard({slug, title, summary, country, days, hero, priceFrom}) {
    return {slug, title, summary, country, days, hero, priceFrom};
}

export function buildCountryPages(regions) {
    if (!Array.isArray(regions) || !regions.length
        || regions.some(region => !Array.isArray(region.countries) || !region.countries.length
            || !Array.isArray(region.itineraries))) {
        throw new Error("Country prerendering requires Region country and itinerary arrays.");
    }
    const countryNames = regions.flatMap(({countries}) => countries);
    const directory = createCountryDirectory(countryNames);
    const allItineraries = regions.flatMap(({itineraries}) => itineraries);
    for (const item of allItineraries) {
        if (typeof item?.country !== "string" || !resolveCountryName(item.country, countryNames)) {
            throw new Error(`Country itinerary ${item?.slug || "unknown"} has an invalid country.`);
        }
    }
    return [...directory].map(([countrySlug, countryName]) => {
        const items = allItineraries.filter(item =>
            typeof item?.country === "string" && item.country.toLowerCase() === countryName.toLowerCase());
        if (!items.length) throw new Error(`Country ${countryName} has no usable itineraries.`);
        const seen = new Set();
        const cards = [];
        for (const item of items) {
            for (const field of ["slug", "title", "summary", "country", "hero"]) {
                if (typeof item[field] !== "string" || !item[field].trim()) {
                    throw new Error(`Country ${countryName}: itinerary ${item.slug || "unknown"} is missing ${field}.`);
                }
            }
            if (!Number.isInteger(item.days) || item.days <= 0
                || !Number.isFinite(item.priceFrom) || item.priceFrom < 0) {
                throw new Error(`Country ${countryName}: itinerary ${item.slug} has invalid days/priceFrom.`);
            }
            // ItineraryCard resolves these repository assets through Vite's glob.
            if (!/^\/src\/assets\/itineraries\/[^/]+\/[^/]+\.jpg$/.test(item.hero)) {
                throw new Error(`Country ${countryName}: itinerary ${item.slug} has an unsupported hero path.`);
            }
            if (!seen.has(item.slug)) {
                cards.push(toCountryCard(item));
                seen.add(item.slug);
            }
        }
        return {type: "country", countryName, countrySlug, language: "en", countryNames: [...directory.values()], items: cards};
    });
}
