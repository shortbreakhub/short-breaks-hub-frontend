const INDEXABLE_STATIC_PATHS = new Set(["/", "/contact", "/privacy", "/terms"]);
const INDEX_POLICY = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const NOINDEX_STATIC_PATHS = new Set([
    "/login",
    "/register",
    "/profile",
    "/create-itinerary",
    "/verify-email",
    "/api/auth/verify-email",
    "/forgot-password",
    "/reset-password",
]);
const AMBIGUOUS_STATIC_PATHS = new Set(["/live-weather", "/map", "/community-itineraries/region"]);

function normalizePathname(pathname) {
    const withoutTrailingSlash = pathname.replace(/\/+$/, "");
    return withoutTrailingSlash || "/";
}

function hasOneSegmentAfter(pathname, prefix) {
    const remainder = pathname.slice(prefix.length);
    return remainder.length > 0 && !remainder.includes("/");
}

export function getRobotsPolicy(pathname) {
    const normalizedPathname = normalizePathname(pathname);

    if (NOINDEX_STATIC_PATHS.has(normalizedPathname)) {
        return "noindex,follow";
    }

    if (AMBIGUOUS_STATIC_PATHS.has(normalizedPathname)
        || normalizedPathname.startsWith("/user-itinerary/") && hasOneSegmentAfter(normalizedPathname, "/user-itinerary/")
        || normalizedPathname.startsWith("/community-itineraries/region/")
            && hasOneSegmentAfter(normalizedPathname, "/community-itineraries/region/")) {
        return INDEX_POLICY;
    }

    if (INDEXABLE_STATIC_PATHS.has(normalizedPathname)
        || normalizedPathname.startsWith("/browse/") && hasOneSegmentAfter(normalizedPathname, "/browse/")
        || normalizedPathname.startsWith("/itinerary/") && hasOneSegmentAfter(normalizedPathname, "/itinerary/")) {
        return INDEX_POLICY;
    }

    // The app's single-segment route is the public region page.
    if (normalizedPathname.split("/").filter(Boolean).length === 1) {
        return INDEX_POLICY;
    }

    // Unmatched paths render the NotFound page and should not enter search results.
    return "noindex,follow";
}
