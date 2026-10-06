import eastAsiaUrl from '../../../assets/atlas/east-asia/east-asia-atlas.png';
import chinaUrl from '../../../assets/atlas/countries/china/china-atlas.png';
import japanUrl from '../../../assets/atlas/countries/japan/japan-atlas.png';
import southkoreaUrl from '../../../assets/atlas/countries/south-korea/south-korea-atlas.png';
import mongoliaUrl from '../../../assets/atlas/countries/mongolia/mongolia-atlas.png';
import taiwanUrl from '../../../assets/atlas/countries/taiwan/taiwan-atlas.png';
import hongkongUrl from '../../../assets/atlas/countries/hong-kong/hong-kong-atlas.png';
import macauUrl from '../../../assets/atlas/countries/macau/macau-atlas.png';
import {useEffect,useRef,useState} from 'react';
import europeUrl from '../../../assets/atlas/europe/europe-atlas.png';
import ukUrl from '../../../assets/atlas/countries/uk/uk-atlas.png';
import franceUrl from '../../../assets/atlas/countries/france/france-atlas.png';
import spainUrl from '../../../assets/atlas/countries/spain/spain-atlas.png';
import portugalUrl from '../../../assets/atlas/countries/portugal/portugal_atlas.png';
import germanyUrl from '../../../assets/atlas/countries/germany/germany-atlas.png';
import greeceUrl from '../../../assets/atlas/countries/greece/greece-atlas.png';
import italyUrl from '../../../assets/atlas/countries/italy/italy-atlas.png';
import netherlandsUrl from '../../../assets/atlas/countries/netherlands/netherlands-atlas.png';
import switzerlandUrl from '../../../assets/atlas/countries/switzerland/switzerland-atlas.png';
import {cloudUrl} from './AtlasCloudTransition.jsx';
import {createAtlasSceneTransition,loadAtlasArtwork} from './atlasSceneTransition.js';
// France (and later countries) load on selection, under cloud cover; only UK is warmed below.
export const SCENE_ASSETS={europe:europeUrl,uk:ukUrl,france:franceUrl,spain:spainUrl,portugal:portugalUrl,
    germany:germanyUrl,greece:greeceUrl,italy:italyUrl,netherlands:netherlandsUrl,switzerland:switzerlandUrl, 'east-asia':eastAsiaUrl,
    'china':chinaUrl, 'japan':japanUrl, 'south-korea':southkoreaUrl, 'mongolia':mongoliaUrl, 'taiwan':taiwanUrl, 'hong-kong':hongkongUrl, 'macau':macauUrl};
export default function useAtlasScene({images,swapScene,onComplete,initialScene='europe'}) {
    const [scene,setScene]=useState(initialScene),[phase,setPhase]=useState('idle'),[error,setError]=useState(false),[reducedMotion,setReducedMotion]=useState(false);
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
            scenes:Object.keys(SCENE_ASSETS),initialScene,
        });
        const preload=setTimeout(()=>{
            loadAtlasArtwork(ukUrl,callbacks.current.images.uk.current,8000,loadingLifetime.signal).catch(()=>{});
            if(!preference.matches)loadAtlasArtwork(cloudUrl,undefined,8000,loadingLifetime.signal).catch(()=>{});
        },250);
        return ()=>{clearTimeout(preload);loadingLifetime.abort();controller.current.dispose();preference.removeEventListener('change',update);};
    },[]);
    return {scene,phase,error,reducedMotion,transitionTo:target=>controller.current?.go(target,window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false)};
}
