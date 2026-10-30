# Production frontend deployment

Status: Phase 1 preparation authorized; **production not activated**. The scoped
shortbreakhub-frontend-deploy role has been created with the reviewed trust and
inline permission documents; the existing OIDC provider is unchanged. Approved
build variables/secrets are configured in GitHub and the activation variable is
explicitly false. `PRODUCTION_DEPLOYMENT_ENABLED` must remain false until
the owner approves activation. `infra/deployment/production.json` is deliberately
unreviewed and rejects all production uploads independently of that variable.

## Source reconciliation

Audit baseline: origin/master `a2c994e0232bd3a7703c36a23e7deee170ee8cca`.
The integration worktree applies the patches from `c16d9cc` (Sydney, Vanuatu and
Rotterdam daily PNGs) and `56c3bb2` (supporting tests). Phase 1 authorizes committing
and pushing only this isolated integration branch and opening an unmerged PR.
It does not include `926bb2b` (routing/404) or push local master `cd789b0`.
The owner's original master and worktree are retained.

Local review validation: isolated `npm ci` and full production build passed using
the existing ignored local build configuration (values were not printed).
The scoped build generated 261 prerendered routes and the deployment validator
accepted 1,527 files and 11 mapped daily PNGs. The complete npm suite passed
942 assertions; deployment safety tests and actionlint also passed. Chromium
verification passed against a local server serving the fresh output, including
all three mapped itineraries and every mapped day. No post-deployment AWS or
production verification has been performed. Local artifact commit fields refer
to the base HEAD because changes are deliberately uncommitted; real CI uses the
committed triggering SHA. Existing optional-food-image build warnings remain.
The subsequent independent-audit remediation and fresh validation results are in
[ci-audit-remediation.md](ci-audit-remediation.md).

Daily images continue to use `src/assets/itineraries/`, the existing
`src/content/itineraryDayImages.js` mappings and `import.meta.glob` loader.
The timeline iterates over schedule days; CI does not impose a four-day limit.
New images/mappings must be committed together. No stable-URL architecture is used.

## Confirmed identifiers and completed AWS inspection

Owner-confirmed: account `919693204623`, region `eu-west-2`, bucket
`shortbreakhub.com`, distribution `E323A73D49XQ0O`, domains
`www.shortbreakhub.com` and `shortbreakhub.com`, branch `master` in
`shortbreakhub/short-breaks-hub-frontend`.

Read-only inspection confirmed both `cozy-farm` and `colorful-life-admin` belong
to account 919693204623. The former lacks bucket/CloudFront read permissions;
`colorful-life-admin` was used for the authorized inspection. Neither profile was
modified. The corrected production distribution ID ends in numeric zero followed
by capital letter O (`0O`), confirmed by the API and owner. `OO` and `00` spellings
returned NoSuchDistribution. No staging or Jerry Jane resources were modified.
See [the AWS verification record](aws-production-verification.md) for findings.

To repeat the authorized read-only inspection:

```sh
python3 scripts/ci/deploy.py --profile colorful-life-admin inspect --output .deployment/aws-inspection.json
```

The command verifies STS before any further AWS requests, then inspects only the
named distribution and bucket, inventories objects, inspects cache policies and
checks the GitHub OIDC provider. It redacts origin header values and writes the
report with mode 0600. Do not upload this report as a public Actions artifact.
The inspector also needs read permissions for IAM OIDC provider inspection;
those permissions do not belong in the deployment role.

The complete inventory and all 269 candidate mutable objects' metadata/tags were
inspected. All have AES256 encryption, no tags, no custom metadata and no cache
headers. The origin is the bucket root with OAC and bucket-owner-enforced object
ownership. Default encryption is SSE-S3, SSE-C uploads are blocked and versioning
is not enabled. No KMS permissions or tag-preservation writes are required.
The generic inspector samples metadata; repeat the complete mutable audit if the
inventory changes. Capture still checks every mutable object's tags before any
upload and aborts if tags appear. Never silently discard future tags.

production.json is now populated from inspection, but `reviewed` remains false
until separate activation approval. The proposed settings are:

- `originPath`: exact S3 origin path, `""` for verified bucket root; never guess.
- `distributionConfigSha256`: redacted configuration hash from inspection.
- `ownedPrefixes`: verified frontend-only prefixes with trailing `/`, e.g.
  `assets/`, `browse/`, `itinerary/` only if ownership is confirmed.
- `ownedKeys`: exact other frontend keys, including region/contact documents and
  public files; no catch-all root prefix. The validator/upload manifest gives the
  complete candidate inventory. Exclude unrelated objects and internal `.vite/`.
