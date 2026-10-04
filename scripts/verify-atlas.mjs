import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {EUROPE_DESTINATIONS} from '../src/components/home/atlas/europeDestinations.js';
import {writeFile} from 'node:fs/promises';

// Observe the existing overlay seam, never expose testing globals in production.
const vite=await createServer({server:{host:'127.0.0.1',port:0,open:false},logLevel:'error',plugins:[{
    name:'atlas-verification-observer',enforce:'pre',transform(code,id){
        if(id.endsWith('/src/components/home/AtlasStage.jsx')) return code.replace('const fail = error => {', 'const fail = error => {console.log("Atlas error", error?.message || error?.error?.message || "deadline");');
        if(id.endsWith('/src/pages/HomePage.jsx'))return code.replace('<AtlasStage />','<AtlasStage onMapReady={map => {window.__atlasForTest = map;}} onCountrySelect={country => {window.__countrySelections = [...(window.__countrySelections || []), country.id];}} />');
    }
}]});
let browser; const results=[];
try {
    await vite.listen(); const origin=vite.resolvedUrls.local[0];
    browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const width of (process.env.ATLAS_WIDTH ? [Number(process.env.ATLAS_WIDTH)] : [1440,768,390])) {
        const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width===1440?1:2,hasTouch:width===390,reducedMotion:'reduce'});
        await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
        const page=await context.newPage(); page.on('console', m=>{if(m.text().includes('Atlas error'))console.log(m.text());}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(origin,{waitUntil:'networkidle'});
        await page.locator('.atlas-preview').evaluate(img=>img.decode());
        const frame=await page.locator('.atlas-paper').boundingBox();
        assert.ok(Math.abs(frame.width/frame.height-1.5)<0.01);
        assert.equal(await page.locator('.atlas-country').count(),9);
        await page.screenshot({path:`/tmp/issue40-interaction-default-${width}.png`});
        const uk=page.locator('[data-country="united-kingdom"]');
        if(width===1440){await uk.hover();await page.waitForTimeout(220);assert.equal(await uk.locator('.atlas-country-callout').isVisible(),true);await page.screenshot({path:'/tmp/issue40-interaction-hover-desktop.png'});await uk.focus();await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>window.__countrySelections),['united-kingdom']);}
        if(width===390){await uk.tap();assert.equal(await uk.getAttribute('data-revealed'),'true');assert.equal(await page.evaluate(()=>window.__countrySelections?.length || 0),0);await page.screenshot({path:'/tmp/issue40-interaction-tap-mobile.png'});await uk.tap();assert.deepEqual(await page.evaluate(()=>window.__countrySelections),['united-kingdom']);}
        
        await page.locator('.atlas-entry button').click();
        await page.locator('[data-atlas-state="ready"]').waitFor({timeout:20000});
        const inspect=()=>page.evaluate(()=>{const m=window.__atlasForTest;return {zoom:m.getZoom(),min:m.getMinZoom(),max:m.getMaxZoom(),center:m.getCenter().toArray(),sources:Object.keys(m.getStyle().sources),layers:m.getStyle().layers.map(l=>l.type),overflow:document.documentElement.scrollWidth>innerWidth};});
        const alignment=async()=>{
            // Camera setters update state immediately; canvas and DOM overlays
            // are painted together on the next render frame.
            await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
            const errors=await page.evaluate(destinations=>destinations.flatMap(destination=>destination.hitAreas.map(area=>{
                const map=window.__atlasForTest,{x,y}=area.artworkPosition;
                const latitude=180/Math.PI*Math.atan(Math.sinh(Math.PI*(1-2*y)/3));
                const projected=map.project([-90+180*x,latitude]);
                const canvas=map.getContainer().getBoundingClientRect(),country=document.querySelector(`[data-country="${destination.id}"]`),link=(area.id===destination.hitAreas[0].id?country:country.querySelector(`[data-hit-area="${area.id}"]`)).getBoundingClientRect();
                return Math.hypot(link.x+link.width/2-canvas.x-projected.x,link.y+link.height/2-canvas.y-projected.y);
            })),EUROPE_DESTINATIONS);
            assert.ok(errors.every(error=>error<1),'DOM destinations must track the artwork camera');
        };
        const initial=await inspect();await alignment();assert.equal(initial.overflow,false);assert.deepEqual(initial.layers,['background','raster']);assert.deepEqual(initial.sources,['europe']);assert.ok(Math.abs(initial.zoom-initial.min)<0.005);
        assert.ok(2**(initial.max-initial.min)<=1.601);
        assert.equal(await page.locator('.atlas-controls button').nth(1).isDisabled(),true);
        // At default zoom there is no slack to drag into empty space.
        const canvas=page.locator('.atlas-map canvas'),box=await canvas.boundingBox();
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height/2,{steps:5});await page.mouse.up();await page.waitForTimeout(300);
        assert.ok(Math.abs((await inspect()).center[0])<0.1);
        for(let i=0;i<3;i++){if(await page.locator('.atlas-controls button').first().isEnabled())await page.locator('.atlas-controls button').first().click();}
        const zoomed=await inspect();await alignment();
        if(width===1440){
            // Tab/focus can reveal a previously clipped destination at max zoom.
            const greece=page.locator('[data-country="greece"]');await page.keyboard.press('Tab');await greece.focus();await page.keyboard.press('Enter');await alignment();
            const visible=await page.evaluate(()=>{const link=document.querySelector('[data-country="greece"]').getBoundingClientRect(),frame=document.querySelector('.atlas-paper').getBoundingClientRect();return link.x+link.width/2>=frame.x && link.x+link.width/2<=frame.right && link.y+link.height/2>=frame.y && link.y+link.height/2<=frame.bottom;});assert.equal(visible,true);
            assert.equal(await page.evaluate(()=>window.__countrySelections.at(-1)),'greece');
            await page.locator('.atlas-controls button').first().focus();
        }
        if(width===1440){await page.mouse.move(10,10);await page.screenshot({path:"/tmp/issue40-interaction-zoom-desktop.png"});}assert.ok(Math.abs(zoomed.zoom-zoomed.max)<0.001);
        // Even a large pan must keep every canvas corner inside the artwork rectangle.
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.95,box.y+box.height*.9,{steps:8});await page.mouse.up();await page.waitForTimeout(400);
        await alignment();
        const corners=await page.evaluate(()=>{const m=window.__atlasForTest,w=m.getContainer().clientWidth,h=m.getContainer().clientHeight;return [[0,0],[w,0],[w,h],[0,h]].map(p=>m.unproject(p).toArray());});
        for(const [lng,lat] of corners){assert.ok(Math.abs(lng)<=90.01);assert.ok(Math.abs(lat)<=51.34);}
        await page.locator('.atlas-controls button').nth(2).click();assert.ok(Math.abs((await inspect()).zoom-initial.zoom)<0.005);
        await canvas.focus();await page.keyboard.press('Tab');assert.equal(await uk.evaluate(el=>el===document.activeElement),true);
        // Resize/orientation keeps every normalized artwork point aligned.
        await page.setViewportSize({width:width===1440?1200:width+20,height:900});await page.waitForTimeout(200);await alignment();
        await page.setViewportSize({width,height:900});await page.waitForTimeout(200);await alignment();
        if(width===390){
            const cdp=await context.newCDPSession(page);await page.evaluate(()=>scrollTo(0,0));
            const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
            const x=box.x+box.width/2,y=box.y+box.height*.8;
            await touch('touchStart',[{x,y}]);for(let i=1;i<=6;i++)await touch('touchMove',[{x,y:y-i*20}]);await touch('touchEnd',[]);await page.waitForTimeout(200);
            assert.ok(await page.evaluate(()=>scrollY)>20,'one finger scrolls the page');
            await page.evaluate(()=>scrollTo(0,0));
            const cy=box.y+box.height/2;
            await touch('touchStart',[{x:x-30,y:cy},{x:x+30,y:cy}]);for(let i=1;i<=5;i++)await touch('touchMove',[{x:x-30-i*5,y:cy},{x:x+30+i*5,y:cy}]);await touch('touchEnd',[]);await page.waitForTimeout(200);
            assert.ok((await inspect()).zoom>initial.min,'two finger pinch zooms');
            await page.locator('.atlas-controls button').nth(2).click();
        }
        await page.screenshot({path:`/tmp/issue40-europe-map-${width}.png`});
        if(width===390){await page.getByRole('button',{name:/English/}).filter({visible:true}).click();await page.getByRole('menuitem',{name:/Français/}).click();assert.equal(await page.locator('.atlas-map').getAttribute('aria-label'),'Atlas interactif de l’Europe');assert.match(await uk.getAttribute('aria-label'),/Royaume-Uni/);await page.screenshot({path:'/tmp/issue40-europe-mobile-fr.png'});}
        // Every country is keyboard-selectable through the same callback seam.
        for(const destination of EUROPE_DESTINATIONS){await page.locator(`[data-country="${destination.id}"]`).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__countrySelections.at(-1)),destination.id);}
        if(width===390){
            for(const destination of EUROPE_DESTINATIONS){
                const link=page.locator(`[data-country="${destination.id}"]`), count=await page.evaluate(()=>window.__countrySelections.length);
                await link.tap();assert.equal(await page.evaluate(()=>window.__countrySelections.length),count,'first tap reveals, without selecting');
                await link.tap();assert.equal(await page.evaluate(()=>window.__countrySelections.at(-1)),destination.id,'every landmark center is touch-selectable');
            }
        }
        // Every audited region, including Edinburgh and both Italian landmarks,
        // resolves through its parent country's ONE semantic link.
        await page.locator('.atlas-controls button').nth(2).click();await alignment();
        for(const destination of EUROPE_DESTINATIONS) for(const area of destination.hitAreas){
            const link=page.locator(`[data-country="${destination.id}"]`),hit=area.id===destination.hitAreas[0].id?link:link.locator(`[data-hit-area="${area.id}"]`);
            const rect=await hit.boundingBox(), before=await page.evaluate(()=>window.__countrySelections.length);
            if(width===390){
                // Clear any previous touch label, including same-country regions.
                await page.locator('#atlas-caption').tap();
                await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
                assert.equal(await page.evaluate(()=>window.__countrySelections.length),before,`${destination.id}/${area.id}: first tap reveals`);
                await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
            } else await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
            assert.equal(await page.evaluate(()=>window.__countrySelections.length),before+1,`${destination.id}/${area.id}: selects once`);
            assert.equal(await page.evaluate(()=>window.__countrySelections.at(-1)),destination.id,`${destination.id}/${area.id}: correct country, no adjacent-country overlap`);
        }
        // Independent artwork samples around dense neighbouring landmarks.
        for(const [country,x,y] of [['netherlands',.41,.285],['netherlands',.456,.345],['germany',.548,.315],['germany',.596,.29],['switzerland',.478,.415],['switzerland',.49,.518]]){
            const rect=await page.locator('.atlas-paper').boundingBox();
            if(width===390){await page.locator('#atlas-caption').tap();await page.touchscreen.tap(rect.x+x*rect.width,rect.y+y*rect.height);await page.touchscreen.tap(rect.x+x*rect.width,rect.y+y*rect.height);}
            else await page.mouse.click(rect.x+x*rect.width,rect.y+y*rect.height);
            assert.equal(await page.evaluate(()=>window.__countrySelections.at(-1)),country,'dense-area sample selects its own country');
        }
        assert.equal(await page.locator('.atlas-country-layer a').count(),9);
        assert.equal(await page.locator('.atlas-country-layer a [tabindex]').count(),0);
        assert.deepEqual(errors,[]);results.push({width,frame,initial,zoomed,errors});console.log(`${width}: Europe interaction, aligned zoom/pan/resize, focus and gestures passed`);
        await context.close();
    }
    await writeFile('/tmp/issue40-europe-verification.json',JSON.stringify(results,null,2));
} finally {await browser?.close();await vite.close();}
