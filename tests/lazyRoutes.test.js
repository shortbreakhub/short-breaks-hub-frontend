import assert from "node:assert/strict";
import test from "node:test";
import React, {Suspense} from "react";
import {renderToString} from "react-dom/server";
import {createRoot} from "react-dom/client";
import {createServer} from "vite";
import {JSDOM} from "jsdom";

test("lazy routes preload only their boundary, render synchronously for hydration, and recover from failure", async () => {
    const requested = new Set();
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}},
        plugins: [{name: "lazy-route-probes", enforce: "pre", load(id) {
            if (/\/src\/pages\/[^/]+\.jsx$/.test(id) || id.endsWith("/src/components/GoogleMap.jsx")) {
                const name = id.split("/").at(-1).replace(".jsx", "");
                requested.add(name);
                if (name === "WeatherPage") return 'throw new Error("chunk request failed");';
                return `import React from "react"; export default function Page(){return React.createElement("main", null, ${JSON.stringify(name)});}`;
            }
        }}],
    });
    const saved = Object.fromEntries(["window", "document", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    const originalError = console.error;
    let root, dom;
    try {
        const {lazyPages, preloadRoute, RouteLoadBoundary} = await vite.ssrLoadModule("/src/routePages.jsx");
        assert.equal(requested.size, 0);
        await preloadRoute("/");
        assert.equal(requested.size, 0, "homepage must not load secondary pages");
        await preloadRoute("/europe");
        assert.deepEqual([...requested], ["RegionPage"], "region must not load browse/Lottie pages");
        const html = renderToString(React.createElement(Suspense, {fallback: "loading"}, React.createElement(lazyPages.RegionPage)));
        assert.ok(html.includes("RegionPage")); assert.ok(!html.includes("loading"));
        await preloadRoute("/browse/china");
        assert.ok(requested.has("BrowsePage"));
        await preloadRoute("/itinerary/shanghai");
        assert.ok(requested.has("ItineraryPage"));
        await preloadRoute("/login");
        for (const page of ["LoginPage", "RegisterPage", "VerifyEmailPage", "ForgotPasswordPage", "ResetPasswordPage"])
            assert.ok(requested.has(page), "account screens share a sensible group");
        assert.ok(!requested.has("CommunityTripsPage"));
        await preloadRoute("/community-itineraries/region");
        assert.ok(requested.has("CommunityTripsPage"));
        await assert.rejects(preloadRoute("/live-weather"), /chunk request failed/);
        dom = new JSDOM('<div id="mount"></div>', {pretendToBeVisual: true});
        Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
        console.error = () => {}; // Expected error boundary diagnostic, not an unhandled error.
        root = createRoot(document.getElementById("mount"));
        const render = (pathname, Page) => React.createElement(RouteLoadBoundary,
            {pathname, fallback: React.createElement("p", {role: "alert"}, "Reload")},
            React.createElement(Suspense, {fallback: "loading"}, React.createElement(Page)));
        await React.act(async () => {
            root.render(render("/live-weather", lazyPages.WeatherPage));
            await new Promise(resolve => setTimeout(resolve, 10));
        });
        assert.equal(document.querySelector('[role="alert"]').textContent, "Reload");
        await React.act(async () => root.render(render("/europe", lazyPages.RegionPage)));
        assert.equal(document.querySelector("main").textContent, "RegionPage");
        assert.ok(!document.querySelector('[role="alert"]'));
    } finally {
        if (root) await React.act(async () => root.unmount());
        console.error = originalError;
        Object.assign(globalThis, saved);
        dom?.window.close(); await vite.close();
    }
});
