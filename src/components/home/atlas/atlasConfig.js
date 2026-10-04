// Illustration coordinates are deliberately NOT geographic registration.
// A Mercator rectangle preserves the source PNG's 3:2 aspect exactly.
export const EUROPE_IMAGE = {width: 1536, height: 1024};
const latitude = 180 / Math.PI * Math.atan(Math.sinh(Math.PI / 3));
export const ATLAS_LIMITS = {bounds: [[-90, -latitude], [90, latitude]], renderWorldCopies: false};
export function initialCamera(width, viewportWidth = width, dpr = 1) {
    const minZoom = Math.log2(Math.max(width, 1) / 256);
    const scale = Math.max(1, Math.min(1.6, EUROPE_IMAGE.width / (Math.max(width, 1) * dpr)));
    return {center: [0, 0], zoom: minZoom, minZoom, maxZoom: minZoom + Math.log2(scale)};
}
// Future overlays use normalized artwork coordinates (0..1), not city lng/lat.
export function artworkCoordinate(x, y) {
    return [-90 + x * 180, 180 / Math.PI * Math.atan(Math.sinh(Math.PI * (1 - 2 * y) / 3))];
}
export function atlasStyle(imageUrl) {
    return {version: 8, projection: {type: "mercator"}, sources: {europe: {type: "image", url: imageUrl,
        coordinates: [[-90, latitude], [90, latitude], [90, -latitude], [-90, -latitude]]}},
        layers: [{id: "paper", type: "background", paint: {"background-color": "#f5f0e5"}},
            {id: "europe-artwork", type: "raster", source: "europe", paint: {"raster-fade-duration": 0}}]};
}
