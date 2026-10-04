import assert from 'node:assert/strict';
import test from 'node:test';
import {createAtlasSceneTransition,loadAtlasArtwork,CLOUD_COVER_DURATION,CLOUD_COVERED_HOLD,CLOUD_REVEAL_DURATION} from '../src/components/home/atlas/atlasSceneTransition.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(overrides={}) {
    const phases=[],swaps=[],completions=[],errors=[],waiting=[];
    let controller;
    controller=createAtlasSceneTransition({loadArtwork:async scene=>({scene}),loadCloud:async()=>{},
        swapScene:async scene=>swaps.push({scene,phase:controller.getState().phase}),onPhase:p=>phases.push(p),onScene:()=>{},onError:e=>errors.push(e),onComplete:s=>completions.push(s),
        wait:duration=>new Promise(resolve=>waiting.push({duration,resolve})),...overrides});
    return {controller,phases,swaps,completions,errors,waiting};
}
test('UK swaps only while covered, locks duplicates, and returns through the same sequence',async()=>{
    let decode;const f=fixture({loadArtwork:scene=>scene==='uk'?new Promise(resolve=>decode=resolve):Promise.resolve({scene})});
    const first=f.controller.go('uk');await tick();assert.equal(f.controller.getState().phase,'covering');
    assert.equal(await f.controller.go('uk'),false);assert.equal(await f.controller.go('europe'),false);
    assert.equal(f.waiting[0].duration,CLOUD_COVER_DURATION);f.waiting.shift().resolve();await tick();
    assert.equal(f.controller.getState().phase,'covered');assert.equal(f.controller.getState().scene,'europe');assert.equal(f.swaps.length,0);
    assert.equal(f.waiting[0].duration,CLOUD_COVERED_HOLD);f.waiting.shift().resolve();await tick();
    assert.equal(f.controller.getState().phase,'covered');assert.equal(f.swaps.length,0);
    decode({decoded:true});await tick();assert.deepEqual(f.swaps,[{scene:'uk',phase:'covered'}]);
    assert.equal(f.waiting[0].duration,CLOUD_REVEAL_DURATION);f.waiting.shift().resolve();assert.equal(await first,true);assert.equal(f.controller.getState().phase,'idle');
    const back=f.controller.go('europe');await tick();f.waiting.shift().resolve();await tick();
    f.waiting.shift().resolve();await tick();f.waiting.shift().resolve();assert.equal(await back,true);
    assert.deepEqual(f.completions,['uk','europe']);assert.ok(f.swaps.every(s=>s.phase==='covered'));
});
test('reduced motion skips travelling clouds and keeps functional scene changes',async()=>{
    let clouds=0;const f=fixture({loadCloud:()=>clouds++,wait:async duration=>assert.equal(duration,0)});
    assert.equal(await f.controller.go('uk',true),true);assert.equal(clouds,0);assert.equal(f.controller.getState().busy,false);
});
test('failed UK image unlocks Europe and never swaps to unloaded artwork',async()=>{
    const f=fixture({loadArtwork:async()=>{throw Error('503');},wait:async()=>{}});
    assert.equal(await f.controller.go('uk'),false);assert.equal(f.controller.getState().scene,'europe');assert.equal(f.controller.getState().phase,'idle');assert.deepEqual(f.swaps,[]);assert.equal(f.errors.at(-1),true);
});
test('a renderer failure restores the previous scene under cover',async()=>{
    let scenes=[];const f=fixture({swapScene:async scene=>{scenes.push(scene);if(scene==='uk')throw Error('renderer');},wait:async()=>{}});
    assert.equal(await f.controller.go('uk'),false);assert.deepEqual(scenes,['uk','europe']);assert.equal(f.controller.getState().busy,false);
});
test('disposing a pending transition prevents scene updates',async()=>{
    let resolve;const f=fixture({loadCloud:()=>new Promise(done=>resolve=done)});const run=f.controller.go('uk');await tick();f.controller.dispose();resolve();assert.equal(await run,false);assert.deepEqual(f.swaps,[]);assert.deepEqual(f.completions,[]);
});
test('preload shares one decoded image and failed loads remain retryable',async()=>{
    class Image extends EventTarget {complete=false;naturalWidth=0;getAttribute(){return 'artwork';}decode(){return Promise.resolve();}}
    const image=new Image();const a=loadAtlasArtwork('test://uk',image),b=loadAtlasArtwork('test://uk',image);assert.equal(a,b);image.complete=true;image.naturalWidth=1536;image.dispatchEvent(new Event('load'));assert.equal(await a,image);
    const failed=new Image();const failure=loadAtlasArtwork('test://failed',failed);failed.dispatchEvent(new Event('error'));await assert.rejects(failure,/unavailable/);
    const retry=new Image();const retried=loadAtlasArtwork('test://failed',retry);retry.naturalWidth=1536;retry.dispatchEvent(new Event('load'));assert.equal(await retried,retry);
});
test('France joins the same covered-only sequence and its artwork loads only when selected',async()=>{
    const loads=[];const f=fixture({scenes:['europe','uk','france'],loadArtwork:async scene=>{loads.push(scene);return {scene};},wait:async()=>{}});
    assert.deepEqual(loads,[]);
    assert.equal(await f.controller.go('france'),true);assert.deepEqual(loads,['france']);
    assert.deepEqual(f.swaps,[{scene:'france',phase:'covered'}]);assert.equal(f.controller.getState().scene,'france');
    assert.equal(await f.controller.go('europe'),true);assert.deepEqual(f.completions,['france','europe']);
    assert.equal(await f.controller.go('italy'),false,'unconfigured scenes are rejected');
    const legacy=fixture({wait:async()=>{}});assert.equal(await legacy.controller.go('france'),false,'default allowlist remains europe/uk');
});
test('failed France artwork restores Europe without swapping',async()=>{
    const f=fixture({scenes:['europe','uk','france'],loadArtwork:scene=>scene==='france'?Promise.reject(Error('France unavailable')):Promise.resolve({scene}),wait:async()=>{}});
    assert.equal(await f.controller.go('france'),false);assert.equal(f.controller.getState().scene,'europe');
    assert.deepEqual(f.swaps,[]);assert.equal(f.errors.at(-1),true);assert.deepEqual(f.completions,['europe']);
});
