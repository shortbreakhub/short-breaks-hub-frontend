import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync, readdirSync} from 'node:fs';
import React, {act} from 'react';
import {renderToString} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {I18nextProvider} from 'react-i18next';
import i18n from 'i18next';

const slug = '4-days-sydney-light-water-and-open-living';
const names = ['day-1-sydney-opera-house-circular-quay', 'day-2-sydney-harbour-bridge',
    'day-3-bondi-to-coogee-coastal-walk', 'day-4-circular-quay-harbour-farewell'];
const schedule = names.map((_, index) => ({day: index + 1, title: `Title ${index + 1}`, summary: 'Preview', details: `Details ${index + 1}`}));

test('Sydney PNG mapping, disclosures, translations and responsive image mounting', async () => {
    const vite = await createServer({appType: 'custom', logLevel: 'error', server: {middlewareMode: true, hmr: false, ws: false},
        ssr: {resolve: {externalConditions: ['node', 'module-sync']}}});
    const previous = {window: globalThis.window, document: globalThis.document, act: globalThis.IS_REACT_ACT_ENVIRONMENT};
    let dom, root;
    const language = i18n.language;
    try {
        await vite.ssrLoadModule('/src/i18n.js');
        await i18n.changeLanguage('en');
        const {getItineraryDayImages} = await vite.ssrLoadModule('/src/content/itineraryDayImages.js');
        const {default: Timeline} = await vite.ssrLoadModule('/src/components/itinerary/ItineraryDayTimeline.jsx');
        const dayImages = getItineraryDayImages(slug);
        assert.deepEqual(Object.keys(dayImages), ['1', '2', '3', '4']);
        for (let day = 1; day <= 4; day++) {
            const image = dayImages[day];
            assert.ok(image.src.endsWith(`${names[day - 1]}.png`));
            const bytes = readFileSync(`src/assets/itineraries/australia/sydney/${names[day - 1]}.png`);
            assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
            assert.equal(bytes.readUInt32BE(16), image.width);
            assert.equal(bytes.readUInt32BE(20), image.height);
            assert.ok(image.alt.en && image.alt.fr);
        }
        assert.match(dayImages[4].alt.en, /cafés.*Circular Quay.*daylight/);
        assert.deepEqual(getItineraryDayImages('another-itinerary'), {});
        const node = images => React.createElement(I18nextProvider, {i18n}, React.createElement(Timeline, {schedule, dayImages: images}));
        const ssr = new JSDOM(renderToString(node(dayImages)));
        assert.equal(ssr.window.document.querySelectorAll('img').length, 1, 'SSR requests only the expanded day image');
        assert.equal(ssr.window.document.querySelector('img').alt, dayImages[1].alt.en);
        assert.equal(ssr.window.document.querySelector('details').open, true);
        ssr.window.close();
        assert.ok(!renderToString(node({})).includes('<img'));
        dom = new JSDOM('<div id="root"></div>');
        globalThis.window = dom.window;
        globalThis.document = dom.window.document;
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
        let matches = true, resize;
        dom.window.matchMedia = query => {
            assert.equal(query, '(min-width: 480px)');
            return {get matches() {return matches;}, addEventListener: (_, fn) => {resize = fn;}, removeEventListener() {}};
        };
        root = createRoot(document.getElementById('root'));
        await act(async () => root.render(node(dayImages)));
        assert.equal(document.querySelectorAll('.itinerary-day-timeline__thumbnail').length, 3);
        assert.equal(document.querySelectorAll('.itinerary-day-timeline__image img').length, 1);
        const days = [...document.querySelectorAll('details')];
        await act(async () => {
            days[1].open = true;
            days[1].dispatchEvent(new dom.window.Event('toggle'));
        });
        assert.equal(days[1].querySelector('.itinerary-day-timeline__thumbnail'), null);
        assert.equal(days[1].querySelector('.itinerary-day-timeline__image img').alt, dayImages[2].alt.en);
        await act(async () => {
            days[0].open = false;
            days[0].dispatchEvent(new dom.window.Event('toggle'));
        });
        assert.equal(days[0].querySelector('.itinerary-day-timeline__image'), null);
        assert.ok(days[0].querySelector('.itinerary-day-timeline__thumbnail'));
        await act(async () => {matches = false; resize();});
        assert.equal(document.querySelectorAll('.itinerary-day-timeline__thumbnail').length, 0, 'mobile does not mount thumbnail requests');
        for (const img of document.querySelectorAll('img')) {
            assert.equal(img.loading || img.getAttribute('loading'), 'lazy');
            assert.equal(img.getAttribute('decoding'), 'async');
            assert.equal(img.getAttribute('width'), '1672');
            assert.equal(img.getAttribute('height'), '941');
            assert.equal(img.parentElement.style.aspectRatio, '16 / 9');
        }
        await act(async () => i18n.changeLanguage('fr'));
        assert.equal(days[1].querySelector('img').alt, dayImages[2].alt.fr);
        for (const [index, day] of days.entries()) {
            assert.equal(day.querySelector('[role="heading"]').textContent, schedule[index].title);
            assert.ok(day.textContent.includes(schedule[index].details));
        }
        const css = readFileSync('src/styles/itinerary-story.css', 'utf8');
        assert.match(css, /@media \(min-width: 480px\)/);
        assert.match(css, /__thumbnail\s*\{\s*display: none/);
    } finally {
        if (root) await act(async () => root.unmount());
        dom?.window.close();
        globalThis.window = previous.window;
        globalThis.document = previous.document;
        globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
        await i18n.changeLanguage(language || 'en');
        await vite.close();
    }
});


test('production PNGs remain byte-identical and Sydney prerender includes only the expanded image', () => {
    const assets = readdirSync('dist/assets');
    for (const name of names) {
        const emitted = assets.find(file => file.startsWith(`${name}-`) && file.endsWith('.png'));
        assert.ok(emitted, `${name} resolves in the production build`);
        assert.deepEqual(readFileSync(`dist/assets/${emitted}`),
            readFileSync(`src/assets/itineraries/australia/sydney/${name}.png`));
    }
    const html = readFileSync(`dist/itinerary/${slug}/index.html`, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('.itinerary-day-timeline img').length, 1);
    assert.match(document.querySelector('.itinerary-day-timeline img').src, /day-1-sydney-opera-house-circular-quay.*\.png$/);
    assert.equal(document.querySelectorAll('.itinerary-day-timeline details').length, 4);
    assert.equal(document.querySelector('link[rel="canonical"]').href, `https://www.shortbreakhub.com/itinerary/${slug}`);
    dom.window.close();
});

const mapped = [
    {label: 'Vanuatu', slug: '4-days-vanuatu-fire-water-and-everyday-earth', folder: 'vanuatu',
        names: ['day-1-efate-island-coast', 'day-2-efate-blue-lagoon', 'day-3-mount-yasur-volcano', 'day-4-tanna-village-morning']},
    {label: 'Haarlem', slug: '2-days-haarlem-where-craft-feels-enough', folder: 'netherlands/haarlem',
        names: ['day-1-grote-markt', 'day-2-molen-de-adriaan']},
    {label: 'Rotterdam', slug: '3-days-rotterdam-where-the-city-decided-to-start-again', folder: 'netherlands/rotterdam',
        names: ['day-1-erasmus-bridge', 'day-2-rotterdam-harbour', 'day-3-rotterdam-neighbourhood-streets']},
    {label: 'Shanghai', slug: '4-days-shanghai-where-the-future-never-waits', folder: 'china/shanghai',
        names: ['day-1-bund-river-light', 'day-2-french-concession-streets', 'day-3-lujiazui-skyscrapers', 'day-4-shanghai-morning-street-life']},
    {label: 'Papua New Guinea', slug: '4-days-papua-new-guinea-land-ancestry-and-presence', folder: 'papua-new-guinea',
        names: ['day-1-port-moresby', 'day-2-papua-new-guinea-highlands', 'day-3-highlands-cultural-traditions', 'day-4-highlands-farewell-journey']},
];

for (const {label, slug, folder, names} of mapped) {
    test(`${label} PNG mapping matches days and source dimensions`, async () => {
        const vite = await createServer({appType: 'custom', logLevel: 'error', server: {middlewareMode: true, hmr: false, ws: false}});
        try {
            const {getItineraryDayImages} = await vite.ssrLoadModule('/src/content/itineraryDayImages.js');
            const dayImages = getItineraryDayImages(slug);
            assert.deepEqual(Object.keys(dayImages), names.map((_, index) => String(index + 1)));
            for (const [index, name] of names.entries()) {
                const image = dayImages[index + 1];
                assert.ok(image.src.endsWith(`${name}.png`));
                const bytes = readFileSync(`src/assets/itineraries/${folder}/${name}.png`);
                assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
                assert.equal(bytes.readUInt32BE(16), image.width);
                assert.equal(bytes.readUInt32BE(20), image.height);
                assert.ok(image.alt.en && image.alt.fr);
            }
        } finally {
            await vite.close();
        }
    });

    test(`${label} production PNGs remain byte-identical and prerender includes only the expanded image`, () => {
        const assets = readdirSync('dist/assets');
        for (const name of names) {
            const emitted = assets.find(file => file.startsWith(`${name}-`) && file.endsWith('.png'));
            assert.ok(emitted, `${name} resolves in the production build`);
            assert.deepEqual(readFileSync(`dist/assets/${emitted}`),
                readFileSync(`src/assets/itineraries/${folder}/${name}.png`));
        }
        const dom = new JSDOM(readFileSync(`dist/itinerary/${slug}/index.html`, 'utf8'));
        const document = dom.window.document;
        assert.equal(document.querySelectorAll('.itinerary-day-timeline img').length, 1);
        assert.ok(document.querySelector('.itinerary-day-timeline img').src.includes(names[0]));
        assert.equal(document.querySelectorAll('.itinerary-day-timeline details').length, names.length);
        dom.window.close();
    });
}
