import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {JSDOM} from 'jsdom';
import {startSeoServer, edgeHandler} from '../scripts/seo-test-server.mjs';
import {generateEdgeCode, sitemapItineraries, buildEdgeRouting} from '../scripts/build-edge-routing.mjs';
import {verifyInitialHtml} from '../scripts/ci/verify-production.mjs';
import {REGIONS} from '../src/config/regions.js';

const template=await readFile('infra/cloudfront/viewer-request.js','utf8');
const inventory=JSON.parse(await readFile('.deployment/edge/inventory.json','utf8'));
const code=await readFile('.deployment/edge/function.js','utf8');
const request=(uri,querystring={})=>({uri,method:'GET',headers:{host:{value:'www.shortbreakhub.com'}},cookies:{},querystring});
const sitemap=slugs=>`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${slugs.map(s=>`<url><loc>https://www.shortbreakhub.com/itinerary/${s}</loc></url>`).join('')}</urlset>`;

test('every generated public itinerary is delivered as initial HTTP HTML, along with existing discovery routes', async()=>{
    const server=await startSeoServer();
    try {
        const countries=[...new Set((await Promise.all(REGIONS.map(async region=>JSON.parse((await readFile(`dist/${region.onClick}/index.html`,'utf8')).match(/<script id="shortbreakhub-prerender-data" type="application\/json">([^]*?)<\/script>/)[1]).countries))).flat())];
        const paths=['/','/contact',...REGIONS.map(r=>'/'+r.onClick),...countries.map(c=>'/browse/'+c.toLowerCase().replaceAll(' ','-')),...inventory.slugs.map(s=>'/itinerary/'+s)];
        for(const path of paths) {
            const response=await fetch(server.origin+path,{redirect:'manual'});
            assert.equal(response.status,200,path);
            const html=await response.text();
            verifyInitialHtml(html,path);
            assert.doesNotMatch(html,/<div id="root"><\/div>/);
        }
    } finally {await server.close();}
});

test('legacy redirects and non-itinerary rewrites match the captured LIVE function',async()=>{
    const before=edgeHandler(await readFile('tests/fixtures/viewer-request-live-2026-10-30.js','utf8'));
    const after=edgeHandler(code);
    for(const uri of ['/','/contact','/europe','/Oceania','/oceania','/america','/north_america','/south_america','/anz','/north-africa','/browse/Spain','/browse/New%20Zealand','/browse/Ghana/','/browse/spain','/user-itinerary/draft','/profile','/login','/privacy','/terms','/random-missing']) {
        const req=request(uri,{q:{value:'a%20b',multiValue:[{value:'a%20b'},{value:'c%2Fd'}]}});
        assert.equal(JSON.stringify(after(req)),JSON.stringify(before(req)),uri);
    }
    const slug=inventory.slugs[0];
    assert.equal(before(request('/itinerary/'+slug)).uri,'/app-shell.html');
    assert.equal(after(request('/itinerary/'+slug)).uri,`/itinerary/${slug}/index.html`);
});

test('unknown, unpublished and retained old itinerary objects cannot bypass noindex 404s',async()=>{
    const temp=await mkdtemp(join(tmpdir(),'sbh-retired-'));
    const reads=[];
    await mkdir(join(temp,'itinerary','private-draft'),{recursive:true});
    await writeFile(join(temp,'itinerary','private-draft','index.html'),'PRIVATE OLD CONTENT');
    const server=await startSeoServer({dist:temp,code,onOriginRead:key=>reads.push(key)});
    try {
        for(const path of ['/itinerary/private-draft','/itinerary/private-draft/index.html','/itinerary%2Fprivate-draft%2Findex.html','/%69tinerary/private-draft/index.html','/%2569tinerary/private-draft/index.html','/itinerary/does-not-exist','/itinerary','/itinerary/','/itinerary/a%2Fb','/itinerary/%E0%A4%A','/itinerary/anything/extra']) {
            const response=await fetch(server.origin+path,{redirect:'manual'});
            assert.equal(response.status,404,path);
            assert.equal(response.headers.get('x-robots-tag'),'noindex,follow');
            const html=await response.text();
            assert.match(html,/<h1>Page not found<\/h1>/);
            assert.doesNotMatch(html,/PRIVATE|rel="canonical"|<script/);
        }
        assert.deepEqual(reads,[],'404s must not reach retained origin objects');
    } finally {await server.close();await rm(temp,{recursive:true,force:true});}
});

test('itinerary aliases redirect once, retain queries and converge on a self-canonical page',async()=>{
    const server=await startSeoServer();
    const slug=inventory.slugs[0];
    try {
        for(const path of [`/ITINERARY/${slug}/`,`/itinerary/${slug.toUpperCase()}`,`/itinerary/${slug}/index.html`]) {
            const response=await fetch(server.origin+path+'?q=a%20b',{redirect:'manual'});
            assert.equal(response.status,301);
            assert.equal(response.headers.get('location'),`/itinerary/${slug}?q=a%20b`);
            const destination=await fetch(server.origin+response.headers.get('location'),{redirect:'manual'});
            assert.equal(destination.status,200);
            verifyInitialHtml(await destination.text(),'/itinerary/'+slug);
        }
    } finally {await server.close();}
});

