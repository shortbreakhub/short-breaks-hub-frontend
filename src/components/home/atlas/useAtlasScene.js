import {useEffect,useRef,useState} from 'react';
import europeUrl from '../../../assets/atlas/europe/europe-atlas.png';
import ukUrl from '../../../assets/atlas/countries/uk/uk-atlas.png';
import {cloudUrl} from './AtlasCloudTransition.jsx';
import {createAtlasSceneTransition,loadAtlasArtwork} from './atlasSceneTransition.js';
export const SCENE_ASSETS={europe:europeUrl,uk:ukUrl};
export default function useAtlasScene({images,swapScene,onComplete}) {
    const [scene,setScene]=useState('europe'),[phase,setPhase]=useState('idle'),[error,setError]=useState(false),[reducedMotion,setReducedMotion]=useState(false);
    const controller=useRef(null),callbacks=useRef(null);callbacks.current={images,swapScene,onComplete};
    useEffect(()=>{
        const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)') || {matches:false,addEventListener(){},removeEventListener(){}};
        const loadingLifetime=new AbortController();
        const update=()=>setReducedMotion(preference.matches);update();preference.addEventListener('change',update);
        controller.current=createAtlasSceneTransition({
            loadArtwork:target=>loadAtlasArtwork(SCENE_ASSETS[target],callbacks.current.images[target].current,8000,loadingLifetime.signal),
            loadCloud:()=>loadAtlasArtwork(cloudUrl,undefined,8000,loadingLifetime.signal),
            swapScene:(...args)=>callbacks.current.swapScene(...args),
            onPhase:setPhase,onScene:setScene,onError:setError,onComplete:target=>callbacks.current.onComplete(target),
        });
        const preload=setTimeout(()=>{
            loadAtlasArtwork(ukUrl,callbacks.current.images.uk.current,8000,loadingLifetime.signal).catch(()=>{});
            if(!preference.matches)loadAtlasArtwork(cloudUrl,undefined,8000,loadingLifetime.signal).catch(()=>{});
        },250);
        return ()=>{clearTimeout(preload);loadingLifetime.abort();controller.current.dispose();preference.removeEventListener('change',update);};
    },[]);
    return {scene,phase,error,reducedMotion,transitionTo:target=>controller.current?.go(target,window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false)};
}
