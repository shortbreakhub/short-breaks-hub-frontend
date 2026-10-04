export const CLOUD_COVER_DURATION = 700;
export const CLOUD_COVERED_HOLD = 220;
export const CLOUD_REVEAL_DURATION = 800;
const artworkCache = new Map();
// Reuse the persistent DOM image: the same decoded UK element feeds MapLibre,
// avoiding another PNG request when uploading it to the raster source.
export function loadAtlasArtwork(url, existingImage, timeoutMs = 8000, signal) {
    if (artworkCache.has(url)) return artworkCache.get(url);
    const promise = new Promise((resolve,reject) => {
        const image = existingImage || new Image();
        let settled = false;
        const finish = (error) => {
            if(settled) return; settled=true; clearTimeout(timeout);
            signal?.removeEventListener('abort',cancelled);
            image.removeEventListener('load',loaded); image.removeEventListener('error',failed);
            if(error) reject(error); else resolve(image);
        };
        const loaded = () => Promise.resolve(image.decode?.()).then(()=>finish(),()=>finish(Error('Artwork decode failed')));
        const failed = () => finish(Error('Artwork unavailable'));
        const cancelled = () => finish(Error('Artwork cancelled'));
        const timeout = setTimeout(()=>finish(Error('Artwork loading deadline')),timeoutMs);
        if(signal?.aborted){cancelled();return;}
        signal?.addEventListener('abort',cancelled,{once:true});
        image.addEventListener('load',loaded);image.addEventListener('error',failed);
        image.loading='eager';
        if(existingImage && image.complete && !image.naturalWidth)image.src=url;
        if(!existingImage) image.src=url;
        if(image.complete && image.naturalWidth) loaded();
        else if(image.complete && image.getAttribute('src')) failed();
    });
    artworkCache.set(url,promise);
    promise.catch(()=>artworkCache.delete(url));
    return promise;
}
function pause(duration,signal) {
    return new Promise((resolve,reject)=>{
        const abort=()=>{clearTimeout(timer);reject(Error('Transition cancelled'));};
        const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},duration);
        if(signal.aborted) abort();else signal.addEventListener('abort',abort,{once:true});
    });
}
// Only scene orchestration; no routing, map engine, or destination geometry here.
export function createAtlasSceneTransition({loadArtwork,loadCloud,swapScene,onPhase,onScene,onError,onComplete,wait=pause,scenes=['europe','uk']}) {
    let scene='europe', phase='idle', busy=false;
    const lifetime=new AbortController();
    const updatePhase=value=>{phase=value;if(!lifetime.signal.aborted)onPhase(value);};
    return {
        getState:()=>({scene,phase,busy}),
        dispose:()=>lifetime.abort(),
        async go(target,reducedMotion=false) {
            if(busy || target===scene || lifetime.signal.aborted || !scenes.includes(target)) return false;
            busy=true;onError(false);updatePhase('preparing');
            const previous=scene;
            // Attach rejection handling immediately, even while clouds are travelling.
            const artwork=Promise.resolve().then(()=>loadArtwork(target)).then(image=>({image}),error=>({error}));
            try {
                if(!reducedMotion)await loadCloud();
                if(lifetime.signal.aborted)return false;
                updatePhase('covering');await wait(reducedMotion?0:CLOUD_COVER_DURATION,lifetime.signal);
                updatePhase('covered');
                await wait(reducedMotion?0:CLOUD_COVERED_HOLD,lifetime.signal);
                const prepared=await artwork;if(prepared.error)throw prepared.error;
                if(lifetime.signal.aborted)return false;
                scene=target;onScene(target);
                await swapScene(target,prepared.image,lifetime.signal);
                updatePhase('revealing');await wait(reducedMotion?0:CLOUD_REVEAL_DURATION,lifetime.signal);
            } catch(error) {
                if(lifetime.signal.aborted)return false;
                const rollback=scene!==previous;scene=previous;onScene(previous);onError(true);
                if(rollback){try{await swapScene(previous,await loadArtwork(previous),lifetime.signal);}catch{/* renderer already falls back to its DOM preview */}}
                // Failed loads never reveal a new scene. Clear moving clouds safely.
                updatePhase('revealing');await wait(reducedMotion?0:CLOUD_REVEAL_DURATION,lifetime.signal).catch(()=>{});
            } finally {
                busy=false;
                if(!lifetime.signal.aborted){updatePhase('idle');onComplete(scene);}
            }
            return scene===target;
        }
    };
}
