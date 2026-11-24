// Settings → Access: switch a public docker service to Internal, deploy it
// and check the public URL stops answering; then Worker; then back to Public.
// Runs on github-demo-kpw0's nginx-unprivileged.
import { open } from '../lib.mjs';
import { helpers, probe, SHEET } from './_settings.mjs';

const c = await open();
const h = helpers(c);
const { page } = h;

console.log('1. Open the service → Settings');
await h.openSettings();
const before = await h.spec();
const url = `https://${before.ingress.hosts[0].host}/`;
console.log('   rail (web):', await h.rail(), '| url', url, (await probe(url)).status);
await c.shot('settings/0-overview', { locator: SHEET });
await c.shot('settings/access', { locator: '[data-settings-section="access"]' });

console.log('2. Internal → commit → deploy');
await page.getByRole('radio', { name: 'Internal' }).click();
await page.waitForTimeout(800);
console.log('   desc:', await h.section('access').innerText());
console.log('   rail (internal):', await h.rail());
await c.shot('settings/access-internal', { locator: '[data-settings-section="access"]' });
await h.commitDeploy('Make nginx-unprivileged internal', 'settings/access-commit');
await h.waitRunning();
let s = await h.spec();
// The public route goes away once the change is live (poll: the edge may
// take a moment).
let out = await probe(url);
for (let i = 0; i < 36 && out.status === 200; i++) { await page.waitForTimeout(5000); out = await probe(url); }
console.log('   saved: ingress.enabled', s.ingress?.enabled, '| outside:', out.status, out.body?.slice(0, 120));
await h.openSettings();
console.log('   rail after deploy:', await h.rail());
await c.shot('settings/access-internal-live', { locator: SHEET });
c.checkpoint();

console.log('3. Worker → commit → deploy');
await page.getByRole('radio', { name: 'Worker' }).click();
await page.waitForTimeout(800);
console.log('   rail (worker):', await h.rail());
await c.shot('settings/access-worker', { locator: SHEET });
await h.commitDeploy('Make nginx-unprivileged a worker');
let wst = await h.waitRunning();
for (let i = 0; i < 36 && !wst.deployments.some((d) => /worker/.test(d.name) && d.ready >= 1); i++) { await page.waitForTimeout(5000); wst = await h.status(); }
console.log('   workloads:', wst.deployments.map((d) => `${d.name} ${d.ready}/${d.desired}`));
await h.openSettings();
console.log('   rail after deploy:', await h.rail());
await c.shot('settings/access-worker-live', { locator: SHEET });
s = await h.spec();
console.log('   saved: web', s.web?.replicaCount, 'worker', s.worker?.replicaCount, '| outside:', (await probe(url)).status);
c.checkpoint();

console.log('4. Back to Public → commit → deploy');
await page.getByRole('radio', { name: 'Public' }).click();
await h.commitDeploy('Make nginx-unprivileged public again');
await h.waitRunning();
let p = { status: 0 };
for (let i = 0; i < 24 && p.status !== 200; i++) { await page.waitForTimeout(5000); p = await probe(url); }
s = await h.spec();
console.log('   saved: web', s.web?.replicaCount, 'worker', s.worker?.replicaCount, 'ingress', s.ingress?.enabled, '| outside:', p.status);
if (p.status !== 200) throw new Error('public URL did not come back');

await c.done();
