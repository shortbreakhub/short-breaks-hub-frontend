import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import i18n from 'i18next';
import {artworkFramePoint} from '../src/components/home/atlas/artworkFrame.js';
const expected={morocco:'5-days-morocco-pattern-ritual-and-warm-shadow',egypt:'5-days-egypt-stone-time-and-living-river','south-africa':'6-days-south-africa-contrast-memory-and-open-futures',kenya:'5-days-kenya-horizon-land-and-shared-movement',tanzania:'6-days-tanzania-migration-patience-and-endless-return',ghana:'5-days-ghana-coast-memory-and-living-welcome',senegal:'5-days-senegal-voice-rhythm-and-atlantic-light',namibia:'5-days-namibia-silence-shadow-and-absolute-space',rwanda:'5-days-rwanda-intention-memory-and-gentle-order'};
const bootstrap=file=>JSON.parse(readFileSync(file,'utf8').match(/<script id="shortbreakhub-prerender-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const fixtures=Object.fromEntries(Object.keys(expected).map(id=>[id,bootstrap(`dist/browse/${id}/index.html`).items]));
test('Africa resolves exactly nine countries and one real itinerary per country, with deferred artwork',async t=>{
 const vite=await createServer({appType:'custom',logLevel:'error',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},ssr:{resolve:{externalConditions:['node','module-sync']}}});
 let api,adapter,mode='ready',requests=0;
 try {
  await vite.ssrLoadModule('/src/i18n.js');api=(await vite.ssrLoadModule('/src/api.js')).publicApi;adapter=api.defaults.adapter;
  api.defaults.adapter=async config=>{requests++;if(mode==='error')throw Error('unavailable');const id=decodeURIComponent(config.url.split('/').at(-1)).toLowerCase().replaceAll(' ','-');return {config,status:200,headers:{},data:mode==='empty'?[]:mode==='ambiguous'?[...fixtures[id],...fixtures[id]]:fixtures[id]};};
  const {REGION_SCENES}=await vite.ssrLoadModule('/src/components/home/atlas/regionScenes.js');
  const {COUNTRY_SCENES,sceneForCountry}=await vite.ssrLoadModule('/src/components/home/atlas/countryScenes.js');
  const {SCENE_ASSETS}=await vite.ssrLoadModule('/src/components/home/atlas/useAtlasScene.js');
  const {default:Stage}=await vite.ssrLoadModule('/src/components/home/AtlasStage.jsx');
  const {default:CountryLayer}=await vite.ssrLoadModule('/src/components/home/atlas/CountryDestinations.jsx');
  const {default:RegionLayer}=await vite.ssrLoadModule('/src/components/home/atlas/EuropeDestinations.jsx');
  const scene=REGION_SCENES.africa;
  assert.equal(requests,0);assert.equal(SCENE_ASSETS.africa,undefined);
  for(const id of Object.keys(expected))assert.equal(SCENE_ASSETS[id],undefined);
  for(const failure of ['error','empty','ambiguous']){mode=failure;await assert.rejects(scene.loadDestinations());assert.deepEqual(scene.destinations,[]);}
  mode='ready';await scene.loadDestinations();assert.equal(scene.destinations.length,9);assert.match(scene.artworkUrl,/africa-atlas\.png/);
  for(const id of Object.keys(expected))await t.test(id,async()=>{
   assert.equal(fixtures[id].length,1);assert.equal(fixtures[id][0].slug,expected[id]);assert.ok(existsSync(`dist/itinerary/${expected[id]}/index.html`));
   assert.equal(sceneForCountry(id),id);const country=COUNTRY_SCENES[id];assert.equal(country.region,'africa');
   await country.loadDestinations();assert.equal(country.destinations.length,1);assert.equal(country.destinations[0].slug,expected[id]);assert.ok(SCENE_ASSETS[id].endsWith(`/${id}-atlas.png`));
   for(const lang of ['en','fr']){
    await i18n.changeLanguage(lang);for(const key of Object.values(country.keys))assert.notEqual(i18n.t(key),key);
    const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:id}))).window.document;
    const links=new JSDOM(renderToStaticMarkup(React.createElement(CountryLayer,{destinations:country.destinations,navLabelKey:country.keys.nav}))).window.document;
    assert.equal(links.querySelectorAll(`a[href="/itinerary/${expected[id]}"]`).length,1);
    assert.ok(links.querySelector('[style*="clip-path"]'));
    assert.equal(doc.querySelector('.atlas-back[href]'),null);
    assert.equal(doc.querySelector('.atlas-back:not([href])').textContent,`← ${i18n.t('homeMagazine.atlas.backAfrica')}`);
    assert.equal(doc.querySelector(`.atlas-${id}-preview`).hasAttribute('hidden'),false);
   }
  });
  for(const lang of ['en','fr']){
   await i18n.changeLanguage(lang);const doc=new JSDOM(renderToStaticMarkup(React.createElement(Stage,{initialRegion:'africa'}))).window.document;
   const nav=doc.querySelector('.atlas-country-layer');assert.equal(nav.querySelectorAll('a').length,9);assert.ok(nav.closest('.atlas-paper'));assert.equal(doc.querySelector('.atlas-country-list'),null);
   for(const id of Object.keys(expected)){const link=nav.querySelector(`[data-country="${id}"]`);assert.equal(link.getAttribute('href'),`/browse/${id}`);assert.ok(link.textContent.includes(i18n.t(`homeMagazine.atlas.africaCountries.${id}`)));assert.notEqual(link.getAttribute('aria-label'),null);}
  }

  await t.test('every landscape hotspot completes its country transition, exposes the canonical itinerary and returns focus to Africa',async()=>{
   const {createRoot}=await import('react-dom/client');const dom=new JSDOM('<div id="root"></div>',{url:'http://atlas.test/',pretendToBeVisual:true});
   const keys=['window','document','ResizeObserver','IS_REACT_ACT_ENVIRONMENT','requestAnimationFrame','cancelAnimationFrame','Image'];
   const saved=Object.fromEntries(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
   dom.window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
   Object.defineProperties(dom.window.HTMLImageElement.prototype,{complete:{get:()=>true},naturalWidth:{get:()=>1536}});
   dom.window.HTMLImageElement.prototype.decode=async()=>{};
   Object.assign(globalThis,{window:dom.window,document:dom.window.document,ResizeObserver:class{observe(){}disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),Image:dom.window.Image});
   const root=createRoot(document.getElementById('root'));
   const settle=async target=>{
    for(let frame=0;frame<30;frame++){
     await React.act(async()=>await new Promise(requestAnimationFrame));
     const stage=document.querySelector('.atlas-stage');
     if(stage.dataset.atlasScene===target&&stage.dataset.atlasTransition==='idle'){await React.act(async()=>await new Promise(requestAnimationFrame));return;}
    }
    assert.fail(`Scene did not complete: ${target}`);
   };
   try {
    await React.act(async()=>root.render(React.createElement(Stage,{initialRegion:'africa'})));
    for(const [id,slug]of Object.entries(expected)){
     await React.act(async()=>document.querySelector(`[data-country="${id}"]`).dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})));
     await settle(id);
     const itinerary=document.querySelector('.atlas-itinerary');assert.equal(itinerary.getAttribute('href'),`/itinerary/${slug}`);assert.equal(document.querySelectorAll('.atlas-itinerary').length,1);
     assert.equal(document.querySelector(`.atlas-${id}-preview`).hasAttribute('hidden'),false);assert.equal(document.activeElement,document.querySelector('.atlas-back'));
     await React.act(async()=>document.querySelector('.atlas-back').click());await settle('africa');
     assert.equal(document.activeElement.dataset.country,id);
    }
   } finally {await React.act(async()=>root.unmount());dom.window.close();for(const [key,value]of Object.entries(saved)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
  });
  await t.test('all nine overlays retain touch arming, outside dismissal, native modifiers and canonical itinerary links',async()=>{
   const {createRoot}=await import('react-dom/client');
   const dom=new JSDOM('<div id="root"></div>',{url:'http://atlas.test/'});
   const saved=Object.fromEntries(['window','document','IS_REACT_ACT_ENVIRONMENT'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
   Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
   const root=createRoot(document.getElementById('root'));let selected=[];
   const click=async(link,type='touch',modified=false)=>{
    let prevented;
    const record=event=>{prevented=event.defaultPrevented;event.preventDefault();};document.addEventListener('click',record);
    const pointer=new window.Event('pointerdown',{bubbles:true});Object.assign(pointer,{pointerType:type,clientX:5,clientY:5});
    await React.act(async()=>{link.dispatchEvent(pointer);link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:5,clientY:5,ctrlKey:modified}));});
    document.removeEventListener('click',record);return prevented;
   };
   try {
    await React.act(async()=>root.render(React.createElement(RegionLayer,{destinations:scene.destinations,onCountrySelect:d=>selected.push(d.id)})));
    for(const id of Object.keys(expected)){
     const link=document.querySelector(`[data-country="${id}"]`);
     assert.equal(await click(link),true);assert.equal(selected.includes(id),false);
     await React.act(async()=>document.body.dispatchEvent(new window.Event('pointerdown',{bubbles:true})));assert.equal(link.dataset.revealed,'false');
     assert.equal(await click(link),true);assert.equal(await click(link),true);assert.equal(selected.at(-1),id);
     const count=selected.length;assert.equal(await click(link,'mouse',true),false);assert.equal(selected.length,count);
    }
    for(const id of Object.keys(expected)){
     await React.act(async()=>root.render(React.createElement(CountryLayer,{key:id,destinations:COUNTRY_SCENES[id].destinations})));
     const link=document.querySelector('.atlas-itinerary');assert.equal(link.getAttribute('href'),`/itinerary/${expected[id]}`);
     assert.equal(await click(link),true);assert.equal(link.dataset.revealed,'true');
     await React.act(async()=>document.body.dispatchEvent(new window.Event('pointerdown',{bubbles:true})));assert.equal(link.dataset.revealed,'false');
     assert.equal(await click(link),true);assert.equal(await click(link),false);assert.equal(await click(link,'mouse',true),false);
    }
   } finally {await React.act(async()=>root.unmount());dom.window.close();for(const [key,value]of Object.entries(saved)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
  });
  await t.test('Africa overlays match Europe/East Asia presentation and remain clickable on desktop/mobile in EN/FR',async()=>{
   const {chromium}=await import('playwright');const {createRoot}=await import('react-dom/client');const browser=await chromium.launch({headless:true});
   const saved=Object.fromEntries(['window','document','HTMLElement','ResizeObserver','IS_REACT_ACT_ENVIRONMENT'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
   mkdirSync('/tmp/issue90-atlas-review',{recursive:true});
   const points={morocco:[800,550],egypt:[650,600],'south-africa':[700,600],kenya:[700,550],tanzania:[750,500],ghana:[750,550],senegal:[800,450],namibia:[850,550],rwanda:[850,550]};
   try {
    for(const lang of ['en','fr'])for(const viewport of [1440,1024,390,320]){
     await i18n.changeLanguage(lang);const width=Math.min(850,viewport-32),height=width*2/3;
     const page=await browser.newPage({viewport:{width:viewport,height:1000}});
     await page.route('**/*',route=>{const path=new URL(route.request().url()).pathname;if(path.startsWith('/src/assets/')&&existsSync('.'+path))return route.fulfill({body:readFileSync('.'+path),contentType:'image/png'});return route.abort();});
     const css=readFileSync('src/styles/homepage.css','utf8');
     const set=async(id,isCountry=false)=>{
      const dom=new JSDOM('<div class="atlas-paper" id="root"></div>');
      Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,ResizeObserver:class{observe(){}disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true});
      const frame=document.getElementById('root');Object.defineProperties(frame,{clientWidth:{value:width},clientHeight:{value:height}});
      const config=isCountry?COUNTRY_SCENES[id]:REGION_SCENES[id];
      const root=createRoot(frame);
      await React.act(async()=>root.render(React.createElement(isCountry?CountryLayer:RegionLayer,{destinations:config.destinations,navLabelKey:config.keys.nav,artworkSize:config.artworkSize})));
      const projected=frame.innerHTML;
      const markup=renderToStaticMarkup(React.createElement(Stage,{initialRegion:id}));
      const doc=new JSDOM(markup).window.document;doc.querySelectorAll('.atlas-country-layer,.atlas-itinerary-layer').forEach(el=>el.remove());doc.querySelector('.atlas-scene-surface').insertAdjacentHTML('beforeend',projected);
      await page.setContent(`<base href="http://atlas.test"><style>body{margin:0}.atlas-caption{display:flex}${css}</style><div style="width:${width}px">${doc.body.innerHTML}</div>`);
      await page.evaluate(()=>document.addEventListener('click',event=>{event.preventDefault();window.clicked=event.target.closest('a')?.getAttribute('href');}));
      await React.act(async()=>root.unmount());dom.window.close();
     };
     let referenceFrame;
     for(const region of ['europe','east-asia','africa']){
      await set(region);assert.ok(await page.locator('.atlas-paper .atlas-country-layer').count());assert.equal(await page.locator('.atlas-country-list').count(),0);
      const frameBox=await page.locator('.atlas-paper').boundingBox();
      if(referenceFrame)assert.deepEqual(frameBox,referenceFrame,'Africa/Asia must use the exact Europe frame');else referenceFrame=frameBox;
      const image=page.locator('.atlas-preview:not([hidden])');
      await image.evaluate(img=>img.decode());
      assert.equal(await image.evaluate(img=>img.naturalWidth/img.naturalHeight),1.5);
      assert.deepEqual(await image.boundingBox(),frameBox,'Landscape artwork fills the established frame without margins or cropping');
      if(lang==='en'&&viewport!==1024)await page.screenshot({path:`/tmp/issue90-atlas-review/${region}-${viewport}.png`,fullPage:true});
     }
     await set('africa');
     for(const d of scene.destinations){
      const point=artworkFramePoint(d.artworkPosition.x,d.artworkPosition.y,width,height,scene.artworkSize),link=page.locator(`[data-country="${d.id}"]`);
      const box=await link.boundingBox();assert.ok(box.height>=44);assert.ok(box.width>=44);
      await page.mouse.click(point.x,point.y);assert.equal(await page.evaluate(()=>window.clicked),`/browse/${d.id}`,`${lang} ${viewport}: ${d.id}`);
      await link.focus();assert.equal(await link.evaluate(el=>document.activeElement===el),true);
      await page.waitForTimeout(200);
      const visible=await link.locator('.atlas-country-callout').evaluate(el=>{const r=el.getBoundingClientRect(),f=el.closest('.atlas-paper').getBoundingClientRect();return getComputedStyle(el).visibility==='visible'&&r.left>=f.left&&r.top>=f.top&&r.right<=f.right&&r.bottom<=f.bottom;});
      assert.equal(visible,true,`${lang} ${viewport}: ${d.id} label`);
     }
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
     for(const id of Object.keys(expected)){
      await set(id,true);const link=page.locator(`a[href="/itinerary/${expected[id]}"]`);
      assert.equal(await link.count(),1);const [x,y]=points[id];await page.mouse.click(x/1536*width,y/1024*height);assert.equal(await page.evaluate(()=>window.clicked),`/itinerary/${expected[id]}`);
      const extra=id==='tanzania'?[[1340,460]]:id==='senegal'?[[800,810],[250,570]]:[];
      for(const [px,py]of extra){await page.mouse.click(px/1536*width,py/1024*height);assert.equal(await page.evaluate(()=>window.clicked),`/itinerary/${expected[id]}`);}
      await link.focus();assert.equal(await link.evaluate(el=>document.activeElement===el),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if(lang==='en'&&viewport===390)await page.screenshot({path:`/tmp/issue90-atlas-review/${id}-390.png`,fullPage:true});
     }
     await page.close();
    }
   } finally {await browser.close();for(const [key,value]of Object.entries(saved)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
  });
 } finally {if(api)api.defaults.adapter=adapter;await vite.close();}
});

test('new Africa landscape artwork uses the unchanged Europe 3:2 presentation and fresh coordinates',async()=>{
 const sharp=(await import('sharp')).default;
 const {width,height}=await sharp('src/assets/atlas/africa/africa-atlas.png').metadata();
 assert.deepEqual([width,height],[1536,1024]);
 const {AFRICA_REGIONAL_ZONES}=await import('../src/components/home/atlas/africaDestinations.js');
 const expectedZones={morocco:[480,160,180,115],egypt:[860,235,180,130],senegal:[340,320,120,100],ghana:[470,395,150,90],kenya:[1120,475,170,110],tanzania:[1080,610,170,105],rwanda:[892,515,110,95],namibia:[675,750,150,120],'south-africa':[830,900,170,95]};
 assert.deepEqual(AFRICA_REGIONAL_ZONES,expectedZones);
 const {atlasStyle,artworkCoordinate}=await import('../src/components/home/atlas/atlasConfig.js');
 assert.deepEqual(atlasStyle('africa.png').sources.europe.coordinates,[artworkCoordinate(0,0),artworkCoordinate(1,0),artworkCoordinate(1,1),artworkCoordinate(0,1)]);
});
