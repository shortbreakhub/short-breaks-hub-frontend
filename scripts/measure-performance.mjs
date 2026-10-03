import {readFileSync, readdirSync, statSync} from "node:fs";
import {resolve, relative} from "node:path";
import {gzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const walk = path => readdirSync(path).flatMap(name => {
    const file = resolve(path, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
});
export function measurePerformance() {
    const dist = resolve(root, "dist");
    const manifest = JSON.parse(readFileSync(resolve(dist, ".vite/manifest.json"), "utf8"));
    const visited = new Set();
    function visit(key) {
        if (visited.has(key)) return;
        visited.add(key);
        for (const dependency of manifest[key].imports || []) visit(dependency);
    }
    visit("index.html");
    const files = walk(dist);
    const chunks = files.filter(file => /\.(js|css)$/.test(file)).map(file => ({
        file: relative(dist, file), raw: statSync(file).size, gzip: gzipSync(readFileSync(file), {level: 9}).length,
    })).sort((a, b) => b.raw - a.raw);
    const initialFiles = [...visited].map(key => manifest[key].file);
    const initialJs = chunks.filter(chunk => initialFiles.includes(chunk.file));
    const sources = walk(resolve(root, "src/assets"));
    return {
        sourceAssetBytes: sources.reduce((sum, file) => sum + statSync(file).size, 0),
        productionBytes: files.reduce((sum, file) => sum + statSync(file).size, 0),
        initialJsRaw: initialJs.reduce((sum, chunk) => sum + chunk.raw, 0),
        initialJsGzip: initialJs.reduce((sum, chunk) => sum + chunk.gzip, 0),
        initialFiles, chunks,
        largestImages: files.filter(file => /\.(jpg|jpeg|png|webp)$/.test(file))
            .map(file => ({file: relative(dist, file), bytes: statSync(file).size}))
            .sort((a, b) => b.bytes - a.bytes).slice(0, 10),
        prerenderedPages: files.filter(file => file.endsWith("/index.html")).length,
    };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    console.log(JSON.stringify(measurePerformance(), null, 2));
}
