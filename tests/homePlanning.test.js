import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, readdirSync, existsSync} from "node:fs";
import React from "react";
import {renderToString} from "react-dom/server";
import {hydrateRoot} from "react-dom/client";
import {MemoryRouter} from "react-router-dom";
import {JSDOM} from "jsdom";
import {createServer} from "vite";
import i18n from "i18next";
import {getHomePlanningDestinations, selectHomePlanningDestination, getPagePlanningDestination, HOME_PLANNING_DATA_ID} from "../src/utils/homePlanning.js";

const pages = readdirSync("dist/itinerary").map(slug => {
 const html=readFileSync(`dist/itinerary/${slug}/index.html`,"utf8");
 return JSON.parse(html.match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
});
const destinations=getHomePlanningDestinations(pages);

test("CTA inventory comes only from 198 existing unique published destinations and canonical routes",()=>{
 assert.equal(destinations.length,198);
 const html=readFileSync("dist/index.html","utf8");
 const bootstrap=JSON.parse(html.match(new RegExp(`<script id="${HOME_PLANNING_DATA_ID}" type="application/json">([\\s\\S]*?)</script>`))[1]);
 assert.equal(bootstrap.length,198);
 assert.deepEqual(new Set(bootstrap.map(item=>item.slug)),new Set(destinations.map(item=>item.slug)));

 assert.equal(new Set(destinations.map(item=>item.slug)).size,198);
 for(const item of destinations) {
  assert.ok(pages.some(page=>page.detail.slug===item.slug && page.detail.city===item.city));
  assert.ok(existsSync(`dist/itinerary/${item.slug}/index.html`));
 }
 assert.deepEqual(getHomePlanningDestinations([{detail:{slug:"invalid/route",city:"Unknown",country:"Unknown"}},pages[0],pages[0]]),[destinations[0]]);
 assert.equal(selectHomePlanningDestination([{city:"Unknown",slug:"https://evil.test"}]),null);
 assert.equal(selectHomePlanningDestination(destinations,()=>0),destinations[0]);
 assert.equal(selectHomePlanningDestination(destinations,()=>0.99999),destinations.at(-1));
});

test("selection varies between page loads, remains stable within the document and needs no request",context=>{
 const makeDocument=()=>new JSDOM(`<script id="${HOME_PLANNING_DATA_ID}" type="application/json">${JSON.stringify(destinations)}</script>`);
 const first=makeDocument(),second=makeDocument();
 context.mock.method(Math,"random",()=>0);
 assert.deepEqual(getPagePlanningDestination(first.window.document,destinations[0]),destinations[0]);
 Math.random=()=>0.99999;
 assert.deepEqual(getPagePlanningDestination(first.window.document,destinations[0]),destinations[0]);
 assert.deepEqual(getPagePlanningDestination(second.window.document,destinations[0]),destinations.at(-1));
 first.window.close();second.window.close();
});

test("localized CTA hydrates without mismatches or incorrect-city flash and stays stable on rerenders",async context=>{
 const vite=await createServer({appType:"custom",logLevel:"error",server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:["node","module-sync"]}}});
 const globals=Object.fromEntries(["window","document","IS_REACT_ACT_ENVIRONMENT"].map(key=>[key,globalThis[key]]));
 let dom,root;
 const errors=[];
 try {
  await vite.ssrLoadModule("/src/i18n.js");
  const {default: CTA}=await vite.ssrLoadModule("/src/components/home/HomePlanningCTA.jsx");
  const fallback=destinations[0];
  context.mock.method(Math,"random",()=>0.99999);
  for(const language of ["en","fr"]) {
   await i18n.changeLanguage(language);
   const tree=()=>React.createElement(MemoryRouter,null,React.createElement(CTA,{fallback}));
   const html=renderToString(tree());
   assert.ok(html.includes('visibility:hidden'),"no incorrect-city CTA is painted before initialization");
   dom=new JSDOM(`<div id="root">${html}</div><script id="${HOME_PLANNING_DATA_ID}" type="application/json">${JSON.stringify(destinations)}</script>`,{url:"https://www.shortbreakhub.com/"});
   Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
   await React.act(async()=>{root=hydrateRoot(document.getElementById("root"),tree(),{onRecoverableError:error=>errors.push(error)});});
   const anchor=document.querySelector("a");
   assert.equal(anchor.style.visibility,"");
   assert.equal(anchor.getAttribute("href"),`/itinerary/${destinations.at(-1).slug}`);
   assert.equal(anchor.textContent,i18n.t("homeMagazine.planning.action",{destination:destinations.at(-1).city})+" →");
   assert.equal(anchor.className,"sbh-action sbh-action--primary");
   const text=anchor.textContent;
   Math.random=()=>0;
   await React.act(async()=>root.render(tree()));
   assert.equal(anchor.textContent,text);
   await React.act(async()=>root.unmount());root=null;dom.window.close();dom=null;
   Math.random=()=>0.99999;
  }
  assert.deepEqual(errors,[]);
 } finally {
  if(root) await React.act(async()=>root.unmount());
  dom?.window.close();await vite.close();await i18n.changeLanguage("en");
  for(const [key,value] of Object.entries(globals)) {if(value===undefined) delete globalThis[key];else globalThis[key]=value;}
 }
});

test("Vite development HTML supplies the same published CTA inventory as production",async()=>{
 const vite=await createServer({appType:"custom",logLevel:"error",server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 try {
  const source=readFileSync("index.html","utf8");
  assert.ok(!source.includes(HOME_PLANNING_DATA_ID));
  const html=await vite.transformIndexHtml("/",source);
  const doc=new JSDOM(html).window.document;
  const inventory=JSON.parse(doc.getElementById(HOME_PLANNING_DATA_ID).textContent);
  assert.equal(inventory.length,198);
  assert.deepEqual(new Set(inventory.map(item=>item.slug)),new Set(destinations.map(item=>item.slug)));
  assert.equal(doc.querySelectorAll(`#${HOME_PLANNING_DATA_ID}`).length,1);
  doc.defaultView.close();
 } finally {await vite.close();}
});
