import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import previewUrl from "../../assets/atlas/europe/europe-atlas.png";
import EuropeDestinations from "./atlas/EuropeDestinations.jsx";
import {initialCamera} from "./atlas/atlasConfig.js";

// The surrounding hero stays independent of the renderer. onMapReady exposes the
// illustration camera for percentage overlays; its return value cleans them up.
export default function AtlasStage({onMapReady, onCountrySelect}) {
    const {t} = useTranslation();
    const frame = useRef(null), host = useRef(null), mapRef = useRef(null), entryButton = useRef(null), preview = useRef(null);
    const [viewportWidth, setViewportWidth] = useState(1440);
    const [width, setWidth] = useState(800), [attempt, setAttempt] = useState(0);
    const [state, setState] = useState("preview"), [previewFailed, setPreviewFailed] = useState(false);
    const [zoom, setZoom] = useState(null), [reloadRequired, setReloadRequired] = useState(false);
    const localeRef = useRef(null), readyRef = useRef(onMapReady);
    readyRef.current = onMapReady;
    localeRef.current = {
        "Map.Title": t("homeMagazine.atlas.mapLabel"),
        "CooperativeGesturesHandler.WindowsHelpText": t("homeMagazine.atlas.wheelHint"),
        "CooperativeGesturesHandler.MacHelpText": t("homeMagazine.atlas.wheelHintMac"),
        "CooperativeGesturesHandler.MobileHelpText": t("homeMagazine.atlas.touchHint"),
    };
    useEffect(() => {
        // A prerendered image can fail before hydration attaches its error listener.
        if (preview.current?.complete && !preview.current.naturalWidth) setPreviewFailed(true);
    }, []);
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const nextWidth = entry.contentRect.width; setWidth(nextWidth); setViewportWidth(window.innerWidth);
            const map = mapRef.current;
            if (map) {
                const oldMin = map.getMinZoom(), oldZoom = map.getZoom();
                map.resize();
                const camera = initialCamera(nextWidth, window.innerWidth, window.devicePixelRatio || 1);
                map.setMinZoom(camera.minZoom); map.setMaxZoom(camera.maxZoom);
                // Preserve user camera after rotation/resizing, and keep relative scale.
                map.jumpTo({zoom: oldZoom + map.getMinZoom() - oldMin});
            }
        });
        observer.observe(frame.current); return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!attempt) return;
        let disposed = false, map, removeOverlay;
        const controller = new AbortController();
        const fail = error => {
            if (disposed) return;
            if (/Worker/i.test(error?.error?.message || error?.message || "")) setReloadRequired(true);
            controller.abort(); removeOverlay?.(); removeOverlay = undefined;
            mapRef.current = null; map?.remove(); map = null; setState("failed"); clearTimeout(timeout);
        };
        const timeout = setTimeout(fail, 15000);
        import("./atlas/createAtlasMap.js").catch(error => {
            // Failed ES-module imports are cached by browsers; a new fetch needs a reload.
            if (!disposed) setReloadRequired(true);
            throw error;
        }).then(({createAtlasMap}) => {
            if (disposed || controller.signal.aborted) return null;
            return createAtlasMap(host.current, {signal: controller.signal, locale: localeRef.current});
        }).then(instance => {
            if (!instance) return;
            if (disposed || controller.signal.aborted) {instance.remove(); return;}
            map = instance; mapRef.current = map;
            map.on("error", fail);
            map.on("webglcontextlost", fail);
            map.on("zoom", () => setZoom(map.getZoom()));
            map.once("idle", () => {
                if (disposed || !map) return;
                clearTimeout(timeout); setZoom(map.getZoom()); setState("ready");
                const cleanup = readyRef.current?.(map);
                removeOverlay = typeof cleanup === "function" ? cleanup : undefined;
                if (document.activeElement === entryButton.current) map.getCanvas().focus({preventScroll: true});
            });
        }).catch(fail);
        return () => {disposed = true; clearTimeout(timeout); controller.abort(); removeOverlay?.(); mapRef.current = null; map?.remove();};
    }, [attempt]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        map.getCanvas().setAttribute("aria-label", t("homeMagazine.atlas.mapLabel"));
        map.getCanvas().setAttribute("aria-describedby", "atlas-gestures");
        const desktop = host.current.querySelector(".maplibregl-desktop-message"), mobile = host.current.querySelector(".maplibregl-mobile-message");
        if (desktop) desktop.textContent = t(/Mac/.test(navigator.platform) ? "homeMagazine.atlas.wheelHintMac" : "homeMagazine.atlas.wheelHint");
        if (mobile) mobile.textContent = t("homeMagazine.atlas.touchHint");
    }, [t, state]);
    const changeZoom = step => mapRef.current?.jumpTo({zoom: Math.min(mapRef.current.getMaxZoom(), Math.max(mapRef.current.getMinZoom(), mapRef.current.getZoom() + step))});
    return <figure className="atlas-stage" aria-labelledby="atlas-caption" data-atlas-stage="illustrated-europe" data-atlas-state={state}>
        <div className="atlas-paper" ref={frame}>
            {state !== "ready" && !previewFailed && <img ref={preview} onError={() => setPreviewFailed(true)} className="atlas-preview" src={previewUrl} width={1536} height={1024} alt={t("homeMagazine.atlas.previewAlt")} loading="eager" />}
            {state !== "ready" && previewFailed && <p className="atlas-preview-unavailable">{t("homeMagazine.atlas.previewUnavailable")}</p>}
            <div ref={host} className="atlas-map" role="region" aria-label={t("homeMagazine.atlas.mapLabel")} aria-describedby="atlas-gestures" hidden={state === "preview" || state === "failed"} />
            {(state === "ready" || !previewFailed) && <EuropeDestinations map={state === "ready" ? mapRef.current : null} onCountrySelect={onCountrySelect} />}
            {state !== "ready" && <div className="atlas-entry">
                {state === "failed" && <p role="alert">{t("homeMagazine.atlas.failed")}</p>}
                {state === "loading" && <p role="status">{t("homeMagazine.atlas.loading")}</p>}
                <button ref={entryButton} type="button" disabled={state === "loading"} onClick={() => {if (reloadRequired) {window.location.reload(); return;} setState("loading"); setAttempt(value => value + 1);}}>{t(reloadRequired ? "homeMagazine.atlas.reload" : state === "failed" ? "itineraryLoad.retry" : "homeMagazine.atlas.explore")}</button>
            </div>}

        </div>
        <figcaption id="atlas-caption"><span>{t("homeMagazine.atlas.caption")}</span>{state === "ready" && <div className="atlas-controls" role="group" aria-label={t("homeMagazine.atlas.controls")}>
                <button type="button" aria-label={t("homeMagazine.atlas.zoomIn")} disabled={zoom >= initialCamera(width, viewportWidth, window.devicePixelRatio || 1).maxZoom - 0.001} onClick={() => changeZoom(0.5)}>+</button>
                <button type="button" aria-label={t("homeMagazine.atlas.zoomOut")} disabled={zoom <= initialCamera(width).minZoom + 0.005} onClick={() => changeZoom(-0.5)}>−</button>
                <button type="button" aria-label={t("homeMagazine.atlas.reset")} onClick={() => mapRef.current?.jumpTo(initialCamera(width, viewportWidth, window.devicePixelRatio || 1))}>↺</button>
            </div>}</figcaption>
        <p id="atlas-gestures" className="atlas-gesture-hint">{t("homeMagazine.atlas.gestures")}</p>
    </figure>;
}