- `cacheControl`: reviewed headers per `assets`, `public`, `html` phase. Typical
  values are `public,max-age=31536000,immutable`,
  `public,max-age=300,must-revalidate`, and
  `public,max-age=0,s-maxage=1,must-revalidate` respectively. This respects the
  verified Managed-CachingOptimized minimum TTL of one second; no policy change.
- `objectTagsAbsent`: true only after the mutable-object tag audit.
- `invalidationPaths`: proposed `/*` covers all public and rewritten cache paths
  with one invalidation path per full release. Existing itinerary/SPA rewrites
  make `/index.html` alone insufficient. This evicts assets as well; account for
  refill traffic. `/sitemap.xml` already uses a separate caching-disabled backend
  behavior, so the invalidation does not change its routing or caching policy.
- `distributionIdentifierConfirmed`: true for the owner-confirmed API ID `0O`.
- `reviewed`: true only when these prerequisites and the initial baseline/recovery
  plan have been accepted. Runtime preflight compares the live distribution
  configuration with the reviewed fingerprint and validates the default S3 origin.

Do not add bucket policies, change access, functions, routing or cache policies.
Record any verification discrepancy separately rather than changing application
behavior to accommodate deployment checks.

## GitHub configuration and proposed IAM

Reuse the existing OIDC provider for `https://token.actions.githubusercontent.com`
with its existing audience `sts.amazonaws.com`; no provider changes are needed.
After approval, create one dedicated role named `shortbreakhub-frontend-deploy`
with `infra/deployment/oidc-trust.json` and attach the exact
`infra/deployment/permissions-proposal.json` permission document. No existing
Short Break Hub frontend GitHub role was found; do not repurpose the ECS task role.
AWS IAM Access Analyzer policy validation returned no findings for the permission
proposal. This was a validation request, not a role or policy creation.
GitHub reports the
repository uses its default non-immutable subject format. Confirm it again before
applying trust. No environment-based subject is used.

To regenerate the proposed permissions locally without enabling deployment:

```sh
python3 scripts/ci/deploy.py policy --output infra/deployment/permissions-proposal.json
```

The created role was read back and matched both proposal documents exactly. It
has one inline FrontendProductionDeploy policy and no attached managed policies.
No S3/CloudFront write operation was performed to test these permissions. OIDC
authentication on master still requires later controlled validation; PR CI does
not request an AWS token or assume this role.

The policy command validates verified target/ownership fields but intentionally
does not require the activation approval flag; it makes no AWS calls and cannot
activate deployment. Proposed permissions: GetBucketLocation/ListBucket for
this bucket (ListBucket permits a reliable distinction between missing keys and
permission faults), GetObject/GetObjectTagging/PutObject for approved object ARNs,
and GetDistribution/CreateInvalidation/GetInvalidation for the production
distribution ARN only. Single-part uploads are capped at 512 MiB/file and require
no multipart permissions. No deletion, ACL, IAM administration, bucket-policy or
distribution-update permissions. SSE-KMS permissions must be separately scoped
to the existing key if required; they are not pre-granted.

Repository variables:

| Name | Value |
| --- | --- |
| `PRODUCTION_DEPLOYMENT_ENABLED` | unset/false until activation approval |
| `AWS_DEPLOY_ROLE_ARN` | proposed `arn:aws:iam::919693204623:role/shortbreakhub-frontend-deploy`, after approval/creation |
| `VITE_API_BASE` | approved existing production API base |
| `VITE_GOOGLE_MAP_MAP_ID` | existing production map ID |
| `VITE_GA_MEASUREMENT_ID` | existing approved value, or blank |

Required repository secrets: `VITE_GOOGLE_MAP_GEOCODING_API_KEY` and
`VITE_EXCHANGERATE_API_KEY`. `VITE_ABSTRACT_GEOLOCATION_API_KEY` is optional:
the only two references are unimported helper definitions, absent from the
production entrypoint graph. No new dependency on that legacy key is introduced.
These protect handling in Actions, not confidentiality in browser bundles:
every VITE value is public at runtime. Copy approved values privately; do not log
them or commit .env. No AWS access keys. `.env.example` documents variable names.
The current Node application does not consume the old GOOGLE_MAP_JAVASCRIPT key
or API_BASE_DEV variable. No dependency on them is introduced.

