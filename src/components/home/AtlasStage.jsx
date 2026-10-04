import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import previewUrl from "../../assets/atlas/europe/europe-atlas.png";
import EuropeDestinations from "./atlas/EuropeDestinations.jsx";
import CountryDestinations from "./atlas/CountryDestinations.jsx";
import {COUNTRY_SCENES, sceneForCountry} from "./atlas/countryScenes.js";
import useAtlasScene, {SCENE_ASSETS} from "./atlas/useAtlasScene.js";
import AtlasCloudTransition from "./atlas/AtlasCloudTransition.jsx";
import {initialCamera} from "./atlas/atlasConfig.js";

// The surrounding hero stays independent of the renderer. onMapReady exposes the
// illustration camera for percentage overlays; its return value cleans them up.
export default function AtlasStage({onMapReady, onCountrySelect}) {
    const {t} = useTranslation();
    const frame = useRef(null), host = useRef(null), mapRef = useRef(null);
    const backButton = useRef(null), sceneRef = useRef('europe'), lastCountry = useRef('uk');
    // One persistent decoded <img> per scene: static fallback and renderer upload source.
    const [images] = useState(() => Object.fromEntries(Object.keys(SCENE_ASSETS).map(scene => [scene, {current: null}])));
    const preview = images.europe;
    const scenes = useAtlasScene({images,
        swapScene: async (target,image,signal) => {
            const map=mapRef.current;
            if(map && state === 'ready') {
                try {
                    await new Promise((resolve,reject)=>{
                        const cleanup=()=>{clearTimeout(timeout);map.off('idle',done);map.off('error',failed);signal.removeEventListener('abort',failed);};
                        const done=()=>{cleanup();resolve();}, failed=()=>{cleanup();reject(Error('Scene renderer unavailable'));};
                        const timeout=setTimeout(failed,8000);
                        map.once('idle',done);map.once('error',failed);signal.addEventListener('abort',failed,{once:true});
                        const camera=initialCamera(map.getContainer().clientWidth,window.innerWidth,window.devicePixelRatio || 1);
                        map.getSource('europe').updateImage({image});
                        map.setMinZoom(camera.minZoom);map.setMaxZoom(camera.maxZoom);map.jumpTo(camera);
                    });
                } catch(error) {
                    if(!signal.aborted){mapRef.current=null;map.remove();setState('failed');}
                    throw error;
                }
            } else {
                // Give React time to reveal the persistent decoded DOM image.
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                const active=images[target].current;
                if(active)await active.decode();
            }
        },
        onComplete: target => requestAnimationFrame(()=>{
            const focus=target!=='europe'?backButton.current:frame.current?.querySelector(`[data-country="${COUNTRY_SCENES[lastCountry.current].countryId}"]`);
            focus?.focus({preventScroll:true});
        }),
    });
    sceneRef.current=scenes.scene;
    const locked=scenes.phase!=='idle', country=COUNTRY_SCENES[scenes.scene];
    const selectCountry = destination => {
        if(locked || state==='loading')return;
        if(onCountrySelect)return onCountrySelect(destination);
        const scene=sceneForCountry(destination.id);
        if(scene){lastCountry.current=scene;scenes.transitionTo(scene);return;}
        return false; // Countries without a story map retain their native browse links.
    };
    const [width, setWidth] = useState(800), [attempt, setAttempt] = useState(0);
    const [state, setState] = useState("preview"), [previewFailed, setPreviewFailed] = useState(false);
    const [reloadRequired, setReloadRequired] = useState(false);
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
            const nextWidth = entry.contentRect.width; setWidth(nextWidth);
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
            return createAtlasMap(host.current, {signal: controller.signal, locale: localeRef.current, imageUrl:SCENE_ASSETS[sceneRef.current], image:sceneRef.current!=='europe'?images[sceneRef.current].current:undefined});
        }).then(instance => {
            if (!instance) return;
            if (disposed || controller.signal.aborted) {instance.remove(); return;}
            map = instance; mapRef.current = map;
            map.on("error", fail);
            map.on("webglcontextlost", fail);
            map.once("idle", () => {
                if (disposed || !map) return;
                clearTimeout(timeout); setState("ready");
                const cleanup = readyRef.current?.(map);
                removeOverlay = typeof cleanup === "function" ? cleanup : undefined;
            });
        }).catch(fail);
        return () => {disposed = true; clearTimeout(timeout); controller.abort(); removeOverlay?.(); mapRef.current = null; map?.remove();};
    }, [attempt]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        map.getCanvas().setAttribute("aria-label", t(country?.keys.mapLabel || "homeMagazine.atlas.mapLabel"));
        map.getCanvas().removeAttribute("aria-describedby");
    }, [t, state, country]);
    return <figure className="atlas-stage" aria-labelledby="atlas-caption" data-atlas-stage="illustrated-europe" data-atlas-state={state} data-atlas-scene={scenes.scene} data-atlas-transition={scenes.phase}>
        <div className="atlas-paper" ref={frame} aria-busy={locked}>
            <div className="atlas-scene-surface" inert={locked}>
            <img ref={preview} onError={() => setPreviewFailed(true)} className="atlas-preview" src={previewUrl} width={1536} height={1024} alt={t("homeMagazine.atlas.previewAlt")} loading="eager" hidden={state==='ready' || scenes.scene!=='europe' || previewFailed} />
            {Object.entries(COUNTRY_SCENES).map(([id, scene]) => <img key={id} ref={images[id]} className={`atlas-preview ${scene.previewClass}`} src={SCENE_ASSETS[id]} width={1536} height={1024} alt={t(scene.keys.previewAlt)} loading="lazy" hidden={state==='ready' || scenes.scene!==id} />)}
            {scenes.scene==='europe' && state !== "ready" && previewFailed && <p className="atlas-preview-unavailable">{t("homeMagazine.atlas.previewUnavailable")}</p>}
            <div ref={host} className="atlas-map" role="region" aria-label={t(country?.keys.mapLabel || "homeMagazine.atlas.mapLabel")} hidden={state === "preview" || state === "failed"} />
            {scenes.scene==='europe' && (state === "ready" || !previewFailed) && <EuropeDestinations map={state === "ready" ? mapRef.current : null} onCountrySelect={selectCountry} />}
            {country && <CountryDestinations key={scenes.scene} destinations={country.destinations} navLabelKey={country.keys.nav} map={state === "ready" ? mapRef.current : null} />}
            </div>
            <AtlasCloudTransition phase={scenes.phase} reducedMotion={scenes.reducedMotion} />
        </div>
        <figcaption id="atlas-caption" className="atlas-caption">
            {country ? <div className="atlas-country-story">
                <span className="atlas-country-name">{t(country.keys.caption)}</span>
                <p>{t(country.keys.story)}</p>
            </div> : <span className="atlas-caption-europe">{t("homeMagazine.atlas.caption")}</span>}
            {country && <button ref={backButton} type="button" className="atlas-back" disabled={locked} onClick={()=>scenes.transitionTo('europe')}>← {t("homeMagazine.atlas.backEurope")}</button>}
        </figcaption>
        <div className="atlas-scene-status" aria-live="polite">
            {locked && <span role="status">{t('homeMagazine.atlas.travelling')}</span>}
            {scenes.error && <span role="alert">{t('homeMagazine.atlas.sceneFailed')}</span>}
            {state === "failed" && <span role="alert">{t(reloadRequired ? "homeMagazine.atlas.reload" : "homeMagazine.atlas.failed")}</span>}
        </div>
    </figure>;
}
