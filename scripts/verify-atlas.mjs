import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
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
        assert.equal(await page.locator('.atlas-country').count(),0,'UK remains without itinerary hit regions');
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
        await page.locator('.atlas-stage[data-atlas-scene="europe"][data-atlas-transition="idle"]').waitFor();
        const topEuropeAgain=await page.locator('.home-copy').evaluate(el=>el.getBoundingClientRect().top+scrollY);
        assert.ok(Math.abs(topEuropeAgain-topBefore)<=1,'hero moved '+(topEuropeAgain-topBefore)+'px after return');
        assert.equal(await page.locator('.atlas-country').count(),9);
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
    }
} finally {await browser?.close();await vite.close();}
