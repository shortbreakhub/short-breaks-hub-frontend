"""Release the existing associated function only, after HTML upload and approval.

No distribution, bucket, IAM, DNS or association changes. Never called by PR CI.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
import deploy

CONFIG = Path('infra/cloudfront/release.json')
TEMPLATE = Path('infra/cloudfront/viewer-request.js')
RELEASE = Path('.deployment/release/edge')
BASELINE = Path('.deployment/baseline/edge')
NAME = 'shortbreakhub-route-rewrite'


def call(operation, args, outfile=None):
    args = dict(args)
    command = ['aws', '--region', deploy.REGION, '--no-cli-pager', '--output', 'json']
    if deploy.PROFILE:
        command += ['--profile', deploy.PROFILE]
    command += ['cloudfront', operation, '--name', NAME]
    for key, option in [('IfMatch', '--if-match'), ('FunctionConfig', '--function-config')]:
        if key in args:
            value = args.pop(key)
            command += [option, json.dumps(value) if isinstance(value, dict) else value]
    for key, option in [('FunctionCode', '--function-code'), ('EventObject', '--event-object')]:
        if key in args:
            command += [option, 'fileb://' + str(Path(args.pop(key)).resolve())]
    if args:
        command += ['--cli-input-json', json.dumps(args)]
    if outfile is not None:
        command.append(str(outfile))
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f'CloudFront {operation} failed: {result.stderr[:300]}')
    return json.loads(result.stdout or '{}')


def approved(recovery=False):
    config = json.loads(CONFIG.read_text())
    if config.get('reviewed') is not True or config.get('name') != NAME or config.get('runtime') != 'cloudfront-js-2.0':
        raise ValueError('Edge release requires explicit review approval in infra/cloudfront/release.json')
    if os.environ.get('DEPLOY_ENABLED') != 'true':
        raise ValueError('Production deployment is disabled')
    if recovery:
        if os.environ.get('GITHUB_REF') != 'refs/heads/master' or os.environ.get('GITHUB_REPOSITORY') != 'shortbreakhub/short-breaks-hub-frontend':
            raise ValueError('Recovery requires the production repository and branch')
    else:
        deploy.assert_current()
    deploy.preflight()
    return config


def release():
    manifest = json.loads(Path('.deployment/release/manifest.json').read_text())
    inventory = json.loads((RELEASE / 'inventory.json').read_text())
    code = (RELEASE / 'function.js').read_bytes()
    if manifest['commit'] != os.environ.get('GITHUB_SHA') or deploy.digest(code) != inventory['codeSha256'] or manifest.get('edgeCodeSha256') != inventory['codeSha256']:
        raise ValueError('Edge release checksum/commit mismatch')
    if not inventory['slugs'] or sorted(set(inventory['slugs'])) != inventory['slugs']:
        raise ValueError('Invalid edge inventory')
    built = sorted(e['key'][10:-11] for e in manifest['files'] if re.fullmatch(r'itinerary/[a-z0-9]+(?:-[a-z0-9]+)*/index.html', e['key']))
    if built != inventory['slugs']:
        raise ValueError('Edge inventory differs from uploaded documents')
    import base64
    hashes = sorted(base64.urlsafe_b64encode(hashlib.sha256(s.encode()).digest()).decode()[:22] for s in inventory['slugs'])
    expected = re.sub(r'^[ \t]+', '', TEMPLATE.read_text().replace('__PUBLIC_ITINERARY_HASHES__', '|' + '|'.join(hashes) + '|'), flags=re.M).encode()
    if code != expected or len(code) > 10240:
        raise ValueError('Edge code differs from reviewed template/inventory')
    return inventory


def sitemap_matches(inventory):
    with urllib.request.urlopen('https://www.shortbreakhub.com/sitemap.xml', timeout=30) as response:
        xml = ET.fromstring(response.read())
    prefix = 'https://www.shortbreakhub.com/itinerary/'
    slugs = sorted(e.text[len(prefix):] for e in xml.iter() if e.tag.endswith('}loc') and (e.text or '').startswith(prefix))
    if slugs != inventory['slugs']:
        raise ValueError('Live sitemap changed; rebuild before release')


def snapshot(stage, directory):
    path = directory / (stage.lower() + '.js')
    result = call('get-function', {'Stage': stage}, path)
    description = call('describe-function', {'Stage': stage})
    config = description['FunctionSummary']['FunctionConfig']
    if config.get('Runtime') != 'cloudfront-js-2.0' or config.get('KeyValueStoreAssociations', {}).get('Quantity', 0):
        raise ValueError('Unexpected existing function runtime/datastore')
    return {'etag': result['ETag'], 'config': config, 'sha256': deploy.digest(path.read_bytes())}


def capture():
    config = approved()
    inventory = release()
    sitemap_matches(inventory)
    BASELINE.mkdir(parents=True, exist_ok=False)
    live = snapshot('LIVE', BASELINE)
    development = snapshot('DEVELOPMENT', BASELINE)
    if live['sha256'] != development['sha256'] or live['config'] != development['config']:
        raise ValueError('Unpublished development changes exist; stop for review')
    source = (BASELINE / 'live.js').read_text()
    normalized = re.sub(r'var PUBLIC_ITINERARY_HASHES = "\|[A-Za-z0-9_|-]+\|";', 'var PUBLIC_ITINERARY_HASHES = "__PUBLIC_ITINERARY_HASHES__";', source, count=1)
    if live['sha256'] != config['initialLiveSha256'] and normalized != re.sub(r'^[ \t]+', '', TEMPLATE.read_text(), flags=re.M):
        raise ValueError('Unreviewed LIVE function drift')
    original = Path('.deployment/original-baseline/edge')
    if int(os.environ.get('GITHUB_RUN_ATTEMPT', '1')) > 1 and not (original / 'baseline.json').is_file():
        raise ValueError('Rerun requires the original edge recovery artifact')
    point = json.loads(Path('.deployment/recovery-point.json').read_text())['recoveryPoint']
    if point['runId'] != os.environ['GITHUB_RUN_ID']:
        raise ValueError('Edge recovery point belongs to another run')
    record = {'commit': os.environ['GITHUB_SHA'], 'run': os.environ['GITHUB_RUN_ID'], 'captureAttempt': os.environ['GITHUB_RUN_ATTEMPT'],
              'recoveryPoint': point, 'live': live, 'development': development}
    (BASELINE / 'baseline.json').write_text(json.dumps(record, indent=2) + '\n')


def publish():
    approved()
    inventory = release()
    sitemap_matches(inventory)
    baseline = json.loads((BASELINE / 'baseline.json').read_text())
    if baseline['commit'] != os.environ['GITHUB_SHA'] or baseline['run'] != os.environ['GITHUB_RUN_ID']:
        raise ValueError('Edge baseline belongs to another release')
    with tempfile.TemporaryDirectory() as temporary:
        current = Path(temporary)
        for stage in ['LIVE', 'DEVELOPMENT']:
            observed = snapshot(stage, current)
            if observed != baseline[stage.lower()]:
                raise ValueError('Function changed since baseline capture; no update allowed')
        updated = call('update-function', {'IfMatch': baseline['development']['etag'],
            'FunctionConfig': baseline['development']['config'], 'FunctionCode': RELEASE / 'function.js'})
        slug = inventory['slugs'][0]
        for uri, expected_status in [('/itinerary/' + slug, None), ('/itinerary/not-a-published-itinerary', 404),
                                     ('/%69tinerary/not-a-published-itinerary/index.html', 404), ('/browse/Spain', 301)]:
            event = {'version': '1.0', 'context': {'eventType': 'viewer-request'}, 'viewer': {'ip': '127.0.0.1'},
                     'request': {'method': 'GET', 'uri': uri, 'headers': {'host': {'value': 'www.shortbreakhub.com'}}, 'cookies': {}, 'querystring': {}}}
            event_path = current / 'event.json'
            event_path.write_text(json.dumps(event))
            result = call('test-function', {'IfMatch': updated['ETag'], 'Stage': 'DEVELOPMENT', 'EventObject': event_path})['TestResult']
            if result.get('FunctionErrorMessage') or int(result.get('ComputeUtilization', '100')) > 70:
                raise ValueError('CloudFront DEVELOPMENT smoke test failed')
            wrapped = json.loads(result['FunctionOutput'])
            output = wrapped.get('request') if expected_status is None else wrapped.get('response')
            if not isinstance(output, dict):
                raise ValueError('CloudFront DEVELOPMENT output missing request/response wrapper')
            if output.get('statusCode') != expected_status or (expected_status is None and output.get('uri') != '/itinerary/' + slug + '/index.html'):
                raise ValueError('CloudFront DEVELOPMENT routing output differs')
        call('publish-function', {'IfMatch': updated['ETag']})
        observed = snapshot('LIVE', current)
        if observed['sha256'] != inventory['codeSha256']:
            raise ValueError('Published function differs from release')
        Path('.deployment/edge-published.json').write_text(json.dumps({'commit': os.environ['GITHUB_SHA'], 'sha256': observed['sha256'], 'etag': observed['etag']}, indent=2) + '\n')


def restore(directory):
    """Owner-approved recovery: original edge membership first, then S3 restore."""
    approved(recovery=True)
    inventory = release()
    directory = Path(directory)
    baseline = json.loads((directory / 'baseline.json').read_text())
    if baseline['commit'] != os.environ['GITHUB_SHA'] or baseline['run'] != os.environ['GITHUB_RUN_ID']:
        raise ValueError('Recovery baseline belongs to another release/run')
    point = baseline.get('recoveryPoint')
    if not point or str(point['attempt']) != str(baseline.get('captureAttempt')):
        raise ValueError('Restore the original edge recovery artifact, not an intermediate snapshot')
    paired = deploy.validate_baseline(directory.parent, deploy.reviewed_config())
    if paired.get('recoveryPoint') != point or paired.get('forCommit') != baseline['commit'] or str(paired.get('captureAttempt')) != str(baseline['captureAttempt']):
        raise ValueError('Edge and S3 recovery generations differ')
    for stage in ['live', 'development']:
        if deploy.digest((directory / (stage + '.js')).read_bytes()) != baseline[stage]['sha256']:
            raise ValueError('Edge recovery file checksum mismatch')
    if baseline['live']['sha256'] != baseline['development']['sha256']:
        raise ValueError('Recovery baseline contains unpublished changes')
    with tempfile.TemporaryDirectory() as temporary:
        live = snapshot('LIVE', Path(temporary))
        development = snapshot('DEVELOPMENT', Path(temporary))
        for stage, current in [('live', live), ('development', development)]:
            if current['sha256'] not in [inventory['codeSha256'], baseline[stage]['sha256']] or current['config'] != baseline[stage]['config']:
                raise ValueError('Unrelated edge change detected; do not overwrite it during recovery')
        updated = call('update-function', {'IfMatch': development['etag'], 'FunctionConfig': baseline['development']['config'], 'FunctionCode': directory / 'development.js'})
        if live['sha256'] != baseline['live']['sha256']:
            call('publish-function', {'IfMatch': updated['ETag']})
        observed = snapshot('LIVE', Path(temporary))
        if observed['sha256'] != baseline['live']['sha256']:
            raise ValueError('Edge recovery verification failed')
    print('Original edge function restored; restore the paired S3 baseline and invalidate using the existing recovery procedure')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['capture', 'publish', 'restore'])
    parser.add_argument('--baseline', default=str(BASELINE))
    parser.add_argument('--profile')
    args = parser.parse_args()
    deploy.PROFILE = args.profile
    if args.command == 'restore': restore(args.baseline)
    else: (capture if args.command == 'capture' else publish)()
