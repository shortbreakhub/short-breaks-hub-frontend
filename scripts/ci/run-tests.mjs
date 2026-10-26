import {spawn} from 'node:child_process';
import {readdirSync} from 'node:fs';

// Bound Vite/jsdom worker pressure and hanging tests without skipping any files.
const files = readdirSync('tests').filter(name => name.endsWith('.test.js')).sort().map(name => `tests/${name}`);
const child = spawn(process.execPath,['--test','--test-timeout=60000','--test-concurrency=4',...files],{stdio:'inherit',detached:process.platform!=='win32'});
let timedOut = false;
const signal = name => {
  try { process.platform==='win32' ? child.kill(name) : process.kill(-child.pid,name); } catch { /* already exited */ }
};
const deadline = setTimeout(() => {
  timedOut = true;
  console.error('Full test suite exceeded 10 minutes; terminating test workers. No deployment permitted.');
  signal('SIGTERM');
  setTimeout(()=>signal('SIGKILL'),5000).unref();
},10*60*1000);
child.on('error',()=>{clearTimeout(deadline);process.exitCode=1;});
child.on('exit',code=>{clearTimeout(deadline);process.exitCode=timedOut ? 124 : code || (code===0 ? 0 : 1);});
for (const name of ['SIGINT','SIGTERM']) process.on(name,()=>signal(name));
