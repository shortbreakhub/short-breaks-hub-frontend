import {useEffect, useState} from "react";

export function readPage(value) {
    if (!value || !Array.isArray(value.content) || !Number.isInteger(value.totalElements) || value.totalElements < 0 || !Number.isInteger(value.totalPages) || value.totalPages < 0) {
        throw new Error("Invalid journal collection");
    }
    return value;
}

export function ownedRecords(items, userId) {
    if (!Array.isArray(items) || items.some(item => String(item.userId) !== String(userId))) {
        throw new Error("Invalid owned journal collection");
    }
    return items;
}

export default function useJournalResource(loader, enabled, page, onUnauthorized) {
    const [result, setResult] = useState({status: "loading", data: null});
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        if (!enabled) return;
        let active = true;
        setResult({status: "loading", data: null, loader, page});
        Promise.resolve().then(() => loader(page)).then(data => {
            if (active) setResult({status: "ready", data, loader, page});
        }).catch(error => {
            if (!active) return;
            if ([401, 403].includes(error?.response?.status)) onUnauthorized();
            else setResult({status: "error", data: null, loader, page});
        });
        return () => { active = false; };
    }, [loader, enabled, page, revision, onUnauthorized]);
    const current = enabled && result.loader === loader && result.page === page ? result : {status: "loading", data: null};
    return {...current, retry: () => setRevision(value => value + 1)};
}
