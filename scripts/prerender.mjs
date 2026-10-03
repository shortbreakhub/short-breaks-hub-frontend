import {mkdir, readFile, readdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createServer, loadEnv} from "vite";
import {buildCountryPages} from "../src/utils/countries.js";
import {getOfficialInventory, fetchOfficialPages} from "../src/utils/officialItineraries.js";
import {REGIONS} from "../src/config/regions.js";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = resolve(projectRoot, "dist");
const env = loadEnv("production", projectRoot, "VITE_");

if (!env.VITE_API_BASE) {
    throw new Error("Pre-rendering requires VITE_API_BASE to fetch current Region content.");
}

const vite = await createServer({
    root: projectRoot,
    mode: "production",
    appType: "custom",
    logLevel: "error",
    optimizeDeps: {noDiscovery: true, include: []},
    ssr: {resolve: {externalConditions: ["node", "module-sync"]}},
    server: {middlewareMode: true},
});

function validateRegionData(region, countries, itineraries) {
    if (!Array.isArray(countries) || countries.length === 0) {
        throw new Error(`Region ${region} pre-render failed: /itineraries/region/${region} returned no countries.`);
    }

    if (!Array.isArray(itineraries) || itineraries.length === 0) {
        throw new Error(`Region ${region} pre-render failed: /itineraries/${region} returned no itineraries.`);
    }

    if (!countries.every((country) => typeof country === "string" && country.trim())) {
        throw new Error(`Region ${region} pre-render failed: the region API returned an invalid country list.`);
    }

    const validItineraries = itineraries.filter((itinerary) =>
        itinerary
        && typeof itinerary.slug === "string"
        && itinerary.slug.trim()
        && typeof itinerary.title === "string"
        && itinerary.title.trim()
        && typeof itinerary.country === "string"
    );
    const countriesWithoutItineraries = countries.filter((country) =>
        !validItineraries.some((itinerary) => itinerary.country.toLowerCase() === country.toLowerCase())
    );

    if (countriesWithoutItineraries.length > 0) {
        throw new Error(`Region ${region} pre-render failed: no usable itinerary links were returned for ${countriesWithoutItineraries.join(", ")}.`);
    }

    return validItineraries.map(({slug, title, country}) => ({slug, title, country}));
}

function escapeJsonForHtml(value) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

function applyAssetManifest(markup, manifest) {
    let output = markup;
    for (const [source, entry] of Object.entries(manifest)) {
        if (!source.startsWith("src/assets/") || !entry.file) continue;
        const sourceUrls = new Set([`/${source}`, `/${encodeURI(source)}`]);
        for (const sourceUrl of sourceUrls) {
            output = output.split(sourceUrl).join(`/${entry.file}`);
        }
    }
    return output;
}

