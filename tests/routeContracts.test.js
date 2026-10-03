import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToString} from "react-dom/server";
import {MemoryRouter} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import {REGIONS} from "../src/config/regions.js";

// Isolate routing from page fetching/layout; exercise the real App route table.
// Real public page rendering is covered by prerenderOutput/itineraryBootstrap.
test("App retains public, community, legal, account and utility route contracts", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}},
        plugins: [{name: "route-page-probes", enforce: "pre",
            load(id) {
                if (/\/src\/pages\/[^/]+\.jsx$/.test(id) || id.endsWith("/src/components/GoogleMap.jsx")) {
                    const name = id.split("/").at(-1).replace(".jsx", "");
                    return `import React from "react"; import {useParams} from "react-router-dom";
                        export default function Page(){return React.createElement("main", {"data-route-page": ${JSON.stringify(name)}}, JSON.stringify(useParams()));}`;
                }
            },
        }],
    });
    try {
        const {default: App} = await vite.ssrLoadModule("/src/App.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        assert.deepEqual(REGIONS.map(({onClick}) => onClick),
            ["southeast-asia", "east-asia", "europe", "americas", "Oceania", "africa"],
            "region inventory and route casing used by navigation/prerendering must remain stable");
        const cases = [
            ["/", "HomePage", {}],
            ...REGIONS.map(({onClick}) => [`/${onClick}`, "RegionPage", {region: onClick}]),
            ["/unknown-region", "RegionPage", {region: "unknown-region"}],
            ["/browse/united-kingdom", "BrowsePage", {country: "united-kingdom"}],
            ["/browse/France?q=Paris", "BrowsePage", {country: "France"}],
            ["/itinerary/4-days-shanghai-where-the-future-never-waits", "ItineraryPage", {slug: "4-days-shanghai-where-the-future-never-waits"}],
            ["/user-itinerary/community-shanghai", "CommunityItineraryPage", {slug: "community-shanghai"}],
            ["/community-itineraries/region", "CommunityTripsPage", {}],
            ["/community-itineraries/region/EUROPE", "CommunityRegionPage", {region: "EUROPE"}],
            ["/terms", "TermsOfService", {}], ["/privacy", "PrivacyPolicy", {}],
            ["/contact", "ContactPage", {}], ["/login", "LoginPage", {}],
            ["/register", "RegisterPage", {}], ["/profile", "ProfilePage", {}],
            ["/create-itinerary?draftId=123", "CreateItineraryPage", {}],
            ["/verify-email?token=fixture", "VerifyEmailPage", {}],
            ["/api/auth/verify-email?token=fixture", "VerifyEmailPage", {}],
            ["/forgot-password", "ForgotPasswordPage", {}], ["/reset-password?token=fixture", "ResetPasswordPage", {}],
            ["/live-weather", "WeatherPage", {}], ["/map", "GoogleMap", {}],
            ["/missing/nested/path", "NotFound", {"*": "missing/nested/path"}],
        ];
        for (const [url, page, params] of cases) await t.test(url, () => {
            const html = renderToString(React.createElement(MemoryRouter, {initialEntries: [url]}, React.createElement(App)));
            const dom = new JSDOM(html);
            try {
                const main = dom.window.document.querySelector("main[data-route-page]");
                assert.equal(main?.getAttribute("data-route-page"), page);
                assert.deepEqual(JSON.parse(main.textContent), params);
                const robots = dom.window.document.querySelector('meta[name="robots"]').content;
                const account = ["LoginPage", "RegisterPage", "ProfilePage", "CreateItineraryPage", "VerifyEmailPage", "ForgotPasswordPage", "ResetPasswordPage", "NotFound"].includes(page);
                assert.ok(robots.startsWith(account ? "noindex,follow" : "index,follow"));
            } finally {dom.window.close();}
        });
    } finally {await vite.close();}
});
