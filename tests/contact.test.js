import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {MemoryRouter} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import i18n from "i18next";

test("Contact postcard preserves localized accessible fields, validation, real submission and recovery", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error", server: {middlewareMode: true, hmr: false, ws: false},
        optimizeDeps: {noDiscovery: true, include: []}, ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const dom = new JSDOM('<div id="root"></div>', {url: "https://www.shortbreakhub.com/contact"});
    const globals = Object.fromEntries(["window", "document", "IS_REACT_ACT_ENVIRONMENT"].map(key => [key, globalThis[key]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
    const {createRoot} = await import("react-dom/client");
    let root, api, previousAdapter;
    try {
        const {default: Contact} = await vite.ssrLoadModule("/src/pages/ContactPage.jsx");
        await vite.ssrLoadModule("/src/i18n.js");
        api = (await vite.ssrLoadModule("/src/api.js")).publicApi;
        previousAdapter = api.defaults.adapter;
        const requests = [];
        api.defaults.adapter = config => new Promise((resolve, reject) => requests.push({config, resolve, reject}));
        const input = async (name, value) => React.act(async () => {
            const el = document.querySelector('[name="' + name + '"]');
            const proto = name === "message" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
            el.dispatchEvent(new window.Event("input", {bubbles: true}));
        });
        const submit = async () => React.act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", {bubbles: true, cancelable: true})));
        const button = () => document.querySelector('button[type="submit"]');
        for (const language of ["en", "fr"]) await t.test(language + ": semantic postcard and inherited validation", async () => {
            await i18n.changeLanguage(language);
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(HelmetProvider, {context: {}},
                React.createElement(MemoryRouter, null, React.createElement(Contact)))));
            assert.equal(document.querySelector("h1").textContent, i18n.t("contactPage.heading"));
            assert.equal(document.querySelector("main").lang, language);
            assert.equal(document.querySelectorAll("form").length, 1);
            assert.equal(document.querySelectorAll("form input,form textarea").length, 3);
            for (const field of document.querySelectorAll("input,textarea")) {
                assert.equal(field.labels.length, 1); assert.ok(field.labels[0].textContent);
                assert.equal(field.required, true);
                if (field.name !== "email") assert.ok(document.getElementById(field.getAttribute("aria-describedby")).textContent);
            }
            assert.equal(document.querySelector('input[name="email"]').type, "email");
            assert.equal(document.querySelector(".contact-postmarks").getAttribute("aria-hidden"), "true");
            assert.doesNotMatch(document.body.innerHTML, /contact-vintage-postcard-reference|hello@shortbreakhub|1–2 working days/);
            assert.ok(button().disabled);
            await submit(); assert.equal(requests.length, 0, "invalid form never contacts the backend");
            await input("name", "J"); await input("email", "jane@example.com"); await input("message", "a".repeat(51));
            assert.ok(button().disabled);
            await input("name", "Jane Doe"); assert.ok(!button().disabled);
            for (const length of [50, 2001]) {await input("message", "a".repeat(length)); assert.ok(button().disabled);}
            await input("message", "a".repeat(2000)); assert.ok(!button().disabled);
            await input("email", "invalid"); assert.ok(button().disabled);
            await React.act(async () => root.unmount()); root = null;
        });
        await t.test("pending, duplicate-submit locking, failure retains draft, retry succeeds only after API confirmation", async () => {
            await i18n.changeLanguage("en");
            root = createRoot(document.getElementById("root"));
            await React.act(async () => root.render(React.createElement(HelmetProvider, {context: {}},
                React.createElement(MemoryRouter, null, React.createElement(Contact)))));
            const message = "We would love to share a travel idea with the Short Break Hub team.";
            await input("name", "Jane Doe"); await input("email", "jane@example.com"); await input("message", message);
            await submit(); await submit();
            assert.equal(requests.length, 1); assert.equal(requests[0].config.url, "/contact");
            assert.equal(requests[0].config.method, "post");
            assert.deepEqual(JSON.parse(requests[0].config.data), {name: "Jane Doe", email: "jane@example.com", message});
            assert.equal(document.querySelector("form").getAttribute("aria-busy"), "true");
            assert.ok(document.querySelector("fieldset").disabled); assert.ok(button().disabled);
            assert.equal(document.querySelector('[role="status"]').textContent, "", "no premature delivery confirmation");
            await React.act(async () => requests[0].reject(new Error("offline")));
            assert.ok(document.querySelector('[role="alert"]').textContent.includes(i18n.t("contactPage.error")));
            assert.equal(document.querySelector("textarea").value, message); assert.ok(!button().disabled);
            await submit(); assert.equal(requests.length, 2);
            await React.act(async () => requests[1].resolve({data: {saved: true}, status: 200, headers: {}, config: requests[1].config}));
            assert.equal(document.querySelector("form").getAttribute("aria-busy"), "false");
            assert.ok(document.querySelector('[role="status"]').textContent.includes(i18n.t("contactPage.messageSent")));
            assert.equal(document.querySelector("textarea").value, ""); assert.equal(document.querySelector('input[name="name"]').value, "");
            assert.ok(button().disabled); assert.equal(document.querySelector('[role="alert"]'), null);
        });
    } finally {
        if (root) await React.act(async () => root.unmount());
        if (api) api.defaults.adapter = previousAdapter;
        await i18n.changeLanguage("en"); await vite.close(); dom.window.close();
        for (const [key, value] of Object.entries(globals)) {if (value === undefined) delete globalThis[key]; else globalThis[key] = value;}
    }
});
