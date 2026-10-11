import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter, useNavigate} from "react-router-dom";
import {JSDOM} from "jsdom";
import {createServer} from "vite";

test("shared route scroll resets new pages, preserving POP, queries and explicit anchors", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const dom = new JSDOM('<div id="root"></div>');
    const keys = ["window", "document", "IS_REACT_ACT_ENVIRONMENT"];
    const saved = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
    const scrolls = []; let navigate, root;
    window.scrollTo = options => scrolls.push(options);
    try {
        const {createRoot} = await import("react-dom/client");
        const {default: useRouteScroll} = await vite.ssrLoadModule("/src/hooks/useRouteScroll.js");
        function Capture() {useRouteScroll(); navigate = useNavigate(); return null;}
        root = createRoot(document.getElementById("root"));
        await React.act(async () => root.render(React.createElement(MemoryRouter, {initialEntries: ["/long-page"]}, React.createElement(Capture))));
        assert.equal(scrolls.length, 0, "initial entry leaves browser restoration intact");
        for (const route of ["/contact", "/live-weather", "/community-itineraries/region"]) {
            await React.act(async () => navigate(route));
            assert.deepEqual(scrolls.pop(), {top: 0, left: 0, behavior: "instant"});
        }
        await React.act(async () => navigate("/community-itineraries/region?tab=other"));
        await React.act(async () => navigate("/community-itineraries/region#section"));
        await React.act(async () => navigate("/other#destination"));
        assert.equal(scrolls.length, 0, "queries and same/cross-page explicit anchors are not reset");
        await React.act(async () => navigate(-1));
        await React.act(async () => navigate(1));
        assert.equal(scrolls.length, 0, "Back/Forward does not override native restoration");
        await React.act(async () => navigate("/replacement", {replace: true}));
        assert.deepEqual(scrolls.pop(), {top: 0, left: 0, behavior: "instant"});
    } finally {
        if (root) await React.act(async () => root.unmount());
        await vite.close(); dom.window.close();
        for (const key of keys) {if (saved[key] === undefined) delete globalThis[key]; else globalThis[key] = saved[key];}
    }
});
