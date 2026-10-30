// Local verification only: run the exact generated viewer-request function,
// then read its S3 key. Unlike Vite preview there is no implicit SPA fallback.
import {createServer} from 'node:http';
import {createContext, runInContext} from 'node:vm';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';

export function edgeHandler(code) {
    const context = createContext({require: createRequire(import.meta.url)});
    runInContext(code, context);
    return request => context.handler({request: structuredClone(request)});
}

export async function startSeoServer({dist = 'dist', code, onOriginRead = () => {}} = {}) {
    const route = edgeHandler(code || await readFile('.deployment/edge/function.js', 'utf8'));
    const root = resolve(dist);
    const server = createServer(async (req, res) => {
        try {
            const url = new URL(req.url, 'http://localhost');
            const querystring = {};
            for (const part of url.search.slice(1).split('&').filter(Boolean)) {
                const split = part.indexOf('=');
                const key = split === -1 ? part : part.slice(0, split);
                const entry = {value: split === -1 ? '' : part.slice(split + 1)};
                if (querystring[key]) querystring[key].multiValue = [...(querystring[key].multiValue || [{value: querystring[key].value}]), entry];
                else querystring[key] = entry;
            }
            const result = route({uri: url.pathname, method: req.method, headers: {host: {value: 'www.shortbreakhub.com'}}, querystring, cookies: {}});
            if (result.statusCode) {
                res.writeHead(result.statusCode, Object.fromEntries(Object.entries(result.headers || {}).map(([key, value]) => [key, value.value])));
                res.end(req.method === 'HEAD' ? undefined : result.body?.data || '');
                return;
            }
            const path = resolve(root, '.' + decodeURIComponent(result.uri));
            if (!path.startsWith(root + sep)) throw new Error('Outside origin');
            onOriginRead(result.uri);
            const bytes = await readFile(path);
            const type = path.endsWith('.html') ? 'text/html; charset=utf-8' : path.endsWith('.js') ? 'application/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.png') ? 'image/png' : path.endsWith('.jpg') ? 'image/jpeg' : path.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
            res.writeHead(200, {'content-type': type});
            res.end(req.method === 'HEAD' ? undefined : bytes);
        } catch {
            // Private S3 REST origins without ListBucket return 403 for missing keys.
            res.writeHead(403); res.end('AccessDenied');
        }
    });
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    return {origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(done => server.close(done))};
}
