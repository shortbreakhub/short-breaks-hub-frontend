// Production, cold local bodies (not compressed network transfer). No affiliate clicks.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile, stat, writeFile} from "node:fs/promises";
import {resolve, extname} from "node:path";
import {gzipSync} from "node:zlib";
import {chromium} from "playwright";

const dist = resolve("dist"), types = {".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".webp":"image/webp", ".png":"image/png", ".jpg":"image/jpeg", ".json":"application/json", ".geojson":"application/json"};
const server = createServer(async (req,res) => {
    try {
        let path=resolve(dist,"."+new URL(req.url,"http://local").pathname);
        if(!path.startsWith(dist+"/")&&path!==dist)throw Error("invalid path");
        if((await stat(path)).isDirectory())path=resolve(path,"index.html");
        res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream","Cache-Control":"no-store"});
        res.end(await readFile(path));
    } catch {res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin=`http://127.0.0.1:${server.address().port}`, results=[];
let browser;
try {
    browser=await chromium.launch({headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
    for(const [name,width,height,dpr] of [["desktop",1440,900,1],["mobile",390,844,2]]) {
        const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:name==="mobile",reducedMotion:"reduce"});
        const requests=new Map(), external=[];
        
        await context.route("**/*",route=>{
            const url=new URL(route.request().url());
            if(url.origin!==origin){external.push(url.href);return route.abort();}
            return route.continue();
        });
        const page=await context.newPage(), errors=[];
        page.on("pageerror",e=>errors.push(e.message));
        page.on("response",response=>{if(response.url().startsWith(origin))requests.set(new URL(response.url()).pathname,response.status());});
        const weights=async()=>{
            const assets=[];
            for(const [url,status] of requests){if(status!==200)continue;let path=resolve(dist,"."+url);if((await stat(path)).isDirectory())path=resolve(path,"index.html");const body=await readFile(path);assets.push({url,raw:body.length,gzip:gzipSync(body,{level:9}).length});}
            return {raw:assets.reduce((n,x)=>n+x.raw,0),gzipEstimate:assets.reduce((n,x)=>n+x.gzip,0),assets};
        };
        await page.goto(origin,{waitUntil:"networkidle"});
        const before=await weights(), beforeExternal=[...external];
        assert.ok(!before.assets.some(x=>/createAtlasMap|\.geojson$/.test(x.url)));
        await page.locator(".atlas-entry button").click();
        await page.locator('[data-atlas-state="ready"]').waitFor({timeout:20000});
        await page.waitForLoadState("networkidle");
        const after=await weights();
        const atlasRequests=after.assets.filter(x=>!before.assets.some(b=>b.url===x.url));
        assert.ok(atlasRequests.some(x=>/createAtlasMap/.test(x.url))); assert.ok(atlasRequests.some(x=>/maplibre-gl-worker/.test(x.url)));
        assert.ok(before.assets.some(x=>/europe-atlas.*\.png$/.test(x.url)));
        assert.equal(external.length,beforeExternal.length,"Atlas must add no external requests");
        assert.equal(await page.locator('.atlas-landmark,.atlas-pin,.atlas-label,.maplibregl-marker,.maplibregl-popup').count(),0);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        const aboveFold=await page.locator("img").evaluateAll(images=>images.filter(img=>{const r=img.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).map(img=>({src:img.currentSrc,alt:img.alt})));
        await page.screenshot({path:`/tmp/issue40-europe-production-${name}.png`});
        assert.deepEqual(errors,[]);
        results.push({name,width,height,dpr,before,after,atlasRequests,incrementRaw:after.raw-before.raw,incrementGzipEstimate:after.gzipEstimate-before.gzipEstimate,externalAtlas:[],aboveFold,errors});
        console.log(`${name}: initial ${before.raw}, activated ${after.raw} unique local asset bytes`);
        await context.close();
    }
    await writeFile("/tmp/issue40-europe-production-runtime.json",JSON.stringify(results,null,2));
} finally {await browser?.close();await new Promise(done=>server.close(done));}
