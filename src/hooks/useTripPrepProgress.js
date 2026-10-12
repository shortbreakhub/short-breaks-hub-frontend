import {useEffect, useRef, useState} from "react";

export const TRIP_PREP_TASKS = Object.freeze(["hotel", "flights", "insurance", "airport", "car", "localTransport", "docs"]);
// Retain the legacy localTransport field for storage compatibility; transfer is optional.
export const TRIP_PREP_REQUIRED_TASKS = Object.freeze(TRIP_PREP_TASKS.filter(id => id !== "localTransport"));
export const TRIP_PREP_RETENTION = 60 * 24 * 60 * 60 * 1000;
const emptyProgress = () => Object.fromEntries(TRIP_PREP_TASKS.map(id => [id, false]));
export function tripPrepKey(slug) {
    return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
        ? `tripPrep:v1:${slug}` : null;
}
function storage() {
    try {return window.localStorage;} catch {return null;}
}
function remove(key) {
    try {storage()?.removeItem(key);} catch { /* Progress remains usable without storage. */ }
}
function parse(raw, now) {
    try {
        const record = JSON.parse(raw);
        if (record?.version !== 1 || !Number.isSafeInteger(record.updatedAt) || record.updatedAt < 0 || record.updatedAt > now ||
            !record.done || TRIP_PREP_TASKS.some(id => typeof record.done[id] !== "boolean")) return null;
        return {...record, done: Object.fromEntries(TRIP_PREP_TASKS.map(id => [id, record.done[id]]))};
    } catch {return null;}
}
function read(key, fallback, unsaved = false) {
    if (!key) return null;
    let record;
    try {
        const target = storage();
        record = target ? parse(target.getItem(key), Date.now()) : fallback;
        if (unsaved && fallback && (!record || fallback.updatedAt > record.updatedAt)) record = fallback;
    } catch {record = fallback;}
    if (record && Date.now() - record.updatedAt >= TRIP_PREP_RETENTION) {
        remove(key);
        return null;
    }
    return record ?? null;
}

export default function useTripPrepProgress(slug) {
    const key = tripPrepKey(slug);
    const activeKey = useRef(key);
    activeKey.current = key;
    const records = useRef(new Map());
    const unsaved = useRef(new Set());
    const [state, setState] = useState({key: null, record: null});

    useEffect(() => {
        // The old global record has no itinerary ownership and must never be migrated.
        remove("tripPrepStatus");
        const record = read(key, records.current.get(key), unsaved.current.has(key));
        records.current.set(key, record);
        setState({key, record});
        function onStorage(event) {
            const target = storage();
            if (event.storageArea && event.storageArea !== target) return;
            if (event.key === null) {
                records.current.clear();
                unsaved.current.clear();
            } else {
                records.current.delete(event.key);
                unsaved.current.delete(event.key);
            }
            if (event.key !== key && event.key !== null) return;
            const next = read(key, null);
            records.current.set(key, next);
            setState({key, record: next});
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [key]);

    const record = state.key === key ? state.record : null;
    useEffect(() => {
        if (!record || !key) return;
        let timer;
        function expire() {
            const remaining = record.updatedAt + TRIP_PREP_RETENTION - Date.now();
            if (remaining > 0) {
                timer = setTimeout(expire, Math.min(remaining, 2147483647));
            } else {
                const next = read(key, records.current.get(key), unsaved.current.has(key));
                records.current.set(key, next);
                setState({key, record: next});
            }
        }
        expire();
        return () => clearTimeout(timer);
    }, [key, record]);

    function update(change) {
        // Callbacks belong to one route; an old callback cannot write to a new route.
        if (!key || activeKey.current !== key) return;
        const previous = read(key, records.current.get(key), unsaved.current.has(key));
        records.current.set(key, previous);
        const current = previous?.done ?? emptyProgress();
        const done = change(current);
        if (TRIP_PREP_TASKS.every(id => done[id] === current[id])) {
            setState({key, record: previous});
            return;
        }
        const next = {version: 1, updatedAt: Date.now(), done};
        records.current.set(key, next);
        setState({key, record: next});
        try {
            const target = storage();
            if (!target) {unsaved.current.add(key); return;}
            target.setItem(key, JSON.stringify(next));
            unsaved.current.delete(key);
        } catch {unsaved.current.add(key); /* Keep entered progress in memory. */ }
    }
    return {
        prepDone: record?.done ?? emptyProgress(),
        markPrepDone(id) {if (TRIP_PREP_REQUIRED_TASKS.includes(id)) update(done => ({...done, [id]: true}));},
        resetPrep() {update(emptyProgress);},
        markAllPrepDone() {update(done => ({...done, ...Object.fromEntries(TRIP_PREP_REQUIRED_TASKS.map(id => [id, true]))}));},
    };
}
