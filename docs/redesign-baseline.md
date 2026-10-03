# UI redesign regression baseline — Issue #32

This baseline separates presentation from existing product contracts. It does not
authorize route, SEO, destination identity, API, or affiliate changes. Layout/CSS
may evolve in subsequent issues; the behaviour below must remain covered.

## Routes and rendering

| Route | Page / assumption | Production prerender |
| --- | --- | --- |
| `/` | Homepage; links to all six public regions | Yes |
| `/southeast-asia`, `/east-asia`, `/europe`, `/americas`, `/Oceania`, `/africa` | Region inventory from `REGIONS`; preserve spelling/casing | Yes |
| `/browse/:country` | Canonical country slug; API/display names resolved through the country directory | Yes, from region inventory |
| `/itinerary/:slug` | Official API slug is an identity, not a display string to regenerate | Yes, from region inventory |
| `/user-itinerary/:slug` | Community API and content; separate from official hotel integration | No |
| `/community-itineraries/region`, `/community-itineraries/region/:region` | Community discovery | No |
| `/contact` | Public contact form | Yes |
| `/privacy`, `/terms` | Legal content, existing metadata/canonicals | No |
| `/login`, `/register`, `/profile`, `/create-itinerary` | Accounts, favourites, published trips and drafts | No; noindex |
| `/verify-email`, `/api/auth/verify-email` | Both verification aliases remain supported | No; noindex |
| `/forgot-password`, `/reset-password` | Password recovery; retain query parameters needed by the flow | No; noindex |
| `/live-weather`, `/map` | Existing utility routes | No |
| Unmatched nested paths | NotFound; noindex | No |

`/:region` is a broad single-segment route: arbitrary single-segment paths currently
match RegionPage and the robots helper considers them indexable. This is documented
existing behaviour, not a recommendation to expand it or change it in this issue.

`npm run build` runs Vite followed by `scripts/prerender.mjs`, using production
`VITE_API_BASE`. Prerendering fetches region inventory, builds country cards from
that inventory, and fetches English official details with concurrency four.
Missing/invalid required content fails the build. It writes route `index.html`
documents and `app-shell.html` for non-prerendered SPA routes. Hosting must serve
the matching generated document on deep-link reload; generic fallback must use
the app shell, not prerendered homepage HTML.

## SEO and language contracts

- Production canonical origin is `https://www.shortbreakhub.com`.
- Preserve region casing, country slug resolution, and official itinerary slugs.
- Browse query filters do not create a new canonical URL.
- Route components own unique title/description/canonical/OG/Twitter metadata.
- Account/transient routes stay noindex; preserve existing community/utility policy.
- `index.html` owns Organization and WebSite JSON-LD. Do not invent itinerary schema.
- Generated public pages contain real headings, content and internal links before
  JavaScript runs. Preserve built asset resolution, escaped public bootstrap,
  matching route/language hydration, and no initial detail refetch for bootstrap.
- English/French UI and official detail `lang` requests remain supported. English
  bootstrap must not supply French content; same-itinerary hotel edits survive a
  language change. Community retrieval currently has no language parameter.
- `public/robots.txt` advertises `/sitemap.xml` on the production origin. No sitemap
  generator or deployment rewrite configuration exists in this repository. The
  external owner must keep sitemap URLs aligned with `REGIONS`, country directory,
  and official inventory; generated route documents are not themselves a sitemap.

## Hotel and itinerary contracts

Only backend-supplied `TRIP_COM` / `CITY` / `MAPPED` descriptors with valid opaque
string IDs may generate hotel handoffs. Shanghai is `externalId = "2"`.
Do not derive an ID from the editable destination name or use a fallback city.
Null/skipped/invalid mappings and edited destination mismatches must block search.

Protect drawer opening, local calendar check-in/check-out defaults, explicit user
overrides, same-itinerary reopen/language preservation, reset/new-itinerary defaults,
rooms/adults/children/required child ages, and breakfast/free-cancellation filters.
The UI age `<1` becomes provider age `0` only when serialized.

The existing Trip.com `/hotels/list` builder emits `cityId`, `cityName`, `destName`,
`searchType=CT`, `checkin`, `checkout`, `crn`, `adult`, optional `children`/`ages`,
and verified `listFilters`. Preserve exactly one occurrence of:

| Tracking parameter | Approved value |
| --- | --- |
| `Allianceid` | `9927800` |
| `SID` | `327885881` |
| `trip_sub1` | Empty string; parameter remains present |
| `trip_sub3` | `D19155586` |

Tests construct URLs locally and stub `window.open`; they never visit Trip.com.
No new affiliate configuration or provider links are introduced by this baseline.

Official/community retrieval failures now leave loading, show a localized error,
and permit retry. HTTP 404 has distinct wording. Empty responses fail safely.
Stale responses/rejections cannot replace a newer route. Official error rendering
retains its route metadata/canonical; no community canonical policy is added.
Successful content, planning/food information, favourites and community Q&A retain
their current APIs. Public viewing must not require authentication.

## Navigation and verification

Navbar route destinations/profile and footer route/legal destinations are real
React Router links. Keep their URLs, normal SPA navigation, modified-click browser
behaviour and mobile menu closure. Logout, menu toggles and in-page scroll controls
remain buttons. No typography, colours, assets or page layout are redesigned.

Run in order:

1. `npm run build` — includes the real production prerender path; needs API access.
2. `npm test` — existing and new tests; generated-output/hydration tests require dist.
3. Inspect homepage, a region (including `/Oceania`), a country and Shanghai official
   HTML: headings/content, unique metadata, canonical, robots, JSON-LD, links/assets,
   bootstrap destination descriptor and app-shell separation.
4. `git diff --check` and review the diff for route/API/affiliate/visual changes.

`routeContracts.test.js` uses page probes to test the real App routing independently
of presentation; generated-page and bootstrap tests exercise real public pages.
`navigationSemantics.test.js` checks real shell links and browser interactions.
`itineraryLoading.test.js` exercises real official/community pages with mocked APIs,
including retry, language, empty/404/network failures and stale results. Existing
hotel tests cover inputs/hydration/state/filters, with additional exact tracking
assertions independent of the production affiliate constant.

## Deferred work

Interactive map, visual redesign, image/bundle optimization, city/guide routes,
flights and other console-only planning actions, broader community discovery
contract repairs, modal/focus accessibility, full day-detail HTML exposure,
localized SEO URLs, invalid-region/404 policy, analytics consent, sitemap/hosting
ownership and lint/CI setup belong to separately scoped issues.
