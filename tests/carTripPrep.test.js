import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {JSDOM} from "jsdom";
import {createServer} from "vite";
import i18n from "i18next";

test("car drawer is airport-only, preserves edits, resets, isolates routes and disables missing mappings in EN/FR",{timeout:30000},async context=>{
 const vite=await createServer({appType:"custom",logLevel:"error",server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
 const dom=new JSDOM('<div id="root"></div>',{url:"https://www.shortbreakhub.com"});
 const globals=Object.fromEntries(["window","document","IS_REACT_ACT_ENVIRONMENT"].map(key=>[key,globalThis[key]]));let root;
 try {
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const {createRoot}=await import("react-dom/client");
  const {default:Rail}=await vite.ssrLoadModule("/src/components/TripPrepRail.jsx");await vite.ssrLoadModule("/src/i18n.js");
  // Freeze only application date calculations, not Vite startup/teardown clocks.
  context.mock.timers.enable({apis:["Date"],now:new Date(2026,9,12,12).getTime()});
  for(const language of ["en","fr"]){
   await i18n.changeLanguage(language);root=createRoot(document.getElementById("root"));
   const submissions=[];
   const render=(slug,key,days=4)=>React.createElement(Rail,{itinerarySlug:slug,city:"City",country:"Country",days,hotelDestination:{destinationKey:key},items:[{id:"car",title:"Car",ctaLabel:"Open Car",onSearch:values=>submissions.push(values)}],onMarkDone(){},onReset(){},onMarkAllDone(){}});
   const click=async text=>React.act(async()=>[...document.querySelectorAll("button")].find(b=>b.textContent===text).click());
   const dialog=()=>document.querySelector('[role="dialog"]');
   const setReturn=async value=>React.act(async()=>{const input=dialog().querySelectorAll("input")[1];Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,"value").set.call(input,value);input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
   await React.act(async()=>root.render(render("shanghai","china--shanghai")));await click("Open Car");
   assert.equal(dialog().querySelectorAll('input[type="datetime-local"]').length,2);assert.equal(dialog().querySelectorAll("input").length,2);assert.equal(dialog().querySelector("select"),null);
   assert.ok(dialog().textContent.includes("PVG"));
   await setReturn("2026-11-12T10:00");await click(i18n.t("tripPrepRail.mainFrame.search"));assert.equal(submissions.length,0);assert.equal(dialog().querySelector('[role="alert"]').textContent,i18n.t("tripPrepRail.car.returnAfterPickup"));
   await setReturn("2026-11-13T11:30");await click(i18n.t("tripPrepRail.drawer.close"));await click("Open Car");assert.equal(dialog().querySelectorAll("input")[1].value,"2026-11-13T11:30");
   await click(i18n.t("tripPrepRail.mainFrame.search"));assert.deepEqual(submissions[0],{pickupTime:"2026-11-12T10:00",returnTime:"2026-11-13T11:30"});
   await click("Open Car");await click(i18n.t("tripPrepRail.mainFrame.resetFilters"));assert.equal(dialog().querySelectorAll("input")[1].value,"2026-11-16T10:00");
   await React.act(async()=>root.render(render("tokyo","japan--tokyo",7)));assert.equal(dialog(),null);await click("Open Car");assert.ok(dialog().textContent.includes("HND"));assert.deepEqual([...dialog().querySelectorAll("input")].map(input=>input.value),["2026-11-12T10:00","2026-11-19T10:00"]);
   await React.act(async()=>root.render(render("paris","france--paris",2)));await click("Open Car");assert.deepEqual([...dialog().querySelectorAll("input")].map(input=>input.value),["2026-11-12T10:00","2026-11-14T10:00"]);
   await React.act(async()=>root.render(render("bagan","myanmar--bagan")));await click("Open Car");assert.ok(dialog().textContent.includes(i18n.t("tripPrepRail.car.unavailable")));assert.equal([...dialog().querySelectorAll("button")].find(b=>b.textContent===i18n.t("tripPrepRail.mainFrame.search")).disabled,true);
   await React.act(async()=>root.unmount());root=null;
  }
 }finally{context.mock.timers.reset();if(root)await React.act(async()=>root.unmount());await i18n.changeLanguage("en");await vite.close();dom.window.close();for(const [key,value] of Object.entries(globals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
