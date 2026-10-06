import {artworkFramePoint} from './artworkFrame.js';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useTranslation} from 'react-i18next';
import {artworkCoordinate} from './atlasConfig.js';
import {getOfficialItineraryPath} from '../../../utils/publicNavigation.js';

// Country Story Map itinerary links (UK, France): plain navigation, no scene
// interception. Mirrors the accepted Europe layer's link/touch semantics without sharing its code.
const relative = (area, anchor) => ({
    left: `${50 + (area.artworkPosition.x - anchor.artworkPosition.x) / anchor.hitArea.width * 100}%`,
    top: `${50 + (area.artworkPosition.y - anchor.artworkPosition.y) / anchor.hitArea.height * 100}%`,
    width: `${area.hitArea.width / anchor.hitArea.width * 100}%`,
    height: `${area.hitArea.height / anchor.hitArea.height * 100}%`,
});
// Top-edge destinations open their callout beneath the artwork name plate.
const calloutBelow = ([anchor, ...areas]) => {
    const bottom = Math.max(...areas.map(area => area.artworkPosition.y + area.hitArea.height / 2));
    return {top: `calc(${50 + (bottom - anchor.artworkPosition.y) / anchor.hitArea.height * 100}% + 6px)`, bottom: 'auto'};
};

export default function CountryDestinations({destinations, navLabelKey, map, artworkSize}) {
    const {t} = useTranslation();
    const links = useRef(new Map()), pointer = useRef(null);
    const [armed, setArmed] = useState(null);
    useEffect(() => {
        const dismiss = event => {if(!event.target.closest('.atlas-itinerary')) setArmed(null);};
        document.addEventListener('pointerdown',dismiss);
        return () => document.removeEventListener('pointerdown',dismiss);
    }, []);
    // Match the regional layer's border-aware projection for static and live artwork.
    // Percentage children otherwise drift inside a thin anchor's 1px border.
    useLayoutEffect(() => {
        const frame = links.current.values().next().value?.closest('.atlas-paper');
        if (!frame) return;
        const project = () => {
            const point = (x,y) => {
                const contained=artworkFramePoint(x,y,frame.clientWidth,frame.clientHeight,artworkSize);
                return map ? map.project(artworkCoordinate(contained.x/frame.clientWidth,contained.y/frame.clientHeight)) : contained;
            };
            for (const destination of destinations) {
                const link = links.current.get(destination.id), anchor = destination.hitAreas[0];
                if (!link) continue;
                const {x,y} = anchor.artworkPosition, center = point(x,y);
                const corner = point(x+anchor.hitArea.width/2,y+anchor.hitArea.height/2);
                const width=2*(corner.x-center.x),height=2*(corner.y-center.y);
                Object.assign(link.style,{left:`${center.x}px`,top:`${center.y}px`,width:`${width}px`,height:`${height}px`});
                for(const area of destination.hitAreas.slice(1)){
                    const hit=link.querySelector(`[data-hit-area="${area.id}"]`),{x,y}=area.artworkPosition;
                    const centerHit=point(x,y),cornerHit=point(x+area.hitArea.width/2,y+area.hitArea.height/2);
                    Object.assign(hit.style,{left:`${centerHit.x-center.x+width/2-link.clientLeft}px`,top:`${centerHit.y-center.y+height/2-link.clientTop}px`,
                        width:`${2*(cornerHit.x-centerHit.x)}px`,height:`${2*(cornerHit.y-centerHit.y)}px`});
                }
            }
        };
        const dismiss = () => setArmed(null);
        const observer=new ResizeObserver(project);observer.observe(frame);
        project(); map?.on('render',project); map?.on('resize',project); map?.on('movestart',dismiss);
        return () => {observer.disconnect();map?.off('render',project);map?.off('resize',project);map?.off('movestart',dismiss);};
    });
    const layer = <nav className="atlas-itinerary-layer" aria-label={t(navLabelKey)}>
        {destinations.map(destination => {
            const [anchor, ...areas] = destination.hitAreas, {x,y} = anchor.artworkPosition;
            const label = t(destination.labelKey), action = t('homeMagazine.atlas.viewItinerary');
            return <a key={destination.id} ref={node => {if(node) links.current.set(destination.id,node);else links.current.delete(destination.id);}}
                className="atlas-itinerary" data-destination={destination.id} data-hit-area={anchor.id} data-revealed={armed === destination.id} data-callout-align={destination.calloutAlign}
                href={getOfficialItineraryPath(destination.slug)} aria-label={`${label} — ${action}`} draggable={false}
                style={{left:`${x*100}%`,top:`${y*100}%`,width:`${anchor.hitArea.width*100}%`,height:`${anchor.hitArea.height*100}%`}}
                onPointerDown={event => {pointer.current={type:event.pointerType,x:event.clientX,y:event.clientY};}}
                onKeyDown={event => {if(event.key==='Escape'){setArmed(null);event.currentTarget.blur();}}}
                onClick={event => {
                    const touch = pointer.current?.type === 'touch' && event.detail !== 0;
                    const moved = event.detail !== 0 && pointer.current && Math.hypot(event.clientX-pointer.current.x,event.clientY-pointer.current.y)>8;
                    pointer.current = null;
                    if(event.defaultPrevented || moved){event.preventDefault();return;}
                    // First tap reveals; the armed destination's second tap navigates natively.
                    if(touch && armed !== destination.id){event.preventDefault();setArmed(destination.id);}
                }}>
                {areas.map(area => <span key={area.id} className="atlas-itinerary-hit" data-hit-area={area.id} aria-hidden="true" style={relative(area,anchor)} />)}
                <span className="atlas-itinerary-callout" aria-hidden="true" style={destination.calloutPlacement === 'below' ? calloutBelow(destination.hitAreas) : undefined}>
                    <strong>{t(destination.calloutLabelKey || destination.labelKey)}</strong> · {action} →
                </span>
            </a>;
        })}
    </nav>;
    return map ? createPortal(layer,map.getCanvasContainer()) : layer;
}
