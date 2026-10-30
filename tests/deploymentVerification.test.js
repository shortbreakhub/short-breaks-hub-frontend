import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {checkFile, checkItineraryResponses, waitForItineraryRouting, waitForReleaseFile} from '../scripts/ci/verify-production.mjs';
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

test('function propagation retries old HTTP 200 shells until release bytes and new route behavior converge',async()=>{
  const entry={key:'itinerary/example/index.html',contentType:'text/html',sha256:sha256(Buffer.from('release'))};
  let requests=0;
  const server=createServer((req,res)=>{
    res.setHeader('Content-Type','text/html');
    if(req.url==='/itinerary/example') return res.end(++requests===1?'old shell':'release');
    if(req.url.startsWith('/itinerary/example/index.html')) {res.writeHead(301,{location:'/itinerary/example?q=a%20b'});return res.end();}
    res.writeHead(404,{'x-robots-tag':'noindex,follow'});res.end('not found');
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  try {
    const result=await waitForItineraryRouting(`http://127.0.0.1:${server.address().port}`,entry,{timeoutMs:2000,intervalMs:1});
    assert.equal(result.attempts,2);
    assert.equal(requests,2);
  } finally {await new Promise(done=>server.close(done));}
});

test('function propagation timeout fails closed when the old shell persists',async()=>{
  const entry={key:'itinerary/example/index.html',contentType:'text/html',sha256:sha256(Buffer.from('release'))};
  const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('old shell');});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  try {
    await assert.rejects(waitForItineraryRouting(`http://127.0.0.1:${server.address().port}`,entry,{timeoutMs:50,intervalMs:1}),/did not converge/);
  } finally {await new Promise(done=>server.close(done));}
});

test('inventory-only propagation retries a new slug even when the old canary already passes',async()=>{
  const entry={key:'itinerary/new-slug/index.html',contentType:'text/html',sha256:sha256(Buffer.from('release'))};
  let requests=0;
  const server=createServer((req,res)=>{
    res.setHeader('Content-Type','text/html');
    if(req.url==='/itinerary/old-slug') return res.end('release');
    if(req.url==='/itinerary/new-slug') {
      if(++requests<3) {res.writeHead(404);return res.end('not published on this edge yet');}
      return res.end('release');
    }
    if(req.url.startsWith('/itinerary/old-slug/index.html')) {res.writeHead(301,{location:'/itinerary/old-slug?q=a%20b'});return res.end();}
    res.writeHead(404,{'x-robots-tag':'noindex,follow'});res.end('not found');
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await waitForItineraryRouting(origin,{...entry,key:'itinerary/old-slug/index.html'},{timeoutMs:2000,intervalMs:1})).attempts,1);
    assert.equal((await waitForReleaseFile(origin,entry,'/itinerary/new-slug',{deadline:Date.now()+2000,intervalMs:1})).toString(),'release');
    assert.equal(requests,3);
  } finally {await new Promise(done=>server.close(done));}
});

test('new inventory routes still fail when the shared propagation deadline expires',async()=>{
  const server=createServer((req,res)=>{res.writeHead(404);res.end('missing');});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  try {
    await assert.rejects(waitForReleaseFile(`http://127.0.0.1:${server.address().port}`,{key:'itinerary/new/index.html',contentType:'text/html',sha256:sha256(Buffer.from('release'))},'/itinerary/new',{deadline:Date.now()+50,intervalMs:1}),/propagation deadline/);
  } finally {await new Promise(done=>server.close(done));}
});

test('production route probes reject encoded bypasses, missing noindex and lost alias queries',async()=>{
  let defect;
  const server=createServer((req,res)=>{
    if(req.url.startsWith('/itinerary/example/index.html')) {
      res.writeHead(301,{location:defect==='query'?'/itinerary/example':'/itinerary/example?q=a%20b'});return res.end();
    }
    if(defect==='encoded'&&req.url.startsWith('/%69')) {res.writeHead(200);return res.end('old retained document');}
    res.writeHead(404,defect==='noindex'?{}:{'x-robots-tag':'noindex,follow'});res.end('not found');
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  try {
    for(defect of ['encoded','noindex','query']) await assert.rejects(checkItineraryResponses(`http://127.0.0.1:${server.address().port}`,'/itinerary/example'),defect==='query'?/redirect\/query changed/:/noindex HTTP 404/);
  } finally {await new Promise(done=>server.close(done));}
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
