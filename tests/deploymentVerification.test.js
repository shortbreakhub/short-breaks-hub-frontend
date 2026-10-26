import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {checkFile} from '../scripts/ci/verify-production.mjs';
import {sha256, safeKey} from '../scripts/ci/validate-build.mjs';
import {readFileSync} from 'node:fs';

test('HTTP 200 alone cannot pass release verification', async () => {
  const entry = {key:'index.html',contentType:'text/html',sha256:sha256(Buffer.from('expected release'))};
  const server = createServer((req,res) => {res.setHeader('Content-Type','text/html');res.end('old release');});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    await assert.rejects(checkFile(`http://127.0.0.1:${server.address().port}`,entry,undefined,1),/checksum differs/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('build keys cannot escape the upload root or publish hidden files', () => {
  for (const key of ['../secret','assets/../secret','/index.html','.env','assets//image.png','assets/image.png?x']) assert.throws(() => safeKey(key));
  assert.equal(safeKey('assets/day-6-photo-ABC.png'),'assets/day-6-photo-ABC.png');
});

test('PR validation cannot authenticate to AWS or run production mutations', () => {
  const workflow=readFileSync('.github/workflows/deploy-production.yml','utf8');
  assert.match(workflow,/pull_request:\n\s+branches: \[master\]/);
  const job=workflow.split('  build-only:\n')[1].split('  production:\n')[0];
  assert.match(job,/github\.event_name == 'pull_request'/);
  assert.match(job,/head\.repo\.full_name == github\.repository/);
  assert.match(job,/DEPLOY_ENABLED: 'false'/);
  assert.doesNotMatch(job,/id-token:|configure-aws-credentials|deploy\.py (?:deploy|invalidate|capture|restore|preflight)\b/);
  assert.match(job,/npm ci/);assert.match(job,/npm run build/);assert.match(job,/npm test/);
  assert.match(workflow.split('  production:\n')[1],/github\.ref == 'refs\/heads\/master'/);
});
