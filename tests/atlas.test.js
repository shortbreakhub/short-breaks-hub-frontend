import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync, statSync} from "node:fs";
import {gzipSync} from "node:zlib";
import {initialCamera, artworkCoordinate, atlasStyle, ATLAS_LIMITS} from "../src/components/home/atlas/atlasConfig.js";
import {EUROPE_DESTINATIONS} from "../src/components/home/atlas/europeDestinations.js";
import {getCountryBrowsePath} from "../src/utils/publicNavigation.js";
import {measurePerformance} from "../scripts/measure-performance.mjs";

test("Europe framing preserves artwork and derives a conservative pixel budget", () => {
    for (const [width, dpr] of [[828,1],[828,2],[722,2],[358,2],[358,3]]) {
        const camera = initialCamera(width, width, dpr);
        assert.deepEqual(camera.center, [0,0]); assert.equal(camera.zoom, camera.minZoom);
        const scale = 2 ** (camera.maxZoom-camera.minZoom);
        assert.ok(scale >= 1 && scale <= 1.6 + 1e-8);
        assert.ok(width*dpr*scale <= Math.max(1536,width*dpr)+1e-8);
        assert.ok(Math.abs(256*2**camera.minZoom-width)<1e-6);
    }
    assert.equal(ATLAS_LIMITS.renderWorldCopies,false);
    assert.deepEqual(artworkCoordinate(0.5,0.5),[0,0]);
    assert.deepEqual(artworkCoordinate(0,0),[-90,ATLAS_LIMITS.bounds[1][1]]);
});
test("Europe uses the unchanged local PNG as its only map source", () => {
    const png=readFileSync("src/assets/atlas/europe/europe-atlas.png");
    assert.equal(png.readUInt32BE(16),1536); assert.equal(png.readUInt32BE(20),1024);
    const style=atlasStyle("/europe.png");
    assert.deepEqual(style.layers.map(x=>x.type),["background","raster"]);
    assert.deepEqual(Object.keys(style.sources),["europe"]);
    assert.equal(style.sources.europe.url,"/europe.png");
    assert.equal(style.glyphs,undefined); assert.equal(style.sprite,undefined);
    for (const file of ["world-land.geojson","world-preview.svg","provenance.json"]) assert.ok(statSync("src/assets/atlas/"+file).size>0);
    assert.ok(statSync('public/licenses/MapLibre-LICENSE.txt').size>0);
});
test("atlas engine is deferred; existing initial bundle guards remain unchanged", () => {
    const report=measurePerformance();
    assert.ok(report.initialJsGzip<=180_000);
    assert.ok(!report.initialFiles.some(file=>/createAtlasMap|maplibre/i.test(file)));
    const engine=report.chunks.filter(chunk=>/createAtlasMap|maplibre-gl-worker/.test(chunk.file));
    assert.ok(engine.some(chunk=>/createAtlasMap/.test(chunk.file)));
    assert.ok(engine.some(chunk=>/maplibre-gl-worker/.test(chunk.file)));
    // Measured SDK delivery ~424 KB: a regression ceiling, NOT compliance with
    // the original 60 KB target. Its documented overrun requires human review.
    assert.ok(engine.reduce((sum,chunk)=>sum+chunk.gzip,0)<=500_000,"deferred MapLibre delivery exceeds its measured regression ceiling");
    const component=readFileSync("src/components/home/AtlasStage.jsx","utf8");
    assert.match(component,/import\("\.\/atlas\/createAtlasMap\.js"\)/);
    assert.match(component,/AbortController/); assert.match(component,/15000/);
    const adapter=readFileSync("src/components/home/atlas/createAtlasMap.js","utf8");
    assert.doesNotMatch(adapter,/https?:\/\//);
    assert.match(adapter,/interactive: false/); assert.match(adapter,/scrollZoom: false/);
    assert.match(adapter,/touchZoomRotate: false/); assert.match(adapter,/map\.dragPan\.disable\(\)/);
    const stage = readFileSync("src/components/home/AtlasStage.jsx", "utf8");
    assert.doesNotMatch(stage,/className="atlas-entry"|atlas-controls/);
    assert.doesNotMatch(stage,/atlas-gestures/);
    assert.match(adapter,/fadeDuration: 0/);
});

test("Europe activates exactly nine supported countries with normalized illustration hit areas", () => {
    assert.deepEqual(EUROPE_DESTINATIONS.map(c=>c.id).sort(),['france','germany','greece','italy','netherlands','portugal','spain','switzerland','united-kingdom']);
    for (const country of EUROPE_DESTINATIONS) {
        assert.equal(getCountryBrowsePath(country.country), `/browse/${country.id}`);
        assert.ok(country.labelKey.startsWith('itinerarySearchBar.countries.'));
        for(const value of Object.values(country.artworkPosition)) assert.ok(value>0 && value<1);
        for(const value of Object.values(country.hitArea)) assert.ok(value>0 && value<.3);
        assert.ok(country.hitAreas.some(area=>area.kind==='country'));
        assert.equal(new Set(country.hitAreas.map(area=>area.id)).size,country.hitAreas.length);
        for(const area of country.hitAreas){
            const {x,y}=area.artworkPosition,{width,height}=area.hitArea;
            assert.ok(width>0 && height>0);
            assert.ok(x-width/2>=0 && x+width/2<=1 && y-height/2>=0 && y+height/2<=1);
        }
    }
    const source=readFileSync('src/components/home/atlas/EuropeDestinations.jsx','utf8');
    assert.match(source,/createPortal\(layer,map.getCanvasContainer\(\)\)/);
    assert.match(source,/map\?\.on\('render',project\)/);
    assert.match(source,/map\?\.off\('render',project\)/);
});

test("audited secondary landmarks belong to their existing country destination", () => {
    const has = (country,id)=>EUROPE_DESTINATIONS.find(c=>c.id===country).hitAreas.some(area=>area.id===id);
    assert.ok(has('united-kingdom','edinburgh-castle'));
    for(const id of ['colosseum','southern-town']) assert.ok(has('italy',id));
    assert.ok(has('france','mont-saint-michel'));
    assert.ok(has('netherlands','canal-houses'));
    assert.ok(has('switzerland','alpine-peaks'));
});
