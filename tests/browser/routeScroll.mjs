// Run against an existing local Vite server. External requests are blocked to isolate routing.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{for(const width of [1440,390])for(const route of ['/contact','/live-weather','/community-itineraries/region']){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',route=>route.abort());await page.goto('http://localhost:5173/',{waitUntil:'domcontentloaded'});await page.locator('.journey-navbar').waitFor();
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));const before=await page.evaluate(()=>scrollY);
 await page.locator(`.journey-navbar a[href="${route}"]`).first().evaluate(el=>el.click());await page.waitForURL('**'+route);
 const destination = {'/contact': '.contact-journal', '/live-weather': '.weather-journal', '/community-itineraries/region': '.community-landing'}[route];
 await page.locator(destination).waitFor();
 await page.waitForFunction(() => scrollY === 0);
 await page.waitForTimeout(900);
 assert.ok(before > 500); assert.equal(await page.evaluate(()=>scrollY),0); assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,route,before,after:await page.evaluate(()=>scrollY),errors}));await page.close();
}}finally{await browser.close();}
