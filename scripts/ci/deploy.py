"""Production-only AWS CLI orchestration. No deletion or infrastructure mutations."""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.parse

ACCOUNT = '919693204623'
BUCKET = 'shortbreakhub.com'
DISTRIBUTION = 'E323A73D49XQ0O'
REGION = 'eu-west-2'
CONFIG = Path('infra/deployment/production.json')
PROFILE = None


def digest(data):
    return hashlib.sha256(data).hexdigest()


def aws(service, operation, arguments=None, outfile=None, missing_ok=False, body=None):
    command = ['aws', '--region', REGION, '--no-cli-pager']
    if PROFILE:
        command += ['--profile', PROFILE]
    command += [service, operation, '--output', 'json']
    if arguments:
        command += ['--cli-input-json', json.dumps(arguments)]
    if outfile is not None:
        command.append(str(outfile))
    if body is not None:
        command += ['--body', str(body)]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        if missing_ok and any(x in result.stderr for x in ['(404)', '(NoSuchKey)', '(NotFound)']):
            return None
        # Do not echo commands, credentials, configuration, or request bodies.
        raise RuntimeError(f'AWS {service}:{operation} failed: {result.stderr.strip()[:500]}')
    return json.loads(result.stdout or '{}')


def identity():
    who = aws('sts', 'get-caller-identity')
    if who['Account'] != ACCOUNT:
        raise ValueError('Wrong AWS account; stopping before further requests')
    return who


def safe_key(key):
    if not isinstance(key, str) or not key or key.startswith('/') or '\\' in key or any(c in key for c in ['?', '#', '*']) or any(ord(c) < 32 for c in key) or any(p in ['', '.', '..'] or p.startswith('.') for p in key.split('/')):
        raise ValueError('Unsafe deployment key')
    return key


def distribution():
    response = aws('cloudfront', 'get-distribution', {'Id': DISTRIBUTION})
    config = response['Distribution']['DistributionConfig']
    if not config['Enabled']:
        raise ValueError('Production distribution is disabled')
    # Redact origin secrets before hashing or writing inspection output.
    for origin in config['Origins']['Items']:
        for header in origin.get('CustomHeaders', {}).get('Items', []):
            header['HeaderValue'] = '<redacted>'
    return config


def config_hash(config):
    return digest(json.dumps(config, sort_keys=True, separators=(',', ':')).encode())


def reviewed_config(require_approval=True):
    config = json.loads(CONFIG.read_text())
    if (require_approval and not config.get('reviewed')) or (config.get('account'), config.get('bucket'), config.get('distribution'), config.get('region')) != (ACCOUNT, BUCKET, DISTRIBUTION, REGION):
        raise ValueError('AWS deployment configuration has not been reviewed')
    if not config.get('distributionIdentifierConfirmed'):
        raise ValueError('Distribution identifier correction requires explicit confirmation')
    prefix = config.get('originPath')
    if not isinstance(prefix, str) or (prefix and (not prefix.startswith('/') or prefix.endswith('/'))):
        raise ValueError('Unverified origin path')
    if prefix:
        safe_key(prefix[1:])
    if not config.get('distributionConfigSha256') or not config.get('objectTagsAbsent'):
        raise ValueError('Distribution fingerprint and object-tag audit are required')
    for phase in ['assets', 'public', 'html']:
        if not config.get('cacheControl', {}).get(phase):
            raise ValueError('Cache-Control must be explicitly reviewed for every upload phase')
    paths = config.get('invalidationPaths')
    if not paths or any(not isinstance(p, str) or not p.startswith('/') for p in paths):
        raise ValueError('Invalidation paths have not been reviewed')
    for key in config.get('ownedKeys', []):
        safe_key(key)
    for key in config.get('ownedPrefixes', []):
        if not key.endswith('/'):
            raise ValueError('Owned prefixes must end with /')
        safe_key(key[:-1])
    return config


def owned(config, key):
    safe_key(key)
    if key not in config.get('ownedKeys', []) and not any(key.startswith(p) for p in config.get('ownedPrefixes', [])):
        raise ValueError(f'Output path has no verified frontend ownership: {key}')
    return config['originPath'].lstrip('/') + ('/' if config['originPath'] else '') + key