`node scripts/ci/validate-env.mjs` runs after npm ci and before building, using
Vite's production dotenv precedence (including process-environment overrides).
It checks the existing HTTPS API host/path and provider formats for the three
active Google/map/exchange settings. Errors name fields without printing values.
GA remains optional, including the existing behavior that invalid IDs disable it.
Private local values for all four required settings were found in the currently
served production bundles during this audit, without logging their contents.

The production branch is currently unprotected. Owner decides a practical merge
approval policy; GitHub does not allow authors to approve their own PRs. Pinning
actions and restricting OIDC does not make unreviewed master code safe.

## Phase 1 build-only CI and first deployment

Same-repository pull requests targeting master run the build-only job before merge.
That job has contents:read only, DEPLOY_ENABLED=false, and no OIDC/AWS steps. It
installs, validates production settings, builds, tests, validates all output paths
locally and retains a compact artifact for thirty days. Fork PRs cannot run that
secret-bearing job. Production runs only on refs/heads/master. PR builds use a
separate concurrency group so they cannot displace a queued production deployment.
No merge or production deployment is authorized by Phase 1. Manual dispatch of a
new workflow requires its file on the default branch, so the initial CI check uses
the PR event rather than merging to make dispatch available.

Push to master or dispatch on master runs npm ci, environment validation, existing npm run build
(Vite plus prerender), existing tests, AWS-free safety tests and build validation.
Local validation must use an isolated npm ci install and existing private build
configuration. Prerender fetches live public API data; backend availability and
complete image/content inventory remain build prerequisites. The broken existing
lint command is not enabled or modified by this change.

