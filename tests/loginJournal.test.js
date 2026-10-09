import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter, useLocation} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

function RouteState() {return React.createElement('output', {id:'route'},useLocation().pathname);}

test("Login journal preserves accessible localized inputs, validation, authentication, failure and redirect", async t => {
    const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
    const dom=new JSDOM('<div id="root"></div><div id="toast-root"></div>',{url:'http://localhost:5173/login'});
    const keys=['window','document','localStorage','IS_REACT_ACT_ENVIRONMENT'];const before=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
    let root,api,adapter;
    try {
        const {createRoot}=await import('react-dom/client');
        const {default:Login}=await vite.ssrLoadModule('/src/pages/LoginPage.jsx');
        await vite.ssrLoadModule('/src/i18n.js');
        api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
        const requests=[];api.defaults.adapter=config=>new Promise((resolve,reject)=>requests.push({config,resolve,reject}));
        const render=async path=>{root=createRoot(document.getElementById('root'));await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(React.Fragment,null,React.createElement(Login),React.createElement(RouteState)))));};
        const input=async (name,value)=>React.act(async()=>{const el=document.querySelector(`[name="${name}"]`);Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}));});
        const submit=async()=>React.act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
        for(const lang of ['en','fr']) await t.test(lang+' labels and native validation',async()=>{
            await i18n.changeLanguage(lang);await render('/login');
            assert.equal(document.querySelector('h1').textContent,i18n.t('loginPage.welcomeBack'));
            const email=document.querySelector('[name="email"]'),password=document.querySelector('[name="password"]');
            assert.equal(email.labels.length,1);assert.equal(password.labels.length,1);
            assert.equal(email.autocomplete,'username');assert.equal(password.autocomplete,'current-password');
            assert.equal(password.type,'password');assert.ok(email.required&&password.required);
            assert.equal(document.querySelector('a[href="/register"]').textContent,i18n.t('loginPage.register'));
            assert.ok(document.querySelector('a[href="/forgot-password"]'));
            assert.equal(document.querySelector('img').getAttribute('alt'),'');
            await submit();assert.equal(requests.length,0);
            await input('email','not-an-email');await input('password','test-password');await submit();assert.equal(requests.length,0);
            await React.act(async()=>root.unmount());root=null;
        });
        await t.test('loading locks duplicates, error retains credentials, successful retry saves session and redirects',async()=>{
            await i18n.changeLanguage('en');await render('/login');
            await input('email','traveler@example.com');await input('password','test-password');await submit();await submit();
            assert.equal(requests.length,1);assert.equal(requests[0].config.url,'/auth/login');assert.equal(requests[0].config.method,'post');
            assert.deepEqual(JSON.parse(requests[0].config.data),{email:'traveler@example.com',password:'test-password'});
            assert.ok(document.querySelector('fieldset').disabled);assert.equal(document.querySelector('form').getAttribute('aria-busy'),'true');
            await React.act(async()=>requests[0].reject({response:{data:{error:'invalid credentials'}}}));
            assert.equal(document.querySelector('[role="alert"]').textContent,i18n.t('loginPage.incorrectEmailOrPassword'));
            assert.ok(!document.querySelector('fieldset').disabled);assert.equal(document.querySelector('[name="password"]').value,'test-password');
            assert.equal(localStorage.getItem('authToken'),null);
            await submit();await React.act(async()=>requests[1].reject(new Error('network unavailable')));
            assert.equal(document.querySelector('[role="alert"]').textContent,i18n.t('registerPage.networkError'));
            await submit();await React.act(async()=>requests[2].resolve({data:{token:'safe-mocked-token',emailVerified:true,displayName:'Traveler'},status:200,headers:{},config:requests[2].config}));
            assert.equal(localStorage.getItem('authToken'),'safe-mocked-token');assert.equal(localStorage.getItem('emailVerified'),'true');assert.equal(document.querySelector('#route').textContent,'/');
            await React.act(async()=>root.unmount());root=null;
        });
        await t.test('expired-session notice and toast cleanup remain intact',async()=>{
            localStorage.setItem('auth:toast','Session expired fixture');
            await render('/login?reason=expired');
            assert.ok(document.getElementById('toast-root').textContent.includes('Session expired fixture'));
            assert.equal(localStorage.getItem('auth:toast'),null);
            assert.equal(requests.length,3);
            await React.act(async()=>root.unmount());root=null;
        });
    } finally {
        if(root)await React.act(async()=>root.unmount());if(api)api.defaults.adapter=adapter;
        await i18n.changeLanguage('en');await vite.close();dom.window.close();for(const k of keys){if(before[k]===undefined)delete globalThis[k];else globalThis[k]=before[k];}
    }
});
