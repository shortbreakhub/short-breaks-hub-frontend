import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter, Routes, Route, useNavigate} from "react-router-dom";
import {JSDOM} from "jsdom";
import {createServer} from "vite";

test("Home entry and Home buttons reset document scroll without changing other routes or hash links", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const dom = new JSDOM('<div id="root"></div>', {url: "http://localhost:5173/contact"});
    const keys = ["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"];
    const saved = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
    const frames = new Map(), scrolls = []; let nextFrame = 0, navigate, root;
    window.requestAnimationFrame = callback => {frames.set(++nextFrame, callback); return nextFrame;};
    window.cancelAnimationFrame = id => frames.delete(id);
    window.scrollTo = options => scrolls.push(options);
    const flush = () => {for (const [id, callback] of [...frames]) {frames.delete(id); callback();}};
    try {
        const {createRoot} = await import("react-dom/client");
        const {default: useHomeScroll} = await vite.ssrLoadModule("/src/hooks/useHomeScroll.js");
        const {default: Navbar} = await vite.ssrLoadModule("/src/components/Navbar.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        function Home() {useHomeScroll(); return React.createElement("section", {id: "home"}, "Home hero");}
        function Capture() {navigate = useNavigate(); return null;}
        root = createRoot(document.getElementById("root"));
        await React.act(async () => root.render(React.createElement(MemoryRouter, {initialEntries: ["/contact"]},
            React.createElement(Navbar), React.createElement(Capture), React.createElement(Routes, null,
                React.createElement(Route, {path: "/", element: React.createElement(Home)}),
                React.createElement(Route, {path: "/contact", element: React.createElement("p", null, "Contact")})))));
        flush(); assert.equal(scrolls.length, 0);
        const homeButton = () => [...document.querySelectorAll("button")].find(button => button.textContent === "Home");
        await React.act(async () => homeButton().click()); flush();
        assert.ok(scrolls.length >= 1); assert.ok(scrolls.every(value => value.top === 0 && value.left === 0 && value.behavior === "instant"));
        scrolls.length = 0; await React.act(async () => homeButton().click());
        assert.equal(scrolls.length, 1, "Home also resets when already on Home");
        scrolls.length = 0; await React.act(async () => navigate("/contact")); flush(); assert.equal(scrolls.length, 0);
        await React.act(async () => navigate("/#explore")); flush(); assert.equal(scrolls.length, 0, "explicit section links remain intact");
        await React.act(async () => navigate("/"));
        assert.equal(frames.size, 1);
        await React.act(async () => navigate("/contact")); flush(); assert.equal(scrolls.length, 0, "unmounted Home cancels its pending scroll");
        await React.act(async () => navigate("/")); flush(); assert.equal(scrolls.length, 1, "fresh Home route entry resets scroll after mount");
    } finally {
        if (root) await React.act(async () => root.unmount()); await vite.close(); dom.window.close();
        for (const key of keys) {if (saved[key] === undefined) delete globalThis[key]; else globalThis[key] = saved[key];}
    }
});
