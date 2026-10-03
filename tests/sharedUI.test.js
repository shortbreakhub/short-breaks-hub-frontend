import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createRoot} from "react-dom/client";
import {MemoryRouter} from "react-router-dom";
import {createServer} from "vite";
import {JSDOM} from "jsdom";
import {readFileSync, readdirSync, statSync} from "node:fs";

const walk = path => readdirSync(path).flatMap(name => {
    const file = `${path}/${name}`;
    return statSync(file).isDirectory() ? walk(file) : [file];
});

test("editorial primitives retain navigation, control, media and state semantics", async t => {
    const vite = await createServer({appType: "custom", logLevel: "error",
        server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []},
        ssr: {resolve: {externalConditions: ["node", "module-sync"]}}});
    const doms = [];
    try {
        const ui = await vite.ssrLoadModule("/src/components/ui/EditorialUI.jsx");
        const render = node => {
            const dom = new JSDOM(renderToStaticMarkup(React.createElement(MemoryRouter, null, node)));
            doms.push(dom); return dom.window.document;
        };
        await t.test("actions use real links for destinations and native buttons for work", () => {
            for (const variant of ["primary", "secondary", "quiet"]) {
                const doc = render(React.createElement("div", null,
                    React.createElement(ui.Action, {to: "/browse/france", variant}, "Découvrir les itinéraires"),
                    React.createElement(ui.Action, {href: "https://example.com/guide", target: "_blank", variant}, "Guide"),
                    React.createElement(ui.Action, {variant}, "Enregistrer")));
                assert.equal(doc.querySelector("a").getAttribute("href"), "/browse/france");
                assert.equal(doc.querySelector('a[target="_blank"]').rel, "noopener noreferrer");
                assert.equal(doc.querySelector("button").type, "button");
                assert.ok(!doc.querySelector("button[href], a[type]"));
            }
            assert.equal(render(React.createElement(ui.Action, {type: "submit"}, "Search")).querySelector("button").type, "submit");
            assert.throws(() => render(React.createElement(ui.Action, {to: "/", href: "/"}, "Invalid")), /exactly one/);
        });
        await t.test("disabled actions suppress activation and preserve accessible state", () => {
            let calls = 0;
            const doc = render(React.createElement("div", null,
                React.createElement(ui.Action, {disabled: true, onClick: () => calls++}, "Disabled"),
                React.createElement(ui.Action, {to: "/europe", disabled: true}, "Unavailable")));
            const button = doc.querySelector("button"); button.click(); assert.equal(calls, 0);
            assert.ok(button.disabled);
            const link = doc.querySelector("a");
            assert.equal(link.getAttribute("aria-disabled"), "true"); assert.equal(link.tabIndex, -1);
            assert.ok(!link.hasAttribute("href"));
        });
        await t.test("mounted actions activate only when enabled and disabled links cancel keyboard activation", async () => {
            const dom = new JSDOM('<div id="mount"></div>', {url: "https://www.shortbreakhub.com"});
            const keys = ["window", "document", "IS_REACT_ACT_ENVIRONMENT"];
            const saved = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
            Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
            const root = createRoot(document.getElementById("mount"));
            let active = 0, blocked = 0;
            try {
                await React.act(async () => root.render(React.createElement(MemoryRouter, null,
                    React.createElement(ui.Action, {onClick: () => active++}, "Enabled"),
                    React.createElement(ui.Action, {disabled: true, onClick: () => blocked++}, "Disabled"),
                    React.createElement(ui.Action, {to: "/europe", disabled: true, onClick: () => blocked++, onKeyDown: () => blocked++}, "Unavailable"))));
                const [enabled, disabled] = document.querySelectorAll("button");
                await React.act(async () => {enabled.click(); disabled.click(); document.querySelector("a").click();});
                assert.equal(active, 1); assert.equal(blocked, 0);
                for (const key of ["Enter", " "]) {
                    const event = new window.KeyboardEvent("keydown", {key, bubbles: true, cancelable: true});
                    document.querySelector("a").dispatchEvent(event);
                    assert.ok(event.defaultPrevented);
                }
                assert.equal(blocked, 0);
                enabled.focus(); assert.equal(document.activeElement, enabled);
                disabled.focus(); assert.equal(document.activeElement, enabled);
            } finally {
                await React.act(async () => root.unmount()); dom.window.close(); Object.assign(globalThis, saved);
            }
        });
        await t.test("icon actions require names and expose toggle states", () => {
            assert.throws(() => render(React.createElement(ui.Action, {iconOnly: true}, "☆")), /aria-label/);
            const doc = render(React.createElement(ui.Action, {iconOnly: true, "aria-label": "Enregistrer cet itinéraire", "aria-pressed": true}, "★"));
            assert.equal(doc.querySelector("button").getAttribute("aria-label"), "Enregistrer cet itinéraire");
            assert.equal(doc.querySelector("button").getAttribute("aria-pressed"), "true");
        });
        await t.test("editorial headers/cards keep headings and independent links/actions", () => {
            const doc = render(React.createElement("section", null,
                React.createElement(ui.SectionHeader, {id: "picks", title: "Choix de la rédaction", eyebrow: "À découvrir", description: "De nouvelles histoires", action: React.createElement(ui.EditorialLink, {to: "/europe"}, "Voir tout")}),
                React.createElement(ui.ContentCard, {title: "Saint-Rémy-de-Provence et les villages des Alpilles", to: "/browse/france",
                    metadata: ["4 jours", "Printemps"], headingLevel: 3,
                    action: React.createElement(ui.Action, {iconOnly: true, "aria-label": "Enregistrer"}, "☆")})));
            assert.equal(doc.querySelector("h2").id, "picks");
            assert.ok(doc.querySelector("article h3 a[href='/browse/france']"));
            assert.equal(doc.querySelectorAll("article ul li").length, 2);
            assert.equal(doc.querySelector("article a button"), null);
            assert.ok(doc.querySelector("article button"));
            assert.throws(() => render(React.createElement(ui.SectionHeader, {title: "Bad level", headingLevel: 0})), /heading level/);
        });
        await t.test("media retains explicit alt, dimensions and delivery decisions", () => {
            const attrs = {src: "/photo.webp", alt: "Les toits de Paris", srcSet: "/small.webp 480w, /large.webp 960w", sizes: "90vw", width: 960, height: 640};
            for (const loading of ["lazy", "eager"]) {
                const img = render(React.createElement(ui.Media, {...attrs, loading, fetchPriority: "high"})).querySelector("img");
                for (const [name, value] of Object.entries({alt: attrs.alt, width: "960", height: "640", sizes: attrs.sizes, srcset: attrs.srcSet, loading, decoding: "async", fetchpriority: "high"}))
                    assert.equal(img.getAttribute(name), value);
            }
            assert.throws(() => render(React.createElement(ui.Media, {src: "/photo.webp"})), /explicit alt/);
            assert.equal(render(React.createElement(ui.Media, {src: "/photo.webp", alt: ""})).querySelector("img").alt, "");
        });
        await t.test("native forms preserve labels, descriptions, validation and constraints", () => {
            for (const type of ["text", "search", "date", "number"]) {
                const doc = render(React.createElement(ui.Field, {label: "Date d’arrivée ou destination", type, hint: "Conseil", error: "Réessayez", min: 1, max: 12, "aria-describedby": "external", name: "destination", disabled: true}));
                const control = doc.querySelector("input");
                assert.equal(doc.querySelector("label").htmlFor, control.id); assert.ok(control.id);
                assert.equal(control.type, type); assert.equal(control.name, "destination"); assert.ok(control.disabled);
                assert.equal(control.getAttribute("aria-invalid"), "true");
                assert.equal(control.getAttribute("min"), "1"); assert.equal(control.getAttribute("max"), "12");
                const ids = control.getAttribute("aria-describedby").split(" ");
                assert.equal(ids[0], "external");
                assert.equal(doc.getElementById(ids[1]).textContent, "Conseil");
                assert.equal(doc.getElementById(ids[2]).getAttribute("role"), "alert");
            }
            const doc = render(React.createElement(ui.Field, {label: "Région", as: "select", required: true}, React.createElement("option", {value: "EU"}, "Europe")));
            assert.equal(doc.querySelector("select").value, "EU"); assert.ok(doc.querySelector("select").required);
        });
        await t.test("states distinguish loading, empty and recoverable error without hidden copy", () => {
            const loading = render(React.createElement(ui.ContentState, {kind: "loading", title: "Chargement…"}));
            assert.equal(loading.querySelector('[role="status"]').getAttribute("aria-busy"), "true");
            const empty = render(React.createElement(ui.ContentState, {title: "Aucun résultat"}));
            assert.equal(empty.querySelector('[role="alert"], [aria-busy="true"]'), null);
            const error = render(React.createElement(ui.ContentState, {kind: "error", title: "Impossible de charger", action: React.createElement(ui.Action, null, "Réessayer")}));
            assert.ok(error.querySelector('[role="alert"] button')); assert.equal(error.querySelector('[aria-busy="true"]'), null);
        });
    } finally {for (const dom of doms) dom.window.close(); await vite.close();}
});

