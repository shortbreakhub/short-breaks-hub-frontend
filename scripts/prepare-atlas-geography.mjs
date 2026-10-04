import {readFile, writeFile, mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";

// Explicit offline derivation; no map service or build-time download.
// Input: Natural Earth's ne_110m_land.geojson from its documented upstream.
const input = process.argv[2];
if (!input) throw Error("Pass the downloaded Natural Earth 110m land GeoJSON path.");
const original = await readFile(input);
const source = JSON.parse(original);
const round = value => Array.isArray(value) ? value.map(round) : Number(value.toFixed(4));
const data = {type: "FeatureCollection", features: source.features.map(({geometry}) => ({type: "Feature", properties: {}, geometry: {type: geometry.type, coordinates: round(geometry.coordinates)}}))};
// Real spherical Mercator projection, shared with MapLibre; a static preview only.
const project = ([lng, lat]) => {
    const bounded = Math.max(-85.051129, Math.min(85.051129, lat));
    return [(lng + 180) / 360 * 1000, (1 - Math.log(Math.tan(Math.PI / 4 + bounded * Math.PI / 360)) / Math.PI) / 2 * 1000];
};
const paths = data.features.flatMap(({geometry}) => {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map(polygon => polygon.map(ring => ring.map((point, index) => `${index ? "L" : "M"}${project(point).map(n => n.toFixed(2)).join(",")}`).join("")+"Z").join(""));
});
await mkdir("src/assets/atlas", {recursive: true});
await writeFile("src/assets/atlas/world-land.geojson", JSON.stringify(data)+"\n");
await writeFile("src/assets/atlas/world-preview.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g fill="#ccd5bb" fill-rule="evenodd">${paths.map(d => `<path d="${d}"/>`).join("")}</g></svg>\n`);
await writeFile("src/assets/atlas/provenance.json", JSON.stringify({source: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/693f11422f4e08d2da4566b854dda53eb7c39fb3/geojson/ne_110m_land.geojson",sourceCommit: "693f11422f4e08d2da4566b854dda53eb7c39fb3",dataset: "Natural Earth 1:110m land",license: "Public domain",terms: "https://www.naturalearthdata.com/about/terms-of-use/",sourceSha256: createHash("sha256").update(original).digest("hex"),features: data.features.length,processing: "Strip attributes/bboxes; round lon/lat to 4 decimals; preserve all polygons. Preview projects the same data to spherical Mercator, clamps poles to ±85.051129°. No manually drawn geography."},null,2)+"\n");
console.log(`Prepared ${data.features.length} real land features and projected preview.`);
