import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {createRoot} from "react-dom/client";
import {JSDOM} from "jsdom";
import useTripPrepProgress, {tripPrepKey, TRIP_PREP_TASKS, TRIP_PREP_RETENTION} from "../src/hooks/useTripPrepProgress.js";

const blank = () => Object.fromEntries(TRIP_PREP_TASKS.map(id => [id, false]));
const record = (updatedAt, ids = []) => ({version: 1, updatedAt, done: {...blank(), ...Object.fromEntries(ids.map(id => [id, true]))}});
async function harness(run) {
    const dom = new JSDOM('<div id="root"></div>', {url: "https://shortbreakhub.com"});
    const keys = ["window", "document", "IS_REACT_ACT_ENVIRONMENT"];
    const saved = Object.fromEntries(keys.map(k => [k, globalThis[k]]));
    Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true});
    const realNow = Date.now;
    let now = 1800000000000, value, root;
    const renders = [];
    Date.now = () => now;
    function Probe({slug}) {value = useTripPrepProgress(slug); renders.push({slug, done: {...value.prepDone}}); return React.createElement("div", null, JSON.stringify(value.prepDone));}
    const mount = async (slug = "bali") => {
        root ??= createRoot(document.getElementById("root"));
        await React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Probe, {slug}))));
    };
    const unmount = async () => {await React.act(async () => root.unmount()); root = null;};
    const change = async fn => React.act(async () => fn(value));
    try {await run({mount, unmount, change, get value() {return value;}, storage: window.localStorage, renders, now: () => now, advance: ms => {now += ms;}});}
    finally {if (root) await unmount(); Date.now = realNow; dom.window.close(); for (const k of keys) {if (saved[k] === undefined) delete globalThis[k]; else globalThis[k] = saved[k];}}
}

test("Bali/Kyoto route reuse, return and refresh isolate all seven tasks and stale callbacks", () => harness(async h => {
    await h.mount();
    await h.change(v => v.markPrepDone("hotel"));
    const bali = h.storage.getItem(tripPrepKey("bali")), stale = h.value;
    await h.mount("kyoto");
    assert.deepEqual(h.value.prepDone, blank(), "route render selects a fresh itinerary before any persistence");
    assert.ok(h.renders.filter(r => r.slug === "kyoto").every(r => !r.done.hotel), "even the first reused render cannot expose Bali progress");
    await h.change(() => stale.markAllPrepDone());
    assert.equal(h.storage.getItem(tripPrepKey("kyoto")), null, "old callbacks cannot write under the new key");
    assert.equal(h.storage.getItem(tripPrepKey("bali")), bali);
    await h.change(v => v.markAllPrepDone());
    assert.deepEqual(Object.keys(h.value.prepDone), TRIP_PREP_TASKS);
    assert.ok(TRIP_PREP_TASKS.every(id => h.value.prepDone[id]));
    await h.mount("bali"); assert.equal(h.value.prepDone.hotel, true); assert.equal(h.value.prepDone.car, false);
    await h.unmount(); await h.mount("bali"); assert.equal(h.value.prepDone.hotel, true);
    await h.change(v => v.resetPrep()); assert.deepEqual(h.value.prepDone, blank());
    await h.mount("kyoto"); assert.ok(TRIP_PREP_TASKS.every(id => h.value.prepDone[id]));
    await h.change(v => v.resetPrep()); assert.deepEqual(h.value.prepDone, blank(), "reset includes car");
}));

test("timestamps change only on actual modifications, never reads, refreshes or no-ops", () => harness(async h => {
    await h.mount(); await h.change(v => v.resetPrep());
    assert.equal(h.storage.length, 0);
    await h.change(v => v.markPrepDone("hotel")); const saved = h.storage.getItem(tripPrepKey("bali"));
    h.advance(1000); await h.change(v => v.markPrepDone("hotel")); await h.change(v => v.markPrepDone("unknown"));
    await h.mount("kyoto"); await h.mount("bali"); await h.unmount(); await h.mount();
    assert.equal(h.storage.getItem(tripPrepKey("bali")), saved);
    await h.change(v => v.markAllPrepDone()); const all = h.storage.getItem(tripPrepKey("bali"));
    h.advance(1000); await h.change(v => v.markAllPrepDone()); assert.equal(h.storage.getItem(tripPrepKey("bali")), all);
    await h.change(v => v.resetPrep()); assert.equal(JSON.parse(h.storage.getItem(tripPrepKey("bali"))).updatedAt, h.now());
}));

test("60-day expiry is independent and removes only the expired itinerary", () => harness(async h => {
    h.storage.setItem(tripPrepKey("bali"), JSON.stringify(record(h.now() - TRIP_PREP_RETENTION, ["hotel"])));
    const fresh = JSON.stringify(record(h.now() - TRIP_PREP_RETENTION + 1000, ["car"]));
    h.storage.setItem(tripPrepKey("kyoto"), fresh); h.storage.setItem("unrelated", "keep");
    await h.mount(); assert.deepEqual(h.value.prepDone, blank()); assert.equal(h.storage.getItem(tripPrepKey("bali")), null);
    await h.mount("kyoto"); assert.equal(h.value.prepDone.car, true); assert.equal(h.storage.getItem(tripPrepKey("kyoto")), fresh);
    h.advance(1000); await h.mount("bali"); await h.mount("kyoto");
    assert.deepEqual(h.value.prepDone, blank()); assert.equal(h.storage.getItem(tripPrepKey("kyoto")), null);
    assert.equal(h.storage.getItem("unrelated"), "keep");
}));

