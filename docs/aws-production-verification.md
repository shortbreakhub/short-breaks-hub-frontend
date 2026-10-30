# Read-only AWS production verification

This is the historical 26 October inspection record. References below to an
unchanged function or the original workflow's scope describe that baseline.
SEO Phase 2 (PR #112) proposes separately gated function publication and paired
recovery; use [the current deployment runbook](frontend-deployment.md) for that
release. This historical record is not evidence that the proposed fix is live.

Inspection date: 2026-10-26. All AWS operations were read-only API requests,
object downloads or policy validation. No credentials, profiles, IAM resources,
bucket settings, S3 objects, distributions, functions or GitHub settings changed.
Raw reports remain in ignored `.deployment/` files with restricted local access.
Subsequent owner-authorized Phase 1 created the scoped frontend deploy role and
configured GitHub build settings; see frontend-deployment.md. The read-only
findings below describe the original inspection. No production deployment or
OIDC-provider modification was part of that follow-up.

## Identity and exact distribution identifier

Both explicitly authorized profiles returned account **919693204623**:

| Profile | IAM principal | Inspection outcome |
| --- | --- | --- |
| cozy-farm | user/cozy-farm-backend | HeadBucket forbidden; CloudFront GetDistribution denied |
| colorful-life-admin | user/colorful-life-admin | Production inspection succeeded |

Use `colorful-life-admin` only for the authorized read-only inspection. This does
not authorize it for deployment or IAM changes. CI must use a new scoped OIDC role.

The API and owner confirmed **E323A73D49XQ0O**: the final characters are numeric
zero (U+0030), then capital O (U+004F). Both previously supplied alternatives
E323A73D49XQOO and E323A73D49XQ00 returned NoSuchDistribution using the admin
profile. A read-only list filtered to the two production aliases identified the
correct distribution; no unrelated distribution was modified.

Verified distribution ARN:
`arn:aws:cloudfront::919693204623:distribution/E323A73D49XQ0O`.
Enabled, status Deployed, domain `d2jm6ofttu9una.cloudfront.net`, aliases
`www.shortbreakhub.com` and `shortbreakhub.com`.

## Origins, routing and cache behavior

Default origin: `shortbreakhub.com.s3.eu-west-2.amazonaws.com`, origin path **empty**.
Deployment destination is therefore **s3://shortbreakhub.com/**, not a subdirectory.
Default root object is index.html. GET/HEAD only, HTTPS redirects and compression
are enabled. CloudFront OAC EB98YXJFWR638 uses SigV4 signing on every request.
No OAI and no origin custom headers are configured.

Default cache policy: Managed-CachingOptimized,
658327ea-f89d-4fab-a63d-7e88639e58f6. Min/default/max TTLs:
**1 / 86400 / 31536000 seconds**. Query strings, cookies and user headers are not
in the cache key; gzip/Brotli content negotiation is enabled.

Default viewer-request association:
`arn:aws:cloudfront::919693204623:function/shortbreakhub-route-rewrite`.
LIVE code was downloaded and inspected without modification. It maps public
regions/countries/contact to generated index documents and itineraries/SPA paths
to app-shell.html. No Lambda associations or custom error responses exist.
The known itinerary-document discrepancy remains out of scope.

The sole additional behavior is `/sitemap.xml`, served from the HTTPS-only
api.shortbreakhub.com origin, empty origin path, no function association, and
Managed-CachingDisabled (4135ea2d-6df8-44a3-9df3-4b5a84be39ad; all TTLs zero).
No sitemap object is included in the upload allowlist or IAM object resources.

Redacted distribution-config SHA256:
`c30048c904f5d217a282bcd34f1894129ed7d18d47d9806b417fef226031c837`.
The deployment preflight checks this fingerprint and the exact S3 origin/path;
it never edits distribution configuration. Managed cache policies were separately
read and recorded. The associated function code is not deployed by this workflow.

## Bucket and frontend object ownership

Bucket region: eu-west-2. BucketOwnerEnforced ownership; ACLs disabled. All four
public-access-block switches are true. The bucket policy permits only CloudFront
GetObject via the verified distribution SourceArn; it has no blanket deny that
would prevent a separately approved same-account deployment role. No bucket-policy
change is proposed. Missing-object 403 behavior remains unchanged.

Default encryption: SSE-S3 AES256; BucketKeyEnabled returned true, but no KMS key
is configured/required. SSE-C uploads are blocked. GetBucketVersioning returned
an empty object: versioning is not enabled, so snapshots are required for recovery.

Complete inventory: **1,529 objects / 1,677,012,880 bytes**:
1,258 assets, 201 itinerary documents, 52 country documents, three license files,
region/contact documents, root frontend files and `.vite/manifest.json`.
No customer upload or backend-data namespace was observed.

The production Vite manifest accounts for 1,257 asset keys; the remaining emitted
MapLibre worker also exists in the candidate build and has matching bytes/ETag.
All 1,238 immutable keys shared by the candidate and production match local MD5
ETags. Twenty old chunk keys differ from the candidate's twenty new chunk keys;
old chunks will remain untouched. Existing `.vite/manifest.json` and `404.html`
are also outside the upload allowlist and must remain untouched.

Verified frontend namespace proposal: assets/, browse/, itinerary/, plus the 16 exact
keys in production.json. This covers all 1,527 candidate build files and does
not grant writes to the entire bucket root. New public namespaces require review.

All **269 mutable overwrite candidates** were checked with HeadObject and
GetObjectTagging: 262 HTML, two PNG, four text/plain and one SVG. All use AES256,
have no tags, no custom metadata, no cache headers, no content encoding and no
website redirect metadata. No header/tag inspection failed. The existing JS/CSS
entry files, all eleven mapped daily PNGs, and the MapLibre worker were also
sampled: correct content types, SSE-S3, no cache headers or content encoding.

## Local deployment and permission proposal

production.json records the verified bucket-root destination, exact distribution
and ownership allowlist. Deployment remains **disabled**: reviewed=false and no
GitHub activation setting was changed. The identifier-confirmation flag is true
only because the owner explicitly confirmed the API's 0O spelling.

Proposed object headers: immutable one-year caching for newly uploaded fingerprinted
assets, five-minute browser caching for mutable public files, and
`public, max-age=0, s-maxage=1, must-revalidate` for HTML. This uses the existing
one-second edge minimum without changing any cache policy. Existing immutable
objects are retained without rewriting their metadata. One `/*` invalidation per
full release covers rewritten routes and costs one path; broader refill traffic
is a known tradeoff. No invalidation was requested during this audit.

Existing GitHub OIDC provider:
`arn:aws:iam::919693204623:oidc-provider/token.actions.githubusercontent.com`,
audience sts.amazonaws.com, created 2026-10-20. **Reuse it unchanged.**
No dedicated Short Break Hub frontend GitHub deployment role was found by role
name/trust inspection. The existing shortbreakhub-ecs-task-role is unrelated.

After separate approval, create one role, proposed name shortbreakhub-frontend-deploy,
using oidc-trust.json and permissions-proposal.json. Exact trust: this repository,
refs/heads/master, audience sts.amazonaws.com. The permission proposal grants
ListBucket/GetBucketLocation on this bucket; GetObject/GetObjectTagging/PutObject
on the three verified prefixes and sixteen exact keys; GetDistribution,
CreateInvalidation and GetInvalidation on the corrected distribution ARN only.
No S3 deletion, KMS, ACL, IAM administration, bucket-policy modification or
distribution-configuration write permission. AWS Access Analyzer ValidatePolicy
returned **zero findings** for the identity-policy proposal. No policy was applied.

Remaining activation steps: approve the role/trust/permission documents and
cache/invalidation choices; authorize role creation, GitHub build variables/secrets,
publication/merge and first deployment separately. Capture and persist the mutable
baseline before the first PutObject, as enforced by the prepared workflow.
