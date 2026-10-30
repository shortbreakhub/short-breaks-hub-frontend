import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {chromium} from 'playwright';
import {sitemapItineraries} from '../build-edge-routing.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function checkFile(origin, entry, pathname = '/' + entry.key, attempts = 4, delayMs = 3000, requestTimeoutMs = 30000) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(origin + pathname, {signal:AbortSignal.timeout(requestTimeoutMs),redirect:'error'});
      if (response.status !== 200) throw new Error(`${pathname}: HTTP ${response.status}`);
      if (response.headers.get('content-type')?.split(';')[0].trim() !== entry.contentType.split(';')[0]) throw new Error(`${pathname}: incorrect content type`);
      const bytes=Buffer.from(await response.arrayBuffer());
      if (hash(bytes) !== entry.sha256) throw new Error(`${pathname}: release checksum differs`);
      return bytes;
    } catch (error) { last = error; }
    if (attempt < attempts - 1) await new Promise(r => setTimeout(r, Math.min(20000, delayMs * (attempt + 1))));
  }
  throw last;
}

export async function checkItineraryResponses(origin, pathname, requestTimeoutMs = 30000, deadline = Infinity) {
  const signal=()=>{
    const remaining=Math.min(requestTimeoutMs,deadline-Date.now());
    if(remaining<=0) throw new Error('Itinerary propagation deadline reached');
    return AbortSignal.timeout(remaining);
  };
  for (const missing of ['/itinerary/seo-verification-nonexistent-route', '/itinerary/seo-verification-nonexistent-route/index.html', '/%69tinerary/seo-verification-nonexistent-route/index.html']) {
    const response=await fetch(origin+missing,{redirect:'manual',signal:signal()});
    await response.arrayBuffer();
    if (response.status!==404 || !response.headers.get('x-robots-tag')?.includes('noindex')) throw new Error(`${missing}: expected noindex HTTP 404`);
  }
  const response=await fetch(origin+pathname+'/index.html?q=a%20b',{redirect:'manual',signal:signal()});
  await response.arrayBuffer();
  if (response.status!==301 || new URL(response.headers.get('location'),origin).href!==origin+pathname+'?q=a%20b') throw new Error('Known itinerary alias redirect/query changed');
}

export async function waitForItineraryRouting(origin, entry, {timeoutMs=600000, intervalMs=10000} = {}) {
  const started=Date.now();
  const deadline=started+timeoutMs;
  const pathname='/'+entry.key.replace(/\/index\.html$/,'');
  let last;
  let attempts=0;
  do {
    attempts++;
    try {
      const remaining=()=>Math.max(1,Math.min(30000,deadline-Date.now()));
      await checkFile(origin,entry,pathname,1,0,remaining());
      await checkItineraryResponses(origin,pathname,remaining(),deadline);
      return {origin,pathname,attempts,elapsedMs:Date.now()-started};
    } catch(error) {last=error;}
    if(Date.now()>=deadline) break;
    await new Promise(done=>setTimeout(done,Math.min(intervalMs,deadline-Date.now())));
  } while(Date.now()<deadline);
  throw new Error(`Itinerary routing did not converge within ${timeoutMs}ms: ${last?.message}`,{cause:last});
}

export function verifyInitialHtml(html, pathname) {
  const dom=new JSDOM(html);
  try {
    const doc=dom.window.document;
    const root=doc.querySelector('#root');
    if (!root?.querySelector('h1')?.textContent.trim() || root.getAttribute('data-prerendered')!=='true') throw new Error(`${pathname}: no meaningful prerendered HTML`);
    if (doc.querySelectorAll('link[rel="canonical"]').length!==1 || doc.querySelector('link[rel="canonical"]').href!==`https://www.shortbreakhub.com${pathname}`) throw new Error(`${pathname}: incorrect canonical`);
    if (!doc.title || !doc.querySelector('meta[name="description"]')?.content.trim() || !doc.querySelector('meta[name="robots"]')?.content.startsWith('index,follow')) throw new Error(`${pathname}: missing indexable route metadata`);
    if (pathname.startsWith('/itinerary/')) {
      const data=JSON.parse(doc.querySelector('#shortbreakhub-prerender-data')?.textContent || 'null');
      if (data?.type!=='official-itinerary' || data.slug!==pathname.slice(11) || !data.detail?.summary || !root.textContent.includes(data.detail.summary) || !root.querySelector('.itinerary-day-timeline')) throw new Error(`${pathname}: missing itinerary content/bootstrap`);
    }
  } finally {dom.window.close();}
}

