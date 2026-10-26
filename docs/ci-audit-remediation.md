# Independent CI/CD audit remediation

This is the pre-Phase-1 remediation record. Authorized role/GitHub setup and the
new build-only PR job are recorded in frontend-deployment.md; production remains off.

Prepared on branch `ci/production-frontend`; no commits, pushes, merges,
deployments or AWS/GitHub configuration changes. Both activation guards remain
disabled: production.json reviewed=false and the GitHub activation variable absent.

| Finding | Remediation | Evidence |
| --- | --- | --- |
| H1 branch isolation | Re-fetched origin/master; integration HEAD remains a2c994e, not local master cd789b0. Only approved image/test patches were imported. | 926bb2b is not an ancestor; every path changed by that commit is unchanged from remote or absent. All 15 application files match c16d9cc exactly. |
| H2 environment | Added production dotenv validation before build, without printing values. | Four active settings match current production bundles. API URL and Google/map/exchange formats validated; required-missing/invalid and redaction tests pass. |
| H3 test reliability | Replaced live count/publication assumptions with inventory consistency and fail-closed mapping checks. Kept offline evidence checks and all tests. | 944 tests passed in about 30 seconds across all 69 test files; no skips. |
| Car test | Freeze Date only after Vite/module startup; reset before teardown. Add 30-second test limit and bounded suite resources. | Original hang not reproduced in 12 original runs; 20/20 subsequent stress runs passed, including concurrent suite load. Root cause remains unproven. |
| Invalidation | Idempotent create retries, transient-error polling for up to 15 minutes, persistent ID/status, then extended content/browser verification if pending. | Pending, transient recovery, access denial and idempotence tests pass. Local Chromium verified 17 targets with a simulated pending invalidation. |
| Recovery | 30-day immutable per-attempt artifacts; reruns verify and reference the earliest original baseline. Missing/expired originals abort. | Earliest-selection/download tests and offline rollback drill pass; later partial snapshots cannot silently become the original. |

## Actual required environment

Required: VITE_API_BASE, VITE_GOOGLE_MAP_GEOCODING_API_KEY,
VITE_GOOGLE_MAP_MAP_ID, VITE_EXCHANGERATE_API_KEY. Their private local values
were found in the currently served production entry/page bundles; only match
booleans were recorded. No values were printed or committed.

VITE_ABSTRACT_GEOLOCATION_API_KEY was investigated rather than made mandatory
by assumption: its only uses are two unimported helper definitions. No production
import or glob includes those helpers. It remains an optional legacy setting;
the implementation does not introduce geolocation behavior or a new secret
dependency. Analytics remains optional and retains existing disable behavior.
The validator uses Vite's production dotenv precedence, not a divergent parser.

## Test gate

