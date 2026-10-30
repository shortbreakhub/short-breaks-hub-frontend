# Itinerary initial HTML: investigation and release evidence

Date: 30 October 2026. Branch: `fix/itinerary-initial-html`, based on
`origin/master` `7a34fb0`. Separate worktree: `/tmp/sbh-itinerary-seo`.
Original workspace changes were left untouched. No production write, merge,
deployment, GSC action, DNS change or IAM change was performed.

## Root cause and scope

Read-only download of LIVE `shortbreakhub-route-rewrite` confirmed that
`/itinerary/` belongs to `SPA_PREFIXES`. The final branch of its handler rewrites
every matching URL to `/app-shell.html`. This happens before the cache lookup,
so uploading more HTML or invalidating the cache cannot fix the route choice.
The exact downloaded source is retained in
`tests/fixtures/viewer-request-live-2026-10-30.js` (SHA-256
`04404ed494490ff6273db841ff2210dcb9a4550dd33ca68e8df52f796692fe4a`).

A bounded read-only HTTP audit checked **all 201 itinerary URLs** in the live
263-URL sitemap. All returned 200, an empty React root, no H1 and no initial
canonical. The nonexistent `/itinerary/seo-verification-nonexistent-route` also
returned 200. This is the delivery issue documented in
[Issue #84](https://github.com/shortbreakhub/short-breaks-hub-frontend/issues/84),
not an isolated content/data failure or a WWW redirect issue.

The baseline production build already generated all 201 complete itinerary
documents at `dist/itinerary/<slug>/index.html`. `getOfficialInventory` derives
the inventory from the six public official Region APIs. `fetchOfficialPages`
fetches English detail with four workers, validates it and projects public
fields. `ItineraryPage` renders bootstrap data immediately. `main.jsx`
preloads the route and hydrates a `data-prerendered="true"` root. Existing CI
already ran `npm run build` (Vite followed by prerendering) before tests and
uploaded the generated itinerary keys. These contracts are retained.

## Minimal functional change

The existing viewer-request function now sends recognized public itinerary
requests to their generated index document. It returns a small, non-hydrated
HTTP 404 with `noindex,follow` for unrecognized itinerary requests. It checks
the decoded namespace before origin dispatch, including encoded slashes and
encoded prefix characters, so retained old S3 objects cannot bypass membership.
Known itinerary case/trailing-slash/index-document aliases get a single 301
with the query retained. Existing non-itinerary redirects and rewrites are
compared against the captured LIVE source in regression tests.

No SSR framework, dependency, datastore, CloudFront association, distribution
setting, bucket policy, canonical-host change or backend change is introduced.
WWW canonicals, country/region routing and legitimate legacy redirects remain.

The build adds a public inventory gate. Every itinerary must have meaningful
HTML, route metadata, a WWW canonical and matching hydration data. Its slug set
must exactly match the live sitemap itinerary set. The release artifact carries
the generated function and inventory separately from S3 public objects.

The function uses the first 132 bits of SHA-256, encoded as 22 base64url
characters, for public slug membership. This avoids a new datastore under the
CloudFront 10 KB code limit. Current output is **9,415/10,240 bytes**. Builds
check collisions within the catalogue and fail if the function exceeds the
limit. Membership has a cryptographic collision bound; it is not authentication
or authorization for private data. At this template size, roughly 35 additional
same-length digest entries fit before a release must be redesigned or reduced.

The official backend table currently has no draft/private status field. Its
public official Region APIs and public sitemap define this inventory. Private
and community/draft APIs are not used to build these documents, and account
fields are excluded from bootstrap projection. An official item removed from
the public backend after deployment remains in that release's static snapshot
until a new successful frontend build and function publication. If immediate
withdrawal of official content is required, it needs coordinated publication
or a separate runtime revocation design; this patch does not promise real-time
privacy enforcement over static content.

## Before and proposed after

For `/itinerary/5-days-senegal-voice-rhythm-and-atlantic-light`:

```html
<!-- Current production, HTTP 200: app-shell.html -->
<div id="root"></div>
<!-- No initial route canonical, title, description or H1. -->
```

```html
<!-- Proposed initial response, HTTP 200; excerpt -->
<link rel="canonical" href="https://www.shortbreakhub.com/itinerary/5-days-senegal-voice-rhythm-and-atlantic-light"/>
<title>Senegal in 5 Days: Voice, Rhythm, and Atlantic Light | Senegal | Short Breaks Hub</title>
<!-- The description contains the actual itinerary summary; robots is index/follow. -->
<div id="root" data-prerendered="true">
  <h1 id="itinerary-story-title">Senegal in 5 Days: Voice, Rhythm, and Atlantic Light</h1>
  <!-- Summary, highlights, day timeline and travel content follow. -->
</div>
<script id="shortbreakhub-prerender-data" type="application/json">...</script>
```

| Request | Current production | Proposed function + build |
| --- | --- | --- |
| Existing public itinerary | 200, empty shell | 200, matching full itinerary HTML |
| Unknown itinerary | 200, empty shell | 404, noindex, no script/canonical |
| Unknown direct index key, including encoded aliases | Could bypass generic route handling | 404 before any origin read |
| Known itinerary slash/index/case alias | Generic SPA behavior | One 301 to its public slug |
| `/browse/Spain`, `/browse/New%20Zealand`, `/america` | Legitimate path redirects | Same redirects |
| HTTPS WWW/non-WWW homepages | Both 200, WWW canonical | Unchanged |

The local HTTP verifier runs the exact generated function in a VM and then
serves only the S3 key it returns, without Vite's implicit fallback. It models
private S3 missing-key 403 behavior for requests outside this patch's scope.
It does not simulate CloudFront propagation, cache timing or AWS runtime limits.

## Files changed and rationale

- `infra/cloudfront/viewer-request.js`: existing live routing plus public
  itinerary document routing and noindex 404s.
- `infra/cloudfront/release.json`: explicit, currently **disabled** edge review
  gate and known initial LIVE fingerprint.
- `scripts/build-edge-routing.mjs`, `scripts/prerender.mjs`: validate generated
  itinerary HTML against the live sitemap; generate bounded function inventory.
- `scripts/ci/validate-build.mjs`: bind edge code/inventory to release checksums
  and ensure its inventory equals the documents in the upload manifest.
- `scripts/ci/edge-deploy.py`, workflow: snapshot both function stages, prevent
  drift and overwrite of unrelated development work, test DEVELOPMENT, publish
  after HTML upload, and support conditional paired recovery.
- `scripts/ci/deploy.py`, IAM proposal: propose only the five function actions
  needed on the existing named function. No IAM policy was applied.
- `scripts/ci/verify-production.mjs`: verify initial HTML and exact release bytes
  for every public document, sitemap membership, invalid-route 404s, legacy
  redirects, browser canonicals and hydration. The former warning-only itinerary
  delivery discrepancy is a release failure.
- `src/pages/ItineraryPage.jsx`: failed client-side detail loading declares
  noindex; valid navigation removes it.
- SEO HTTP/Chromium, bootstrap and Python tests plus captured live fixture:
  exercise delivery, metadata, hydration, private/retired object rejection,
  encoded aliases, sitemap drift, AWS contracts, release ordering and recovery.

## Verification

Commands run in the isolated worktree:

```sh
npm run build
npm test
python3 -m unittest discover -s tests/ci -v
node scripts/ci/validate-build.mjs
python3 scripts/ci/deploy.py plan
git diff --check
```

- Production build: **261 prerendered routes**, including **201 full public
  itineraries**, 52 countries, six regions, homepage and Contact.
- Full frontend suite: **958 passed, zero failures/skips**.
- Deployment safety suite: **35 passed**.
- Local initial HTTP checks: homepage, Contact, all regions, all countries and
  every public itinerary, checking meaningful content and metadata without JS.
- Chromium: cold hydration of three itineraries including Senegal and Shanghai,
  interactive day details, country-to-itinerary client navigation, WWW canonical
  retention and invalid-route noindex 404. Network enrichment is mocked using
  public build data so third-party availability is not a test dependency.
- Existing bootstrap test: hydration, local progress restoration, stale-response
  protection, French navigation, invalid navigation noindex and successful
  navigation restoring index/follow.
- Release validator/plan: **1,537 files**, **21 mapped daily PNGs**; itinerary
  documents included and all upload paths within the reviewed S3 allowlist.
- Workflow YAML parsed and production step order checked. Read-only AWS
  preflight confirmed the existing account/bucket/distribution fingerprint;
  DEVELOPMENT and LIVE currently have identical source hashes, so no unpublished
  development change was observed at investigation time.
- The first full-suite attempt overlapped a background rebuild and reported
  missing dist files. That run is discarded; the completed build was tested
  again sequentially. No tests were disabled to obtain a passing result.
- Existing optional food-image, bundle-size and Browserslist warnings remain.

Independent review identified and verified fixes for encoded namespace bypasses,
the AWS test-output wrapper, the absence of ETag in PublishFunction's response,
and recovery generation matching. The reviewer independently passed all 35
Python safety tests and four targeted edge/legacy/privacy/sitemap tests and
reported no remaining blocking findings. CloudFront runtime/publication and
production delivery verification remain release gates.

Local diagnostic logs and production-before observations are in ignored
`.deployment/seo/` and `/tmp/sbh-seo-*.log`; generated build/release records are
in `dist/` and `.deployment/`. The report and tests are the reviewable evidence;
local logs are not durable GitHub release artifacts yet.

## Release gate and controlled deployment recommendation

Do not merge or deploy this branch before explicit owner approval. The edge
configuration has `reviewed: false`, so a production run would stop before any
S3 upload. Build-only PR validation remains free of AWS authentication/writes.

Read-only IAM inspection confirmed the current role
`shortbreakhub-frontend-deploy` has no CloudFront Function permissions. After
approval, the scoped policy addition must be applied through the approved IAM
management process and the edge release gate must be reviewed. This is a real
release prerequisite, not something this implementation silently enables.

Use the existing production Actions workflow after approval:

1. Build, test and validate the release, including the sitemap inventory gate.
2. Authenticate using the existing repository/master OIDC role. Verify the
   account, reviewed distribution and current master SHA.
3. Capture S3 and LIVE/DEVELOPMENT function baselines. Refuse unpublished
   development changes or unreviewed live drift. Upload the paired baseline
   artifact before production writes; retain the earliest recovery point on
   reruns.
4. Upload assets and generated HTML using the existing non-deleting deployment.
   Invalidate the reviewed paths and wait using the existing bounded procedure.
5. Recheck the sitemap and function baselines; update DEVELOPMENT conditionally
   with its ETag. Run AWS smoke tests for a public rewrite, missing route,
   encoded unknown route and legacy redirect. Refuse errors/high utilization.
6. Publish that tested function to LIVE, then verify generated HTML bytes,
   route metadata, sitemap, 404s, redirects and browser behavior. Record failure
   rather than accepting 200 or logging a routing warning as success.

The real AWS DEVELOPMENT tests, role permission change, edge propagation,
invalidation and post-deployment production verification have **not** occurred.
They remain approval-gated release operations. AWS documents that TestFunction
does not validate the entire viewer/origin flow, so live verification is still
mandatory: [AWS function testing](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/test-function.html).

## Failure handling and paired recovery

There is no automatic rollback. Stop further releases after any mutation or
verification failure and review the original baseline artifact identified by
`recovery-point.json`.

The baseline artifact contains `edge/live.js`, `edge/development.js`, stage
configs/ETags/checksums and capture attempt, together with the original S3
snapshot. Recovery rejects intermediate rerun snapshots, mismatched S3/edge
generations, tampered source and unrelated current function changes.

For an owner-approved recovery using that original artifact and the failed
release's code/release manifest in the existing authorized recovery runner:

```sh
python3 scripts/ci/edge-deploy.py restore --baseline .deployment/original-baseline/edge
python3 scripts/ci/deploy.py restore --output .deployment/original-baseline
python3 scripts/ci/deploy.py invalidate
```

Use the actual downloaded original artifact path; on the original attempt it
may be `.deployment/baseline`. Retain the original release SHA/run context and
approved production gate. The edge recovery command intentionally permits the
original SHA to differ from today's master but still checks the production
repository/branch, approved account/distribution and original release hashes.
Restore the edge inventory first, then its paired HTML snapshot. This prevents
newly retained S3 keys from staying accessible through a newer inventory. Old
immutable assets/new keys remain per the existing non-deleting recovery design.

If DEVELOPMENT testing failed before LIVE publication, the same recovery resets
DEVELOPMENT without publishing an unnecessary LIVE change. Otherwise reruns
deliberately stop on DEVELOPMENT/LIVE differences rather than overwriting them.
After recovery, verify behavior against the restored baseline, not the failed
release manifest. Restoring the initial baseline also restores the original
empty-shell limitation; it is a recovery action, not a successful SEO release.
