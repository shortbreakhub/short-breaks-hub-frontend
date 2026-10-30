import {createHash} from 'node:crypto';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {validateOfficialSlug} from '../src/utils/officialItineraries.js';

export const SITEMAP_URL = 'https://www.shortbreakhub.com/sitemap.xml';
export const itineraryHash = slug => createHash('sha256').update(slug).digest('base64url').slice(0, 22);
export function sitemapItineraries(xml) {
    const dom = new JSDOM(xml, {contentType: 'application/xml'});
    try {
        const document = dom.window.document;
        if (document.documentElement.localName !== 'urlset') throw new Error('Expected sitemap urlset');
        const slugs = [];
        for (const loc of document.querySelectorAll('loc')) {
            const url = new URL(loc.textContent);
            if (url.origin !== 'https://www.shortbreakhub.com' || url.search || url.hash || url.href !== loc.textContent) throw new Error('Noncanonical sitemap URL');
            if (url.pathname.startsWith('/itinerary/')) slugs.push(validateOfficialSlug(url.pathname.slice(11)));
        }
        if (!slugs.length || new Set(slugs).size !== slugs.length) throw new Error('Empty or duplicate sitemap itinerary inventory');
        return slugs.sort();
    } finally { dom.window.close(); }
}

export function generateEdgeCode(template, slugs) {
    if (!slugs.length || new Set(slugs).size !== slugs.length) throw new Error('Empty or duplicate itinerary inventory');
    slugs.forEach(validateOfficialSlug);
    const hashes = slugs.map(itineraryHash);
    if (new Set(hashes).size !== slugs.length) throw new Error('Itinerary digest collision');
    // 132-bit SHA-256 prefixes fit the existing function's 10 KB limit without a new datastore.
    // This is public route membership, never an authentication mechanism.
    const code = template.replace('__PUBLIC_ITINERARY_HASHES__', '|' + hashes.sort().join('|') + '|').replace(/^[ \t]+/gm, '');
    if (code.includes('__PUBLIC_ITINERARY_HASHES__') || !template.includes('__PUBLIC_ITINERARY_HASHES__')) throw new Error('Invalid edge template');
    if (Buffer.byteLength(code) > 10240) throw new Error('CloudFront Function exceeds 10 KB; stop release');
    return code;
}

export async function buildEdgeRouting({dist = 'dist', output = '.deployment/edge', sitemapXml} = {}) {
    const slugs = (await readdir(resolve(dist, 'itinerary'))).sort();
    for (const slug of slugs) {
        validateOfficialSlug(slug);
        const dom = new JSDOM(await readFile(resolve(dist, 'itinerary', slug, 'index.html'), 'utf8'));
        try {
            const doc = dom.window.document;
            const data = JSON.parse(doc.querySelector('#shortbreakhub-prerender-data')?.textContent || 'null');
            if (data?.type !== 'official-itinerary' || data.slug !== slug || data.detail?.slug !== slug
                || doc.querySelector('link[rel="canonical"]')?.href !== `https://www.shortbreakhub.com/itinerary/${slug}`
                || !doc.querySelector('meta[name="description"]')?.content?.trim()
                || !doc.title || !doc.querySelector('#root h1')?.textContent?.trim()
                || !doc.querySelector('#root')?.textContent.includes(data.detail.summary)
                || !doc.querySelector('meta[name="robots"]')?.content.startsWith('index,follow')
                || doc.querySelector('#root')?.getAttribute('data-prerendered') !== 'true') {
                throw new Error(`Invalid initial itinerary HTML: ${slug}`);
            }
        } finally { dom.window.close(); }
    }
    if (sitemapXml === undefined) {
        const response = await fetch(SITEMAP_URL, {redirect: 'error', signal: AbortSignal.timeout(30000)});
        if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}`);
        sitemapXml = await response.text();
    }
    if (JSON.stringify(sitemapItineraries(sitemapXml)) !== JSON.stringify(slugs)) throw new Error('Sitemap and built public itinerary inventories differ');
    const template = await readFile(new URL('../infra/cloudfront/viewer-request.js', import.meta.url), 'utf8');
    const code = generateEdgeCode(template, slugs);
    await mkdir(output, {recursive: true});
    await writeFile(resolve(output, 'function.js'), code);
    await writeFile(resolve(output, 'inventory.json'), JSON.stringify({version: 1, slugs, codeSha256: createHash('sha256').update(code).digest('hex')}, null, 2) + '\n');
    console.log(`Edge itinerary routing: ${slugs.length} validated public documents; ${Buffer.byteLength(code)}/10240 bytes; sitemap matches.`);
    return {slugs, code};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildEdgeRouting();
