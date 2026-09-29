export const CANONICAL_ORIGIN = "https://www.shortbreakhub.com";

export function getCanonicalUrl(segments = []) {
    const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
    return `${CANONICAL_ORIGIN}/${encodedPath}`;
}