All tests/*.test.js files still run. Worker concurrency is four, Node test timeout
60 seconds, whole-suite watchdog ten minutes, Actions test-step timeout twelve
minutes. The car test additionally has a 30-second limit. Timing/resource isolation
and process termination prevent an intermittent hang from stalling deployment
indefinitely; no claim is made that the historical hang's root cause is proven.

The home CTA bootstrap must equal the unique current published country/city
inventory. Expected route count comes from region bootstrap countries and official
slugs, rather than a frozen 261. Airport evidence's static data integrity checks
remain; frontend deployment no longer requires all 201 historical destinations
to be simultaneously published. Unknown/unapproved mappings must return null,
and generated references, metadata, daily images and hydration checks remain.

## Validation completed

1. Clean npm ci: 304 packages installed successfully from the lockfile.
2. Environment validation passed; required values match current production.
3. Full unchanged npm run build passed: Vite plus prerender, 201 itinerary details,
   52 countries, 261 prerendered routes. Existing optional-food-image warnings remain.
4. npm test passed: 944 tests, zero failures/cancellations/skips, all 69 files.
5. Python CI/CD safety suite passed: 18 tests; no real AWS writes.
6. Build validator passed: 1,527 deployable files and all 11 mapped daily PNGs.
7. Local deployment plan verified every file's hash, phase and owned S3 path.
   dist/404.html is absent; 404.html and .vite/manifest.json are not allowed uploads.
8. actionlint passed. Whitespace checks passed. The exact release file list below
   was reviewed; routing, prerender, sitemap, robots, canonical, metadata and
   structured-data application files are unchanged from origin/master.
9. Chromium against a local server serving the clean build passed 17 targets,
   including all mapped days, while exercising pending-invalidation handling.
   The simulated invalidation requested no AWS operation; temporary drill state
   was restored/removed afterward. This is not a production deployment check.

## Recovery drill and reruns

The workflow publishes `frontend-baseline-RUN_ID-ATTEMPT` with overwrite=false
and retention-days=30 before any PutObject. Every later snapshot records the
original recoveryPoint.artifact. A GitHub-read-only step downloads and hashes the
earliest baseline before permitting a rerun. It rejects expired originals, absent
backups on reruns, changed targets/commits and inconsistent earliest references.
Do not bypass recovery with a fresh dispatch after a failed upload.

Use the original artifact named by recoveryPoint, not the highest attempt number.
`deploy.py check-baseline` validates downloaded baseline files locally without
AWS or activation. `restore` rejects an intermediate rerun snapshot if it points
to an earlier original artifact. All hashes are checked before restoration writes.

The automated offline drill simulates a partial upload and a rerun: attempting
to restore the later partial snapshot fails, the original bytes/cache metadata
are restored in a fake local store, and new objects are retained. AWS calls are
mocked and asserted absent. A real production capture/restore/invalidation drill
still requires separate write approval; none was performed.

## Remaining activation steps

No failing implementation checks remain. Historical car-hang root cause is not
proven; repeated passes and bounded failure behavior are the stated evidence.
Before activation, approve the scoped OIDC role/permission proposal and create it
using the existing provider; configure approved GitHub build settings; authorize
publication/merge; run build-only Actions and confirm effective 30-day artifact
expiry; approve first production deployment. Then and only then enable both guards.
No additional IAM permissions are needed for these remediations; Actions adds
actions:read solely to recover artifacts. Existing AWS targets/allowlists remain.

No additional fixed monthly infrastructure cost. At daily frequency, thirty-day
retention is approximately 424 MB for two similarly compressed snapshots per day
(measured release ZIP 7.06 MB), plus metadata/reruns/other account usage. The
uncompressed 1.2 GB upper-bound estimate would cost about $0.18/month above an
otherwise unused 500 MB allowance. Check account usage before activation.

## Exact release changed-file list relative to origin/master

Includes the previously prepared CI/CD implementation and approved image patches,
not just this remediation turn. Generated builds, private env and raw audit reports
are ignored and are not in this list.

```text
.env.example
.github/workflows/deploy-production.yml
.gitignore
docs/aws-production-verification.md
docs/ci-audit-remediation.md
docs/frontend-deployment.md
infra/deployment/oidc-trust.json
infra/deployment/permissions-proposal.json
infra/deployment/production.json
package.json
scripts/ci/deploy.py
scripts/ci/run-tests.mjs
scripts/ci/validate-build.mjs
scripts/ci/validate-env.mjs
scripts/ci/verify-production.mjs
src/assets/itineraries/australia/sydney/day-1-sydney-opera-house-circular-quay.png
src/assets/itineraries/australia/sydney/day-2-sydney-harbour-bridge.png
src/assets/itineraries/australia/sydney/day-3-bondi-to-coogee-coastal-walk.png
src/assets/itineraries/australia/sydney/day-4-circular-quay-harbour-farewell.png
src/assets/itineraries/netherlands/rotterdam/day-1-erasmus-bridge.png
src/assets/itineraries/netherlands/rotterdam/day-2-rotterdam-harbour.png
src/assets/itineraries/netherlands/rotterdam/day-3-rotterdam-neighbourhood-streets.png
src/assets/itineraries/vanuatu/day-1-efate-island-coast.png
src/assets/itineraries/vanuatu/day-2-efate-blue-lagoon.png
src/assets/itineraries/vanuatu/day-3-mount-yasur-volcano.png
src/assets/itineraries/vanuatu/day-4-tanna-village-morning.png
src/components/itinerary/ItineraryDayTimeline.jsx
src/components/itinerary/ItineraryStoryPage.jsx
src/content/itineraryDayImages.js
src/styles/itinerary-story.css
tests/buildEnvironment.test.js
tests/carTripPrep.test.js
tests/ci/test_deploy.py
tests/deploymentVerification.test.js
tests/flightAirports.test.js
tests/homePlanning.test.js
tests/itineraryDayImages.test.js
tests/performance.test.js
```
