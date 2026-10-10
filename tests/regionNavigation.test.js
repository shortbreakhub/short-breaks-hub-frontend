import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

test("Region navigation preserves six identities, real cards, retry and stale response handling", async () => {
 const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/europe',pretendToBeVisual:true});
 const keys=['window','document','localStorage','IS_REACT_ACT_ENVIRONMENT'],previous=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});window.scrollTo=()=>{};
 let root,api,adapter,navigate;try{
  const {createRoot}=await import('react-dom/client');const {default:Region}=await vite.ssrLoadModule('/src/pages/RegionPage.jsx');await vite.ssrLoadModule('/src/i18n.js');api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
  let outcome='ready';const pending=[];
  const item={slug:'rome',title:'Rome',country:'Italy',days:4,summary:'Explore Rome',hero:'/rome.jpg',priceFrom:260};
  api.defaults.adapter=async config=>{
   if(config.url.includes('/slug/'))return {data:item,status:200,headers:{},config};
   const data=config.url.includes('/region/')?['Italy']:[item];
   if(outcome==='pending')return new Promise(resolve=>pending.push(()=>resolve({data,status:200,headers:{},config})));
   if(outcome==='error')throw new Error('offline');
   return {data,status:200,headers:{},config};
  };
  function Capture(){navigate=useNavigate();return null;}
  root=createRoot(document.getElementById('root'));
  await React.act(async()=>root.render(React.createElement(HelmetProvider,null,React.createElement(MemoryRouter,{initialEntries:['/europe']},React.createElement(Capture),React.createElement(Routes,null,React.createElement(Route,{path:'/:region',element:React.createElement(Region)}))))));
  for(const lang of ['en','fr']){
   await React.act(async()=>i18n.changeLanguage(lang));
   for(const [region,key]of [['southeast-asia','southeastAsia'],['east-asia','eastAsia'],['europe','europe'],['americas','americas'],['Oceania','oceania'],['africa','africa']]){
    await React.act(async()=>navigate('/'+region));
    assert.equal(document.querySelector('#region-title').textContent,i18n.t('RegionPage.'+key));assert.ok(document.querySelector('#region-title').classList.contains('sr-only'));
    assert.equal(document.querySelector('.bg-cover'),null);assert.ok(document.querySelector('a[href="/itinerary/rome"]'));assert.ok(document.querySelector('a[href="/browse/italy"]'));
   }
  }
  outcome='error';await React.act(async()=>navigate('/europe'));assert.ok(document.querySelector('[role="alert"]'));assert.equal(document.querySelector('a[href="/itinerary/rome"]'),null);
  outcome='ready';await React.act(async()=>document.querySelector('[role="alert"] button').click());assert.ok(document.querySelector('a[href="/itinerary/rome"]'));assert.equal(document.querySelector('[role="alert"]'),null);
  outcome='pending';await React.act(async()=>navigate('/east-asia'));assert.ok(document.querySelector('[role="status"]'));assert.equal(document.querySelector('a[href="/itinerary/rome"]'),null);
  outcome='error';await React.act(async()=>navigate('/africa'));await React.act(async()=>pending.forEach(resolve=>resolve()));assert.ok(document.querySelector('[role="alert"]'),'stale success cannot replace newer error');assert.equal(document.querySelector('a[href="/itinerary/rome"]'),null);
 }finally{if(root)await React.act(async()=>root.unmount());if(api)api.defaults.adapter=adapter;await i18n.changeLanguage('en');await vite.close();dom.window.close();for(const k of keys){if(previous[k]===undefined)delete globalThis[k];else globalThis[k]=previous[k]}}
});
