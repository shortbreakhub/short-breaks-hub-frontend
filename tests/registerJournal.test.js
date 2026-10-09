import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
function RouteState(){return React.createElement('output',{id:'route'},useLocation().pathname)}
test('Register journal preserves validation, password visibility, payload, errors and successful Login navigation',async t=>{
 const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/register'});const keys=['window','document','localStorage','IS_REACT_ACT_ENVIRONMENT'];const previous=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 let root,api,adapter;
 try{
  const {createRoot}=await import('react-dom/client');const {default:Register}=await vite.ssrLoadModule('/src/pages/RegisterPage.jsx');await vite.ssrLoadModule('/src/i18n.js');api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;const requests=[];api.defaults.adapter=config=>new Promise((resolve,reject)=>requests.push({config,resolve,reject}));
  const render=async()=>{root=createRoot(document.getElementById('root'));await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/register']},React.createElement(React.Fragment,null,React.createElement(Register),React.createElement(RouteState)))))};
  const input=async(name,value)=>React.act(async()=>{const el=document.querySelector(`[name="${name}"]`);Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}));el.dispatchEvent(new window.FocusEvent('focusout',{bubbles:true}));});
  const submit=async()=>React.act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  for(const lang of ['en','fr'])await t.test(lang+' form semantics and every inherited validation rule',async()=>{
   await i18n.changeLanguage(lang);await render();assert.equal(document.querySelector('h1').textContent,i18n.t('registerPage.heading'));
   assert.equal(document.querySelectorAll('input').length,4);assert.ok([...document.querySelectorAll('input')].every(el=>el.labels.length===1&&el.required));assert.equal(document.querySelector('[name="password"]').autocomplete,'new-password');assert.equal(document.querySelector('[name="passwordConfirm"]').autocomplete,'new-password');assert.ok(document.querySelector('a[href="/login"]'));
   assert.equal(document.querySelectorAll('img').length,3);assert.ok([...document.querySelectorAll('img')].every(img=>img.alt===''&&img.closest('[aria-hidden="true"]')));assert.ok(document.querySelector('.auth-submit').disabled);await submit();assert.equal(requests.length,0);
   await input('email','traveler@example.com');await input('displayName','Traveler');
   for(const pwd of ['Aa1!','lowercase1!','UPPERCASE1!','NoDigitHere!','NoSpecial123']){await input('password',pwd);await input('passwordConfirm',pwd);assert.ok(document.querySelector('.auth-submit').disabled);await submit();assert.equal(requests.length,0)}
   await input('password','ValidPass1!');await input('passwordConfirm','Different1!');assert.ok(document.querySelector('.auth-submit').disabled);assert.ok(document.querySelector('#register-confirm-help'));await input('passwordConfirm','ValidPass1!');
   for(const name of ['A','A'.repeat(31),'Name!', 'Two  Spaces']){await input('displayName',name);assert.ok(document.querySelector('.auth-submit').disabled)}await input('displayName','Traveler');await input('email','invalid');assert.ok(document.querySelector('.auth-submit').disabled);await input('email','traveler@example.com');assert.ok(!document.querySelector('.auth-submit').disabled);
   const toggle=document.querySelector('.auth-password-field button');assert.equal(toggle.getAttribute('aria-label'),i18n.t('registerPage.showPassword'));await React.act(async()=>toggle.click());assert.equal(document.querySelector('[name="password"]').type,'text');assert.equal(toggle.getAttribute('aria-pressed'),'true');await React.act(async()=>toggle.click());assert.equal(document.querySelector('[name="password"]').type,'password');
   await React.act(async()=>root.unmount());root=null;
  });
  await t.test('pending lock, duplicate email/status/network errors, confirmed success and Go now',async()=>{
   await i18n.changeLanguage('en');await render();for(const [name,value]of Object.entries({email:'traveler@example.com',password:'ValidPass1!',passwordConfirm:'ValidPass1!',displayName:'Traveler'}))await input(name,value);
   await submit();await submit();assert.equal(requests.length,1);assert.equal(requests[0].config.url,'/auth/register');assert.equal(requests[0].config.method,'post');assert.deepEqual(JSON.parse(requests[0].config.data),{email:'traveler@example.com',password:'ValidPass1!',displayName:'Traveler'});assert.ok(document.querySelector('fieldset').disabled);assert.equal(document.querySelector('form').getAttribute('aria-busy'),'true');assert.equal(document.querySelector('[role="status"]'),null);
   await React.act(async()=>requests[0].reject({response:{status:409,data:{}}}));assert.equal(document.querySelector('[role="alert"]').textContent,i18n.t('registerPage.errorEmailExist'));assert.ok(!document.querySelector('fieldset').disabled);
   await submit();await React.act(async()=>requests[1].reject({response:{status:400,data:{message:'Backend validation fixture'}}}));assert.equal(document.querySelector('[role="alert"]').textContent,'Backend validation fixture');
   await submit();await React.act(async()=>requests[2].reject(new Error('network')));assert.equal(document.querySelector('[role="alert"]').textContent,i18n.t('registerPage.networkError'));
   await submit();await React.act(async()=>requests[3].resolve({data:{},status:200,headers:{},config:requests[3].config}));assert.ok(document.querySelector('[role="status"]').textContent.includes(i18n.t('registerPage.accountCreatedMessage')));assert.equal(document.querySelector('form'),null);assert.equal(localStorage.getItem('authToken'),null,'registration never fabricates a logged-in session');
   await React.act(async()=>document.querySelector('.auth-register-success button').click());assert.equal(document.querySelector('#route').textContent,'/login');
  });
 }finally{if(root)await React.act(async()=>root.unmount());if(api)api.defaults.adapter=adapter;await i18n.changeLanguage('en');await vite.close();dom.window.close();for(const k of keys){if(previous[k]===undefined)delete globalThis[k];else globalThis[k]=previous[k]}}
});
