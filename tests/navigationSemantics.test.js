import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToString} from "react-dom/server";
import {createRoot} from "react-dom/client";
import {MemoryRouter, useLocation} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

test("Navbar/Footer expose crawlable routes and preserve SPA, modified-click and mobile navigation", async () => {
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const savedGlobals = Object.fromEntries(["window", "document", "localStorage", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    let root, dom;
    try {
        const {default: Navbar} = await vite.ssrLoadModule("/src/components/Navbar.jsx");
        const {default: Footer} = await vite.ssrLoadModule("/src/components/Footer.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        if (i18n.isInitialized) await i18n.changeLanguage("en");
        let pathname;
        function Capture() {pathname = useLocation().pathname; return null;}
        const tree = React.createElement(MemoryRouter, {initialEntries: ["/"]},
            React.createElement(Navbar), React.createElement(Footer), React.createElement(Capture));
        const html = renderToString(tree);
        dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>',
            {url: "https://www.shortbreakhub.com", pretendToBeVisual: true});
        const prerender = new JSDOM(html);
        try {
            const doc = prerender.window.document;
            const footer = doc.querySelector('.journal-footer');
            assert.ok(footer);
            assert.equal(footer.querySelectorAll('a').length, 9, 'all existing footer routes remain');
            const email = footer.querySelector('input[type="email"]');
            assert.equal(email.getAttribute('aria-label'), i18n.t('footer.emailPlaceholder'));
            assert.equal(footer.querySelector('.journal-signup button').type, 'button', 'existing signup remains non-submitting');
            assert.equal(footer.querySelectorAll('img').length, 1);
            assert.match(footer.querySelector('img').getAttribute('src'), /footer-editorial-clean-master/);
            assert.ok(!footer.innerHTML.includes('mediterranean-coast') && !footer.innerHTML.includes('rustic-signpost'), 'scenery is integrated only once');
            for (const image of footer.querySelectorAll('img')) {
                assert.equal(image.alt, '');
                assert.equal(image.getAttribute('aria-hidden'), 'true');
                assert.equal(image.getAttribute('loading'), 'lazy');
                assert.ok(image.width && image.height);
            }
            assert.ok(!footer.innerHTML.includes('footer-editorial-reference'));
            assert.equal(footer.querySelector('.journal-closing p').textContent, 'Short Breaks. Big Stories.');
            const brand = doc.querySelector('.journey-brand');
            assert.equal(brand.getAttribute('href'), '/');
            // Branding is painted in the responsive mastheads; the home link has its own accessible name.
            assert.equal(brand.getAttribute('aria-label'), 'Short Break Hub');
            assert.equal(brand.querySelector('img'), null);
            assert.ok(!html.includes('data:image/gif'));
            assert.ok(!html.includes('shortbreakhub-logo-mobile'));
            assert.match(doc.querySelector('.journey-scenery-frame source[media="(max-width: 767px)"]').getAttribute('srcset'), /masthead-mobile/);
            assert.ok(!html.includes('shortbreakhub-logo-desktop') && !html.includes('shortbreakhub-logo-mark'));
            const scenery = doc.querySelector('.journey-scenery');
            assert.match(scenery.getAttribute('src'), /shortbreakhub-navbar-masthead/);
            assert.match(scenery.parentElement.querySelector('source').getAttribute('srcset'), /masthead-compact/);
            assert.equal(scenery.parentElement.querySelector('source').getAttribute('media'), '(min-width: 768px) and (max-width: 1279px)');
            assert.equal(scenery.alt, '');
            assert.equal(scenery.getAttribute('aria-hidden'), 'true');
            assert.ok(!html.includes('navbar-reference') && !html.includes('navbar-mobile-reference'));
            assert.ok(doc.querySelector('[aria-current="location"]'));

            for (const route of ["/contact", "/live-weather", "/community-itineraries/region", "/login"]) {
                assert.ok(doc.querySelector(`nav a[href="${route}"]`));
                assert.ok(doc.querySelector(`footer a[href="${route}"]`));
            }
            for (const route of ["/privacy", "/terms", "/europe", "/southeast-asia", "/americas"]) {
                assert.ok(doc.querySelector(`footer a[href="${route}"]`));
            }
        } finally {prerender.window.close();}
        Object.assign(globalThis, {window: dom.window, document: dom.window.document,
            localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true});
        root = createRoot(document.getElementById("mount"));
        await React.act(async () => root.render(tree));
        const contact = document.querySelector('nav a[href="/contact"]');
        for (const options of [{ctrlKey: true}, {metaKey: true}, {shiftKey: true}, {altKey: true}, {button: 1}]) {
            const event = new window.MouseEvent("click", {bubbles: true, cancelable: true, ...options});
            await React.act(async () => {
                contact.dispatchEvent(event);
                assert.equal(event.defaultPrevented, false, "native new-tab/window behaviour must survive");
                // Stop jsdom's deferred document navigation after checking the link handler.
                event.preventDefault();
            });
            assert.equal(pathname, "/");
        }
        await React.act(async () => contact.click());
        assert.equal(pathname, "/contact", "ordinary link click remains SPA navigation");
        await React.act(async () => document.querySelector('footer a[href="/privacy"]').click());
        assert.equal(pathname, "/privacy");
        await React.act(async () => document.querySelector('footer a[href="/terms"]').click());
        assert.equal(pathname, "/terms");
        await React.act(async () => document.querySelector('button[aria-label="Open navigation menu"]').click());
        assert.equal(document.querySelector('.journey-menu-toggle').getAttribute('aria-expanded'), 'true');
        assert.equal(document.querySelectorAll('.journey-menu-icon > span').length, 3);
        assert.equal(document.querySelector('.journey-menu-icon').getAttribute('aria-hidden'), 'true');
        assert.equal(document.querySelector('.journey-menu-motto').textContent, 'Short Breaks. Big Stories.');
        await React.act(async () => document.querySelector('.journey-menu-toggle').dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true})));
        assert.equal(document.querySelector('.journey-menu-toggle').getAttribute('aria-expanded'), 'false');
        assert.equal(document.activeElement, document.querySelector('.journey-menu-toggle'));
        await React.act(async () => document.querySelector('.journey-menu-toggle').click());
        const mobileContact = [...document.querySelectorAll('header a[href="/contact"]')].at(-1);
        assert.equal(document.querySelectorAll('header a[href="/contact"]').length, 2);
        await React.act(async () => mobileContact.click());
        assert.equal(pathname, "/contact");
        assert.equal(document.querySelectorAll('header a[href="/contact"]').length, 1, "mobile menu closes after navigation");
        await React.act(async () => document.querySelector('[aria-haspopup="menu"]').click());
        assert.equal(document.querySelector('[aria-haspopup="menu"]').getAttribute('aria-expanded'), 'true');
        await React.act(async () => [...document.querySelectorAll('[role="menuitem"]')].find(button => button.textContent.includes('Français')).click());
        assert.equal(document.querySelector('[aria-haspopup="menu"]').getAttribute('aria-label'), 'Français');
        assert.equal(document.querySelector('[aria-haspopup="menu"]').getAttribute('aria-expanded'), 'false');
        assert.ok([...document.querySelectorAll('header a')].some(link => link.textContent === i18n.t('navbar.contact')));
        assert.equal(document.querySelector('.journal-footer h3').textContent, i18n.t('footer.explore'));
        assert.equal(document.querySelector('.journal-signup input').getAttribute('aria-label'), i18n.t('footer.emailPlaceholder'));
        assert.equal(document.querySelector('.journal-closing p').textContent, `${i18n.t('homeMagazine.hero.lineOne')} ${i18n.t('homeMagazine.hero.lineTwo')}`);
        await React.act(async () => i18n.changeLanguage('en'));
        localStorage.setItem("authToken", "fixture");
        await React.act(async () => document.querySelector('footer a[href="/terms"]').click());
        assert.ok(document.querySelector('nav a[href="/profile"]'));
        assert.ok([...document.querySelectorAll("button")].some(button => button.textContent === i18n.t("navbar.logout")),
            "logout remains an action button");
    } finally {
        if (root) await React.act(async () => root.unmount());
        await i18n.changeLanguage("en");
        await vite.close(); dom?.window.close();
        for (const [key, value] of Object.entries(savedGlobals)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
