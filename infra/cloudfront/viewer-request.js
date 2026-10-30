// Based on LIVE 2026-10-30; legacy rules below are preserved.
var PUBLIC_ITINERARY_HASHES = "__PUBLIC_ITINERARY_HASHES__";
var crypto = require('crypto');

function itineraryRequest(request) {
    var path = request.uri.replace(/\/+$/, '');
    var slug = decode(path.slice('/itinerary/'.length));
    if (slug !== null) slug = slug.replace(/\/index\.html$/, '').toLowerCase();
    if (slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
        && PUBLIC_ITINERARY_HASHES.indexOf('|' + crypto.createHash('sha256').update(slug).digest('base64url').slice(0, 22) + '|') !== -1) {
        var canonical = '/itinerary/' + slug;
        if (request.uri !== canonical) return {
            statusCode: 301,
            headers: {location: {value: canonical + rawQuery(request.querystring || {})},
                'cache-control': {value: 'public, max-age=86400'}}
        };
        request.uri = canonical + '/index.html';
        return request;
    }
    return {statusCode: 404, statusDescription: 'Not Found',
        headers: {'content-type': {value: 'text/html; charset=utf-8'},
            'cache-control': {value: 'no-store'}, 'x-robots-tag': {value: 'noindex,follow'}},
        body: {encoding: 'text', data: '<!doctype html><html lang="en"><head><meta name="robots" content="noindex,follow"><title>Page not found | Short Breaks Hub</title></head><body><main><h1>Page not found</h1><a href="/">Back to home</a></main></body></html>'}};
}

var REGION_PATHS = {
    "southeast-asia": "/southeast-asia",
    "east-asia": "/east-asia",
    "europe": "/europe",
    "americas": "/americas",
    "oceania": "/Oceania",
    "africa": "/africa",
    "america": "/americas",
    "north_america": "/americas",
    "south_america": "/americas",
    "anz": "/Oceania",
    "australia-new-zealand": "/Oceania",
    "north-africa": "/africa"
};

var PRERENDERED_PATHS = {"/contact": true};

var SPA_PATHS = {
    "/login": true,
    "/register": true,
    "/profile": true,
    "/create-itinerary": true,
    "/live-weather": true,
    "/verify-email": true,
    "/api/auth/verify-email": true,
    "/map": true,
    "/forgot-password": true,
    "/reset-password": true,
    "/privacy": true,
    "/terms": true,
    "/community-itineraries/region": true
};


var SPA_PREFIXES = ["/itinerary/", "/user-itinerary/", "/community-itineraries/region/"];

var COUNTRY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function countrySlug(name) {
    var value = typeof name.normalize === "function" ? name.normalize("NFKD") : name;
    return value.replace(/[̀-ͯ]/g, "")
        .trim().toLowerCase().replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function decode(segment) {
    try {
        return decodeURIComponent(segment);
    } catch (e) {
        return null;
    }
}


function canonicalPath(path) {
    if (path === "/") return "/";
    var segments = path.slice(1).split("/");
    var lower = path.toLowerCase();

    if (segments.length === 1) {
        var name = decode(segments[0]);
        if (name === null) return null;
        name = name.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(REGION_PATHS, name)) return REGION_PATHS[name];
        if (PRERENDERED_PATHS["/" + name] || SPA_PATHS["/" + name]) return "/" + name;
        return null;
    }

    if (segments.length === 2 && segments[0].toLowerCase() === "browse") {
        var country = decode(segments[1]);
        var slug = country === null ? "" : countrySlug(country);
        return slug ? "/browse/" + slug : null;
    }

    if (SPA_PATHS[lower]) return lower;

    for (var i = 0; i < SPA_PREFIXES.length; i++) {
        var prefix = SPA_PREFIXES[i];
        if (lower.indexOf(prefix) === 0 && path.length > prefix.length) {
            return prefix + path.slice(prefix.length);
        }
    }
    return null;
}


function rawQuery(querystring) {
    var parts = [];
    for (var key in querystring) {
        if (!Object.prototype.hasOwnProperty.call(querystring, key)) continue;
        var entry = querystring[key];
        var values = entry.multiValue ? entry.multiValue : [entry];
        for (var i = 0; i < values.length; i++) {
            var value = values[i].value;
            parts.push(value === undefined || value === "" ? key : key + "=" + value);
        }
    }
    return parts.length ? "?" + parts.join("&") : "";
}

function handler(event) {
    var request = event.request;
    var scope = request.uri;
    for (var d = 0; d < 3; d++) {
        var decoded = decode(scope);
        if (decoded === null || decoded === scope) break;
        scope = decoded;
    }
    if (/(^|\/)itinerary(?:\/|$)/i.test(scope)) return itineraryRequest(request);
    var uri = request.uri;
    var path = uri.length > 1 ? uri.replace(/\/+$/, "") || "/" : uri;
    var canonical = canonicalPath(path);

    if (canonical === null) return request;

    if (canonical !== uri) {
        return {
            statusCode: 301,
            statusDescription: "Moved Permanently",
            headers: {
                location: {value: canonical + rawQuery(request.querystring || {})},
                "cache-control": {value: "public, max-age=86400"}
            }
        };
    }

    if (canonical === "/") {
        request.uri = "/index.html";
    } else if (PRERENDERED_PATHS[canonical] || canonical.indexOf("/browse/") === 0
        || REGION_PATHS[canonical.slice(1).toLowerCase()] === canonical) {
        request.uri = canonical + "/index.html";
    } else {
        request.uri = "/app-shell.html";
    }
    return request;
}
