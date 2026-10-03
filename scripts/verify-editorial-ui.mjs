import assert from "node:assert/strict";
import {chromium} from "playwright";
import {createServer} from "vite";
import {writeFile} from "node:fs/promises";

// Development entry only. Never opens booking providers or modifies product data.
const vite = await createServer({server: {host: "127.0.0.1", port: 0, open: false}, logLevel: "error"});
let browser;
const results = [];
try {
    await vite.listen();
    const origin = vite.resolvedUrls.local[0];
    browser = await chromium.launch({headless: true});
    for (const width of [1440, 768, 390]) for (const language of ["en", "fr"]) {
        const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: "reduce"});
        await context.route("**/*", route => new URL(route.request().url()).origin === new URL(origin).origin ? route.continue() : route.abort());
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(`${origin}src/dev/index.html`, {waitUntil: "networkidle"});
        await page.locator("h1").waitFor();
        if (language === "fr") await page.getByRole("button", {name: "Français", exact: true}).click();
        await page.locator(`.sbh-editorial[lang=${language}]`).waitFor();
        const layout = await page.evaluate(() => ({
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            columns: getComputedStyle(document.querySelector(".sbh-grid")).gridTemplateColumns.split(" ").length,
            unlabelledControls: [...document.querySelectorAll("input,select")].filter(control => !control.labels?.length).length,
            undersizedActions: [...document.querySelectorAll(".sbh-action,.sbh-link--navigation")].filter(control => {
                const box = control.getBoundingClientRect(); return box.width < 44 || box.height < 44;
            }).length,
            transition: getComputedStyle(document.querySelector(".sbh-action")).transitionDuration,
        }));
        assert.ok(layout.scrollWidth <= width, `${language}/${width}: horizontal overflow`);
        assert.equal(layout.columns, width >= 1024 ? 3 : width >= 640 ? 2 : 1);
        assert.equal(layout.unlabelledControls, 0); assert.equal(layout.undersizedActions, 0);
        assert.equal(layout.transition, "0s");
        const controls = page.locator(".sbh-action");
        await controls.first().focus();
        await page.keyboard.press("Tab");
        assert.equal(await controls.nth(1).evaluate(element => document.activeElement === element), true);
        const outline = await controls.nth(1).evaluate(element => {
            const style = getComputedStyle(element); return {style: style.outlineStyle, width: parseFloat(style.outlineWidth)};
        });
        assert.equal(outline.style, "solid"); assert.ok(outline.width >= 2);
        const save = page.locator(".sbh-action--icon");
        await save.focus(); await page.keyboard.press("Space");
        assert.equal(await save.getAttribute("aria-pressed"), "true");
        const enabled = page.getByRole("link", {name: language === "fr" ? "Lire le guide de voyage" : "Read the guide", exact: true});
        await enabled.focus(); await page.keyboard.press("Tab");
        assert.equal(await save.evaluate(element => document.activeElement === element), true, "Tab must skip both disabled actions");
        const search = page.locator('input[type="search"]');
        await search.fill("Saint-Rémy-de-Provence et les villages des Alpilles");
        assert.equal(await search.inputValue(), "Saint-Rémy-de-Provence et les villages des Alpilles");
        const retry = page.getByRole("button", {name: language === "fr" ? "Réessayer" : "Try again", exact: true});
        await retry.focus(); await page.keyboard.press("Enter");
        assert.equal(await page.locator('.sbh-state[role="alert"]').count(), 0, "retry resolves the error instead of indefinite loading");
        assert.equal(await page.locator('.sbh-state[role="status"][aria-busy="true"]').count(), 1);
        await page.screenshot({path: `/tmp/issue36-ui-${width}-${language}.png`, fullPage: true});
        await page.locator("section").nth(4).screenshot({path: `/tmp/issue36-cards-${width}-${language}.png`});
        assert.deepEqual(errors, []);
        results.push({width, language, ...layout, keyboardFocus: outline, errors});
        console.log(`${width}px/${language}: layout, labels, touch targets, reduced motion, keyboard and retry passed`);
        await context.close();
    }
    await writeFile("/tmp/issue36-ui-verification.json", JSON.stringify(results, null, 2));
} finally {
    await browser?.close(); await vite.close();
}
