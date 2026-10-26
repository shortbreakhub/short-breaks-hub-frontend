import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {chromium} from 'playwright';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function checkFile(origin, entry, pathname = '/' + entry.key, attempts = 4, delayMs = 3000) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(origin + pathname, {signal:AbortSignal.timeout(30000),redirect:'error'});
      if (response.status !== 200) throw new Error(`${pathname}: HTTP ${response.status}`);
      if (response.headers.get('content-type')?.split(';')[0].trim() !== entry.contentType.split(';')[0]) throw new Error(`${pathname}: incorrect content type`);
      if (hash(Buffer.from(await response.arrayBuffer())) !== entry.sha256) throw new Error(`${pathname}: release checksum differs`);
      return;
    } catch (error) { last = error; }
    if (attempt < attempts - 1) await new Promise(r => setTimeout(r, Math.min(20000, delayMs * (attempt + 1))));
  }
  throw last;
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
  const report = {commit:manifest.commit,invalidation,verified:[],discrepancies:[]};
  for (const origin of origins) {
    await verifyFile(origin,byKey.get('index.html'),'/');
    report.verified.push(origin + '/');
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
      try {
      const pathname = '/' + entry.key.replace(/\/index\.html$/,'');
      // Record known delivery differences explicitly; do not rewrite routing.
      const response = await fetch(origins[0]+pathname,{signal:AbortSignal.timeout(30000),redirect:'error'});
      if (response.status !== 200 || !response.headers.get('content-type')?.startsWith('text/html')) throw new Error(`Itinerary unavailable: ${pathname}`);
      if (hash(Buffer.from(await response.arrayBuffer())) !== entry.sha256) {
        const message = `${pathname}: served HTML differs from generated itinerary document (existing routing discrepancy; unchanged)`;
        report.discrepancies.push(message);
        console.log(`::warning::${message}`);
        await writeFile('.deployment/verification.json',JSON.stringify(report,null,2)+'\n');
      }
      const navigation = await page.goto(origins[0]+pathname,{waitUntil:'domcontentloaded',timeout:45000});
      if (navigation?.status() !== 200) throw new Error(`Browser navigation failed: ${pathname}`);
      await page.locator('.itinerary-day-timeline').waitFor({timeout:45000});
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
  console.log(`Verified release ${manifest.commit}: ${report.verified.length} targets; ${report.discrepancies.length} separately reported HTML routing discrepancies.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verifyProduction();
