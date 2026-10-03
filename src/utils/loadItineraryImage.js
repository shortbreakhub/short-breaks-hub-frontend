// Keep the large itinerary URL inventory outside the homepage/shared shell path.
const images = import.meta.glob("../assets/itineraries/**/*.{jpg,jpeg,png,webp}", {eager: true, import: "default"});
const byStem = Object.fromEntries(Object.entries(images).map(([path, url]) =>
    [path.toLowerCase().replace(/\.[^.]+$/, ""), url]));
// Confirmed filenames in the repository; keep backend content paths unchanged.
const aliases = {
    "itineraries/mexico/mexico-city-food/los-danzantes": "itineraries/mexico/mexico-city-food/los-danzante",
    "itineraries/australia/sydney-food/icebergs-dining-room": "itineraries/australia/sydney-food/icebergs-dining-roo",
};

export function loadSubFolderImages(subFolderName, name) {
    const stem = `${subFolderName}/${name}`.toLowerCase();
    return byStem[`../assets/${aliases[stem] || stem}`];
}
