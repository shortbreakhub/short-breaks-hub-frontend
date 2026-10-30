import {createHash} from 'node:crypto';
import {readFile, readdir, lstat, mkdir, writeFile, copyFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {REGIONS} from '../../src/config/regions.js';
import {generateEdgeCode} from '../build-edge-routing.mjs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function safeKey(key) {
  if (!key || key.startsWith('/') || key.includes('\\') || key.split('/').some(p => !p || p === '.' || p === '..' || p.startsWith('.')) || /[\x00-\x1f?#*]/.test(key)) throw new Error(`Unsafe output key: ${key}`);
  return key;
}
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon','.avif':'image/avif','.gif':'image/gif'};
async function walk(root, prefix = '') {
  const files = [];
  for (const name of await readdir(resolve(root, prefix))) {
    const key = prefix + name;
    const stat = await lstat(resolve(root, key));
    if (stat.isSymbolicLink()) throw new Error(`Symlink in build: ${key}`);
    if (key === '.vite') continue;
    safeKey(key);
    if (stat.isDirectory()) files.push(...await walk(root, key + '/'));
    else if (stat.isFile()) files.push(key);
    else throw new Error(`Unexpected build entry: ${key}`);
  }
  return files.sort();
}
export async function validateBuild(root = 'dist', output = '.deployment/release') {
  const keys = await walk(root);
  const keySet = new Set(keys);
  for (const key of ['index.html','app-shell.html','contact/index.html','robots.txt',...REGIONS.map(r => `${r.onClick}/index.html`)]) {
    if (!keySet.has(key)) throw new Error(`Missing required build output: ${key}`);
  }
  const vite = JSON.parse(await readFile(resolve(root,'.vite/manifest.json')));
  for (const entry of Object.values(vite)) for (const key of [entry.file,...(entry.css || []),...(entry.assets || [])]) {
    if (!keySet.has(key)) throw new Error(`Missing Vite asset: ${key}`);
  }
  const files = [];
  for (const key of keys) {
    const bytes = await readFile(resolve(root,key));
    const type = types[key.slice(key.lastIndexOf('.')).toLowerCase()];
    if (!type || !bytes.length || bytes.length > 512 * 1024 * 1024) throw new Error(`Unsupported/empty/oversized file: ${key}`);
    const phase = key.endsWith('.html') ? 'html' : key.startsWith('assets/') ? 'assets' : 'public';
    files.push({key,sha256:sha256(bytes),size:bytes.length,contentType:type,phase});
    if (phase !== 'assets') {
      await mkdir(dirname(resolve(output,'files',key)),{recursive:true});
      await copyFile(resolve(root,key),resolve(output,'files',key));
    }
    if (phase === 'html') {
      const document = new JSDOM(bytes.toString()).window.document;
      if (!document.querySelector('#root') || !document.querySelector('script[type="module"][src]')) throw new Error(`Invalid document: ${key}`);
      for (const el of document.querySelectorAll('[src],link[href]')) {
        const url = el.getAttribute('src') || el.getAttribute('href');
        if (url?.startsWith('/assets/') && !keySet.has(decodeURI(url.slice(1)))) throw new Error(`Unresolved asset ${url} in ${key}`);
      }
      document.defaultView.close();
    }
  }
  const dailyPngs = new Set();
  const ssr = await createServer({appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
  try {
    const {getItineraryDayImages} = await ssr.ssrLoadModule('/src/content/itineraryDayImages.js');
    for (const route of files.filter(f => f.key.startsWith('itinerary/') && f.key.endsWith('/index.html'))) {
      for (const [day,image] of Object.entries(getItineraryDayImages(route.key.split('/')[1]))) {
        if (!image.src?.startsWith('/src/assets/itineraries/')) throw new Error(`Unresolved mapped daily image: ${route.key}, day ${day}`);
        const source = decodeURI(image.src.slice(1));
        const entry = vite[source];
        const built = entry && files.find(f => f.key === entry.file);
        if (!source.endsWith('.png') || !built || built.sha256 !== sha256(await readFile(source))) throw new Error(`Daily PNG mismatch: ${source}`);
        dailyPngs.add(entry.file);
      }
    }
  } finally { await ssr.close(); }
  if (!dailyPngs.size) throw new Error('No daily itinerary PNGs emitted');
  const inventory=JSON.parse(await readFile('.deployment/edge/inventory.json','utf8'));
  const edgeCode=await readFile('.deployment/edge/function.js');
  const builtSlugs=files.filter(f=>f.key.startsWith('itinerary/')&&f.key.endsWith('/index.html')).map(f=>f.key.split('/')[1]).sort();
  const edgeTemplate=await readFile('infra/cloudfront/viewer-request.js','utf8');
  if (JSON.stringify(inventory.slugs)!==JSON.stringify(builtSlugs) || sha256(edgeCode)!==inventory.codeSha256 || edgeCode.toString()!==generateEdgeCode(edgeTemplate,builtSlugs)) throw new Error('Stale/tampered edge release');
  const manifest = {version:1,commit:process.env.GITHUB_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),createdAt:new Date().toISOString(),files,dailyPngs:[...dailyPngs].sort(),edgeCodeSha256:inventory.codeSha256};
  await mkdir(output,{recursive:true});
  // Edge inventory is a release artifact, never an S3 public object.
  await mkdir(resolve(output,'edge'),{recursive:true});
  for (const name of ['function.js','inventory.json']) await copyFile(resolve('.deployment/edge',name),resolve(output,'edge',name));
  await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Validated ${files.length} files and ${dailyPngs.size} mapped daily PNGs. Internal Vite metadata excluded.`);
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateBuild();