test("development showcase is excluded from production entries, documents, links and sitemap files", () => {
    const files = walk("dist");
    const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
    assert.ok(!Object.keys(manifest).some(key => /src\/dev\//.test(key)));
    assert.ok(!files.some(file => /showcase|\/dev\//i.test(file)));
    for (const file of files.filter(file => /\.(html|js)$/.test(file) || /sitemap.*\.xml$/.test(file))) {
        assert.doesNotMatch(readFileSync(file, "utf8"), /\/src\/dev\/|editorialShowcase|development UI showcase/);
    }
    assert.match(readFileSync("src/dev/index.html", "utf8"), /noindex,nofollow/);
    // This repository advertises an externally managed sitemap; don't invent one.
    for (const file of walk("public").filter(file => /sitemap|robots/.test(file)))
        assert.doesNotMatch(readFileSync(file, "utf8"), /\/src\/dev\//);
});

test("semantic palette keeps readable text and distinguishable native control borders", () => {
    const css = readFileSync("src/styles/editorial.css", "utf8");
    const color = role => css.match(new RegExp(`--sbh-${role}: (#[0-9a-f]{6})`))[1];
    const luminance = hex => {
        const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
            .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    for (const surface of ["page", "surface", "surface-soft"])
        for (const text of ["ink", "secondary", "muted", "link", "error", "success"])
            assert.ok(ratio(color(text), color(surface)) >= 4.5, `${text} on ${surface} must have 4.5:1 contrast`);
    assert.ok(ratio(color("ink"), color("accent")) >= 4.5);
    assert.ok(ratio(color("control-border"), color("surface")) >= 3);
    assert.ok(ratio(color("focus"), color("page")) >= 3);
});
