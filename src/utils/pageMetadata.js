import {formatSlug} from "./formatSlug.js";

export const HOME_PAGE_METADATA = {
    title: "Short Breaks Hub – Curated City Breaks & Weekend Getaways",
    description: "Discover curated city breaks and weekend getaways with destination ideas and practical 2–5 day itineraries for your next trip.",
};

export const STATIC_PAGE_METADATA = {
    contact: {
        title: "Contact Short Breaks Hub | Travel Questions & Partnerships",
        description: "Contact Short Breaks Hub with travel questions, feedback, or partnership enquiries. Send us a message and our team will get back to you.",
    },
    privacy: {
        title: "Privacy Policy | Short Breaks Hub",
        description: "Read how Short Breaks Hub collects, uses, and protects personal information when you use the website, account features, and planning tools.",
    },
    terms: {
        title: "Terms of Service | Short Breaks Hub",
        description: "Read the terms for using Short Breaks Hub, including its itineraries, planning features, community content, accounts, and related services.",
    },
};

export function getRegionPageMetadata(regionName) {
    const region = regionName?.trim() || "this region";

    return {
        title: `Short Breaks in ${region} | Regional Itineraries | Short Breaks Hub`,
        description: `Explore countries and curated short-break itineraries across ${region}, with destination highlights and trip plans for your next getaway.`,
    };
}

export function getCountryPageMetadata(countryName) {
    const country = countryName?.trim() || "Destinations";

    return {
        title: `Short Breaks in ${country} | Short Breaks Hub`,
        description: `Discover curated short-break itineraries in ${country} — days, highlights, and prices in one place.`,
    };
}

export function getItineraryPageMetadata(itinerary, routeSlug) {
    const title = itinerary?.title?.trim() || (routeSlug ? formatSlug(routeSlug) : "Short Break Itinerary");
    const country = itinerary?.country?.trim();
    const days = itinerary?.days;
    const summary = itinerary?.summary?.trim();
    const titleParts = [title, country, "Short Breaks Hub"].filter(Boolean);

    let description = summary;
    if (!description) {
        const location = country ? ` in ${country}` : "";
        const itineraryType = days ? `, a ${days}-day short-break itinerary` : ", a curated short-break itinerary";
        description = `Explore ${title}${location}${itineraryType} with highlights, a day-by-day plan, and practical travel details.`;
    }

    return {
        title: titleParts.join(" | "),
        description,
    };
}