def preflight():
    identity()
    config = reviewed_config()
    aws('s3api', 'head-bucket', {'Bucket': BUCKET, 'ExpectedBucketOwner': ACCOUNT})
    region = aws('s3api', 'get-bucket-location', {'Bucket': BUCKET, 'ExpectedBucketOwner': ACCOUNT}).get('LocationConstraint')
    if region != REGION:
        raise ValueError('Unexpected production bucket region')
    live = distribution()
    if config_hash(live) != config['distributionConfigSha256']:
        raise ValueError('CloudFront configuration differs from reviewed inspection; re-audit before writing')
    origin = next(o for o in live['Origins']['Items'] if o['Id'] == live['DefaultCacheBehavior']['TargetOriginId'])
    allowed_domains = {f'{BUCKET}.s3.amazonaws.com', f'{BUCKET}.s3.{REGION}.amazonaws.com', f'{BUCKET}.s3-{REGION}.amazonaws.com'}
    if origin['DomainName'] not in allowed_domains or origin.get('OriginPath', '') != config['originPath']:
        raise ValueError('Default origin is not the verified production S3 destination')
    return config


def load_manifest(path, config, files_root=None):
    manifest = json.loads(Path(path).read_text())
    if manifest.get('version') != 1 or not manifest.get('files'):
        raise ValueError('Invalid release manifest')
    seen = set()
    for entry in manifest['files']:
        key = entry['key']
        owned(config, key)
        if key in seen or entry['phase'] not in ['assets', 'public', 'html']:
            raise ValueError('Duplicate key or invalid upload phase')
        seen.add(key)
        expected_phase = 'html' if key.endswith('.html') else 'assets' if key.startswith('assets/') else 'public'
        if entry['phase'] != expected_phase:
            raise ValueError('Manifest phase differs from output path')
        if files_root is not None:
            path = Path(files_root) / key
            if path.is_symlink() or not path.is_file():
                raise ValueError('Missing or symlinked release file')
            data = path.read_bytes()
            if len(data) != entry['size'] or digest(data) != entry['sha256']:
                raise ValueError(f'Release checksum mismatch: {key}')
    return manifest


def plan(manifest_path, root):
    # Read local configuration only: activation is deliberately not required.
    config = reviewed_config(require_approval=False)
    manifest = load_manifest(manifest_path, config, root)
    print(f'Validated all {len(manifest["files"])} deployment paths/checksums against the verified S3 allowlist; no AWS calls')


def s3_args(config, key):
    return {'Bucket': BUCKET, 'Key': owned(config, key), 'ExpectedBucketOwner': ACCOUNT}


def capture(manifest_path, output):
    config = preflight()
    manifest = load_manifest(manifest_path, config)
    recovery = None
    if os.environ.get('GITHUB_RUN_ID'):
        recovery = json.loads(Path('.deployment/recovery-point.json').read_text())['recoveryPoint']
        if recovery['runId'] != os.environ['GITHUB_RUN_ID']:
            raise ValueError('Recovery point belongs to a different workflow run')
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    baseline = {'version': 1, 'forCommit': manifest['commit'], 'manifestSha256': digest(Path(manifest_path).read_bytes()), 'target': {'account': ACCOUNT, 'bucket': BUCKET, 'originPath': config['originPath']}, 'captureAttempt': os.environ.get('GITHUB_RUN_ATTEMPT'), 'recoveryPoint': recovery, 'files': [], 'newKeys': []}
    for entry in manifest['files']:
        if entry['phase'] == 'assets':
            continue
        target = output / 'files' / entry['key']
        target.parent.mkdir(parents=True, exist_ok=True)
        metadata = aws('s3api', 'get-object', s3_args(config, entry['key']), target, missing_ok=True)
        if metadata is None:
            baseline['newKeys'].append(entry['key'])
            continue
        tags = aws('s3api', 'get-object-tagging', s3_args(config, entry['key']))['TagSet']
        if tags:
            raise ValueError(f'Tagged mutable object needs explicit preservation design: {entry["key"]}')
        baseline['files'].append({'key': entry['key'], 'sha256': digest(target.read_bytes()), 'metadata': metadata})
    if not any(f['key'] == 'index.html' for f in baseline['files']):
        raise ValueError('No existing homepage captured; aborting before any writes')
    (output / 'baseline.json').write_text(json.dumps(baseline, indent=2) + '\n')
    print(f'Captured {len(baseline["files"])} mutable objects; no production writes')