test("legacy, malformed, unsupported and invalid identifiers never become itinerary progress", () => harness(async h => {
    h.storage.setItem("tripPrepStatus", JSON.stringify({hotel: true}));
    h.storage.setItem("unrelated", "keep"); await h.mount();
    assert.deepEqual(h.value.prepDone, blank()); assert.equal(h.storage.getItem("tripPrepStatus"), null);
    for (const bad of ['{', '[]', JSON.stringify({...record(h.now(), ["car"]), version: 2}), JSON.stringify({...record(h.now()), updatedAt: h.now()+1}), JSON.stringify({version: 1, updatedAt: h.now(), done: {hotel: "true"}})]) {
        await h.unmount(); h.storage.setItem(tripPrepKey("bali"), bad); await h.mount();
        assert.deepEqual(h.value.prepDone, blank());
    }
    for (const slug of [undefined, "", "../bali", "Bali", "bali?x=1"]) {
        assert.equal(tripPrepKey(slug), null); await h.mount(slug === undefined ? "" : slug);
        await h.change(v => v.markAllPrepDone()); assert.deepEqual(h.value.prepDone, blank());
    }
    assert.equal(h.storage.getItem("unrelated"), "keep");
}));

test("unavailable and quota-limited storage retain usable in-memory, itinerary-scoped progress", () => harness(async h => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {configurable: true, get() {throw new Error("blocked");}});
    await h.mount(); await h.change(v => v.markPrepDone("hotel"));
    await h.mount("kyoto"); assert.deepEqual(h.value.prepDone, blank());
    await h.mount("bali"); assert.equal(h.value.prepDone.hotel, true);
    Object.defineProperty(window, "localStorage", descriptor);
    const original = window.Storage.prototype.setItem;
    window.Storage.prototype.setItem = () => {throw new Error("quota");};
    try {
        await h.change(v => v.markPrepDone("car")); await h.mount("kyoto"); await h.mount("bali");
        assert.equal(h.value.prepDone.car, true);
    } finally {window.Storage.prototype.setItem = original;}
}));

test("cross-tab updates, removals and expiry synchronize only the relevant key without writing", () => harness(async h => {
    await h.mount();
    const key = tripPrepKey("bali"), next = JSON.stringify(record(h.now(), ["docs"]));
    const event = async k => h.change(() => window.dispatchEvent(new window.StorageEvent("storage", {key: k, storageArea: h.storage})));
    h.storage.setItem(tripPrepKey("kyoto"), next); await event(tripPrepKey("kyoto")); assert.deepEqual(h.value.prepDone, blank());
    h.storage.setItem(key, next); h.advance(1000); await event(key);
    assert.equal(h.value.prepDone.docs, true); assert.equal(h.storage.getItem(key), next);
    h.storage.removeItem(key); await event(key); assert.deepEqual(h.value.prepDone, blank());
    h.storage.setItem(key, JSON.stringify(record(h.now() - TRIP_PREP_RETENTION, ["docs"])));
    await event(key); assert.deepEqual(h.value.prepDone, blank()); assert.equal(h.storage.getItem(key), null);
    h.storage.setItem(key, next); await event(key); h.storage.clear(); await event(null); assert.deepEqual(h.value.prepDone, blank());
}));


test("active progress expires without extending timestamps while the itinerary stays open", t => harness(async h => {
    t.mock.timers.enable({apis: ["setTimeout"]});
    const key = tripPrepKey("bali");
    h.storage.setItem(key, JSON.stringify(record(h.now() - TRIP_PREP_RETENTION + 2000, ["hotel"])));
    await h.mount(); assert.equal(h.value.prepDone.hotel, true);
    h.advance(2000);
    await React.act(async () => t.mock.timers.tick(2000));
    assert.deepEqual(h.value.prepDone, blank()); assert.equal(h.storage.getItem(key), null);
}));


test("returning to an inactive itinerary honors storage removal rather than resurrecting saved cache", () => harness(async h => {
    await h.mount(); await h.change(v => v.markPrepDone("hotel"));
    await h.mount("kyoto"); h.storage.removeItem(tripPrepKey("bali"));
    await h.mount("bali"); assert.deepEqual(h.value.prepDone, blank());
    assert.equal(h.storage.getItem(tripPrepKey("bali")), null);
}));

test("a no-op after expiry clears stale in-memory progress even before the expiry timer runs", () => harness(async h => {
    await h.mount(); await h.change(v => v.markPrepDone("hotel"));
    h.advance(TRIP_PREP_RETENTION);
    await h.change(v => v.resetPrep());
    assert.deepEqual(h.value.prepDone, blank());
    assert.equal(h.storage.getItem(tripPrepKey("bali")), null);
}));

test("cross-tab deletion of an inactive itinerary clears its unsaved fallback", () => harness(async h => {
    await h.mount();
    const original = window.Storage.prototype.setItem;
    window.Storage.prototype.setItem = () => {throw new Error("quota");};
    try {await h.change(v => v.markPrepDone("hotel"));} finally {window.Storage.prototype.setItem = original;}
    await h.mount("kyoto");
    await h.change(() => window.dispatchEvent(new window.StorageEvent("storage", {key: tripPrepKey("bali"), newValue: null, storageArea: h.storage})));
    await h.mount("bali");
    assert.deepEqual(h.value.prepDone, blank());
}));
