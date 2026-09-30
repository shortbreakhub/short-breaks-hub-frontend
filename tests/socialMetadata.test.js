import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToString} from "react-dom/server";
import {createServer} from "vite";

// Exercise the real JSX component without introducing a separate test transpiler.
test("shared social metadata uses supplied text and only existing canonical coverage", async () => {
    const vite = await createServer({
        appType: "custom",
        logLevel: "error",
        server: {middlewareMode: true, hmr: false},
        optimizeDeps: {noDiscovery: true, include: []},
    });
    try {
        const {default: PageMetadata} = await vite.ssrLoadModule("/src/components/PageMetadata.jsx");
        const render = props => renderToString(React.createElement(PageMetadata, props));
        const html = render({title: "Trip & city", description: "Days & highlights", canonicalSegments: ["itinerary", "city break"]});
        assert.match(html, /property="og:url" content="https:\/\/www\.shortbreakhub\.com\/itinerary\/city%20break"/);
        for (const key of ["og:title", "twitter:title"]) {
            assert.ok(html.includes(`${key}" content="Trip &amp; city"`));
            assert.equal((html.match(new RegExp(`(?:property|name)="${key}"`, "g")) || []).length, 1);
        }
        for (const key of ["og:description", "twitter:description"]) {
            assert.ok(html.includes(`${key}" content="Days &amp; highlights"`));
        }
        assert.doesNotMatch(html, /rel="canonical"/, "social metadata must not create a canonical link");
        const community = render({title: "Community trip", description: "Community description"});
        assert.doesNotMatch(community, /og:url|rel="canonical"/, "do not expand community canonical coverage");
        assert.match(community, /name="twitter:title" content="Community trip"/);
        assert.match(community, /property="og:image" content="https:\/\/www\.shortbreakhub\.com\/og-cover\.png"/);
    } finally {
        await vite.close();
    }
});