def put(config, entry, root, restore_metadata=None, create_only=False):
    args = s3_args(config, entry['key'])
    path = Path(root) / entry['key']
    data = path.read_bytes()
    if digest(data) != entry['sha256'] or len(data) > 512 * 1024 * 1024:
        raise ValueError('Upload file failed integrity/size check')
    if restore_metadata is None:
        args.update(ContentType=entry['contentType'], CacheControl=config['cacheControl'][entry['phase']], Metadata={'sbh-sha256': entry['sha256']})
    else:
        for field in ['ContentType','CacheControl','ContentEncoding','ContentLanguage','ContentDisposition','Expires','WebsiteRedirectLocation','Metadata','ServerSideEncryption','SSEKMSKeyId','BucketKeyEnabled']:
            if field in restore_metadata:
                args[field] = restore_metadata[field]
    args['ChecksumSHA256'] = base64.b64encode(bytes.fromhex(entry['sha256'])).decode()
    if create_only:
        args['IfNoneMatch'] = '*'
    # Single-part PutObject avoids multipart permissions and has a bounded size.
    # CLI Body must be passed as a file path, not file contents in JSON/logs.
    aws('s3api', 'put-object', args, body=path)


def asset(config, entry, root):
    args = s3_args(config, entry['key'])
    head = aws('s3api', 'head-object', args, missing_ok=True)
    if head is not None:
        if head.get('Metadata', {}).get('sbh-sha256') == entry['sha256'] and head['ContentLength'] == entry['size']:
            return
        # S3 single-part, unencrypted/SSE-S3 ETags are MD5 digests. Do not apply
        # this shortcut to multipart or KMS objects, whose ETags are opaque.
        etag = head.get('ETag', '').strip('"')
        if head.get('ServerSideEncryption') in [None, 'AES256'] and len(etag) == 32 and head['ContentLength'] == entry['size']:
            local_md5 = hashlib.md5((Path(root) / entry['key']).read_bytes(), usedforsecurity=False).hexdigest()
            if etag == local_md5:
                return
        # Legacy objects may not have our metadata: verify bytes before retaining.
        with tempfile.TemporaryDirectory(prefix='sbh-asset-') as temp:
            path = Path(temp) / 'asset'
            aws('s3api', 'get-object', args, path)
            if digest(path.read_bytes()) != entry['sha256']:
                raise ValueError(f'Existing fingerprinted asset has different bytes: {entry["key"]}')
        return
    put(config, entry, root, create_only=True)


def assert_current():
    if os.environ.get('GITHUB_REF') != 'refs/heads/master' or os.environ.get('GITHUB_REPOSITORY') != 'shortbreakhub/short-breaks-hub-frontend':
        raise ValueError('Deployment requires the production repository and branch')
    head = subprocess.check_output(['git', 'ls-remote', 'origin', 'refs/heads/master'], text=True).split()[0]
    if head != os.environ.get('GITHUB_SHA'):
        raise ValueError('Stale production commit; stopping before writes')


