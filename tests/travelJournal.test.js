import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {MemoryRouter, Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';

const token = exp => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({sub:'7',exp})).toString('base64url')}.fixture`;
const me = {userId:7,email:'journal@example.test',displayName:'Journal Traveller',adults:2,children:0,currency:'GBP',location:'London',bio:'Real fixture profile'};
const published = {id:11,userId:7,slug:'real-public-fixture',title:'Published fixture',country:'Italy',days:3,visibility:'PUBLIC',summary:'Existing test data'};
const privateEntry = {...published,id:12,slug:'private-fixture',title:'Private fixture',visibility:'PRIVATE'};
const draft = {...published,id:31,title:'Draft fixture',lastUpdatedAt:'2026-10-10T10:00:00Z'};
const official = {id:21,slug:'official-fixture',title:'Official favorite fixture',country:'France',days:4};
const community = {...published,id:22,userId:99,slug:'community-fixture',title:'Community favorite fixture'};
const paged = (content,total=content.length,pages=total?1:0) => ({content,totalElements:total,totalPages:pages});

test('My Travel Journal preserves authentication, five sections, real collections and supported mutations', async t => {
    const vite = await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/profile'});
    const keys=['window','document','localStorage','location','IS_REACT_ACT_ENVIRONMENT'];
    const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,location:{pathname:'/login'},IS_REACT_ACT_ENVIRONMENT:true});
    let root,api,adapter,navigate,requests=[],mode='ready',deletionFails=false, drafts=[draft], pending=[];
    const errors = (status=500) => Object.assign(new Error('fixture failure'),{response:{status}});
    const readData = config => {
        if(config.url==='/auth/me')return me;
        if(config.url==='/itineraries/me/favorites')return mode==='empty'?paged([]):paged(config.params.page?[{...official,id:24,title:'Second page fixture'}]:[official],25,3);
        if(config.url==='/community-itineraries/me/favorites')return mode==='empty'?paged([]):paged([community],4,1);
        if(config.url==='/community-itineraries/me')return mode==='empty'?paged([]):paged(mode==='foreign'?[{...published,userId:99}]:[published,privateEntry],14,2);
        if(config.url==='/community-itineraries/draft/me')return mode==='empty'?[]:mode==='foreign'?[{...draft,userId:99}]:drafts;
        throw new Error('Unexpected request '+config.url);
    };
    try {
        const {createRoot}=await import('react-dom/client');
        const {default:Profile}=await vite.ssrLoadModule('/src/pages/ProfilePage.jsx');
        await vite.ssrLoadModule('/src/i18n.js');
        api=(await vite.ssrLoadModule('/src/api.js')).api;adapter=api.defaults.adapter;
        api.defaults.adapter=async config=>{
            requests.push(config);
            if(mode==='unauthorized')throw errors(401);
            if(mode==='forbidden')throw errors(403);
            if(config.method==='delete'){
                assert.equal(config.url,'community-itineraries/draft/31');
                if(deletionFails)throw errors();drafts=[];return {config,status:200,data:{msg:'deleted'},headers:{}};
            }
            if(config.method==='post' && config.url==='/auth/me/photo')return {config,status:200,data:'/src/assets/user-center/default-avatar.png',headers:{}};
            if(config.method==='put' && mode==='saveError')throw errors();
            if(config.method==='put')return {config,status:200,data:{...me,...JSON.parse(config.data)},headers:{}};
            if(mode==='error' && config.url.includes('/favorites'))throw errors();
            if(mode==='pending' && config.url.includes('/favorites'))return new Promise(resolve=>pending.push(()=>resolve({config,status:200,data:paged([]),headers:{}})));
            return {config,status:200,data:readData(config),headers:{}};
        };
        function Capture(){navigate=useNavigate();return React.createElement('output',{id:'route'},useLocation().pathname);}
        async function mount(auth=true,path='/profile'){
            if(root)await React.act(async()=>root.unmount());
            localStorage.clear();if(auth)localStorage.setItem('authToken',typeof auth==='string'?auth:token(Math.floor(Date.now()/1000)+3600));
            root=createRoot(document.getElementById('root'));
            await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(Capture),React.createElement(Routes,null,
                React.createElement(Route,{path:'/profile',element:React.createElement(Profile)}),React.createElement(Route,{path:'/login',element:React.createElement('h1',null,'Login')})))));
        }
        const go=async section=>React.act(async()=>navigate('/profile?tab='+section));
        const click=async text=>React.act(async()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b,text);b.click();});
        await t.test('guest and expired session cannot request or display account data',async()=>{
            requests=[];await mount(false);assert.equal(document.querySelector('#route').textContent,'/login');assert.equal(requests.length,0);assert.equal(document.querySelector('.travel-journal'),null);
            await mount(token(1));assert.equal(requests.length,0);assert.equal(document.querySelector('.travel-journal'),null);
        });
        await t.test('overview uses backend totals and all five localized sections without invented history',async()=>{
            mode='ready';requests=[];await mount();
            assert.deepEqual([...document.querySelectorAll('.journal-stat strong')].map(el=>el.textContent),['29','14','1']);
            assert.equal(document.querySelectorAll('.journal-navigation a').length,5);
            assert.equal(document.querySelector('.journal-sidebar'),null);
            assert.equal(document.querySelector('.journal-banner'),null);
            assert.equal(document.querySelector('.journal-header p').textContent,i18n.t('travelJournal.subtitle'));
            assert.equal(document.querySelectorAll('img[src*="journal-banner"], img[src*="sidebar-village"]').length,0);
            assert.ok(requests.every(r=>r.headers.Authorization?.startsWith('Bearer ')));
            assert.ok(!document.body.textContent.includes('Member Since'));assert.ok(!document.body.textContent.includes('views'));
            for(const lang of ['en','fr']){await React.act(async()=>i18n.changeLanguage(lang));assert.equal(document.querySelector('h1').textContent,i18n.t('travelJournal.title'));await go('settings');assert.equal(document.querySelector('h2').textContent,i18n.t('travelJournal.sections.settings'));}
            await React.act(async()=>i18n.changeLanguage('en'));
        });
        await t.test('favorites remain separate, preserve native routes and respect pagination totals',async()=>{
            await go('favorites');assert.ok(document.querySelector('a[href="/itinerary/official-fixture"]'));
            await click('Next');assert.ok(document.body.textContent.includes('Second page fixture'));
            const last=requests.filter(r=>r.url==='/itineraries/me/favorites').at(-1);assert.equal(last.params.page,1);assert.equal(last.params.size,12);
            await click('Community Trips');assert.ok(document.querySelector('a[href="/user-itinerary/community-fixture"]'));assert.equal(document.querySelector('a[href="/itinerary/official-fixture"]'),null);
        });
        await t.test('published exposes only supported public links and drafts continue through the existing route',async()=>{
            await go('published-itineraries');assert.ok(document.querySelector('a[href="/user-itinerary/real-public-fixture"]'));assert.equal(document.querySelector('a[href="/user-itinerary/private-fixture"]'),null);assert.ok(document.body.textContent.includes('Private fixture'));
            await go('draft-itineraries');assert.ok(document.querySelector('a[href="/create-itinerary?draftId=31"]'));
            assert.equal(draft.visibility,'PUBLIC');
            assert.equal(document.querySelector('.journal-entry h3').textContent,'Draft fixture');
            assert.equal(document.querySelector('.journal-entry h3 a'),null);
            assert.equal(document.querySelector('.journal-entry a[href^="/user-itinerary/"]'),null);
        });
        await t.test('draft confirmation retains records on failure and refreshes after successful deletion',async()=>{
            await click('Discard');assert.ok(document.querySelector('[role="alertdialog"]'));assert.equal(document.activeElement.textContent,'Keep draft');
            deletionFails=true;await click('Delete draft');assert.ok(document.querySelector('[role="alert"]'));assert.ok(document.body.textContent.includes('Draft fixture'));
            deletionFails=false;await click('Delete draft');assert.equal(document.querySelector('[role="alertdialog"]'),null);assert.ok(document.body.textContent.includes('No drafts yet'));
        });
        await t.test('settings retain native validation and update only supported fields',async()=>{
            await go('settings');const form=document.querySelector('form');assert.equal(document.querySelector('[name="displayName"]').labels.length,1);
            await React.act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
            const saved=requests.find(r=>r.method==='put');assert.equal(saved.url,'/auth/me');assert.deepEqual(Object.keys(JSON.parse(saved.data)).sort(),['adults','bio','children','currency','displayName','location']);assert.ok(document.querySelector('[role="status"]'));
        });
        await t.test('settings surface save failures and preserve the authenticated avatar upload contract',async()=>{
            await go('settings');mode='saveError';
            await React.act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
            assert.ok(document.querySelector('[role="alert"]'));assert.ok(!document.querySelector('fieldset').disabled);
            mode='ready';
            const file=document.querySelector('input[type="file"]');
            Object.defineProperty(file,'files',{configurable:true,value:[new File([new Uint8Array([1,2,3])],'fixture.png',{type:'image/png'})]});
            await React.act(async()=>file.dispatchEvent(new window.Event('change',{bubbles:true})));
            const upload=requests.find(r=>r.method==='post');assert.equal(upload.url,'/auth/me/photo');assert.equal(upload.data.get('file').name,'fixture.png');
            const assignment=requests.filter(r=>r.method==='put').at(-1);assert.equal(assignment.url,'/auth/me/photo');assert.deepEqual(JSON.parse(assignment.data),{avatarUrl:'/src/assets/user-center/default-avatar.png'});
            assert.ok(document.querySelector('[role="status"]'));
        });
        await t.test('empty is reserved for successful responses; failures have independent retry states',async()=>{
            mode='empty';await mount();assert.ok(document.body.textContent.includes('Your first journey is waiting'));assert.deepEqual([...document.querySelectorAll('.journal-stat strong')].map(el=>el.textContent),['0','0','0']);
            mode='error';await mount();assert.ok(document.body.textContent.includes('Unavailable'));await go('favorites');assert.ok(document.querySelector('[role="alert"]'));assert.equal(document.querySelector('.journal-empty'),null);
            mode='ready';await click('Try again');assert.ok(document.querySelector('a[href="/itinerary/official-fixture"]'));
        });
        await t.test('loading stays distinct and foreign owned rows never render',async()=>{
            mode='pending';await mount();await go('favorites');assert.ok(document.querySelector('[role="status"]'));assert.equal(document.querySelector('.journal-empty'),null);
            await React.act(async()=>pending.splice(0).forEach(resolve=>resolve()));assert.ok(document.querySelector('.journal-empty'));
            mode='foreign';await mount();await go('published-itineraries');assert.ok(document.querySelector('[role="alert"]'));assert.equal(document.querySelector('a[href="/user-itinerary/real-public-fixture"]'),null);
            await go('draft-itineraries');assert.ok(document.querySelector('[role="alert"]'));assert.equal(document.querySelector('a[href="/create-itinerary?draftId=31"]'),null);
        });
        await t.test('direct section URLs and Back/Forward preserve the selected journal section',async()=>{
            mode='ready';await mount(true,'/profile?tab=draft-itineraries');
            assert.equal(document.querySelector('.journal-navigation [aria-current]').getAttribute('href'),'/profile?tab=draft-itineraries');
            await go('settings');await React.act(async()=>navigate(-1));
            assert.equal(document.querySelector('.journal-navigation [aria-current]').getAttribute('href'),'/profile?tab=draft-itineraries');
            await React.act(async()=>navigate(1));assert.ok(document.querySelector('form'));
            assert.equal(document.querySelector('.journal-navigation [aria-current]').getAttribute('href'),'/profile?tab=settings');
        });
        await t.test('same-tab token renewal keeps the journal authenticated',async()=>{
            mode='ready';await mount();
            localStorage.setItem('authToken',token(Math.floor(Date.now()/1000)+7200));
            await go('settings');assert.equal(document.querySelector('#route').textContent,'/profile');assert.ok(document.querySelector('form'));
        });
        await t.test('401, 403 and cross-tab logout clear private UI',async()=>{
            for(const outcome of ['unauthorized','forbidden']){mode=outcome;await mount();assert.equal(document.querySelector('#route').textContent,'/login');assert.equal(document.querySelector('.travel-journal'),null);assert.equal(localStorage.getItem('authToken'),null);}
            mode='ready';await mount();await React.act(async()=>{localStorage.removeItem('authToken');window.dispatchEvent(new window.StorageEvent('storage',{key:'auth:logout'}));});assert.equal(document.querySelector('.travel-journal'),null);
        });
    } finally {
        if(root)await React.act(async()=>root.unmount());if(api)api.defaults.adapter=adapter;await i18n.changeLanguage('en');await vite.close();dom.window.close();
        for(const key of keys){if(saved[key]===undefined)delete globalThis[key];else globalThis[key]=saved[key];}
    }
});
