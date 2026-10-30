import base64
from contextlib import chdir
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path('scripts/ci').resolve()))
spec = importlib.util.spec_from_file_location('edge_deploy', 'scripts/ci/edge-deploy.py')
edge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edge)
TEMPLATE = edge.TEMPLATE.resolve()


class EdgeReleaseSafety(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.cwd = chdir(self.temp.name)
        self.cwd.__enter__()
        self.template = patch.object(edge, 'TEMPLATE', TEMPLATE)
        self.template.start()
        self.env = patch.dict(os.environ, {'GITHUB_SHA':'release', 'GITHUB_RUN_ID':'42', 'GITHUB_RUN_ATTEMPT':'1'})
        self.env.start()
        edge.RELEASE.mkdir(parents=True)
        digest = base64.urlsafe_b64encode(edge.hashlib.sha256(b'public-city').digest()).decode()[:22]
        code = edge.re.sub(r'^[ \t]+', '', TEMPLATE.read_text().replace('__PUBLIC_ITINERARY_HASHES__', '|' + digest + '|'), flags=edge.re.M).encode()
        self.code_hash = edge.deploy.digest(code)
        (edge.RELEASE / 'function.js').write_bytes(code)
        (edge.RELEASE / 'inventory.json').write_text(json.dumps({'version':1, 'slugs':['public-city'], 'codeSha256':self.code_hash}))
        Path('.deployment/release/manifest.json').write_text(json.dumps({'commit':'release', 'edgeCodeSha256':self.code_hash, 'files':[{'key':'itinerary/public-city/index.html'}]}))
        self.live = {'etag':'live-etag', 'sha256':'original', 'config':{'Runtime':'cloudfront-js-2.0','Comment':'original'}}
        self.dev = {**self.live, 'etag':'dev-etag'}
        edge.BASELINE.mkdir(parents=True)
        (edge.BASELINE / 'baseline.json').write_text(json.dumps({'commit':'release','run':'42','live':self.live,'development':self.dev}))

    def tearDown(self):
        self.env.stop()
        self.template.stop()
        self.cwd.__exit__(None,None,None)
        self.temp.cleanup()

    def snapshot(self, stage, directory):
        if self.published:
            return {**self.live, 'etag':'published-etag', 'sha256':self.code_hash}
        return self.live if stage == 'LIVE' else self.dev

    def aws(self, operation, args, outfile=None):
        self.operations.append(operation)
        if operation == 'update-function':
            self.assertEqual(args['IfMatch'],'dev-etag')
            return {'ETag':'updated-etag'}
        if operation == 'test-function':
            event = json.loads(Path(args['EventObject']).read_text())
            uri = event['request']['uri']
            output = {'uri':'/itinerary/public-city/index.html'} if uri == '/itinerary/public-city' else {'statusCode':301 if uri.startswith('/browse/') else 404}
            return {'TestResult':{'ComputeUtilization':'1','FunctionOutput':json.dumps({'request' if uri=='/itinerary/public-city' else 'response':output})}}
        if operation == 'publish-function':
            self.assertEqual(args['IfMatch'],'updated-etag')
            self.published = True
            # Real AWS PublishFunction has no ETag field.
            return {'FunctionSummary':{'Status':'UNASSOCIATED'}}
        self.fail('Unexpected AWS operation: ' + operation)

    def test_publish_uses_conditional_updates_tests_before_live_and_real_aws_response_shape(self):
        self.operations=[]; self.published=False
        with patch.object(edge,'approved'), patch.object(edge,'sitemap_matches'), patch.object(edge,'snapshot',side_effect=self.snapshot), patch.object(edge,'call',side_effect=self.aws):
            edge.publish()
        self.assertEqual(self.operations,['update-function','test-function','test-function','test-function','test-function','publish-function'])
        self.assertEqual(json.loads(Path('.deployment/edge-published.json').read_text())['etag'],'published-etag')

    def test_live_drift_stops_before_update(self):
        with patch.object(edge,'approved'), patch.object(edge,'sitemap_matches'), patch.object(edge,'snapshot',return_value={**self.live,'sha256':'someone-else'}), patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'changed since baseline'):
                edge.publish()
            aws.assert_not_called()

    def test_wrong_commit_baseline_stops_before_any_mutation(self):
        with patch.object(edge,'approved'), patch.object(edge,'sitemap_matches'), patch.dict(os.environ,{'GITHUB_RUN_ID':'different'}), patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'another release'): edge.publish()
            aws.assert_not_called()

    def test_failed_cloudfront_smoke_test_prevents_live_publish(self):
        self.operations=[]; self.published=False
        def call(operation,args,outfile=None):
            if operation=='test-function': return {'TestResult':{'FunctionErrorMessage':'runtime error','ComputeUtilization':'1'}}
            return self.aws(operation,args,outfile)
        with patch.object(edge,'approved'), patch.object(edge,'sitemap_matches'), patch.object(edge,'snapshot',side_effect=self.snapshot), patch.object(edge,'call',side_effect=call):
            with self.assertRaisesRegex(ValueError,'smoke test failed'): edge.publish()
        self.assertFalse(self.published)

    def test_tampered_code_and_inventory_are_rejected_without_aws(self):
        (edge.RELEASE/'function.js').write_text('unreviewed')
        with patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'checksum'): edge.release()
            aws.assert_not_called()

    def test_missing_uploaded_itinerary_is_rejected(self):
        path=Path('.deployment/release/manifest.json')
        data=json.loads(path.read_text());data['files']=[];path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError,'uploaded documents'): edge.release()

    def test_unapproved_edge_gate_stops_before_aws(self):
        config=Path('config.json');config.write_text(json.dumps({'reviewed':False,'name':edge.NAME,'runtime':'cloudfront-js-2.0'}))
        with patch.object(edge,'CONFIG',config), patch.object(edge.deploy,'preflight') as preflight, patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'explicit review approval'): edge.approved()
            preflight.assert_not_called();aws.assert_not_called()

    def test_cli_emits_required_arguments_and_binary_file_flags_explicitly(self):
        result=types.SimpleNamespace(returncode=0,stdout='{}',stderr='')
        with patch.object(edge.subprocess,'run',return_value=result) as run:
            edge.call('update-function',{'IfMatch':'etag','FunctionConfig':{'Runtime':'cloudfront-js-2.0'},'FunctionCode':Path('function.js')})
            command=run.call_args.args[0]
            for flag in ['--name','--if-match','--function-config','--function-code']: self.assertIn(flag,command)
            self.assertTrue(command[command.index('--function-code')+1].startswith('fileb://'))
            self.assertNotIn('shell',run.call_args.kwargs)

    def test_recovery_profile_and_json_output_apply_to_edge_and_shared_preflight(self):
        result=types.SimpleNamespace(returncode=0,stdout='{"ETag":"updated"}',stderr='')
        with patch.object(edge.deploy,'PROFILE','AUTHORIZED_RECOVERY_PROFILE'), patch.object(edge.subprocess,'run',return_value=result) as run:
            response=edge.call('update-function',{'IfMatch':'etag','FunctionConfig':{'Runtime':'cloudfront-js-2.0'},'FunctionCode':Path('function.js')})
            command=run.call_args.args[0]
            self.assertEqual(command[command.index('--profile')+1],'AUTHORIZED_RECOVERY_PROFILE')
            self.assertEqual(command[command.index('--output')+1],'json')
            self.assertEqual(response,{'ETag':'updated'})

    def test_default_oidc_calls_do_not_select_a_named_profile(self):
        with patch.object(edge.deploy,'PROFILE',None), patch.object(edge.subprocess,'run',return_value=types.SimpleNamespace(returncode=0,stdout='{}',stderr='')) as run:
            edge.call('describe-function',{'Stage':'LIVE'})
            command=run.call_args.args[0]
            self.assertNotIn('--profile',command)
            self.assertEqual(command[command.index('--output')+1],'json')

    def recovery(self, attempt='1'):
        for stage in ['live','development']:
            (edge.BASELINE/(stage+'.js')).write_bytes(b'original code')
        self.live['sha256']=edge.deploy.digest(b'original code')
        self.dev['sha256']=self.live['sha256']
        point={'runId':'42','attempt':1,'artifact':'frontend-baseline-42-1'}
        record={'commit':'release','run':'42','captureAttempt':attempt,'recoveryPoint':point,'live':self.live,'development':self.dev}
        (edge.BASELINE/'baseline.json').write_text(json.dumps(record))
        return {'recoveryPoint':point,'forCommit':'release','captureAttempt':attempt}

    def test_recovery_rejects_intermediate_snapshot_without_any_update(self):
        self.recovery(attempt='2')
        with patch.object(edge,'approved'), patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'original edge recovery artifact'): edge.restore(edge.BASELINE)
            aws.assert_not_called()

    def test_recovery_requires_matching_s3_generation(self):
        self.recovery()
        with patch.object(edge,'approved'), patch.object(edge.deploy,'reviewed_config'), patch.object(edge.deploy,'validate_baseline',return_value={'recoveryPoint':{},'forCommit':'other'}), patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'generations differ'): edge.restore(edge.BASELINE)
            aws.assert_not_called()

    def test_recovery_rejects_later_s3_attempt_even_with_original_recovery_point(self):
        paired=self.recovery()
        with patch.object(edge,'approved'), patch.object(edge.deploy,'reviewed_config'), patch.object(edge.deploy,'validate_baseline',return_value={**paired,'captureAttempt':'2'}), patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'generations differ'): edge.restore(edge.BASELINE)
            aws.assert_not_called()

    def test_recovery_restores_original_edge_before_s3_and_refuses_unrelated_changes(self):
        paired=self.recovery()
        current_live={**self.live,'sha256':self.code_hash}
        current_dev={**self.dev,'sha256':self.code_hash}
        with patch.object(edge,'approved'), patch.object(edge.deploy,'reviewed_config'), patch.object(edge.deploy,'validate_baseline',return_value=paired), patch.object(edge,'snapshot',side_effect=[current_live,current_dev,self.live]), patch.object(edge,'call',side_effect=[{'ETag':'restored-dev'}, {'FunctionSummary':{}}]) as aws:
            edge.restore(edge.BASELINE)
            self.assertEqual([c.args[0] for c in aws.call_args_list],['update-function','publish-function'])
        with patch.object(edge,'approved'), patch.object(edge.deploy,'reviewed_config'), patch.object(edge.deploy,'validate_baseline',return_value=paired), patch.object(edge,'snapshot',side_effect=[{**current_live,'sha256':'unrelated'},current_dev]), patch.object(edge,'call') as aws:
            with self.assertRaisesRegex(ValueError,'Unrelated edge change'): edge.restore(edge.BASELINE)
            aws.assert_not_called()

    def test_failed_development_test_can_be_recovered_without_publishing(self):
        paired=self.recovery()
        with patch.object(edge,'approved'), patch.object(edge.deploy,'reviewed_config'), patch.object(edge.deploy,'validate_baseline',return_value=paired), patch.object(edge,'snapshot',side_effect=[self.live,{**self.dev,'sha256':self.code_hash},self.live]), patch.object(edge,'call',return_value={'ETag':'restored-dev'}) as aws:
            edge.restore(edge.BASELINE)
            self.assertEqual([c.args[0] for c in aws.call_args_list],['update-function'])


if __name__ == '__main__': unittest.main()