def deploy(manifest_path, root, baseline_path):
    config = preflight()
    manifest = load_manifest(manifest_path, config, root)
    if manifest['commit'] != os.environ.get('GITHUB_SHA'):
        raise ValueError('Manifest is not for the triggering commit')
    baseline = json.loads(Path(baseline_path).read_text())
    if baseline.get('target') != {'account': ACCOUNT, 'bucket': BUCKET, 'originPath': config['originPath']} or not baseline.get('files'):
        raise ValueError('Recoverable baseline required')
    if baseline.get('forCommit') != manifest['commit'] or baseline.get('manifestSha256') != digest(Path(manifest_path).read_bytes()):
        raise ValueError('Baseline is not for this deployment manifest')
    if os.environ.get('GITHUB_RUN_ID'):
        point = json.loads(Path('.deployment/recovery-point.json').read_text())['recoveryPoint']
        if baseline.get('recoveryPoint') != point:
            raise ValueError('Original recovery point reference changed; refusing deployment')
    assert_current()
    assets = [f for f in manifest['files'] if f['phase'] == 'assets']
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda f: asset(config, f, root), assets))
    for phase in ['public', 'html']:
        files = [f for f in manifest['files'] if f['phase'] == phase]
        files.sort(key=lambda f: (f['key'] in ['app-shell.html', 'index.html'], f['key']))
        for entry in files:
            put(config, entry, root)
    print(f'Uploaded release {manifest["commit"]}; no objects deleted')


def transient_aws_error(error):
    return any(code in str(error) for code in ['Throttling','TooManyInvalidationsInProgress','ServiceUnavailable','InternalError','RequestTimeout','Could not connect','Connection reset','Connection was closed','Read timeout','Connect timeout','timed out'])


def wait_invalidation(invalidation_id, max_seconds=900, interval=20, clock=None, sleep=None):
    clock = clock or time.monotonic
    sleep = sleep or time.sleep
    deadline = clock() + max_seconds
    report = {'id':invalidation_id,'status':'InProgress','waitTimedOut':False,'transientErrors':0}
    while True:
        try:
            response = aws('cloudfront','get-invalidation',{'DistributionId':DISTRIBUTION,'Id':invalidation_id})
            report['status'] = response['Invalidation']['Status']
            if report['status'] == 'Completed':
                return report
            if report['status'] != 'InProgress':
                raise ValueError('Unexpected invalidation status')
        except RuntimeError as error:
            if not transient_aws_error(error):
                raise
            report['transientErrors'] += 1
        remaining = deadline - clock()
        if remaining <= 0:
            report['waitTimedOut'] = True
            print('::warning::CloudFront invalidation is still pending after the bounded wait. Continue with extended release verification; pending is not proof of failed upload.')
            return report
        sleep(min(interval, remaining))


def invalidate():
    config = preflight()
    run_id = os.environ.get('GITHUB_RUN_ID', f'manual-{time.time_ns()}')
    reference = f'sbh-{run_id}-{os.environ.get("GITHUB_RUN_ATTEMPT", "1")}-v1'
    request = {'DistributionId': DISTRIBUTION, 'InvalidationBatch': {'Paths': {'Quantity': len(config['invalidationPaths']), 'Items': config['invalidationPaths']}, 'CallerReference': reference}}
    for attempt in range(4):
        try:
            response = aws('cloudfront','create-invalidation',request)
            break
        except RuntimeError as error:
            if not transient_aws_error(error) or attempt == 3:
                raise
            time.sleep(5 * 2**attempt)
    invalidation_id = response['Invalidation']['Id']
    path = Path('.deployment/invalidation.json')
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps({'id':invalidation_id,'status':response['Invalidation']['Status'],'waitTimedOut':False},indent=2)+'\n')
    try:
        report = wait_invalidation(invalidation_id)
    except Exception:
        path.write_text(json.dumps({'id':invalidation_id,'status':'PollingFailed','waitTimedOut':False},indent=2)+'\n')
        raise
    path.write_text(json.dumps(report,indent=2)+'\n')
    print(f'CloudFront invalidation {invalidation_id}: {report["status"]}. Production verification remains mandatory.')


def validate_baseline(output, config):
    baseline = json.loads((Path(output) / 'baseline.json').read_text())
    if baseline['target'] != {'account': ACCOUNT, 'bucket': BUCKET, 'originPath': config['originPath']}:
        raise ValueError('Baseline target mismatch')
    if baseline.get('version') != 1 or not baseline.get('files'):
        raise ValueError('Invalid baseline')
    seen = set()
    for entry in baseline['files']:
        owned(config, entry['key'])
        path = Path(output) / 'files' / entry['key']
        if entry['key'] in seen or entry['key'].startswith('assets/') or path.is_symlink() or digest(path.read_bytes()) != entry['sha256']:
            raise ValueError('Baseline failed integrity check before restoration')
        seen.add(entry['key'])
    return baseline


