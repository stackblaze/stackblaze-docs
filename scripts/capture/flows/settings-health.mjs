// Settings → Health: change the probe path and deploy it; deploy a path that
// fails and see the old version stay live; turn the check off (staged, then
// discarded); put the defaults back. Runs on github-demo-kpw0's nginx-unprivileged.
import { open } from '../lib.mjs';
import { helpers, probe, SHEET } from './_settings.mjs';

const c = await open();
const h = helpers(c);
const { page } = h;
const health = () => h.section('health');
const tab = (name) => page.locator('button,[role=tab],a').filter({ hasText: new RegExp(`^${name}`) }).first();

console.log('1. Settings → Health');
await h.openSettings();
await h.jump('Health');
const s0 = await h.spec();
const url = `https://${s0.ingress.hosts[0].host}`;
console.log('   ', (await health().innerText()).replace(/\s+/g, ' '));
console.log('   values', await page.locator('#hc-path').inputValue(), await page.locator('#hc-startup').inputValue(), await page.locator('#hc-timeout').inputValue(), await page.locator('#hc-interval').inputValue());
await c.shot('settings/health', { locator: '[data-settings-section="health"]' });

console.log('2. Path /index.html → deploy');
await page.locator('#hc-path').fill('/index.html');
await page.waitForTimeout(400);
await c.shot('settings/health-path', { locator: '[data-settings-section="health"]' });
await h.commitDeploy('Health check on /index.html', 'settings/health-commit');
await h.waitRunning();
let s = await h.spec();
console.log('   saved:', JSON.stringify(s.healthcheck));
c.checkpoint();

console.log('3. A path that fails: /does-not-exist → deploy');
await h.openSettings();
await h.jump('Health');
await page.locator('#hc-path').fill('/does-not-exist');
await page.locator('#hc-startup').fill('30');
await h.commitDeploy('Health check on a missing path');
// Watch the rollout: the new pod never becomes ready, the old one keeps serving.
let st;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(10000);
  st = await h.status();
  const p = await probe(url + '/');
  console.log(`   t+${(i + 1) * 10}s`, st?.deployments?.map((d) => `ready ${d.ready}/${d.desired} updated ${d.updated} unavail ${d.unavailable} stalled ${d.progressStalled}`), 'pods', st?.pods?.map((x) => `${x.phase}/${x.ready}/${x.restarts}`), '| site', p.status);
  if (i >= 8 && st?.pods?.some((x) => x.restarts > 0)) break;
}
await h.openSettings();
await tab('Deployment').click();
await page.waitForTimeout(4000);
console.log('   deployments tab:', (await page.locator('[data-slot=sheet-content]').innerText()).replace(/\s+/g, ' ').slice(0, 900));
await c.shot('settings/health-failing', { locator: SHEET });
c.checkpoint();

console.log('4. Turn it off (staged, then discarded)');
await tab('Settings').click();
await page.locator('nav[aria-label="Settings sections"]').waitFor();
await h.jump('Health');
await page.locator('#app-deploy-healthCheckDefaultOn').click();
await page.waitForTimeout(500);
console.log('   ', (await health().innerText()).replace(/\s+/g, ' '));
await c.shot('settings/health-off', { locator: '[data-settings-section="health"]' });
await h.discard();

console.log('5. Put back: path /, Startup 90 → deploy');
await h.openSettings();
await h.jump('Health');
await page.locator('#hc-path').fill('/');
await page.locator('#hc-startup').fill('90');
await h.commitDeploy('Health check back on /');
await h.waitRunning();
s = await h.spec();
console.log('   saved:', JSON.stringify(s.healthcheck), '| site', (await probe(url + '/')).status);

await c.done();
