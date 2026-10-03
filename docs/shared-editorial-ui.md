# Shared editorial UI foundation — Issue #36

Source: [Issue #36](https://github.com/shortbreakhub/short-breaks-hub-frontend/issues/36).
Protected behavior: [#32 baseline](redesign-baseline.md). Delivery budgets: [#34 foundation](performance-foundation.md).

## Audit before implementation

Starting branch `feature/36-shared-editorial-ui-system`, working tree clean.

- Tailwind v4 comes from the Vite plugin and `@import "tailwindcss"`. The legacy `tailwind.config.js` has an empty extension and is not explicitly loaded by the CSS. Global CSS only resets body margin and box sizing. No shared typography/token layer exists.
- Existing typography is primarily system sans, with bold page/section headings and small gray metadata. Containers vary between screen-lg, screen-xl and 7xl; layouts repeat 640/768/1024px breakpoints and local gap/padding values.
- Homepage/brand actions use yellow/amber; auth/discovery links often use blue; planning actions use gray/black. Borders, radii, focus rings and shadows differ across cards and controls. Retain amber character and the optimized existing logo; introduce consistent semantic roles for future editorial areas.
- RegionCard, CountryCard and ItineraryCard repeat photo/title/description/metadata hierarchy. They also own different contracts: community click behavior, country detail fetching/language updates, official/community paths and favorites. Keep their implementations for later incremental migration; consolidate only the presentation foundation here.
- ItinerarySearchBar and TripPrepRail repeat native input/select/date/number/button styling. Hotel Search is specialized code within TripPrepRail, not an independent drawer file. Its mapping, filters, state, validation, reset and affiliate handoff must stay specialized.
- Navbar/Footer contain authentication, language, route and scroll behavior, mobile navigation and legal links. Preserve these conventions and all URLs. Do not use the new primitives as a reason to rewrite the shell.
- Loading varies between full-screen Lottie, local control status and localized recoverable itinerary errors. Preserve those existing behaviors. New states distinguish busy content, empty results and recoverable errors; they do not own fetching/retry policy.
- #34 responsive srcset, intrinsic dimensions, eager hero and deferred images/code are useful existing conventions. Preserve them; media primitives accept delivery metadata rather than importing a large image library.

## Opt-in architecture and tokens

`src/styles/editorial.css` is imported once by global CSS. All rules are scoped to `.sbh-editorial`; no legacy font, heading, color, layout or component reset is added. `EditorialSurface` activates the foundation for a deliberately migrated subtree. No public component is migrated in this issue.

Typography roles: display, page title, section title, card title, body, supporting text, metadata/kicker and control/action labels. Fluid display/page/section roles scale with `clamp`; body is 16px, supporting text 15px, metadata 13px, labels/actions 14px. Headings use a local Georgia/Times serif stack, body/actions a system sans stack. No font download or dependency.

Semantic palette: warm paper page, white surface, soft sand surface, charcoal primary text, secondary/muted text, subtle decorative border, stronger native control border, amber accent/hover, dark editorial links, blue-green focus, success and error. Text combinations are tested at ≥4.5:1, control boundary/focus at ≥3:1. Focus is a 3px outline with offset; controls/action targets are at least 44px. Disabled controls remain readable.

Rhythm: 4/8/12/16/24/32px steps; fluid 40–80px section space and 16–32px gutters. Shape: 8px controls, 12px cards/media, no ordinary card shadow. One elevated shadow/bordered surface is reserved for real overlays. No tooltip/dialog behavior or atlas code is invented.

## Public primitive API

Import named exports from `src/components/ui/EditorialUI.jsx` within an `EditorialSurface`:

| Primitive | Intended use / behavior |
| --- | --- |
| `EditorialSurface` | Opt-in colors, typography and tokens; accepts `lang` and native div props |
| `Container` | Existing 80rem page width/gutters; `reading` selects 48rem |
| `Section` | Native section with responsive vertical rhythm; caller supplies heading association |
| `CardGrid` | One column mobile, two at 640px, three at 1024px; zero-minimum grid tracks |
| `Action` | Primary/secondary/quiet; `iconOnly` requires translated `aria-label`; native button by default, `to` for Router link, `href` for anchor |
| `EditorialLink` | Recognizable text link; `navigation` adds action-sized hit area; real crawlable href |
| `SectionHeader` | Optional eyebrow/description/action; title heading defaults to h2; configurable level/id |
| `ContentCard` | Native article, photo/title/metadata/description/action; heading defaults h3; supports destination/itinerary/story/guide/community content without domain wrappers |
| `Media` | Explicit alt (empty only if decorative), responsive srcSet/sizes, dimensions, aspect ratio/position, overlay, lazy/eager and priority attributes |
| `Badge` / `Metadata` | Two restrained badge tones; ordinary metadata is a wrapping semantic list, not pills |
| `Field` | Native input/select/textarea, generated or caller id, associated label, hint/error IDs, aria-invalid and caller-owned native state/constraints |
| `ContentState` | Empty by default; loading uses status/busy, error uses alert; caller supplies localized title/description and retry action |

Actions require exactly one navigation destination when used as links. Default button type is `button`, avoiding accidental form submits; submit/reset are explicit. Disabled navigation has no href, is marked aria-disabled, skips Tab, and suppresses click/activation keys. New-window anchors default to noopener/noreferrer. Card title links stay separate from other actions, avoiding nested interactive elements. Heading levels are validated, not inferred from CSS size.

`.sbh-stack` and `.sbh-cluster` are small spacing classes, not extra React wrappers. `.sbh-toggle` styles existing native checkbox labels for filters. There is no generic field schema, provider, variant framework, data fetching or booking abstraction.

Media defaults to lazy, but a caller must set eager/high priority for real above-fold/LCP images. Supply #34 derivative src/srcSet/width/height unchanged and appropriate sizes. Aspect ratio reserves the frame; photography is never fabricated. Metadata text and card titles wrap instead of assuming short English strings. Keep `headingLevel` aligned with the containing page.

All user-visible primitive copy is caller-owned. Existing i18n remains unchanged; showcase copy switches through the current English/French i18n instance. Foundation motion is limited to brief color transitions and disabled under reduced-motion preference. This does not claim to repair all legacy animation/accessibility behavior.

## Development showcase and verification

```sh
npm run ui:dev
# opens /src/dev/index.html on the Vite development server
npm run ui:verify
npm run build
npm test
npm run performance:measure
git diff --check
```

The showcase is a separate HTML/React development entry, not an App route or production Rollup input. It declares noindex/nofollow, is guarded by `import.meta.env.DEV`, and adds no production initial JavaScript. It demonstrates typography, palette, all action variants/disabled/toggle states, links, section headers, destination/story/long-name cards, inputs/select/date/number/checkbox, badges/plain metadata, responsive media/overlay, and loading/empty/retry states. Demo controls do not book travel or mutate product data. No Storybook/dependency added.

`ui:verify` launches a temporary Vite server and Chromium, blocks external requests, checks English/French at 1440/768/390px, and writes screenshots/results to `/tmp/issue36-ui-*`. It checks overflow, grid collapse, labeled controls, 44px action targets, reduced motion, visible keyboard focus, Space toggle, Tab skipping disabled actions, long search input and Enter retry. It does not freeze pixel-perfect output.

`sharedUI.test.js` checks server semantics and mounted activation behavior, heading hierarchy, independent links/actions, media delivery/alt attributes, native field constraints/descriptions/error state, loading/empty/error distinctions, palette contrast and production showcase exclusion. Production exclusion checks manifest, all built HTML/JS, sitemap files if present, and existing robots/sitemap sources. This repository advertises an external sitemap and does not generate one; no external sitemap publication was changed.

## Next migration targets

1. Opt in the new homepage editorial subtree while preserving the existing shell and all crawlable links.
2. Use SectionHeader/Container/CardGrid and ContentCard for editorial picks and destination/itinerary discovery; keep retrieval and route helpers outside presentation primitives.
3. Retain optimized assets and choose eager/lazy and responsive sizes per actual placement; do not blindly move the old hero to lazy loading.
4. Apply Action/Field to simple homepage discovery controls while preserving region/country resolution and native labels/state. Hotel Search migration should be separately reviewed against its protected regression coverage.
5. Keep the later atlas behind its measured loading boundary. Overlay surface, semantic actions and media can be composed there without adding map dependencies now.

Do not migrate Navbar/Footer, country-card fetching, itinerary favorites, itinerary error policy, booking or community flows merely to use this API. Broad modal/focus work and legacy community link problems remain separately scoped.

## Completed verification

- Full suite: **616 passed**, zero failures/skips (605 prior contracts +11 new UI checks).
- Focused Hotel Search +#34 performance checks: **16 passed**; no live affiliate clicks.
- Browser UI checks: English/French at 1440, 768 and 390px pass; representative desktop and mobile card screenshots inspected.
- Production build including full prerender: passed; exact same **258 routes** (198 official, 52 countries, 6 regions, home/contact).
- Home, Europe, China and Shanghai: rendered React roots, title/description/robots/canonical and existing JSON-LD exactly equal to the pre-change documents. Shanghai bootstrap retains TRIP_COM / CITY / MAPPED / externalId `2`.
- Tracking tests retain `Allianceid=9927800`, `SID=327885881`, present-empty `trip_sub1=`, `trip_sub3=D19155586`.
- Showcase absent from production manifest, all built HTML/JS, output paths, sitemap sources and advertised inventory. Production routing is untouched. No externally managed sitemap publication was performed.
- Initial JS raw: **470,646 →470,646 bytes**, identical to #34. Node gzip level 9: **152,484 →152,482 bytes**; tiny compression difference comes from the changed CSS filename reference. No shared UI/showcase JS is imported by the production application yet.
- CSS raw: **66,948 →75,421 bytes**; Node gzip level 9 **11,877 →13,561 bytes**, +1,684 bytes for the scoped foundation and Tailwind source discovery. Below the existing 20 KB gzip CSS guard; initial JS stays below 180 KB gzip. Lazy boundaries/optimized images remain unchanged. No atlas JavaScript budget consumed.
- Existing deferred Lottie size warning, stale Browserslist warning and six missing optional food-image warnings remain. No unrelated fixes.
- `git diff --check` passed; new text files also checked for trailing whitespace. Final diff reviewed; no production page, routing, API, affiliate or asset changes beyond importing scoped CSS.
- No dependencies added/removed. No commit, push or merge. Work stops for review.

## Exact file inventory

Modified: `package.json`, `src/index.css`.

Added:

- `docs/shared-editorial-ui.md`
- `scripts/verify-editorial-ui.mjs`
- `src/components/ui/EditorialUI.jsx`
- `src/dev/editorialShowcase.jsx`
- `src/dev/index.html`
- `src/dev/showcase.css`
- `src/styles/editorial.css`
- `tests/sharedUI.test.js`

Starting tree was clean; final tree has two tracked modifications and eight untracked additions, nothing staged. Standard unstaged `git diff --stat` reports two files changed, five insertions, two deletions; Git omits untracked additions from that statistic.