def choose_recovery_artifact(artifacts, run_id, attempt):
    prefix = f'frontend-baseline-{run_id}-'
    matches = [a for a in artifacts if a['name'].startswith(prefix) and a['name'][len(prefix):].isdigit()]
    if matches:
        earliest = min(matches, key=lambda a: int(a['name'][len(prefix):]))
        if earliest.get('expired') or int(earliest['name'][len(prefix):]) >= attempt:
            raise ValueError('Original baseline expired or current attempt already has a baseline; stop for recovery review')
        return earliest
    if attempt > 1:
        raise ValueError('Rerun has no recoverable earlier baseline. Do not capture partial production as the original; review recovery or dispatch a new run if no writes occurred.')
    return None


def recovery_point():
    config = reviewed_config(require_approval=False)
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    attempt = os.environ.get('GITHUB_RUN_ATTEMPT', '')
    if not run_id.isdigit() or not attempt.isdigit() or int(attempt) < 1:
        raise ValueError('Recovery point requires a GitHub run and attempt')
    result = subprocess.run(['gh','api','--paginate','--slurp',f'repos/shortbreakhub/short-breaks-hub-frontend/actions/runs/{run_id}/artifacts?per_page=100'],capture_output=True,text=True,check=True)
    artifacts = [a for page in json.loads(result.stdout) for a in page['artifacts']]
    earliest = choose_recovery_artifact(artifacts, run_id, int(attempt))
    if earliest:
        output = Path('.deployment/original-baseline')
        if output.exists():
            raise ValueError('Original baseline destination already exists; never overwrite it')
        subprocess.run(['gh','run','download',run_id,'--repo','shortbreakhub/short-breaks-hub-frontend','--name',earliest['name'],'--dir',str(output)],check=True,capture_output=True,text=True)
        baseline = validate_baseline(output, config)
        point = baseline.get('recoveryPoint')
        if not point or point['artifact'] != earliest['name'] or point['runId'] != run_id or baseline['forCommit'] != os.environ.get('GITHUB_SHA'):
            raise ValueError('Original recovery artifact is unavailable or inconsistent; stop rather than substituting a later snapshot')
    else:
        point = {'runId':run_id,'attempt':int(attempt),'artifact':f'frontend-baseline-{run_id}-{attempt}'}
    Path('.deployment').mkdir(exist_ok=True)
    Path('.deployment/recovery-point.json').write_text(json.dumps({'recoveryPoint':point},indent=2)+'\n')
    print(f'Original recovery point: {point["artifact"]}; later attempt snapshots will not replace it')


def restore(output):
    config = preflight()
    baseline = validate_baseline(output, config)
    point = baseline.get('recoveryPoint')
    if point and str(point['attempt']) != str(baseline.get('captureAttempt')):
        raise ValueError(f'This is an intermediate snapshot. Restore original artifact {point["artifact"]} instead.')
    # Rollback is explicit and manual; never require its old SHA to equal master.
    for entry in sorted(baseline['files'], key=lambda f: (f['key'].endswith('.html'), f['key'] in ['index.html','app-shell.html'], f['key'])):
        owned(config, entry['key'])
        put(config, entry, Path(output) / 'files', entry['metadata'])
    print(f'Restored {len(baseline["files"])} mutable objects; new keys retained: {len(baseline["newKeys"])}')


