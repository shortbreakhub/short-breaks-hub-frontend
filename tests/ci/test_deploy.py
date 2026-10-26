import importlib.util
import json
import os
from contextlib import chdir
from pathlib import Path
import tempfile
import shutil
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('deploy', 'scripts/ci/deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentSafety(unittest.TestCase):
    def config(self):
        return {'originPath': '', 'ownedPrefixes': ['assets/', 'itinerary/'], 'ownedKeys': ['index.html','app-shell.html','robots.txt'], 'cacheControl': {'assets':'public,max-age=31536000,immutable','public':'public,max-age=300','html':'public,max-age=0,must-revalidate'}}

    def test_wrong_account_stops_before_bucket_access(self):
        with patch.object(deploy,'aws',return_value={'Account':'000000000000'}) as aws:
            with self.assertRaisesRegex(ValueError,'Wrong AWS account'):
                deploy.preflight()
            self.assertEqual(aws.call_count, 1)

    def test_committed_configuration_is_inert(self):
        with tempfile.TemporaryDirectory() as temp:
            config = Path(temp)/'config.json'
            config.write_text('{"reviewed":false}')
            with patch.object(deploy,'CONFIG',config), self.assertRaisesRegex(ValueError,'not been reviewed'):
                deploy.reviewed_config()

    def test_permission_proposal_does_not_enable_deployment_or_call_aws(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(deploy,'aws') as aws:
            config_path = Path(temp)/'config.json'
            config = json.loads(deploy.CONFIG.read_text())
            config['reviewed'] = False
            config_path.write_text(json.dumps(config))
            output = Path(temp)/'policy.json'
            with patch.object(deploy,'CONFIG',config_path):
                deploy.policy(output)
            policy = json.loads(output.read_text())
            cloudfront = next(s for s in policy['Statement'] if any(a.startswith('cloudfront:') for a in s['Action']))
            self.assertEqual(cloudfront['Resource'],'arn:aws:cloudfront::919693204623:distribution/E323A73D49XQ0O')
            forbidden = {'s3:DeleteObject','s3:PutBucketPolicy','cloudfront:UpdateDistribution','iam:CreateRole'}
            self.assertFalse(forbidden.intersection(a for s in policy['Statement'] for a in s['Action']))
            self.assertFalse(json.loads(config_path.read_text())['reviewed'])
            aws.assert_not_called()

    def test_unconfirmed_identifier_cannot_enable_writes(self):
        config = json.loads(deploy.CONFIG.read_text())
        config.update(reviewed=True,distributionIdentifierConfirmed=False)
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp)/'config.json'
            path.write_text(json.dumps(config))
            with patch.object(deploy,'CONFIG',path), self.assertRaisesRegex(ValueError,'identifier correction'):
                deploy.reviewed_config()

    def test_inspection_requires_named_profile(self):
        with patch.object(deploy,'PROFILE',None), patch.object(deploy,'aws') as aws:
            with self.assertRaisesRegex(ValueError,'--profile'):
                deploy.inspect('unused')
            aws.assert_not_called()

    def test_ownership_does_not_allow_neighboring_prefixes(self):
        config = self.config()
        self.assertEqual(deploy.owned(config,'assets/example.png'),'assets/example.png')
        for key in ['uploads/customer.png','assets-other/file.png','assets/../index.html','/index.html','.vite/manifest.json','assets//file.png','assets/a?query']:
            with self.subTest(key=key), self.assertRaises(ValueError):
                deploy.owned(config,key)

    def test_stale_commit_stops_before_writes(self):
        with patch.dict(os.environ,{'GITHUB_REF':'refs/heads/master','GITHUB_REPOSITORY':'shortbreakhub/short-breaks-hub-frontend','GITHUB_SHA':'old'}), patch.object(deploy.subprocess,'check_output',return_value='new\trefs/heads/master\n'):
            with self.assertRaisesRegex(ValueError,'Stale'):
                deploy.assert_current()

    def test_existing_fingerprinted_asset_cannot_be_replaced(self):
        def aws(service,operation,args,outfile=None,**kwargs):
            if operation == 'head-object': return {'ContentLength':3}
            if operation == 'get-object': Path(outfile).write_bytes(b'old'); return {}
            self.fail('Unexpected write')
        with patch.object(deploy,'aws',side_effect=aws), patch.object(deploy,'put') as put:
            with self.assertRaisesRegex(ValueError,'different bytes'):
                deploy.asset(self.config(),{'key':'assets/photo.png','sha256':deploy.digest(b'new'),'size':3},'unused')
            put.assert_not_called()

    def test_tampered_release_fails_before_upload(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root/'index.html').write_bytes(b'wrong')
            manifest = {'version':1,'files':[{'key':'index.html','phase':'html','sha256':deploy.digest(b'right'),'size':5}]}
            (root/'manifest.json').write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError,'checksum mismatch'):
                deploy.load_manifest(root/'manifest.json',self.config(),root)

    def test_upload_order_and_no_delete(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            entries = []
            for key,phase in [('index.html','html'),('app-shell.html','html'),('itinerary/demo/index.html','html'),('robots.txt','public'),('assets/photo.png','assets')]:
                path = root/key
                path.parent.mkdir(parents=True,exist_ok=True)
                path.write_bytes(b'content')
                entries.append({'key':key,'phase':phase,'contentType':'text/plain','size':7,'sha256':deploy.digest(b'content')})
            (root/'manifest.json').write_text(json.dumps({'version':1,'commit':'current','files':entries}))
            point={'runId':'42','attempt':1,'artifact':'frontend-baseline-42-1'}
            (root/'.deployment').mkdir()
            recovery=root/'.deployment/recovery-point.json'
            recovery.write_text(json.dumps({'recoveryPoint':point}))
            (root/'baseline.json').write_text(json.dumps({'forCommit':'current','manifestSha256':deploy.digest((root/'manifest.json').read_bytes()),'target':{'account':deploy.ACCOUNT,'bucket':deploy.BUCKET,'originPath':''},'recoveryPoint':point,'files':[{'key':'index.html'}]}))
            order = []
            with chdir(root), patch.object(deploy,'preflight',return_value=self.config()), patch.object(deploy,'assert_current'), patch.dict(os.environ,{'GITHUB_SHA':'current','GITHUB_RUN_ID':'42','GITHUB_RUN_ATTEMPT':'1'}), patch.object(deploy,'asset',side_effect=lambda c,e,r: order.append(e['key'])), patch.object(deploy,'put',side_effect=lambda c,e,r: order.append(e['key'])):
                deploy.deploy(root/'manifest.json',root,root/'baseline.json')
                self.assertEqual(order,['assets/photo.png','robots.txt','itinerary/demo/index.html','app-shell.html','index.html'])
                order.clear()
                recovery.write_text(json.dumps({'recoveryPoint':{**point,'attempt':2}}))
                with self.assertRaisesRegex(ValueError,'recovery point reference changed'):
                    deploy.deploy(root/'manifest.json',root,root/'baseline.json')
                self.assertEqual(order,[],'changed recovery point must block all uploads')
                recovery.unlink()
                with self.assertRaises(FileNotFoundError):
                    deploy.deploy(root/'manifest.json',root,root/'baseline.json')
                self.assertEqual(order,[],'missing recovery point must block all uploads')

    def test_cli_uses_only_expected_account_target_and_file_body(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp)/'index.html'
            path.write_bytes(b'content')
            with patch.object(deploy,'aws') as aws:
                deploy.put(self.config(),{'key':'index.html','sha256':deploy.digest(b'content'),'phase':'html','contentType':'text/html'},temp)
            args,kwargs = aws.call_args
            self.assertEqual(args[:2],('s3api','put-object'))
            self.assertEqual(args[2]['Bucket'],deploy.BUCKET)
            self.assertEqual(args[2]['ExpectedBucketOwner'],deploy.ACCOUNT)
            self.assertEqual(kwargs['body'],path)
            self.assertNotIn('ACL',args[2])

    def test_entire_baseline_is_checked_before_restoration_writes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root/'files').mkdir()
            entries = []
            for key in ['robots.txt','index.html']:
                (root/'files'/key).write_bytes(b'original')
                entries.append({'key':key,'sha256':deploy.digest(b'original'),'metadata':{'ContentType':'text/plain'}})
            (root/'files/index.html').write_bytes(b'corrupted')
            (root/'baseline.json').write_text(json.dumps({'version':1,'target':{'account':deploy.ACCOUNT,'bucket':deploy.BUCKET,'originPath':''},'files':entries,'newKeys':[]}))
            with patch.object(deploy,'preflight',return_value=self.config()), patch.object(deploy,'put') as put:
                with self.assertRaisesRegex(ValueError,'integrity check'):
                    deploy.restore(root)
                put.assert_not_called()

    def test_slow_invalidation_warns_and_requires_content_verification(self):
        now=[0]
        with patch.object(deploy,'aws',return_value={'Invalidation':{'Status':'InProgress'}}) as aws:
            report=deploy.wait_invalidation('pending',max_seconds=2,interval=1,clock=lambda:now[0],sleep=lambda seconds:now.__setitem__(0,now[0]+seconds))
        self.assertTrue(report['waitTimedOut'])
        self.assertEqual(report['status'],'InProgress')
        self.assertTrue(all(c.args[:2]==('cloudfront','get-invalidation') for c in aws.call_args_list))

    def test_invalidation_transient_errors_retry_but_access_denied_does_not(self):
        now=[0]
        with patch.object(deploy,'aws',side_effect=[RuntimeError('Throttling'),{'Invalidation':{'Status':'Completed'}}]):
            report=deploy.wait_invalidation('retry',max_seconds=2,interval=1,clock=lambda:now[0],sleep=lambda seconds:now.__setitem__(0,now[0]+seconds))
        self.assertEqual(report['transientErrors'],1)
        self.assertEqual(report['status'],'Completed')
        with patch.object(deploy,'aws',side_effect=RuntimeError('AccessDenied')) as aws:
            with self.assertRaisesRegex(RuntimeError,'AccessDenied'):
                deploy.wait_invalidation('denied')
            self.assertEqual(aws.call_count,1)

    def test_invalidation_request_retry_reference_is_idempotent(self):
        config=self.config();config['invalidationPaths']=['/*']
        original=os.getcwd()
        try:
            with tempfile.TemporaryDirectory() as temp, patch.object(deploy,'preflight',return_value=config), patch.dict(os.environ,{'GITHUB_RUN_ID':'42','GITHUB_RUN_ATTEMPT':'2'}), patch.object(deploy,'aws',return_value={'Invalidation':{'Id':'id','Status':'InProgress'}}) as aws, patch.object(deploy,'wait_invalidation',return_value={'id':'id','status':'Completed'}):
                os.chdir(temp)
                deploy.invalidate();deploy.invalidate()
                references=[c.args[2]['InvalidationBatch']['CallerReference'] for c in aws.call_args_list]
                self.assertEqual(references,['sbh-42-2-v1','sbh-42-2-v1'])
        finally: os.chdir(original)

    def test_reruns_select_earliest_and_never_silently_replace_missing_baseline(self):
        original={'name':'frontend-baseline-42-1','expired':False}
        later={'name':'frontend-baseline-42-2','expired':False}
        self.assertEqual(deploy.choose_recovery_artifact([later,original],'42',3),original)
        self.assertIsNone(deploy.choose_recovery_artifact([],'42',1))
        with self.assertRaisesRegex(ValueError,'no recoverable'):
            deploy.choose_recovery_artifact([],'42',2)
        with self.assertRaisesRegex(ValueError,'expired'):
            deploy.choose_recovery_artifact([{**original,'expired':True},later],'42',3)

    def test_offline_rollback_drill_restores_original_bytes_and_metadata(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            point={'runId':'42','attempt':1,'artifact':'frontend-baseline-42-1'}
            for attempt,content in [(1,b'original release'),(2,b'partially deployed release')]:
                path=root/str(attempt);(path/'files').mkdir(parents=True)
                (path/'files/index.html').write_bytes(content)
                baseline={'version':1,'target':{'account':deploy.ACCOUNT,'bucket':deploy.BUCKET,'originPath':''},'recoveryPoint':point,'captureAttempt':str(attempt),'files':[{'key':'index.html','sha256':deploy.digest(content),'metadata':{'ContentType':'text/html','CacheControl':'original-header'}}],'newKeys':['itinerary/new/index.html']}
                (path/'baseline.json').write_text(json.dumps(baseline))
            simulated={'index.html':b'partially deployed release','itinerary/new/index.html':b'new file retained'}
            metadata={}
            def put(config,entry,files,restore_metadata):
                simulated[entry['key']]=(Path(files)/entry['key']).read_bytes()
                metadata[entry['key']]=restore_metadata
            with patch.object(deploy,'preflight',return_value=self.config()),patch.object(deploy,'put',side_effect=put) as writes,patch.object(deploy,'aws') as aws:
                with self.assertRaisesRegex(ValueError,'intermediate snapshot'):
                    deploy.restore(root/'2')
                writes.assert_not_called()
                deploy.restore(root/'1')
                self.assertEqual(simulated['index.html'],b'original release')
                self.assertEqual(metadata['index.html']['CacheControl'],'original-header')
                self.assertEqual(simulated['itinerary/new/index.html'],b'new file retained')
                aws.assert_not_called()

    def test_recovery_point_downloads_and_checks_original_artifact_without_aws(self):
        original=os.getcwd()
        try:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);source=root/'fixture';(source/'files').mkdir(parents=True)
                (source/'files/index.html').write_bytes(b'original')
                point={'runId':'42','attempt':1,'artifact':'frontend-baseline-42-1'}
                baseline={'version':1,'forCommit':'sha','target':{'account':deploy.ACCOUNT,'bucket':deploy.BUCKET,'originPath':''},'recoveryPoint':point,'captureAttempt':'1','files':[{'key':'index.html','sha256':deploy.digest(b'original'),'metadata':{}}],'newKeys':[]}
                (source/'baseline.json').write_text(json.dumps(baseline))
                def gh(command,**kwargs):
                    if command[1]=='api':return types.SimpleNamespace(stdout=json.dumps([{'artifacts':[{'name':point['artifact'],'expired':False}]}]))
                    shutil.copytree(source,root/'.deployment/original-baseline')
                    return types.SimpleNamespace(stdout='')
                os.chdir(root)
                with patch.object(deploy,'reviewed_config',return_value=self.config()),patch.dict(os.environ,{'GITHUB_RUN_ID':'42','GITHUB_RUN_ATTEMPT':'2','GITHUB_SHA':'sha'}),patch.object(deploy.subprocess,'run',side_effect=gh),patch.object(deploy,'aws') as aws:
                    deploy.recovery_point()
                    self.assertEqual(json.loads((root/'.deployment/recovery-point.json').read_text())['recoveryPoint'],point)
                    aws.assert_not_called()
        finally:os.chdir(original)


if __name__ == '__main__': unittest.main()
