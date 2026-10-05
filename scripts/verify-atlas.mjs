import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {UK_DESTINATIONS} from '../src/components/home/atlas/ukDestinations.js';
import {FRANCE_DESTINATIONS} from '../src/components/home/atlas/franceDestinations.js';
import {SPAIN_DESTINATIONS} from '../src/components/home/atlas/spainDestinations.js';
import {PORTUGAL_DESTINATIONS} from '../src/components/home/atlas/portugalDestinations.js';
import {GERMANY_DESTINATIONS} from '../src/components/home/atlas/germanyDestinations.js';
import {GREECE_DESTINATIONS} from '../src/components/home/atlas/greeceDestinations.js';
import {ITALY_DESTINATIONS} from '../src/components/home/atlas/italyDestinations.js';
import {NETHERLANDS_DESTINATIONS} from '../src/components/home/atlas/netherlandsDestinations.js';
import {SWITZERLAND_DESTINATIONS} from '../src/components/home/atlas/switzerlandDestinations.js';
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
// Issues #44/#46/#48: on-demand country scenes (France, Spain, Portugal) share one check; the UK keeps its own section above.
const COUNTRY_CHECKS={
    france:{name:'France',destinations:FRANCE_DESTINATIONS,story:'FRANCE Where time slows, and beauty learns to stay.',nav:'Explore France itineraries',shots:'issue44-france',
        hoverShots:['paris','strasbourg'],armedShots:['nice','marseille','paris','strasbourg'],pair:['marseille','nice'],drag:'nice',desktopNav:'paris',mobileNav:'marseille'},
    spain:{name:'Spain',destinations:SPAIN_DESTINATIONS,story:'SPAIN Where the sun lingers, and every evening begins again.',nav:'Explore Spain itineraries',shots:'issue46-spain',
        hoverShots:['barcelona','valencia','cordoba'],armedShots:['cordoba','seville','malaga','granada','barcelona'],pair:['cordoba','seville'],drag:'granada',desktopNav:'barcelona',mobileNav:'seville'},
    portugal:{name:'Portugal',asset:'portugal_atlas',destinations:PORTUGAL_DESTINATIONS,story:'PORTUGAL Where the land ends, and the horizon begins.',nav:'Explore Portugal itineraries',shots:'issue48-portugal',
        hoverShots:['porto','sintra','lagos'],armedShots:['porto','sintra','lisbon','lagos','faro'],pairs:[['sintra','lisbon'],['lagos','faro']],drag:'lisbon',desktopNav:'porto',mobileNav:'faro'},
    germany:{name:'Germany',destinations:GERMANY_DESTINATIONS,story:'GERMANY Where old worlds endure, and new stories take their place.',nav:'Explore Germany itineraries',shots:'issue52-germany',
        hoverShots:['hamburg','berlin','heidelberg'],armedShots:['hamburg','berlin','munich'],pairs:[['cologne','heidelberg']],drag:'berlin',desktopNav:'hamburg',mobileNav:'munich'},
    greece:{name:'Greece',destinations:GREECE_DESTINATIONS,story:'GREECE Where the sea remembers, and old stories never quite end.',nav:'Explore Greece itineraries',shots:'issue52-greece',
        hoverShots:['thessaloniki','rhodes','crete'],armedShots:['athens','santorini','crete','rhodes'],pairs:[['santorini','crete']],drag:'athens',desktopNav:'athens',mobileNav:'crete'},
    italy:{name:'Italy',destinations:ITALY_DESTINATIONS,story:'ITALY Where history lives on, and every region tells a story.',nav:'Explore Italy itineraries',shots:'issue52-italy',
        hoverShots:['milan','venice','palermo'],armedShots:['florence','naples','palermo'],pairs:[['venice','florence'],['rome','naples']],drag:'rome',desktopNav:'milan',mobileNav:'palermo'},
    netherlands:{name:'Netherlands',destinations:NETHERLANDS_DESTINATIONS,story:'NETHERLANDS Where water shapes the land, and ideas flow further.',nav:'Explore Netherlands itineraries',shots:'issue52-netherlands',
        hoverShots:['haarlem','amsterdam','utrecht'],armedShots:['haarlem','amsterdam','the-hague','rotterdam'],pairs:[['haarlem','amsterdam'],['the-hague','rotterdam']],drag:'amsterdam',desktopNav:'amsterdam',mobileNav:'rotterdam'},
    switzerland:{name:'Switzerland',destinations:SWITZERLAND_DESTINATIONS,story:'SWITZERLAND Mountains, lakes, and timeless moments at every turn.',nav:'Explore Switzerland itineraries',shots:'issue52-switzerland',
        hoverShots:['zurich','geneva','zermatt'],armedShots:['lucerne','interlaken','geneva','zermatt'],pairs:[['zurich','lucerne'],['bern','interlaken']],drag:'bern',desktopNav:'zurich',mobileNav:'geneva'},
};
async function checkCountryScene(browser,origin,width,scene){
    const cfg=COUNTRY_CHECKS[scene],countryHref=id=>'/itinerary/'+cfg.destinations.find(d=>d.id===id).slug,count=cfg.destinations.length;
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:width===390?2:1,hasTouch:width===390});
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
    const page=await context.newPage(),errors=[],artRequests=[];page.on('pageerror',error=>errors.push(error.message));
    // Vite dev serves a tiny ?import JS module for the asset URL; only real image fetches count.
    page.on('request',request=>{if(request.url().includes(cfg.asset||scene+'-atlas')&&request.resourceType()==='image')artRequests.push(request.url());});
    await page.goto(origin,{waitUntil:'domcontentloaded'});await page.locator('.atlas-preview:not([hidden])').evaluate(image=>image.decode());
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
    assert.deepEqual(artRequests,[],cfg.name+' artwork is not requested before '+cfg.name+' is selected');
    const stage=page.locator('.atlas-stage'),paper=page.locator('.atlas-paper'),country=page.locator('[data-country="'+scene+'"]');
    const heroTop=()=>page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY),topBefore=await heroTop();
    if(width===390){await country.tap();assert.equal(await country.getAttribute('data-revealed'),'true');await country.tap();}else await country.click();
    await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
    assert.equal(await stage.getAttribute('data-atlas-scene'),'europe',cfg.name+' never shows before cover');
    await page.locator('.atlas-stage[data-atlas-transition="covered"]').waitFor();
    assert.equal(await stage.getAttribute('data-atlas-scene'),'europe');assert.equal(await page.locator('.atlas-scene-surface').evaluate(el=>el.inert),true);
    await page.locator('.atlas-stage[data-atlas-scene="'+scene+'"][data-atlas-transition="idle"]').waitFor({timeout:12000});
    assert.ok(artRequests.length>=1,cfg.name+' artwork loads on selection');
    assert.ok(Math.abs(await heroTop()-topBefore)<=1,'hero stays stable in '+cfg.name);
    await page.waitForFunction(()=>document.activeElement?.classList.contains('atlas-back'));
    assert.equal((await page.locator('.atlas-country-story').innerText()).replace(/\s+/g,' ').trim(),cfg.story);
    const back=page.locator('.atlas-back'),backBox=await back.boundingBox(),box=await paper.boundingBox();
    assert.ok(backBox.y>=box.y+box.height,'Back stays outside the artwork');
    const nav=page.getByRole('navigation',{name:cfg.nav});assert.equal(await nav.count(),1);
    assert.equal(await nav.locator('a.atlas-itinerary').count(),count);assert.equal(await page.locator('.atlas-country').count(),0);
    for(const d of cfg.destinations){
        const link=page.locator('[data-destination="'+d.id+'"]');
        assert.equal(await link.getAttribute('href'),countryHref(d.id));assert.match(await link.getAttribute('aria-label'),/ — View itinerary$/);
        assert.equal(await link.locator('a,button,[tabindex]').count(),0);
        for(const area of d.hitAreas){const {x,y}=regionPoint(box,area);
            assert.equal(await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.closest('.atlas-itinerary')?.dataset.destination,[x,y]),d.id,area.id+' resolves to '+d.id+' at '+width+'px');}
    }
    assert.equal(await page.locator('.atlas-itinerary-callout:visible').count(),0,'no permanent callouts');
    // Callouts must stay inside the clipped frame (Paris/Strasbourg top edge, Strasbourg right edge).
    await page.screenshot({path:'/tmp/'+cfg.shots+'-default-'+width+'.png'});
    const calloutInside=async id=>{const link=page.locator('[data-destination="'+id+'"]');assert.equal(await calloutShown(link),true,id+' callout shows');
        const c=await link.locator('.atlas-itinerary-callout').boundingBox();
        assert.ok(c.x>=box.x-1&&c.y>=box.y-1&&c.x+c.width<=box.x+box.width+1&&c.y+c.height<=box.y+box.height+1,id+' callout stays inside the artwork at '+width+'px');};
    await page.evaluate(()=>{window.__countryClicks=[];window.__blockCountryClicks=true;window.addEventListener('click',event=>{const link=event.target.closest?.('.atlas-itinerary');if(!link||!window.__blockCountryClicks)return;window.__countryClicks.push({id:link.dataset.destination,prevented:event.defaultPrevented});event.preventDefault();});});
    const clicks=()=>page.evaluate(()=>window.__countryClicks.splice(0));
    if(width===1440){
        for(const d of cfg.destinations)for(const area of d.hitAreas){const {x,y}=regionPoint(box,area);await page.mouse.click(x,y);}
        assert.deepEqual(await clicks(),cfg.destinations.flatMap(d=>d.hitAreas.map(()=>({id:d.id,prevented:false}))),'every landmark and plate activates natively');
        for(const d of cfg.destinations){const {x,y}=regionPoint(box,d.hitAreas[0]);await page.mouse.move(x,y);await calloutInside(d.id);
            if(cfg.hoverShots.includes(d.id))await page.screenshot({path:'/tmp/'+cfg.shots+'-hover-'+d.id+'-1440.png'});}
        for(const d of cfg.destinations)assert.match((await page.locator('[data-destination="'+d.id+'"] .atlas-itinerary-callout').textContent()).replace(/\s+/g,' ').trim(),/^\S.* · View itinerary →$/);
        await page.mouse.move(box.x+5,box.y+5);await back.focus();const order=[];
        for(let i=0;i<count;i++){await page.keyboard.press('Shift+Tab');order.unshift(await page.evaluate(()=>document.activeElement.dataset.destination));}
        assert.deepEqual(order,cfg.destinations.map(d=>d.id));
        const first=page.locator('[data-destination="'+order[0]+'"]');
        assert.equal(await first.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')),true);await calloutInside(order[0]);
        await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('atlas-itinerary')),false);
        await back.focus();await page.keyboard.press('Enter');
    } else {
        for(const d of cfg.destinations)for(const area of d.hitAreas){
            const {x,y}=regionPoint(box,area);await page.touchscreen.tap(x,y);
            assert.deepEqual(await page.locator('.atlas-itinerary[data-revealed="true"]').evaluateAll(els=>els.map(el=>el.dataset.destination)),[d.id],area.id+' arms only '+d.id);
            assert.deepEqual(await clicks(),[{id:d.id,prevented:true}],'first tap does not navigate');
            if(area.kind==='landmark')await calloutInside(d.id);
            if(area.kind==='landmark'&&cfg.armedShots.includes(d.id))await page.screenshot({path:'/tmp/'+cfg.shots+'-armed-'+d.id+'-390.png'});
            await page.locator('.atlas-country-story').tap();assert.equal(await page.locator('.atlas-itinerary[data-revealed="true"]').count(),0,'tapping elsewhere disarms');
        }
        // The closest pairs (France: Marseille/Nice; Spain: Córdoba/Seville; Portugal: Sintra/Lisbon, Lagos/Faro) arm independently.
        const tapId=async id=>{const {x,y}=regionPoint(box,cfg.destinations.find(d=>d.id===id).hitAreas[0]);await page.touchscreen.tap(x,y);};
        for(const [first,second] of cfg.pairs||[cfg.pair]){
            await tapId(first);await tapId(second);
            assert.deepEqual(await page.locator('.atlas-itinerary[data-revealed="true"]').evaluateAll(els=>els.map(el=>el.dataset.destination)),[second]);
            await tapId(first);assert.deepEqual(await clicks(),[{id:first,prevented:true},{id:second,prevented:true},{id:first,prevented:true}]);
            await tapId(first);assert.deepEqual(await clicks(),[{id:first,prevented:false}],'second tap navigates natively');
            await page.locator('.atlas-country-story').tap();
        }
        const cdp=await context.newCDPSession(page),dragFrom=regionPoint(box,cfg.destinations.find(d=>d.id===cfg.drag).hitAreas[0]);
        const before=await page.evaluate(()=>scrollY),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
        await touch('touchStart',[dragFrom]);for(let i=1;i<=6;i++)await touch('touchMove',[{x:dragFrom.x,y:dragFrom.y-i*20}]);await touch('touchEnd',[]);await page.waitForTimeout(200);
        assert.ok(await page.evaluate(()=>scrollY)>before,'one finger scrolls the page from a '+cfg.name+' destination');
        assert.equal(await page.locator('.atlas-itinerary[data-revealed="true"]').count(),0);assert.deepEqual(await clicks(),[]);
        await page.evaluate(y=>scrollTo(0,y),before);await cdp.detach();
        await back.tap();
    }
    await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
    assert.equal(await page.locator('.atlas-itinerary').count(),count);assert.equal(await page.locator('.atlas-scene-surface').evaluate(el=>el.inert),true,cfg.name+' itineraries are inert while clouds travel');
    assert.equal(await back.isDisabled(),true,'Back is disabled during travel');
    await page.locator('.atlas-stage[data-atlas-scene="europe"][data-atlas-transition="idle"]').waitFor();
    assert.equal(await page.locator('.atlas-itinerary').count(),0);assert.equal(await page.locator('.atlas-country').count(),9);
    await page.waitForFunction(id=>document.activeElement?.dataset.country===id,scene);
    assert.ok(Math.abs(await heroTop()-topBefore)<=1,'hero stays stable after '+cfg.name);
    await page.emulateMedia({reducedMotion:'reduce'});
    if(width===390){await country.tap();await country.tap();}else await country.click();const reducedStart=Date.now();
    // Measure scene readiness per frame, rather than locator retry backoff.
    await page.waitForFunction(id=>{const stage=document.querySelector('.atlas-stage');return stage?.dataset.atlasScene===id&&stage.dataset.atlasTransition==='idle';},scene,{polling:'raf'});
    assert.ok(Date.now()-reducedStart<500,'reduced-motion '+cfg.name+' swap remains near instant');
    assert.equal(await page.locator('.atlas-cloud-transition').count(),0);
    // Completion restores focus on the next animation frame, after idle is rendered.
    // Wait for that existing readiness signal before testing native modified clicks.
    await page.waitForFunction(()=>document.activeElement?.classList.contains('atlas-back'));
    await page.evaluate(()=>{window.__blockCountryClicks=false;});
    if(width===1440){
        const [tab]=await Promise.all([context.waitForEvent('page'),page.locator('[data-destination="'+cfg.desktopNav+'"]').click({modifiers:['ControlOrMeta']})]);
        await tab.waitForURL('**'+countryHref(cfg.desktopNav));assert.equal(new URL(page.url()).pathname,'/');await tab.close();
        await page.locator('[data-destination="'+cfg.desktopNav+'"]').click();await page.waitForURL('**'+countryHref(cfg.desktopNav));
    } else {
        const link=page.locator('[data-destination="'+cfg.mobileNav+'"]');await link.tap();assert.equal(new URL(page.url()).pathname,'/');
        await link.tap();await page.waitForURL('**'+countryHref(cfg.mobileNav));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);console.log(width+': '+cfg.name+' scene, on-demand artwork, interaction and navigation to '+new URL(page.url()).pathname+' passed');
    await context.close();
}
// A failed country image restores Europe under cover, announces it, refocuses the country and stays retryable.
async function checkSceneFailure(browser,origin,scene){
    const asset=COUNTRY_CHECKS[scene].asset||scene+'-atlas';
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const block=route=>route.request().resourceType()==='image'?route.abort():route.continue();
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
    await context.route('**/*'+asset+'*',block);
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin,{waitUntil:'domcontentloaded'});await page.locator('.atlas-preview:not([hidden])').evaluate(image=>image.decode());
    const country=page.locator('[data-country="'+scene+'"]');await country.click();
    await page.locator('.atlas-stage[data-atlas-transition="covering"]').waitFor();
    await page.locator('.atlas-stage[data-atlas-scene="europe"][data-atlas-transition="idle"]').waitFor({timeout:15000});
    assert.equal(await page.getByRole('alert').filter({hasText:'The country map could not open. Europe is ready to explore again.'}).count(),1);
    await page.waitForFunction(id=>document.activeElement?.dataset.country===id,scene);
    assert.equal(await page.locator('.atlas-itinerary').count(),0);assert.equal(await page.locator('.atlas-country').count(),9);
    await context.unroute('**/*'+asset+'*',block);await country.click();
    await page.locator('.atlas-stage[data-atlas-scene="'+scene+'"][data-atlas-transition="idle"]').waitFor({timeout:15000});
    assert.equal(await page.getByRole('alert').count(),0,'retry clears the failure alert');
    assert.deepEqual(errors,[]);console.log('1440: '+scene+' image failure restored Europe, refocused the country and retried successfully');await context.close();
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
        for(const scene of Object.keys(COUNTRY_CHECKS))await checkCountryScene(browser,origin,width,scene);
        if(width===1440)for(const scene of ['spain','portugal','germany','greece','italy','netherlands','switzerland'])await checkSceneFailure(browser,origin,scene);
    }
} finally {await browser?.close();await vite.close();}
