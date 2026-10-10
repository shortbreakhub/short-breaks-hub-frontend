import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {JSDOM} from "jsdom";
import {createServer} from "vite";

test("Itinerary scroll owns loading, ready, history and hash entries without leaking anchoring changes", async () => {
    const vite = await createServer({appType:"custom",logLevel:"error",server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:["node","module-sync"]}}});
    const dom = new JSDOM('<div id="root"></div>');
    const keys = ["window","document","IS_REACT_ACT_ENVIRONMENT"];
    const saved = Object.fromEntries(keys.map(key => [key,globalThis[key]]));
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
    const frames = new Map(), scrolls = []; let frameId = 0, root, navigate, setReady, anchors = 0;
    window.requestAnimationFrame = callback => {frames.set(++frameId,callback); return frameId;};
    window.cancelAnimationFrame = id => frames.delete(id);
    window.scrollTo = value => scrolls.push(value);
    dom.window.HTMLElement.prototype.scrollIntoView = () => anchors++;
    const flush = () => {for(const [id,cb] of [...frames]) {frames.delete(id); cb();}};
    try {
        const {createRoot} = await import("react-dom/client");
        const {default: useItineraryScroll} = await vite.ssrLoadModule("/src/hooks/useItineraryScroll.js");
        function Page() {const [ready,update] = React.useState(false); setReady=update; useItineraryScroll(ready);return ready?React.createElement('h1',{id:'overview'},'Story'):null;}
        function Capture(){navigate=useNavigate();return null;}
        root=createRoot(document.getElementById('root'));
        await React.act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/']},React.createElement(Capture),React.createElement(Routes,null,
            React.createElement(Route,{path:'/',element:React.createElement('p',null,'Home')}),React.createElement(Route,{path:'/itinerary/:slug',element:React.createElement(Page)})))));
        assert.equal(scrolls.length,0);
        await React.act(async()=>navigate('/itinerary/paris'));
        assert.equal(scrolls.at(-1).top,0); assert.equal(document.documentElement.style.overflowAnchor,'none');
        await React.act(async()=>setReady(true)); flush();
        assert.equal(scrolls.at(-1).top,0);assert.equal(document.documentElement.style.overflowAnchor,'');
        await React.act(async()=>navigate(-1));flush();assert.equal(document.documentElement.style.overflowAnchor,'');
        scrolls.length=0;await React.act(async()=>navigate(1));assert.equal(scrolls.at(-1).top,0);
        await React.act(async()=>setReady(true));flush();assert.equal(scrolls.at(-1).top,0);
        scrolls.length=0;await React.act(async()=>navigate('/itinerary/paris#overview'));flush();
        assert.equal(scrolls.length,0);assert.equal(anchors,1);
        await React.act(async()=>navigate('/'));flush();assert.equal(document.documentElement.style.overflowAnchor,'');
    } finally {
        if(root)await React.act(async()=>root.unmount());await vite.close();dom.window.close();
        for(const key of keys){if(saved[key]===undefined)delete globalThis[key];else globalThis[key]=saved[key];}
    }
});
