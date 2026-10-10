import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import axios from 'axios';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';

const legacy = 'https://res.cloudinary.com/fixture/image/upload/legacy.jpg';
const fresh = 'https://res.cloudinary.com/fixture/image/upload/trusted.png';
const draft = {draftId:31,title:'A real Paris journey',country:'France',region:'Europe',days:1,estimatedCost:100,
    summary:'An existing draft introduction that has more than fifty characters for publication.',coverPhoto:legacy,
    highlights:'Architecture',visibility:'PUBLIC',schedule:[{day:1,title:'Walking Paris',details:'An existing detailed day plan with more than thirty characters.'}]};

test('Create itinerary cover ownership and persistence workflows', async t => {
    const vite = await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    const dom = new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/create-itinerary'});
    const keys = ['window','document','localStorage','location','IS_REACT_ACT_ENVIRONMENT'];
    const saved = Object.fromEntries(keys.map(key => [key,globalThis[key]]));
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,location:dom.window.location,IS_REACT_ACT_ENVIRONMENT:true});
    const createURL = URL.createObjectURL, revokeURL = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:cover-preview'; URL.revokeObjectURL = () => {};
    const externalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async config => ({config,status:200,headers:{},data:config.url.includes('countriesnow')?{data:[{country:'France'}]}:[{region:'Europe'}]});
    let root, api, adapter, requests=[], fail=null, uploadResolve, saveResolve, pendingUpload=false, pendingSave=false;
    const response = (config,data) => ({config,data,status:200,headers:{}});
    try {
        const {createRoot} = await import('react-dom/client');
        const {default:Form} = await vite.ssrLoadModule('/src/components/CreateItineraryForm.jsx');
        api = (await vite.ssrLoadModule('/src/api.js')).api; adapter = api.defaults.adapter;
        api.defaults.adapter = async config => {
            requests.push(config);
            if (fail && config.url.includes(fail.path)) {
                const error = Object.assign(new Error('fixture failure'),{config});
                if (fail.status) error.response = {status:fail.status};
                throw error;
            }
            if (config.method === 'get') return response(config,config.url.endsWith('/count')?{count:0}:draft);
            if (config.url.includes('photo')) {
                assert.ok(config.data.get('file') instanceof File);
                if (pendingUpload) return new Promise(resolve => {uploadResolve=()=>resolve(response(config,fresh));});
                return response(config,fresh);
            }
            if (pendingSave) return new Promise(resolve => {saveResolve=()=>resolve(response(config,{draftId:31}));});
            return response(config,{draftId:31});
        };
        async function mount(path='/create-itinerary?draftId=31') {
            if(root) await React.act(async()=>root.unmount());
            localStorage.clear();localStorage.setItem('emailVerified','true');
            localStorage.setItem('authToken',`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({sub:'7',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.fixture`);
            requests=[];fail=null;pendingUpload=false;pendingSave=false;
            root=createRoot(document.getElementById('root'));
            await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(Form))));
        }
        const click=async action=>React.act(async()=>document.querySelector(`[data-action="${action}"]`).click());
        const select=async(photo=new File(['pixels'],'cover.png',{type:'image/png'}))=>React.act(async()=>{
            const input=document.getElementById('hero');Object.defineProperty(input,'files',{value:photo?[photo]:[],configurable:true});
            input.dispatchEvent(new window.Event('change',{bubbles:true}));
        });
        const mutations=()=>requests.filter(r=>r.method!=='get');
        const uploads=()=>mutations().filter(r=>r.url.includes('photo'));
        const assertPreserved=()=>{
            assert.equal(document.getElementById('title').value,draft.title);
            assert.equal(document.querySelector('[data-field="currentTime-details"]').value,draft.schedule[0].details);
            assert.equal(document.getElementById('tags').value,draft.highlights);
        };
        await t.test('legacy cover cannot publish without a fresh file; cancellation never uploads',async()=>{
            await mount();await select(null);await click('publish');assert.equal(mutations().length,0);
            assert.match(document.body.textContent,/upload a cover image before publishing this older draft/);assertPreserved();
        });
        await t.test('empty or unsupported files do not replace the existing cover',async()=>{
            await mount();await select(new File([],'empty.png',{type:'image/png'}));await click('publish');assert.equal(uploads().length,0);
            await select(new File(['bad'],'note.txt',{type:'text/plain'}));assert.match(document.body.textContent,/non-empty JPG or PNG/);
            assert.equal(document.querySelector('img').getAttribute('src'),legacy);assertPreserved();
        });
        await t.test('unchanged legacy draft remains saveable without uploading or discarding its schedule',async()=>{
            await mount();await click('save-draft');assert.equal(uploads().length,0);
            const payload=JSON.parse(mutations()[0].data);assert.equal(payload.coverPhoto,legacy);assert.deepEqual(payload.userDayPlan,draft.schedule);assertPreserved();
        });
        await t.test('replacement is awaited, submits the returned URL, and keeps controls locked until save completes',async()=>{
            await mount();await select();pendingUpload=true;pendingSave=true;await click('save-draft');
            assert.equal(mutations().length,1);assert.equal(uploads()[0].data.get('existingCoverUrl'),legacy);
            assert.equal(document.querySelector('[data-action="publish"]').disabled,true);
            await React.act(async()=>uploadResolve());assert.equal(mutations().length,2);
            assert.equal(JSON.parse(mutations()[1].data).coverPhoto,fresh);
            assert.equal(document.querySelector('[data-action="save-draft"]').disabled,true);
            assert.ok(!document.body.textContent.includes('Draft Updated Successfully'));
            await React.act(async()=>saveResolve());assert.match(document.body.textContent,/Draft Updated Successfully/);
            pendingSave=false;await click('save-draft');assert.equal(uploads().length,1);assert.equal(JSON.parse(mutations().at(-1).data).coverPhoto,fresh);assertPreserved();
        });
        await t.test('new draft without a file saves without attempting an upload',async()=>{
            await mount('/create-itinerary');
            // Use a React input event with the browser's native setter.
            await React.act(async()=>{const input=document.getElementById('title');Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'A new journey draft');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
            await click('save-draft');assert.equal(uploads().length,0);
            assert.equal(mutations().length,1);assert.equal(JSON.parse(mutations()[0].data).coverPhoto,'');
        });
        await t.test('legacy publishing uploads before publishing and uses the exact returned URL',async()=>{
            await mount();await select();pendingUpload=true;await click('publish');assert.equal(mutations().length,1);
            assert.ok(!document.body.textContent.includes('Itinerary published'));
            await React.act(async()=>uploadResolve());assert.equal(mutations().length,2);
            assert.equal(mutations()[1].url,'/community-itineraries/publish-itinerary');assert.equal(JSON.parse(mutations()[1].data).coverPhoto,fresh);
            assert.match(document.body.textContent,/Itinerary published/);
        });
        await t.test('network and 404 upload failures preserve all fields, preview and selected file',async()=>{
            for (const status of [null,404]) {
                await mount();await select();fail={path:'photo',status};await click('publish');assert.equal(mutations().length,1);
                assertPreserved();assert.equal(document.querySelector('img').getAttribute('src'),'blob:cover-preview');
                assert.ok(!document.body.textContent.includes('Itinerary published'));
                assert.match(document.body.textContent,status?/unavailable/:/connection/);
                fail=null;await click('publish');assert.match(document.body.textContent,/Itinerary published/);
            }
        });
        await t.test('failed publish retains uploaded URL and retries without uploading again',async()=>{
            await mount();await select();fail={path:'publish-itinerary',status:500};await click('publish');
            assertPreserved();assert.equal(uploads().length,1);assert.ok(!document.body.textContent.includes('Itinerary published'));
            fail=null;await click('publish');assert.equal(uploads().length,1);assert.equal(JSON.parse(mutations().at(-1).data).coverPhoto,fresh);
            assert.match(document.body.textContent,/Itinerary published/);
        });
        await t.test('failed replacement persistence retains returned URL for a safe retry',async()=>{
            await mount();await select();fail={path:'draft/31',status:500};await click('save-draft');assertPreserved();
            assert.ok(!document.body.textContent.includes('Draft Updated Successfully'));fail=null;await click('save-draft');
            assert.equal(uploads().length,1);assert.equal(JSON.parse(mutations().at(-1).data).coverPhoto,fresh);
        });
        await t.test('a newly trusted replacement can publish without a duplicate upload',async()=>{
            await mount();await select();await click('save-draft');await click('publish');
            assert.equal(uploads().length,1);assert.equal(JSON.parse(mutations().at(-1).data).coverPhoto,fresh);
            assert.match(document.body.textContent,/Itinerary published/);
        });
        await t.test('failed new draft save keeps its upload and entered title for retry',async()=>{
            await mount('/create-itinerary');
            await React.act(async()=>{const input=document.getElementById('title');Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'A new journey draft');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
            await select();fail={path:'save-draft',status:500};await click('save-draft');
            assert.equal(document.getElementById('title').value,'A new journey draft');
            assert.ok(!document.body.textContent.includes('Itinerary Draft Saved'));fail=null;await click('save-draft');
            assert.equal(uploads().length,1);assert.equal(JSON.parse(mutations().at(-1).data).coverPhoto,fresh);
            assert.match(document.body.textContent,/Itinerary Draft Saved/);
        });
        await t.test('failed draft deletion preserves the form instead of navigating away',async()=>{
            await mount();fail={path:'draft/31',status:404};await click('discard');
            await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Yes').click());
            assertPreserved();assert.equal(window.location.pathname,'/create-itinerary');assert.match(document.body.textContent,/Delete failed/);
        });
        await t.test('401 clears credentials without redirecting or clearing the form',async()=>{
            await mount();await select();fail={path:'photo',status:401};await click('publish');
            assert.equal(localStorage.getItem('authToken'),null);assertPreserved();assert.equal(window.location.pathname,'/create-itinerary');
            assert.match(document.body.textContent,/Sign in again/);assert.equal(document.querySelector('img').getAttribute('src'),'blob:cover-preview');
            const count=requests.length;await click('save-draft');assert.equal(requests.length,count);
        });
        await t.test('failed draft loading blocks mutations instead of replacing unavailable data with a blank draft',async()=>{
            await mount('/create-itinerary');fail={path:'draft/31',status:404};
            await React.act(async()=>root.unmount());root=createRoot(document.getElementById('root'));
            await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/create-itinerary?draftId=31']},React.createElement(Form))));
            assert.equal(document.querySelector('[data-action="save-draft"]').disabled,true);assert.equal(document.querySelector('[data-action="publish"]').disabled,true);
            assert.match(document.body.textContent,/Load draft failed/);assert.equal(mutations().length,0);
        });
    } finally {
        if(root) await React.act(async()=>root.unmount());
        if(api) api.defaults.adapter=adapter;axios.defaults.adapter=externalAdapter;
        URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;
        await vite.close();dom.window.close();for(const key of keys){if(saved[key]===undefined)delete globalThis[key];else globalThis[key]=saved[key];}
    }
});