The npm test runner includes every tests/*.test.js file with four workers,
60-second Node test timeouts, a ten-minute process-group watchdog, and a twelve-
minute Actions step limit. Catalogue counts are derived from the built regional
inventory; offline airport evidence is still validated, but publication of every
historical destination is no longer required. Missing live mappings retain their
existing fail-closed behavior. Broken generated references and metadata still fail.
The car test's frozen Date now starts after module loading and resets before
Vite cleanup; it also has a 30-second test timeout. The intermittent hang was not
reproduced in twelve pre-fix repetitions; this is timing/resource isolation and a
bounded failure mechanism, not a claim of a proven original root cause.

Both deployment guards are off initially. Before activation, review/publish the
scoped branch only with owner authorization, configure the approved build values,
and run build-only CI. Review the completed AWS findings and approve/create the
scoped IAM role separately. Reuse the existing provider. Do not assume code or
read-only inspection authorization permits IAM changes.

After explicit first-deployment approval, set the reviewed configuration and enable
the variable, then dispatch on current master. Credentials are obtained after
build/testing. STS, bucket/region, distribution configuration and ownership checks
must pass. Baseline capture downloads **every existing mutable object that this
release will overwrite**, including metadata, and records absent/new keys. It does
not need to download old immutable assets or untouched objects. A pre-existing
homepage is mandatory. Baseline upload to a GitHub artifact must succeed **before
any production PutObject**. Missing permissions/metadata or failed backup aborts.

Before capture, a GitHub-read-only step identifies the earliest baseline artifact
for the run. On reruns it downloads that artifact, verifies target and all hashes,
and keeps its name in every later snapshot and the Actions summary. Each attempt's
backup is immutable and separately named, never uploaded with overwrite enabled.
An expired, missing or inconsistent original backup aborts before writes; it must
not be replaced with a snapshot of partially deployed production. A rerun with no
earlier backup also stops: if the prior attempt never wrote anything, review that
fact and dispatch a new run. Do not dispatch a fresh run to bypass recovery after
a failed upload. The workflow needs actions:read to inspect/download artifacts;
no extra AWS permission or GitHub write permission is introduced.

The single concurrency group never cancels an active deployment. Branch HEAD is
checked before authentication and again immediately before writes; stale queued
runs and old reruns cannot overwrite newer releases. Old fingerprinted objects
are retained and checked for identical content; conflicting bytes abort. Newly
emitted assets upload first, public files next, HTML last, entry documents last
within HTML. There are no delete APIs. Unrelated paths are rejected rather than
overwritten. There is no automatic old-asset cleanup.

Production verification first waits for the published function's routing to
converge, with a shared ten-minute budget for both hosts. It checks a real
itinerary's exact release bytes, unknown/direct-index/encoded route noindex 404s,
and a known itinerary alias's 301 with its query intact. Invalidation completes
before function publication and is not evidence that the function propagated.
The wait is bounded and fails closed; it does not prove worldwide convergence.
Verification then checks exact initial HTML, WWW canonicals and meaningful content
for every generated public document, live sitemap inventory, homepage bytes on
both hosts, JS/CSS and daily PNG hashes/types, and mapped itinerary images and
hydration in Chromium. HTTP 200 or an app shell cannot pass. Verification performs
no form submission or production writes.
No deployment metadata marker is injected into public HTML or assets.

Invalidation creation uses a stable per-run/attempt caller reference so transient
request retries do not create duplicate batches. Status polling retries transient
errors for up to fifteen minutes; authorization/configuration errors fail. A still-
pending request is saved as pending with its ID and a warning, not labelled a failed
upload. Production verification then uses extended content retries and fresh browser
contexts. A pending request can only finish successfully if release checks pass,
and the summary still warns that other edge locations may be converging. Wrong
hashes, missing images and genuine AWS failures are never converted to success.

The result and recovery link appear in the Actions summary. A build-only success
is identified with deployment disabled, not described as a production update.

## Failure recovery / rollback

Uploads are not atomic. A partial upload or failed verification stops execution;
there is no automatic deletion, rollback, or continued invalidation after a failed
upload. Disable subsequent production runs, inspect the failure and use the
baseline artifact from the failed run. Manual recovery requires explicit production
write authorization and authorized credentials, not merely the read-only profile.

Read the original `recoveryPoint.artifact` from the Actions summary or baseline.json.
After reruns this is normally `frontend-baseline-RUN_ID-1`, not the highest attempt.
If attempt 1 has been deleted or expired, stop for manual recovery review; do not
assume a later snapshot predates the partial deployment. Download that **original**
artifact to `.deployment/recovery` and inspect baseline.json, target, hashes,
metadata and newKeys. The restore command rejects a later attempt's intermediate
snapshot when it points to an earlier original artifact. First check it locally:

```sh
python3 scripts/ci/deploy.py check-baseline --output .deployment/recovery
```

That command verifies files/ownership without AWS calls or activation approval.
Obtain the approved role via
an authorized recovery session/profile; never store long-lived keys in GitHub.
For SEO Phase 2, S3-only recovery is insufficient after function publication.
Download both the **original paired baseline** and the compact release artifact
from the attempt that actually published the function. Put the baseline in
`.deployment/recovery` (with its `edge/` subdirectory) and that attempt's release
artifact in `.deployment/release`. Use the failed release's approved source
checkout. Do not rebuild it against today's backend, use a later attempt's
release manifest, or substitute a later baseline: inventory may have changed.

There is no automated recovery runner/job. Use an explicitly authorized manual
recovery session/profile. Keep GitHub `PRODUCTION_DEPLOYMENT_ENABLED=false` and
wait for active Actions runs to finish. In that session only, replace the two
uppercase placeholders with the failed release commit/run from the artifacts:

```sh
export GITHUB_REPOSITORY=shortbreakhub/short-breaks-hub-frontend
export GITHUB_REF=refs/heads/master
export GITHUB_SHA=FAILED_RELEASE_COMMIT_SHA
export GITHUB_RUN_ID=FAILED_RUN_ID
export DEPLOY_ENABLED=true
```

These are local recovery-process context variables, not changes to GitHub gates.
The failed release checkout must already contain the separately approved edge
configuration (`reviewed:true`); this PR intentionally keeps it false. Never
enable a gate or apply IAM merely to rehearse recovery without write approval.
The named profile is used for both edge API calls and shared account/distribution
preflight, and JSON output is explicitly selected regardless of profile defaults.

After explicit recovery approval, restore the edge inventory **before** its paired
HTML, then invalidate:

```sh
python3 scripts/ci/edge-deploy.py --profile AUTHORIZED_RECOVERY_PROFILE restore --baseline .deployment/recovery/edge
python3 scripts/ci/deploy.py --profile AUTHORIZED_RECOVERY_PROFILE restore --output .deployment/recovery
env -u GITHUB_RUN_ID python3 scripts/ci/deploy.py --profile AUTHORIZED_RECOVERY_PROFILE invalidate
```

Edge recovery verifies the original capture attempt, release/run, both source
hashes, paired S3 generation and current function state before any update. It
refuses unrelated changes. A failed DEVELOPMENT smoke test is recovered by
resetting DEVELOPMENT without an unnecessary LIVE publication. After LIVE
publication the original function is restored first, so newly retained S3 keys
are not still exposed through a newer inventory. A mismatched/expired artifact
requires recovery review, not bypassing these checks.

The invalidation command unsets the run ID for that process only, selecting a
fresh manual caller reference. Reusing the failed Actions run's reference could
return its already-completed invalidation instead of purging restored content.

Restoration verifies baseline file hashes and restores metadata (including prior
cache directives and encryption) to the same approved keys, HTML last. Previously
referenced fingerprinted assets remain in S3. New route objects remain; their
removal needs separate approval. Baseline records list them explicitly.
Recheck production homepage against baseline checksum and verify representative
itineraries and their retained asset URLs before re-enabling automatic deployment.
Unset the local recovery context after the session. Restoring the original SEO
baseline restores its old app-shell limitation; successful rollback is not a
successful SEO release. The detailed rationale is in
[the itinerary SEO report](seo-itinerary-delivery.md#failure-handling-and-paired-recovery).
For an older release, use the retained compact release artifact, construct a
reviewed restoration inventory with its content types/cache metadata and verify
all referenced immutable assets still exist; the immediate pre-deployment baseline
is the primary supported paired rollback. Do not rebuild an old commit as a
substitute: live backend data can differ.

Artifacts retain thirty days by default; download the initial baseline for longer
recovery coverage. Compact release records contain mutable files and full hashes,
not the roughly 1.68 GB assets. No backend data rollback is attempted.

Safe drill now: `python3 -m unittest discover -s tests/ci -v` includes an offline
rollback drill that simulates a partial deployment and rerun, rejects the later
snapshot, restores original bytes/metadata in a local fake store and retains new
objects. AWS calls are mocked and asserted absent. For a controlled production
drill after separate authorization, capture/persist/download the real initial
baseline, run check-baseline, and inspect the proposed restoration inventory.
Only with explicit write approval run restore and invalidate, then compare live
homepage hashes, object metadata, JS/CSS and image URLs against that baseline.
No production drill has been performed.

## Cost before activation

No new fixed-cost AWS services, staging, EC2, ECS, RDS or hosting platform.
This repository is public: standard GitHub runner compute is free. At one release
per day, two roughly 20 MB mutable snapshots with thirty-day retention have a
roughly 1.2 GB upper bound before compression. With a 500 MB unused allowance,
the uncompressed excess would cost about $0.18/month at $0.25/GB-month. Actual
HTML compression reduces this substantially; reruns and other account artifacts
can increase usage. Retention is intentionally thirty days, not silently shortened
to fit a quota. Check account artifact usage before activation.
The current 19.47 MB compact release measures 7.06 MB in a level-6 ZIP; two
similar snapshots per day for thirty days would be about 424 MB, plus metadata,
verification records and other account usage. This is an estimate, not a storage
allowance guarantee. Verify the 30-day expiry during the first build-only CI run.

With 1,500-2,000 upload requests/release and 30 releases/month, London PUT requests
cost about $0.24-$0.32/month at $0.0053/1,000; the uploader normally skips existing
fingerprinted assets. HEAD/GET verification and tag-read requests add small costs.
All 1,238 immutable keys shared by production and the candidate build matched
their local MD5 ETags; sampled JS/CSS/PNGs use SSE-S3. These objects can be compared
without downloading their bodies. Other future legacy assets without SHA metadata
are downloaded to verify identical bytes; this can repeat on subsequent runs.
In the worst case, 1.68 GB/run to GitHub runners can add several dollars/month of
S3 internet egress if free allowances are exhausted. Review the verified object's
checksums/encryption before activation. Newly uploaded SHA-tagged objects avoid
those body downloads on subsequent runs. New immutable assets use conditional
creation so a concurrent external writer cannot be silently overwritten.
CloudFront invalidation is free for the first 1,000 account-wide paths/month, then
$0.005/path. Broad invalidation causes cache refills. Retained assets, public
verification traffic, baseline downloads, KMS and excess artifact storage are
usage-based, not guaranteed free. No deletion costs or automatic cleanup.

References: https://docs.github.com/en/billing/concepts/product-billing/github-actions
https://aws.amazon.com/s3/pricing/
https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/eu-west-2/index.json
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PayingForInvalidation.html

## Historical itinerary delivery issue and SEO Phase 2

Prior read-only checks found some public itinerary URLs serve app-shell HTML even
though the build generates itinerary documents. Missing URLs also returned S3 403.
The original CI/CD integration did not change that behavior and excluded the
local routing/404 commit. PR #112 now proposes a separately gated update to the
existing associated function, generated public itinerary inventory, noindex 404s,
strict initial-HTML verification and paired edge/S3 recovery. See
[the investigation/release report](seo-itinerary-delivery.md). This extends the
same pipeline; no SSR framework, distribution association or IAM change has been
applied merely by preparing the PR.
