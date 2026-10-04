// Loaded only on explicit exploration. No MapLibre import enters the static app graph.
import * as maplibre from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import artworkUrl from "../../../assets/atlas/europe/europe-atlas.png";
import {ATLAS_LIMITS, initialCamera, atlasStyle} from "./atlasConfig.js";

export async function createAtlasMap(container, {signal, locale}) {
    if (signal.aborted) throw Error("Atlas cancelled");
    maplibre.setWorkerUrl(workerUrl);
    maplibre.setWorkerCount(1);
    const camera = initialCamera(container.clientWidth, window.innerWidth, window.devicePixelRatio || 1);
    const map = new maplibre.Map({container, style: atlasStyle(artworkUrl), center: camera.center, zoom: camera.zoom, maxZoom: camera.maxZoom,
        minZoom: camera.minZoom, maxBounds: ATLAS_LIMITS.bounds, renderWorldCopies: false, attributionControl: false,
        cooperativeGestures: true, doubleClickZoom: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
        touchZoomRotate: true, keyboard: true, locale, fadeDuration: 0,
        canvasContextAttributes: {antialias: true}, pixelRatio: Math.min(devicePixelRatio || 1, 2)});
    map.touchZoomRotate.disableRotation();
    const updateMovement = () => {
        const zoomed = map.getZoom() > map.getMinZoom() + 0.005;
        if (zoomed) {map.dragPan.enable(); map.keyboard.enable(); map.keyboard.disableRotation();}
        else {map.dragPan.disable(); map.keyboard.disable();}
    };
    map.on("zoomend", updateMovement);
    updateMovement();
    // Future percentage overlays use artworkCoordinate(x, y), then map.project().
    // The illustration plane is not a georeferenced Europe basemap.
    return map;
}