export async function verifyProduction({origins = ['https://www.shortbreakhub.com','https://shortbreakhub.com']} = {}) {
  const manifest = JSON.parse(await readFile('.deployment/release/manifest.json'));
  if (manifest.commit !== process.env.GITHUB_SHA) throw new Error('Verification manifest does not match release SHA');
  const byKey = new Map(manifest.files.map(f => [f.key,f]));
  let invalidation;
  try { invalidation=JSON.parse(await readFile('.deployment/invalidation.json')); }
  catch (error) { if (error.code!=='ENOENT') throw error; }
  const pending = invalidation && invalidation.status !== 'Completed';
  const verifyFile = (origin,entry,path) => checkFile(origin,entry,path,pending?16:4,pending?10000:3000);
  const report = {commit:manifest.commit,invalidation,verified:[],functionPropagation:[]};
  const canary=manifest.files.find(f=>f.key.startsWith('itinerary/')&&f.key.endsWith('/index.html'));
  if(!canary) throw new Error('No itinerary routing verification target');
  // Invalidation completion predates function publication; it cannot prove propagation.
  const propagationDeadline=Date.now()+600000;
  for(const origin of origins) report.functionPropagation.push(await waitForItineraryRouting(origin,canary,{timeoutMs:Math.max(1,propagationDeadline-Date.now())}));
  for (const origin of origins) {
    await verifyFile(origin,byKey.get('index.html'),'/');
    report.verified.push(origin + '/');
  }
  const publicDocuments=manifest.files.filter(f=>f.phase==='html' && f.key!=='app-shell.html');
  let next=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(next<publicDocuments.length) {
      const entry=publicDocuments[next++];
      const pathname=entry.key==='index.html'?'/':'/'+entry.key.replace(/\/index\.html$/,'');
      const html=await verifyFile(origins[0],entry,pathname);
      verifyInitialHtml(html.toString(),pathname);
      report.verified.push(pathname);
    }
  }));
  const inventory=JSON.parse(await readFile('.deployment/release/edge/inventory.json'));
  const sitemap=await fetch(origins[0]+'/sitemap.xml',{redirect:'error',signal:AbortSignal.timeout(30000)});
  if (sitemap.status!==200 || JSON.stringify(sitemapItineraries(await sitemap.text()))!==JSON.stringify(inventory.slugs)) throw new Error('Production sitemap differs from released public itinerary inventory');
  await checkItineraryResponses(origins[0],'/'+canary.key.replace(/\/index\.html$/,''));
  for (const [source,target] of [['/browse/Spain','/browse/spain'],['/browse/New%20Zealand','/browse/new-zealand'],['/america','/americas']]) {
    const response=await fetch(origins[0]+source,{redirect:'manual',signal:AbortSignal.timeout(30000)});
    if(response.status!==301 || new URL(response.headers.get('location'),origins[0]).href!==origins[0]+target) throw new Error(`Legacy redirect changed: ${source}`);
  }
  const document = new JSDOM(await readFile('dist/index.html','utf8')).window.document;
  const required = new Set([...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(el => (el.getAttribute('src') || el.getAttribute('href')).slice(1)));
  document.defaultView.close();
  for (const key of [...required,...manifest.dailyPngs]) {
    const entry = byKey.get(key);
    if (!entry) throw new Error(`Verification reference missing from manifest: ${key}`);
    await verifyFile(origins[0],entry);
    report.verified.push(key);
  }
  const slugs = Object.keys(JSON.parse(await readFile('dist/.vite/manifest.json')));
  // The source mapping is data, loaded through the same Vite SSR pipeline as tests.
  const {createServer} = await import('vite');
  const vite = await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false}});
  let pages;
  try {
    const {getItineraryDayImages} = await vite.ssrLoadModule('/src/content/itineraryDayImages.js');
    pages = manifest.files.filter(f => f.key.startsWith('itinerary/') && f.key.endsWith('/index.html'))
      .map(f => ({...f,expectedDays:Object.keys(getItineraryDayImages(f.key.split('/')[1])).map(Number)}))
      .filter(f => f.expectedDays.length > 0);
  } finally { await vite.close(); }
  if (!pages.length || !slugs.length) throw new Error('No mapped itinerary verification targets');
  const browser = await chromium.launch();
  try {
    for (const entry of pages) {
     for (let attempt=0;attempt<(pending?3:1);attempt++) {
      const context=await browser.newContext();
      const page=await context.newPage();
      const hydrationErrors=[];
      page.on('console',message=>{if(/hydration|hydrating|did not match|Minified React error #(418|423|425)/i.test(message.text())) hydrationErrors.push(message.text());});
      page.on('pageerror',error=>{if(/Minified React error|hydration/i.test(error.message)) hydrationErrors.push(error.message);});
      try {
      const pathname = '/' + entry.key.replace(/\/index\.html$/,'');
      await verifyFile(origins[0],entry,pathname);
      const navigation = await page.goto(origins[0]+pathname,{waitUntil:'domcontentloaded',timeout:45000});
      if (navigation?.status() !== 200) throw new Error(`Browser navigation failed: ${pathname}`);
      await page.locator('.itinerary-day-timeline').waitFor({timeout:45000});
      if (await page.locator('link[rel="canonical"]').getAttribute('href')!==`https://www.shortbreakhub.com${pathname}` || !await page.locator('h1').textContent() || hydrationErrors.length) throw new Error(`Hydration/canonical regression: ${pathname}`);
      const details = page.locator('.itinerary-day-timeline details');
      const seen = new Set();
      // Opening each day exercises lazy images and does not assume four days.
      for (let i = 0; i < await details.count(); i++) {
        const day = details.nth(i);
        if (!await day.evaluate(el => el.open)) await day.locator('summary').click();
        const image = day.locator('.itinerary-day-timeline__image img');
        const dayNumber = Number(await day.locator('.itinerary-day-timeline__number').textContent());
        seen.add(dayNumber);
        if (entry.expectedDays.includes(dayNumber)) await image.waitFor({timeout:30000});
        if (await image.count()) {
          await image.scrollIntoViewIfNeeded();
          await page.waitForFunction(el => el.complete && el.naturalWidth > 0,await image.elementHandle(),{timeout:30000});
          const url = new URL(await image.getAttribute('src'),page.url());
          if (!manifest.dailyPngs.includes(decodeURI(url.pathname.slice(1)))) throw new Error(`Unexpected daily PNG on ${pathname}`);
        }
      }
      if (entry.expectedDays.some(day => !seen.has(day))) throw new Error(`Mapped schedule day missing: ${pathname}`);
      report.verified.push(pathname);
      break;
      } catch (error) {
        if (!pending || attempt===2) throw error;
        console.log('::warning::Release image verification has not converged while invalidation is pending; retrying in a fresh browser context.');
        await new Promise(r=>setTimeout(r,20000));
      } finally { await context.close(); }
     }
    }
  } finally { await browser.close(); }
  await writeFile('.deployment/verification.json',JSON.stringify(report,null,2)+'\n');
  if (pending) console.log('::warning::Checked release content is verified, but CloudFront still reports invalidation pending. Retain the invalidation ID and monitor completion; other edge locations may still be converging.');
  console.log(`Verified release ${manifest.commit}: ${report.verified.length} targets; initial HTML, itinerary routing, 404s and hydration passed.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verifyProduction();
