import {rootImages} from "./rootImages.js";
import {optimizedImages} from "./optimizedImages.js";

export function loadImages(name) {
    const key = name.toLowerCase();
    return optimizedImages[key]?.src || rootImages[`../assets/${key}.jpg`];
}
