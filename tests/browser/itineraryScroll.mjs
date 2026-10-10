// Run against the local Vite server: node tests/browser/itineraryScroll.mjs
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser = await chromium.launch({headless:true});
try {
    for (const width of [1440,390]) {
        const page = await browser.newPage({viewport:{width,height:900}});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let release, started;
        const requested = new Promise(resolve => {started=resolve;});
        const hold = new Promise(resolve => {release=resolve;});
        let delayed = true;
        await page.route('**/itineraries/slug/**', async route => {
            const response = await route.fetch();
            assert.equal(response.status(),200);
            if (delayed) {started();await hold;}
            await route.fulfill({response});
        });
        await page.goto('http://localhost:5173/');
        const link = page.locator('a.chapter-action').first();
        await link.scrollIntoViewIfNeeded();
        const before = await page.evaluate(()=>scrollY);
        assert.ok(before>0);
        const path = await link.getAttribute('href');
        await link.click();
        await requested;
        await page.waitForFunction(()=>scrollY===0);
        const during = await page.evaluate(()=>scrollY);
        delayed=false;release();
        await page.locator('#itinerary-story-title').waitFor();
        await page.waitForFunction(()=>scrollY===0);
        // Let layout/image events settle rather than asserting only the first frame.
        await page.evaluate(async()=>{await Promise.all([...document.images].filter(image=>{const rect=image.getBoundingClientRect();return rect.top<innerHeight&&rect.bottom>0;}).map(image=>image.decode().catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
        const after = await page.evaluate(()=>scrollY);
        assert.equal(after,0);
        const top = await page.locator('#itinerary-story-title').evaluate(el=>el.getBoundingClientRect().top);
        assert.ok(top>=0 && top<900,'story heading is visible in the initial viewport');
        await page.evaluate(()=>scrollTo(0,800));
        await page.goBack();await page.locator('a.chapter-action').first().waitFor();
        await page.goForward();await page.locator('#itinerary-story-title').waitFor();await page.waitForFunction(()=>scrollY===0);
        await page.evaluate(()=>scrollTo(0,800));
        await page.reload();await page.locator('#itinerary-story-title').waitFor();await page.waitForFunction(()=>scrollY===0);
        await page.goBack();await page.locator('a.chapter-action').first().waitFor();
        await page.goForward();await page.locator('#itinerary-story-title').waitFor();await page.waitForFunction(()=>scrollY===0);
        await page.goBack();await page.locator('a.chapter-action').first().waitFor();
        await page.locator('a.chapter-action').first().click();
        await page.locator('#itinerary-story-title').waitFor();await page.waitForFunction(()=>scrollY===0);
        await page.goto('http://localhost:5173'+path);await page.locator('#itinerary-story-title').waitFor();await page.waitForFunction(()=>scrollY===0);
        await page.goto('http://localhost:5173'+path+'#itinerary-story-overview');
        await page.locator('#itinerary-story-overview').waitFor();
        await page.waitForFunction(()=>Math.abs(document.getElementById('itinerary-story-overview').getBoundingClientRect().top)<2);
        assert.equal(errors.length,0,errors.join('\n'));
        console.log(JSON.stringify({width,before,during,after,headingTop:top,direct:'passed',refresh:'passed',backForward:'top on entry',hash:'passed',consoleErrors:errors.length}));
        await page.close();
    }
} finally {await browser.close();}