// Route components exclusively own standard and social metadata.
function cleanStaticRouteHead(html) {
    return html
        .replace(/\s*<meta\b(?=[^>]*\b(?:property|name)=["'](?:og:|twitter:))[^>]*>/gi, "")
        .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
        .replace(/\s*<meta\s+name=["']description["'][^>]*\/?\s*>/gi, "")
        .replace(/\s*<meta\s+name=["']robots["'][^>]*\/?\s*>/gi, "")
        .replace(/\s*<link\s+rel=["']canonical["'][^>]*\/?\s*>/gi, "");
}

function splitRenderedMarkup(markup, manifest) {
    const renderedRootStart = "<div id=\"shortbreakhub-prerender-root\">";
    const rootStart = markup.indexOf(renderedRootStart);
    const rootEnd = markup.lastIndexOf("</div>");
    if (rootStart === -1 || rootEnd < rootStart + renderedRootStart.length) {
        throw new Error("Pre-render failed: React output did not contain the expected rendered root.");
    }

    return {
        headMarkup: applyAssetManifest(markup.slice(0, rootStart), manifest),
        pageMarkup: applyAssetManifest(markup.slice(rootStart + renderedRootStart.length, rootEnd), manifest),
    };
}

function makeRouteHtml(template, renderedMarkup, manifest, initialData) {
    const {headMarkup, pageMarkup} = splitRenderedMarkup(renderedMarkup, manifest);
    const cleanHead = cleanStaticRouteHead(template);
    const htmlWithHead = cleanHead.replace("</head>", `    ${headMarkup}\n  </head>`);
    const rootMarkup = `<div id="root" data-prerendered="true">${pageMarkup}</div>`;
    const withRoot = htmlWithHead.replace('<div id="root"></div>', rootMarkup);

    if (!withRoot.includes(rootMarkup)) {
        throw new Error("Pre-render failed: unable to locate the Vite application root in dist/index.html.");
    }

    if (!initialData) return withRoot;

    const dataScript = `<script id="shortbreakhub-prerender-data" type="application/json">${escapeJsonForHtml(initialData)}</script>`;
    return withRoot.replace("</body>", `  ${dataScript}\n  </body>`);
}

try {
    const {renderRoute} = await vite.ssrLoadModule("/src/prerenderEntry.jsx");
    const api = await vite.ssrLoadModule("/src/api.js");

    const regionData = await Promise.all(REGIONS.map(async ({onClick: region}) => {
        const [countries, regionItineraries] = await Promise.all([
            api.getCountriesByRegion(region),
            api.getItinerariesByRegion(region),
        ]);
        const itineraries = validateRegionData(region, countries, regionItineraries);
        return {
            countries, itineraries: regionItineraries,
            route: {
                pathname: `/${region}`,
                outputPath: resolve(distRoot, region, "index.html"),
                initialData: {region, countries, itineraries},
            },
        };
    }));
    const countryPages = buildCountryPages(regionData);
    const officialSlugs = getOfficialInventory(regionData);
    const officialPages = await fetchOfficialPages(officialSlugs, api.getItineraryBySlug, 4);
    const officialRoutes = officialPages.map(initialData => ({
        pathname: `/itinerary/${initialData.slug}`,
        outputPath: resolve(distRoot, "itinerary", initialData.slug, "index.html"),
        initialData,
    }));
    const regionRoutes = regionData.map(({route}) => route);
    const countryRoutes = countryPages.map(initialData => ({
        pathname: `/browse/${initialData.countrySlug}`,
        outputPath: resolve(distRoot, "browse", initialData.countrySlug, "index.html"),
        initialData,
    }));
    const template = await readFile(resolve(distRoot, "index.html"), "utf8");
    const manifest = JSON.parse(await readFile(resolve(distRoot, ".vite/manifest.json"), "utf8"));

    for (const {countryName, items} of countryPages) {
        for (const item of items) {
            if (!manifest[item.hero.slice(1)]?.file) {
                throw new Error(`Country ${countryName}: missing built hero asset ${item.hero}.`);
            }
        }
    }
    const {loadSubFolderImages} = await vite.ssrLoadModule("/src/utils/loadItineraryImage.js");
    for (const {slug, detail} of officialPages) {
        if (!manifest[detail.hero.slice(1)]?.file) {
            throw new Error(`Official itinerary ${slug}: missing built hero asset ${detail.hero}.`);
        }
        for (const place of detail.places) {
            if (!place.imageUrl) continue;
            // Inspect the existing component resolver, including its extension aliases.
            const parts = place.imageUrl.split("/");
            const image = loadSubFolderImages(parts.slice(3, 6).join("/"), parts[6].split(".")[0]);
            if (!image) {
                console.warn(`Official itinerary ${slug}: existing optional food image is missing: ${place.imageUrl}`);
            }
        }
    }
    console.log(`Official itinerary prerendering: ${officialPages.length} documents/detail requests; concurrency 4.`);
    console.log(`Country prerendering reuses Region data: ${countryPages.length} countries; no Country/detail API requests.`);
    const routeSpecs = [
        {pathname: "/", outputPath: resolve(distRoot, "index.html"), initialData: null},
        {pathname: "/contact", outputPath: resolve(distRoot, "contact/index.html"), initialData: null},
        ...regionRoutes,
        ...countryRoutes,
        ...officialRoutes,
    ];

    const renderedRoutes = [];
    for (const route of routeSpecs) {
        let rendered;
        try {
            rendered = renderRoute(route.pathname, route.initialData);
        } catch (error) {
            throw new Error(`Route ${route.pathname}: rendering failed: ${error.message}`, {cause: error});
        }
        const html = makeRouteHtml(template, rendered.markup, manifest, route.initialData);
        if (route.initialData?.type === "official-itinerary") {
            const page = splitRenderedMarkup(rendered.markup, manifest).pageMarkup;
            if (/\/src\/assets\/|url\(undefined\)/.test(page)) {
                throw new Error(`Official itinerary ${route.initialData.slug}: unresolved rendered asset.`);
            }
            for (const [, asset] of page.matchAll(/(?:src="|url\()(?:(?:&quot;|&#x27;))?(\/assets\/[^"&')]+)/g)) {
                await readFile(resolve(distRoot, asset.slice(1))).catch(() => {
                    throw new Error(`Official itinerary ${route.initialData.slug}: missing rendered asset ${asset}.`);
                });
            }
        }
        renderedRoutes.push({...route, html});
    }

    for (const route of renderedRoutes) {
        await mkdir(resolve(route.outputPath, ".."), {recursive: true});
        await writeFile(route.outputPath, route.html, "utf8");
    }
    await writeFile(resolve(distRoot, "app-shell.html"), template, "utf8");

    const outputFiles = await readdir(distRoot);
    console.log(`Pre-rendered ${renderedRoutes.length} routes: ${routeSpecs.map(({pathname}) => pathname).join(", ")}`);
    console.log(`Vite output contains ${outputFiles.length} root entries.`);
} catch (error) {
    console.error(`Public route pre-rendering failed: ${error.message}`);
    process.exitCode = 1;
} finally {
    await vite.close();
}
