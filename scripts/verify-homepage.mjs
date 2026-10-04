import assert from "node:assert/strict";
import {chromium} from "playwright";
import {createServer} from "vite";
import {readFile, writeFile} from "node:fs/promises";

// Real dev homepage, deterministic existing API fixtures, no affiliate clicks.
const vite = await createServer({server: {host: "127.0.0.1", port: 0, open: false}, logLevel: "error"});
let browser;
const results = [];
const bootstrap = async path => JSON.parse((await readFile(`dist/${path}/index.html`, "utf8")).match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
try {
    await vite.listen(); const origin = vite.resolvedUrls.local[0];
    browser = await chromium.launch({headless: true});
    for (const width of [1440, 768, 390]) for (const language of ["en", "fr"]) {
        const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: "reduce"});
        let failCountries = true;
        await context.route("**/*", async route => {
            const url = new URL(route.request().url());
            if (url.origin === new URL(origin).origin) return route.continue();
            if (url.pathname.includes("/itineraries/region/")) {
                if (failCountries) return route.fulfill({status: 503, json: {}});
                return route.fulfill({json: (await bootstrap(url.pathname.split("/").at(-1))).countries});
            }
            if (url.pathname.includes("/itineraries/browse/")) return route.fulfill({json: (await bootstrap(`browse/${url.pathname.split("/").at(-1).toLowerCase()}`)).items});
            return route.abort();
        });
        const page = await context.newPage(); const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(origin, {waitUntil: "networkidle"});
        if (language === "fr") {
            await page.getByRole("button", {name: /English/}).filter({visible: true}).click();
            await page.getByRole("menuitem", {name: /Français/}).click();
        }
        await page.locator(`.home-page[lang=${language}]`).waitFor();
        assert.equal(await page.locator("h1").textContent(), language === "en" ? "Short Breaks. Big Stories." : "Petites escapades. Grandes histoires.");
        const layout = await page.evaluate(() => ({
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            visibleLandmarks: [...document.querySelectorAll(".atlas-destination")].filter(el => el.getBoundingClientRect().width > 0).length,
            unlabelledControls: [...document.querySelectorAll("main select")].filter(el => !el.labels?.length).length,
            undersizedActions: [...document.querySelectorAll("main .sbh-action, .atlas-destination a")].filter(el => {
                const box = el.getBoundingClientRect(); return box.width > 0 && (box.width < 44 || box.height < 44);
            }).length,
            aboveFoldImages: [...document.querySelectorAll("img")].filter(el => {
                const r = el.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 0;
            }).map(el => ({src: new URL(el.currentSrc).pathname, alt: el.alt, width: el.clientWidth, height: el.clientHeight})),
        }));
        assert.ok(layout.scrollWidth <= width, `${width}/${language}: horizontal overflow`);
        assert.equal(layout.visibleLandmarks, 0);
        assert.equal(layout.unlabelledControls, 0); assert.equal(layout.undersizedActions, 0);
        await page.screenshot({path: `/tmp/issue38-home-${width}-${language}.png`, fullPage: true});
        await page.locator(".home-hero").screenshot({path: `/tmp/issue38-hero-${width}-${language}.png`});
        await page.locator(".home-picks").screenshot({path: `/tmp/issue38-picks-${width}-${language}.png`});
        const region = page.locator("#home-region"), country = page.locator("#home-country");
        assert.equal(await country.isDisabled(), true);
        await region.selectOption("east-asia");
        await page.locator('[role="alert"]').waitFor();
        assert.equal(await page.locator('.discovery-feedback[role="status"]').count(), 0);
        failCountries = false;
        const retry = page.locator(".discovery-feedback button");
        await retry.focus(); await page.keyboard.press("Enter");
        await page.waitForFunction(() => !document.querySelector("#home-country").disabled);
        await region.focus(); await page.keyboard.press("Tab");
        assert.equal(await country.evaluate(el => document.activeElement === el), true);
        const focus = await country.evaluate(el => ({style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth)}));
        assert.equal(focus.style, "solid"); assert.ok(focus.width >= 2);
        await country.selectOption("China");
        const explore = page.locator('.home-discovery button[type="submit"]');
        assert.equal(await explore.isEnabled(), true);
        await region.selectOption("europe");
        assert.equal(await country.inputValue(), ""); assert.equal(await explore.isDisabled(), true);
        await page.waitForFunction(() => !document.querySelector("#home-country").disabled);
        await country.selectOption("France");
        if (width < 1024) {
            const menu = page.getByRole("button", {name: language === "fr" ? "Ouvrir le menu de navigation" : "Open navigation menu"});
            await menu.click(); assert.equal(await menu.getAttribute("aria-expanded"), "true");
            assert.equal(await page.locator('#navbar-menu a[href="/contact"]').isVisible(), true);
            await menu.click();
        }
        await explore.focus(); await page.keyboard.press("Enter");
        await page.waitForURL("**/browse/france");
        assert.deepEqual(errors, []);
        results.push({width, language, ...layout, keyboardFocus: focus, navigation: new URL(page.url()).pathname, errors});
        console.log(`${width}px/${language}: layout, discovery/retry/reset, native labels, touch targets, focus and navigation passed`);
        await context.close();
    }
    await writeFile("/tmp/issue38-homepage-verification.json", JSON.stringify(results, null, 2));
} finally {await browser?.close(); await vite.close();}
