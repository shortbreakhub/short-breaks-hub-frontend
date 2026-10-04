import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {UK_DESTINATIONS} from '../src/components/home/atlas/ukDestinations.js';
import {FRANCE_DESTINATIONS} from '../src/components/home/atlas/franceDestinations.js';
const ukHref=id=>'/itinerary/'+UK_DESTINATIONS.find(d=>d.id===id).slug;
const regionPoint=(box,area)=>({x:box.x+area.artworkPosition.x*box.width,y:box.y+area.artworkPosition.y*box.height});
// isVisible() ignores opacity; require the faded-in callout before asserting or capturing it.
const calloutShown=link=>link.locator('.atlas-itinerary-callout').evaluate(el=>new Promise(resolve=>{const check=()=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).visibility==='visible'?resolve(true):requestAnimationFrame(check);check();setTimeout(()=>resolve(false),1000);}));
// Issue #42: every landmark and name plate resolves to its own single itinerary link.
async function checkUkItineraries(page,width){
    const paper=page.locator('.atlas-paper'),box=await paper.boundingBox();
    const nav=page.getByRole('navigation',{name:'Explore United Kingdom itineraries'});
    assert.equal(await nav.count(),1);
    const links=nav.locator('a.atlas-itinerary');assert.equal(await links.count(),9);
    for(const d of UK_DESTINATIONS){
        const link=page.locator('[data-destination="'+d.id+'"]');
        assert.equal(await link.getAttribute('href'),ukHref(d.id));
        assert.match(await link.getAttribute('aria-label'),/ — View itinerary$/);
        assert.equal(await link.locator('a,button,[tabindex]').count(),0,'one tab stop per destination');
        for(const area of d.hitAreas){
            const {x,y}=regionPoint(box,area);
            assert.equal(await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.closest('.atlas-itinerary')?.dataset.destination,[x,y]),d.id,area.id+' resolves to '+d.id+' at '+width+'px');
        }
    }
    assert.equal(await page.locator('.atlas-itinerary-callout:visible').count(),0,'no permanent callouts');
    // Window bubble listener runs after React: records native default, then blocks the real navigation.
    await page.evaluate(()=>{window.__ukClicks=[];window.addEventListener('click',event=>{const link=event.target.closest?.('.atlas-itinerary');if(!link)return;window.__ukClicks.push({id:link.dataset.destination,prevented:event.defaultPrevented});event.preventDefault();});});
    const clicks=()=>page.evaluate(()=>window.__ukClicks.splice(0));
    if(width===1440){
        for(const d of UK_DESTINATIONS)for(const area of d.hitAreas){const {x,y}=regionPoint(box,area);await page.mouse.click(x,y);}
        assert.deepEqual(await clicks(),UK_DESTINATIONS.flatMap(d=>d.hitAreas.map(()=>({id:d.id,prevented:false}))),'every landmark and plate activates natively');
        const oxford=page.locator('[data-destination="oxford"]'),plate=regionPoint(box,UK_DESTINATIONS.find(d=>d.id==='oxford').hitAreas[1]);
        await page.mouse.move(plate.x,plate.y);assert.equal(await calloutShown(oxford),true);
        assert.equal((await oxford.locator('.atlas-itinerary-callout').innerText()).trim(),'Oxford · View itinerary →');
        await page.screenshot({path:'/tmp/issue42-uk-hover-1440.png'});await page.mouse.move(box.x+5,box.y+5);
        // Initial UK focus stays on Back; reverse Tab reaches all nine single tab stops.
        const back=page.locator('.atlas-back');await back.focus();const order=[];
        for(let i=0;i<9;i++){await page.keyboard.press('Shift+Tab');order.unshift(await page.evaluate(()=>document.activeElement.dataset.destination));}
        assert.deepEqual(order,UK_DESTINATIONS.map(d=>d.id));
        const focused=page.locator('[data-destination="'+order[0]+'"]');
        assert.equal(await focused.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')),true);
        assert.equal(await calloutShown(focused),true);
        await page.screenshot({path:'/tmp/issue42-uk-focus-1440.png'});
        await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('atlas-itinerary')),false);
        assert.equal(await focused.locator('.atlas-itinerary-callout').isVisible(),false);
    } else {
        // Two taps: arm, then navigate. Neighbours in the dense cluster arm independently.
        for(const id of ['bristol','oxford','bath','glasgow','edinburgh','cambridge','london']){
            const d=UK_DESTINATIONS.find(item=>item.id===id);
            for(const area of d.hitAreas){
                const {x,y}=regionPoint(box,area);
                await page.touchscreen.tap(x,y);
                assert.deepEqual(await page.locator('.atlas-itinerary[data-revealed="true"]').evaluateAll(els=>els.map(el=>el.dataset.destination)),[id],area.id+' arms only '+id);
                assert.deepEqual(await clicks(),[{id,prevented:true}],'first tap does not navigate');
                await page.locator('.atlas-country-story').tap();
                assert.equal(await page.locator('.atlas-itinerary[data-revealed="true"]').count(),0,'tapping elsewhere disarms');
            }
        }
        const bath=UK_DESTINATIONS.find(d=>d.id==='bath').hitAreas[0],{x,y}=regionPoint(box,bath);
        await page.touchscreen.tap(x,y);assert.equal(await calloutShown(page.locator('[data-destination="bath"]')),true);await page.screenshot({path:'/tmp/issue42-uk-armed-390.png'});
        await page.touchscreen.tap(x,y);assert.deepEqual(await clicks(),[{id:'bath',prevented:true},{id:'bath',prevented:false}],'second tap navigates natively');
        await page.locator('.atlas-country-story').tap();
        // A one-finger drag that starts on a destination still scrolls the page and never arms it.
        const cdp=await page.context().newCDPSession(page),london=regionPoint(box,UK_DESTINATIONS.find(d=>d.id==='london').hitAreas[0]);
        const before=await page.evaluate(()=>scrollY),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
        await touch('touchStart',[london]);for(let i=1;i<=6;i++)await touch('touchMove',[{x:london.x,y:london.y-i*20}]);await touch('touchEnd',[]);await page.waitForTimeout(200);
        assert.ok(await page.evaluate(()=>scrollY)>before,'one finger scrolls the page from a UK destination');
        assert.equal(await page.locator('.atlas-itinerary[data-revealed="true"]').count(),0);assert.deepEqual(await clicks(),[]);
        await page.evaluate(y=>scrollTo(0,y),before);await cdp.detach();
    }
}
// Issue #44: France loads only on selection, under cover, and reuses the UK interaction contract.
const franceHref=id=>'/itinerary/'+FRANCE_DESTINATIONS.find(d=>d.id===id).slug;
async function checkFranceScene(browser,origin,width){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width===390?2:1,hasTouch:width===390});
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
    const page=await context.newPage(),errors=[],franceRequests=[];page.on('pageerror',error=>errors.push(error.message));
    // Vite dev serves a tiny ?import JS module for the asset URL; only real image fetches count.
    page.on('request',request=>{if(request.url().includes('france-atlas')&&request.resourceType()==='image')franceRequests.push(request.url());});
    await page.goto(origin,{waitUntil:'domcontentloaded'});await page.locator('.atlas-preview:not([hidden])').evaluate(image=>image.decode());
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
    assert.deepEqual(franceRequests,[],'France artwork is not requested before France is selected');
    const stage=page.locator('.atlas-stage'),paper=page.locator('.atlas-paper'),france=page.locator('[data-country="france"]');
    const heroTop=()=>page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY),topBefore=await heroTop();
    if(width===390){await france.tap();assert.equal(await france.getAttribute('data-revealed'),'true');await france.tap();}else await france.click();
    await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
    assert.equal(await stage.getAttribute('data-atlas-scene'),'europe','France never shows before cover');
    await page.locator('.atlas-stage[data-atlas-transition="covered"]').waitFor();
    assert.equal(await stage.getAttribute('data-atlas-scene'),'europe');assert.equal(await page.locator('.atlas-scene-surface').evaluate(el=>el.inert),true);
    await page.locator('.atlas-stage[data-atlas-scene="france"][data-atlas-transition="idle"]').waitFor({timeout:12000});
    assert.ok(franceRequests.length>=1,'France artwork loads on selection');
    assert.ok(Math.abs(await heroTop()-topBefore)<=1,'hero stays stable in France');
    await page.waitForFunction(()=>document.activeElement?.classList.contains('atlas-back'));
    assert.equal((await page.locator('.atlas-country-story').innerText()).replace(/\s+/g,' ').trim(),'FRANCE Where time slows, and beauty learns to stay.');
    const back=page.locator('.atlas-back'),backBox=await back.boundingBox(),box=await paper.boundingBox();
    assert.ok(backBox.y>=box.y+box.height,'Back stays outside the artwork');
    const nav=page.getByRole('navigation',{name:'Explore France itineraries'});assert.equal(await nav.count(),1);
    assert.equal(await nav.locator('a.atlas-itinerary').count(),6);assert.equal(await page.locator('.atlas-country').count(),0);
    for(const d of FRANCE_DESTINATIONS){
        const link=page.locator('[data-destination="'+d.id+'"]');
        assert.equal(await link.getAttribute('href'),franceHref(d.id));assert.match(await link.getAttribute('aria-label'),/ — View itinerary$/);
        assert.equal(await link.locator('a,button,[tabindex]').count(),0);
        for(const area of d.hitAreas){const {x,y}=regionPoint(box,area);
            assert.equal(await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.closest('.atlas-itinerary')?.dataset.destination,[x,y]),d.id,area.id+' resolves to '+d.id+' at '+width+'px');}
    }
    assert.equal(await page.locator('.atlas-itinerary-callout:visible').count(),0,'no permanent callouts');
    // Callouts must stay inside the clipped frame (Paris/Strasbourg top edge, Strasbourg right edge).
    const calloutInside=async id=>{const link=page.locator('[data-destination="'+id+'"]');assert.equal(await calloutShown(link),true,id+' callout shows');
        const c=await link.locator('.atlas-itinerary-callout').boundingBox();
        assert.ok(c.x>=box.x-1&&c.y>=box.y-1&&c.x+c.width<=box.x+box.width+1&&c.y+c.height<=box.y+box.height+1,id+' callout stays inside the artwork at '+width+'px');};
    await page.evaluate(()=>{window.__countryClicks=[];window.__blockCountryClicks=true;window.addEventListener('click',event=>{const link=event.target.closest?.('.atlas-itinerary');if(!link||!window.__blockCountryClicks)return;window.__countryClicks.push({id:link.dataset.destination,prevented:event.defaultPrevented});event.preventDefault();});});
    const clicks=()=>page.evaluate(()=>window.__countryClicks.splice(0));
    if(width===1440){
        for(const d of FRANCE_DESTINATIONS)for(const area of d.hitAreas){const {x,y}=regionPoint(box,area);await page.mouse.click(x,y);}
        assert.deepEqual(await clicks(),FRANCE_DESTINATIONS.flatMap(d=>d.hitAreas.map(()=>({id:d.id,prevented:false}))),'every landmark and plate activates natively');
        for(const d of FRANCE_DESTINATIONS){const {x,y}=regionPoint(box,d.hitAreas[0]);await page.mouse.move(x,y);await calloutInside(d.id);
            if(['paris','strasbourg'].includes(d.id))await page.screenshot({path:'/tmp/issue44-france-hover-'+d.id+'-1440.png'});}
        assert.equal((await page.locator('[data-destination="paris"] .atlas-itinerary-callout').textContent()).replace(/\s+/g,' ').trim(),'Paris · View itinerary →');
        await page.mouse.move(box.x+5,box.y+5);await back.focus();const order=[];
        for(let i=0;i<6;i++){await page.keyboard.press('Shift+Tab');order.unshift(await page.evaluate(()=>document.activeElement.dataset.destination));}
        assert.deepEqual(order,FRANCE_DESTINATIONS.map(d=>d.id));
        const first=page.locator('[data-destination="'+order[0]+'"]');
        assert.equal(await first.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')),true);await calloutInside(order[0]);
        await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('atlas-itinerary')),false);
        await back.focus();await page.keyboard.press('Enter');
    } else {
        for(const d of FRANCE_DESTINATIONS)for(const area of d.hitAreas){
            const {x,y}=regionPoint(box,area);await page.touchscreen.tap(x,y);
            assert.deepEqual(await page.locator('.atlas-itinerary[data-revealed="true"]').evaluateAll(els=>els.map(el=>el.dataset.destination)),[d.id],area.id+' arms only '+d.id);
            assert.deepEqual(await clicks(),[{id:d.id,prevented:true}],'first tap does not navigate');
            if(area.kind==='landmark')await calloutInside(d.id);
            if(area.kind==='landmark'&&['nice','marseille','paris','strasbourg'].includes(d.id))await page.screenshot({path:'/tmp/issue44-france-armed-'+d.id+'-390.png'});
            await page.locator('.atlas-country-story').tap();assert.equal(await page.locator('.atlas-itinerary[data-revealed="true"]').count(),0,'tapping elsewhere disarms');
        }
        // Nice and Marseille arm independently of each other, in either order.
        const tapId=async id=>{const {x,y}=regionPoint(box,FRANCE_DESTINATIONS.find(d=>d.id===id).hitAreas[0]);await page.touchscreen.tap(x,y);};
        await tapId('marseille');await tapId('nice');
        assert.deepEqual(await page.locator('.atlas-itinerary[data-revealed="true"]').evaluateAll(els=>els.map(el=>el.dataset.destination)),['nice']);
        await tapId('marseille');assert.deepEqual(await clicks(),[{id:'marseille',prevented:true},{id:'nice',prevented:true},{id:'marseille',prevented:true}]);
        await tapId('marseille');assert.deepEqual(await clicks(),[{id:'marseille',prevented:false}],'second tap navigates natively');
        await page.locator('.atlas-country-story').tap();
        const cdp=await context.newCDPSession(page),nice=regionPoint(box,FRANCE_DESTINATIONS.find(d=>d.id==='nice').hitAreas[0]);
        const before=await page.evaluate(()=>scrollY),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
        await touch('touchStart',[nice]);for(let i=1;i<=6;i++)await touch('touchMove',[{x:nice.x,y:nice.y-i*20}]);await touch('touchEnd',[]);await page.waitForTimeout(200);
        assert.ok(await page.evaluate(()=>scrollY)>before,'one finger scrolls the page from a France destination');
        assert.equal(await page.locator('.atlas-itinerary[data-revealed="true"]').count(),0);assert.deepEqual(await clicks(),[]);
        await page.evaluate(y=>scrollTo(0,y),before);await cdp.detach();
        await back.tap();
    }
    await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
    assert.equal(await page.locator('.atlas-itinerary').count(),6);assert.equal(await page.locator('.atlas-scene-surface').evaluate(el=>el.inert),true,'France itineraries are inert while clouds travel');
    assert.equal(await back.isDisabled(),true,'Back is disabled during travel');
    await page.locator('.atlas-stage[data-atlas-scene="europe"][data-atlas-transition="idle"]').waitFor();
    assert.equal(await page.locator('.atlas-itinerary').count(),0);assert.equal(await page.locator('.atlas-country').count(),9);
    await page.waitForFunction(()=>document.activeElement?.dataset.country==='france');
    assert.ok(Math.abs(await heroTop()-topBefore)<=1,'hero stays stable after France');
    await page.emulateMedia({reducedMotion:'reduce'});
    if(width===390){await france.tap();await france.tap();}else await france.click();const reducedStart=Date.now();
    await page.locator('.atlas-stage[data-atlas-scene="france"][data-atlas-transition="idle"]').waitFor();
    assert.ok(Date.now()-reducedStart<500,'reduced-motion France swap remains near instant');
    assert.equal(await page.locator('.atlas-cloud-transition').count(),0);
    await page.evaluate(()=>{window.__blockCountryClicks=false;});
    if(width===1440){
        const [tab]=await Promise.all([context.waitForEvent('page'),page.locator('[data-destination="paris"]').click({modifiers:['ControlOrMeta']})]);
        await tab.waitForURL('**'+franceHref('paris'));assert.equal(new URL(page.url()).pathname,'/');await tab.close();
        await page.locator('[data-destination="paris"]').click();await page.waitForURL('**'+franceHref('paris'));
    } else {
        const link=page.locator('[data-destination="marseille"]');await link.tap();assert.equal(new URL(page.url()).pathname,'/');
        await link.tap();await page.waitForURL('**'+franceHref('marseille'));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);console.log(width+': France scene, on-demand artwork, interaction and navigation to '+new URL(page.url()).pathname+' passed');
    await context.close();
}
// Real navigation and native modified clicks, isolated from the transition checks above.
async function checkUkNavigation(browser,origin,width){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width===390?2:1,hasTouch:width===390,reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
    const page=await context.newPage();await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.locator('.atlas-preview:not([hidden])').evaluate(image=>image.decode());
    const uk=page.locator('[data-country="united-kingdom"]');
    if(width===390){await uk.tap();await uk.tap();}else await uk.click();
    await page.locator('.atlas-stage[data-atlas-scene="uk"][data-atlas-transition="idle"]').waitFor();
    if(width===1440){
        const [tab]=await Promise.all([context.waitForEvent('page'),page.locator('[data-destination="oxford"]').click({modifiers:['ControlOrMeta']})]);
        await tab.waitForURL('**'+ukHref('oxford'));assert.equal(new URL(page.url()).pathname,'/','modified click keeps the atlas page');await tab.close();
        await page.locator('[data-destination="london"]').click();await page.waitForURL('**'+ukHref('london'));
    } else {
        const link=page.locator('[data-destination="bristol"]');await link.tap();assert.equal(new URL(page.url()).pathname,'/');
        await link.tap();await page.waitForURL('**'+ukHref('bristol'));
    }
    console.log(width+': UK itinerary navigation reached '+new URL(page.url()).pathname);await context.close();
}
const vite=await createServer({server:{host:'127.0.0.1',port:0,open:false},logLevel:'error'});
let browser;
try {
    await vite.listen();const origin=vite.resolvedUrls.local[0];
    browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const width of [1440,390]) {
        const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width===390?2:1,hasTouch:width===390});
        await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
        await context.addInitScript(()=> {
            window.__atlasEvents=[];
            new MutationObserver(records=>{for(const record of records){
                const el=record.target;
                window.__atlasEvents.push({scene:el.dataset.atlasScene,phase:el.dataset.atlasTransition,time:performance.now()});
            }}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-atlas-scene','data-atlas-transition']});
        });
        const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto(origin,{waitUntil:'domcontentloaded'});
        const stage=page.locator('.atlas-stage'),paper=page.locator('.atlas-paper');
        await page.locator('.atlas-preview:not([hidden])').evaluate(image=>image.decode());
        assert.equal(await stage.getAttribute('data-atlas-scene'),'europe');
        assert.equal(await page.locator('.atlas-country').count(),9);
        assert.equal(await page.locator('.atlas-entry,.atlas-controls,#atlas-gestures').count(),0);
        assert.equal(await page.getByRole('button',{name:'Explore the map'}).count(),0);
        assert.doesNotMatch(await page.locator('.home-hero').innerText(),/Drag to pan|two fingers on touch/i);
        assert.equal(await page.locator('.atlas-map canvas').count(),0);
        await page.evaluate(()=>document.fonts.ready);
        await page.waitForTimeout(150);
        const topBefore=await page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY);
        const frameBefore=await paper.boundingBox();
        assert.ok(Math.abs(frameBefore.width/frameBefore.height-1.5)<.01);
        await page.screenshot({path:'/tmp/issue40-polish-europe-'+width+'.png'});
        const uk=page.locator('[data-country="united-kingdom"]');
        if(width===1440){await uk.hover();assert.equal(await uk.locator('.atlas-country-callout').isVisible(),true);await page.screenshot({path:'/tmp/issue40-polish-uk-hover.png'});await uk.focus();await page.keyboard.press('Enter');}
        else {await uk.tap();assert.equal(await uk.getAttribute('data-revealed'),'true');await uk.tap();}
        await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
        const coverStart=await page.evaluate(()=>performance.now());
        assert.equal(await stage.getAttribute('data-atlas-scene'),'europe');
        const topCover=await page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY);
        if(Math.abs(topCover-topBefore)>1)console.log('layout diagnostics',await page.evaluate(()=>Object.fromEntries(['.home-opening','.home-copy','.atlas-stage','.atlas-paper','.atlas-caption','.atlas-scene-status'].map(sel=>{const el=document.querySelector(sel),r=el.getBoundingClientRect();return [sel,{top:r.top,height:r.height,display:getComputedStyle(el).display,align:getComputedStyle(el).alignItems}]}))));
        assert.ok(Math.abs(topCover-topBefore)<=1,'hero moved '+(topCover-topBefore)+'px at cover');
        await page.waitForTimeout(320);await page.screenshot({path:'/tmp/issue40-polish-covering-'+width+'.png'});
        assert.equal(await stage.getAttribute('data-atlas-scene'),'europe');
        await page.locator('.atlas-stage[data-atlas-transition="covered"]').waitFor();
        const coveredAt=await page.evaluate(()=>performance.now());
        assert.ok(coveredAt-coverStart>=650,'cover took '+(coveredAt-coverStart)+'ms');
        assert.equal(await page.locator('.atlas-scene-surface').evaluate(el=>el.inert),true);
        await page.screenshot({path:'/tmp/issue40-polish-covered-'+width+'.png'});
        await page.locator('.atlas-stage[data-atlas-scene="uk"][data-atlas-transition="idle"]').waitFor({timeout:12000});
        const heroUK=await page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY);
        assert.ok(Math.abs(heroUK-topBefore)<=1,'hero moved '+(heroUK-topBefore)+'px in UK');
        assert.equal(await page.locator('.atlas-country').count(),0,'Europe country links are not rendered over UK');
        await page.waitForFunction(()=>document.activeElement?.classList.contains('atlas-back'));
        await checkUkItineraries(page,width);
        assert.equal((await page.locator('.atlas-country-story').innerText()).replace(/\s+/g,' ').trim(),'UNITED KINGDOM Where old stones remember, and every road tells a story.');
        const back=page.locator('.atlas-back');assert.equal(await back.isVisible(),true);
        const backBox=await back.boundingBox(),artBox=await paper.boundingBox();
        assert.ok(backBox.y>=artBox.y+artBox.height,'Back is in the caption strip outside the artwork');
        assert.ok(backBox.height>=44);assert.equal(await back.evaluate(el=>getComputedStyle(el).fontWeight),'700');
        assert.equal(await back.evaluate(el=>getComputedStyle(el).textTransform),'uppercase');
        await back.focus();
        if(width===390){await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');}
        assert.equal(await back.evaluate(el=>el.matches(':focus-visible')),true);
        if(width===1440)await page.screenshot({path:'/tmp/issue40-polish-uk-desktop.png'});
        if(width===390){
            const styles=await back.evaluate(el=>({fontSize:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height}));
            assert.ok(styles.fontSize>=12&&styles.height>=44);
            await page.screenshot({path:'/tmp/issue40-polish-uk-mobile.png'});
        }
        if(width===1440)await page.keyboard.press('Enter'); else await back.tap();
        await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
        assert.equal(await page.locator('.atlas-itinerary').count(),9);assert.equal(await page.locator('.atlas-scene-surface').evaluate(el=>el.inert),true,'UK itineraries are inert while clouds travel');
        await page.locator('.atlas-stage[data-atlas-scene="europe"][data-atlas-transition="idle"]').waitFor();
        const topEuropeAgain=await page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY);
        assert.ok(Math.abs(topEuropeAgain-topBefore)<=1,'hero moved '+(topEuropeAgain-topBefore)+'px after return');
        assert.equal(await page.locator('.atlas-country').count(),9);assert.equal(await page.locator('.atlas-itinerary').count(),0);
        for(const id of ['france','germany','greece','italy','netherlands','portugal','spain','switzerland'])assert.equal(await page.locator('[data-country="'+id+'"]').getAttribute('href'),'/browse/'+id);
        assert.equal(await uk.evaluate(el=>el===document.activeElement),true,'focus returns to the UK country control');
        const events=await page.evaluate(()=>window.__atlasEvents.slice());const ukSwap=events.find(event=>event.scene==='uk'),returnSwap=events.find((event,index)=>event.scene==='europe'&&index>events.indexOf(ukSwap));
        assert.equal(ukSwap?.phase,'covered');assert.equal(returnSwap?.phase,'covered');
        const reveal=events.find((event,index)=>index>events.indexOf(ukSwap)&&event.phase==='revealing');
        const idle=events.find((event,index)=>index>events.indexOf(reveal||ukSwap)&&event.phase==='idle');
        assert.ok(idle.time-reveal.time>=780,'reveal honors its minimum duration');
        if(width===390){
            await page.emulateMedia({reducedMotion:'reduce'});
            await uk.tap();await uk.tap();const reducedStart=Date.now();
            await page.locator('.atlas-stage[data-atlas-scene="uk"][data-atlas-transition="idle"]').waitFor();
            assert.ok(Date.now()-reducedStart<500,'reduced-motion transition remains near instant');
            assert.equal((await page.locator('.atlas-country-story').innerText()).replace(/\s+/g,' ').trim(),'UNITED KINGDOM Where old stones remember, and every road tells a story.');
            await back.tap();await page.locator('.atlas-stage[data-atlas-scene="europe"][data-atlas-transition="idle"]').waitFor();
            const cdp=await context.newCDPSession(page);await page.evaluate(()=>scrollTo(0,300));
            const box=await paper.boundingBox(),x=box.x+box.width/2,y=box.y+box.height-15;
            const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
            await touch('touchStart',[{x,y}]);for(let i=1;i<=6;i++)await touch('touchMove',[{x,y:y-i*20}]);await touch('touchEnd',[]);await page.waitForTimeout(200);
            assert.ok(await page.evaluate(()=>scrollY)>300,'one finger still scrolls the page');
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        assert.deepEqual(errors,[]);console.log(width+': static illustration, country transition, timing, caption geometry and responsive checks passed');await context.close();
        await checkUkNavigation(browser,origin,width);
        await checkFranceScene(browser,origin,width);
    }
} finally {await browser?.close();await vite.close();}
