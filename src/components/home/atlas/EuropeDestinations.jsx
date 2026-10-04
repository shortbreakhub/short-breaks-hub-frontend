import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useTranslation} from 'react-i18next';
import {EUROPE_DESTINATIONS} from './europeDestinations.js';
import {artworkCoordinate} from './atlasConfig.js';
import {getCountryBrowsePath} from '../../../utils/publicNavigation.js';

export default function EuropeDestinations({map, onCountrySelect}) {
    const {t} = useTranslation();
    const links = useRef(new Map()), pointer = useRef(null);
    const [armed, setArmed] = useState(null);
    useEffect(() => {
        const dismiss = event => {if(!event.target.closest('.atlas-country')) setArmed(null);};
        document.addEventListener('pointerdown',dismiss);
        return () => document.removeEventListener('pointerdown',dismiss);
    }, []);
    // Imperative projection runs on the same render cycle as the raster camera.
    // Portal inside the canvas container lets map gestures bubble from DOM links.
    useLayoutEffect(() => {
        const frame = links.current.values().next().value?.closest('.atlas-paper');
        if (!frame) return;
        const project = () => {
            const point = (x,y) => map ? map.project(artworkCoordinate(x,y)) : {x:x*frame.clientWidth,y:y*frame.clientHeight};
            for (const destination of EUROPE_DESTINATIONS) {
                const link = links.current.get(destination.id);
                if (!link) continue;
                const primary = destination.hitAreas[0], {x,y} = primary.artworkPosition;
                const center = point(x,y), corner = point(x+primary.hitArea.width/2,y+primary.hitArea.height/2);
                const width = Math.max(44,2*(corner.x-center.x)), height = Math.max(44,2*(corner.y-center.y));
                Object.assign(link.style,{left:`${center.x}px`,top:`${center.y}px`,width:`${width}px`,height:`${height}px`});
                for (const area of destination.hitAreas.slice(1)) {
                    const hit = link.querySelector(`[data-hit-area="${area.id}"]`);
                    const {x,y} = area.artworkPosition, centerHit = point(x,y), cornerHit = point(x+area.hitArea.width/2,y+area.hitArea.height/2);
                    // Child regions extend the same anchor; no extra link/tab stop.
                    // Keep dense supplementary hits artwork-sized rather than
                    // inflating them into neighbouring countries' 44px links.
                    Object.assign(hit.style,{left:`${centerHit.x-center.x+width/2-link.clientLeft}px`,top:`${centerHit.y-center.y+height/2-link.clientTop}px`,width:`${2*(cornerHit.x-centerHit.x)}px`,height:`${2*(cornerHit.y-centerHit.y)}px`});
                }
            }
        };
        const dismiss = () => setArmed(null);
        const observer = new ResizeObserver(project); observer.observe(frame);
        project(); map?.on('render',project); map?.on('resize',project); map?.on('movestart',dismiss);
        return () => {observer.disconnect();map?.off('render',project);map?.off('resize',project);map?.off('movestart',dismiss);};
    });
    const layer = <nav className="atlas-country-layer" aria-label={t('homeMagazine.atlas.destinations')}>
        {EUROPE_DESTINATIONS.map(destination => {
            const {x,y} = destination.artworkPosition;
            const label = t(destination.labelKey);
            return <a key={destination.id} ref={node => {if(node) links.current.set(destination.id,node);else links.current.delete(destination.id);}}
                className="atlas-country" data-country={destination.id} data-hit-area={destination.hitAreas[0].id} data-revealed={armed === destination.id} data-label-align={destination.labelAlign}
                href={getCountryBrowsePath(destination.country)} aria-label={`${label} — ${t('homeMagazine.atlas.countryExplore')}`} draggable={false}
                style={{left:`${x*100}%`,top:`${y*100}%`,width:`${destination.hitArea.width*100}%`,height:`${destination.hitArea.height*100}%`}}
                onFocus={event => {
                    // A keyboard user can reach a destination outside the zoomed window.
                    if (!map || !event.currentTarget.matches(':focus-visible')) return;
                    const point = map.project(artworkCoordinate(x,y)), container = map.getContainer();
                    if(point.x<44 || point.x>container.clientWidth-44 || point.y<44 || point.y>container.clientHeight-44)
                        map.jumpTo({center:artworkCoordinate(x,y)});
                }}
                onPointerDown={event => {pointer.current={type:event.pointerType,x:event.clientX,y:event.clientY};}}
                onKeyDown={event => {if(event.key==='Escape'){setArmed(null);event.currentTarget.blur();}}}
                onClick={event => {
                    const touch = pointer.current?.type === 'touch' && event.detail !== 0;
                    const moved = event.detail !== 0 && pointer.current && Math.hypot(event.clientX-pointer.current.x,event.clientY-pointer.current.y)>8;
                    pointer.current = null;
                    if(event.defaultPrevented || moved){event.preventDefault();return;}
                    if(touch && armed !== destination.id){event.preventDefault();setArmed(destination.id);return;}
                    // Keep native modified clicks/new-tab behavior for real links.
                    if(onCountrySelect && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey){event.preventDefault();onCountrySelect(destination);}
                }}>
                {destination.hitAreas.slice(1).map(area => <span key={area.id} data-hit-area={area.id} aria-hidden="true"
                    style={{position:'absolute',pointerEvents:'auto',touchAction:'pan-x pan-y',transform:'translate(-50%, -50%)',
                        left:`${50+(area.artworkPosition.x-x)/destination.hitArea.width*100}%`,top:`${50+(area.artworkPosition.y-y)/destination.hitArea.height*100}%`,
                        width:`${area.hitArea.width/destination.hitArea.width*100}%`,height:`${area.hitArea.height/destination.hitArea.height*100}%`}} />)}
                <span className="atlas-country-callout" aria-hidden="true"><strong>{label}</strong><span>{t('homeMagazine.atlas.countryExplore')} →</span></span>
            </a>;
        })}
    </nav>;
    return map ? createPortal(layer,map.getCanvasContainer()) : layer;
}