test('build fails on sitemap drift, malformed URLs, duplicate inventory or oversized function',async()=>{
    assert.deepEqual(sitemapItineraries(sitemap(inventory.slugs)),inventory.slugs);
    assert.throws(()=>sitemapItineraries(sitemap(['same','same'])),/duplicate/);
    assert.throws(()=>sitemapItineraries(sitemap(['one']).replace('www.shortbreakhub.com','shortbreakhub.com')),/Noncanonical/);
    assert.throws(()=>sitemapItineraries(sitemap(['../private'])),/Noncanonical/);
    assert.throws(()=>generateEdgeCode(template,['bad/slug']),/invalid canonical slug/);
    assert.throws(()=>generateEdgeCode(template,['same','same']),/duplicate/);
    assert.throws(()=>generateEdgeCode(template+'/*'+'x'.repeat(10240)+'*/',['one']),/10 KB/);
    assert.equal(code,generateEdgeCode(template,inventory.slugs));
    const temp=await mkdtemp(join(tmpdir(),'sbh-sitemap-'));
    try {await assert.rejects(buildEdgeRouting({output:temp,sitemapXml:sitemap(inventory.slugs.slice(1))}),/inventories differ/);}
    finally {await rm(temp,{recursive:true,force:true});}
});

test('HTTP 200 app shell cannot pass the SEO release gate',async()=>{
    assert.throws(()=>verifyInitialHtml(awaitShell,'/itinerary/example'),/no meaningful/);
});
const awaitShell=await readFile('dist/app-shell.html','utf8');

test('real Chromium preserves initial itinerary content, hydrates and navigates without canonical changes', {timeout:120000},async()=>{
    const server=await startSeoServer();
    const browser=await chromium.launch({headless:true});
    try {
        const context=await browser.newContext();
        const detailRequests=[];
        await context.route('**/*',async route=>{
            const url=new URL(route.request().url());
            if(url.origin===server.origin) return route.continue();
            const match=url.pathname.match(/\/itineraries\/slug\/([^/]+)$/);
            if(match && inventory.slugs.includes(match[1])) {
                detailRequests.push(match[1]);
                const html=await readFile(`dist/itinerary/${match[1]}/index.html`,'utf8');
                const dom=new JSDOM(html);
                const data=JSON.parse(dom.window.document.querySelector('#shortbreakhub-prerender-data').textContent);
                dom.window.close();
                return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data.detail)});
            }
            if(url.pathname.endsWith('/favorites/count')) return route.fulfill({status:200,contentType:'application/json',body:'{"count":0}'});
            if(url.pathname.endsWith('/comments')) return route.fulfill({status:200,contentType:'application/json',body:'{"content":[]}'});
            if(url.hostname==='v6.exchangerate-api.com') return route.fulfill({status:200,contentType:'application/json',body:'{"conversion_rates":{"USD":1}}'});
            return route.abort();
        });
        const page=await context.newPage();
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('console',message=>{if(/hydration|hydrating|did not match|Minified React error #(418|423|425)/i.test(message.text())) errors.push(message.text());});
        for(const slug of [inventory.slugs[0],'5-days-senegal-voice-rhythm-and-atlantic-light','4-days-shanghai-where-the-future-never-waits']) {
            const response=await page.goto(server.origin+'/itinerary/'+slug,{waitUntil:'networkidle'});
            assert.equal(response.status(),200);
            await page.locator('.itinerary-day-timeline').waitFor();
            assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://www.shortbreakhub.com/itinerary/'+slug);
            assert.equal(await page.locator('h1').count(),1);
            assert.ok(await page.locator('h1').textContent());
            const day=page.locator('.itinerary-day-timeline details').first();
            const wasOpen=await day.evaluate(el=>el.open);
            await day.locator('summary').click();
            assert.equal(await day.evaluate(el=>el.open),!wasOpen);
        }
        assert.deepEqual(detailRequests,[],'hydration must reuse public detail bootstrap');
        await page.goto(server.origin+'/browse/spain',{waitUntil:'networkidle'});
        const link=page.locator('a[href^="/itinerary/"]').first();
        const path=await link.getAttribute('href');
        await link.click();
        await page.locator('.itinerary-day-timeline').waitFor();
        assert.equal(new URL(page.url()).pathname,path);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://www.shortbreakhub.com'+path);
        assert.ok(detailRequests.includes(path.slice(11)),'client navigation fetches the selected itinerary');
        assert.deepEqual(errors,[]);
        const missing=await page.goto(server.origin+'/itinerary/private-draft',{waitUntil:'domcontentloaded'});
        assert.equal(missing.status(),404);
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,follow');
        await context.close();
    } finally {await browser.close();await server.close();}
});
