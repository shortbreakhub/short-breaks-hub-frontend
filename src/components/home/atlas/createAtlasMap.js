// Loaded only on explicit exploration. No MapLibre import enters the static app graph.
import * as maplibre from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import artworkUrl from "../../../assets/atlas/europe/europe-atlas.png";
import {ATLAS_LIMITS, initialCamera, atlasStyle} from "./atlasConfig.js";

export async function createAtlasMap(container, {signal, locale, imageUrl=artworkUrl, image}) {
    if (signal.aborted) throw Error("Atlas cancelled");
    maplibre.setWorkerUrl(workerUrl);
    maplibre.setWorkerCount(1);
    const camera = initialCamera(container.clientWidth, window.innerWidth, window.devicePixelRatio || 1);
    const style=atlasStyle(imageUrl);
    if(image)delete style.sources.europe.url;
    const map = new maplibre.Map({container, style, center: camera.center, zoom: camera.zoom, maxZoom: camera.maxZoom,
        minZoom: camera.minZoom, maxBounds: ATLAS_LIMITS.bounds, renderWorldCopies: false, attributionControl: false,
        interactive: false, cooperativeGestures: false, doubleClickZoom: false, dragPan: false, scrollZoom: false,
        boxZoom: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
        touchZoomRotate: false, keyboard: false, locale, fadeDuration: 0,
        canvasContextAttributes: {antialias: true}, pixelRatio: Math.min(devicePixelRatio || 1, 2)});
    if(image) {
        const provideImage=()=>{
            const source=map.getSource("europe");
            if(!source)return;
            map.off("styledata",provideImage);
            source.updateImage({image});
        };
        map.on("styledata",provideImage);
    }
    map.dragPan.disable(); map.scrollZoom.disable(); map.boxZoom.disable();
    map.doubleClickZoom.disable(); map.touchZoomRotate.disable(); map.keyboard.disable();
    // Future percentage overlays use artworkCoordinate(x, y), then map.project().
    // The illustration plane is not a georeferenced Europe basemap.
    return map;
}