def inspect(output):
    if not PROFILE:
        raise ValueError('Read-only inspection requires --profile explicitly')
    who = identity()
    aws('s3api', 'head-bucket', {'Bucket': BUCKET, 'ExpectedBucketOwner': ACCOUNT})
    report = {'identity': who, 'distribution': distribution()}
    report['distributionConfigSha256'] = config_hash(report['distribution'])
    for label, operation in [('location','get-bucket-location'),('versioning','get-bucket-versioning'),('encryption','get-bucket-encryption'),('ownership','get-bucket-ownership-controls')]:
        report[label] = aws('s3api', operation, {'Bucket': BUCKET, 'ExpectedBucketOwner': ACCOUNT})
    # CLI auto-pagination collects the complete inventory, not only 1,000 keys.
    report['objects'] = aws('s3api','list-objects-v2',{'Bucket':BUCKET,'ExpectedBucketOwner':ACCOUNT}).get('Contents', [])
    policies = {}
    for behavior in [report['distribution']['DefaultCacheBehavior'], *report['distribution'].get('CacheBehaviors', {}).get('Items', [])]:
        policy = behavior.get('CachePolicyId')
        if policy and policy not in policies:
            policies[policy] = aws('cloudfront','get-cache-policy',{'Id':policy})
    report['cachePolicies'] = policies
    providers = aws('iam','list-open-id-connect-providers')['OpenIDConnectProviderList']
    report['githubOidcProviders'] = [aws('iam','get-open-id-connect-provider',{'OpenIDConnectProviderArn':p['Arn']}) for p in providers if p['Arn'].endswith('/token.actions.githubusercontent.com')]
    # Only sample metadata; full mutable ownership/tag review is still required.
    report['sampleMetadata'] = {}
    for obj in report['objects'][:10]:
        report['sampleMetadata'][obj['Key']] = aws('s3api','head-object',{'Bucket':BUCKET,'Key':obj['Key'],'ExpectedBucketOwner':ACCOUNT})
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + '\n')
    path.chmod(0o600)
    print(f'Read-only inspection saved locally to {path}; origin custom headers redacted. No configuration approved automatically.')


def policy(output):
    # A local proposal must be reviewable without enabling production writes.
    config = reviewed_config(require_approval=False)
    resources = [f'arn:aws:s3:::{BUCKET}/{owned(config, key)}' for key in config['ownedKeys']]
    resources += [f'arn:aws:s3:::{BUCKET}/{owned(config, prefix + "placeholder")[:-len("placeholder")]}*' for prefix in config['ownedPrefixes']]
    if not resources:
        raise ValueError('No approved frontend paths')
    document = {'Version':'2012-10-17','Statement':[
        {'Effect':'Allow','Action':['s3:ListBucket','s3:GetBucketLocation'],'Resource':f'arn:aws:s3:::{BUCKET}'},
        {'Effect':'Allow','Action':['s3:GetObject','s3:GetObjectTagging','s3:PutObject'],'Resource':resources},
        {'Effect':'Allow','Action':['cloudfront:GetDistribution','cloudfront:CreateInvalidation','cloudfront:GetInvalidation'],'Resource':f'arn:aws:cloudfront::{ACCOUNT}:distribution/{DISTRIBUTION}'}]}
    Path(output).parent.mkdir(parents=True,exist_ok=True)
    Path(output).write_text(json.dumps(document,indent=2)+'\n')
    print('Wrote proposed permission policy locally; no AWS calls or IAM changes')


def main():
    global PROFILE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile')
    parser.add_argument('command', choices=['inspect','policy','plan','recovery-point','check-baseline','preflight','capture','deploy','invalidate','restore'])
    parser.add_argument('--manifest', default='.deployment/release/manifest.json')
    parser.add_argument('--root', default='dist')
    parser.add_argument('--baseline', default='.deployment/baseline/baseline.json')
    parser.add_argument('--output', default='.deployment/baseline')
    args = parser.parse_args()
    PROFILE = args.profile
    if args.command == 'inspect': inspect(args.output)
    elif args.command == 'policy': policy(args.output)
    elif args.command == 'plan': plan(args.manifest,args.root)
    elif args.command == 'recovery-point': recovery_point()
    elif args.command == 'check-baseline':
        validate_baseline(args.output,reviewed_config(require_approval=False))
        print('Baseline target, file hashes and ownership verified locally; no AWS calls or writes')
    elif args.command == 'preflight': preflight()
    elif args.command == 'capture': capture(args.manifest,args.output)
    elif args.command == 'deploy': deploy(args.manifest,args.root,args.baseline)
    elif args.command == 'invalidate': invalidate()
    elif args.command == 'restore': restore(args.output)


if __name__ == '__main__':
    main()
