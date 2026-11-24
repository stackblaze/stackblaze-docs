// Settings → Deploy on a docker service: a pre-deploy command that works, one
// that fails, and a start command; each one deployed, then cleared again.
// Runs on github-demo-kpw0's nginx-unprivileged.
import { open } from '../lib.mjs';
import { helpers, probe, SHEET } from './_settings.mjs';

const c = await open();
const h = helpers(c);
const { page } = h;
const tab = (name) => page.locator('button,[role=tab],a').filter({ hasText: new RegExp(`^${name}`) }).first();
const sheetText = async () => (await page.locator('[data-slot=sheet-content]').innerText()).replace(/\s+/g, ' ');

console.log('1. Settings → Deploy');
await h.openSettings();
await h.jump('Deploy');
const s0 = await h.spec();
const url = `https://${s0.ingress.hosts[0].host}/`;
console.log('   ', (await h.section('deploy').innerText()).replace(/\s+/g, ' '));
await c.shot('settings/deploy', { locator: '[data-settings-section="deploy"]' });

console.log('2. Pre-deploy that succeeds → deploy');
await page.locator('#app-predeploy').fill('echo "pre-deploy ran"');
await c.shot('settings/predeploy', { locator: '[data-settings-section="deploy"]' });
await h.commitDeploy('Add a pre-deploy command', 'settings/predeploy-commit');
await h.waitRunning();
let s = await h.spec();
console.log('   saved preDeployCommand:', JSON.stringify(s.preDeployCommand));
await h.openSettings();
await tab('Deployment').click();
await page.waitForTimeout(5000);
console.log('   deployments:', (await sheetText()).slice(0, 700));
await c.shot('settings/predeploy-deployed', { locator: SHEET });
c.checkpoint();

console.log('3. Pre-deploy that fails (exit 1) → deploy');
await tab('Settings').click();
await page.locator('nav[aria-label="Settings sections"]').waitFor();
await h.jump('Deploy');
await page.locator('#app-predeploy').fill('echo "migration failed"; exit 1');
await h.commitDeploy('A pre-deploy command that fails');
for (let i = 0; i < 18; i++) {
  await page.waitForTimeout(10000);
  const st = await h.status();
  console.log(`   t+${(i + 1) * 10}s`, st?.deployments?.map((d) => `${d.ready}/${d.desired} upd ${d.updated}`), st?.pods?.map((p) => `${p.name.slice(-14)} ${p.phase}/${p.ready}`), '| site', (await probe(url)).status);
}
await h.openSettings();
await tab('Deployment').click();
await page.waitForTimeout(5000);
console.log('   deployments:', (await sheetText()).slice(0, 900));
await c.shot('settings/predeploy-failed', { locator: SHEET });
c.checkpoint();

console.log('4. Clear pre-deploy, set a start command → deploy');
await tab('Settings').click();
await page.locator('nav[aria-label="Settings sections"]').waitFor();
await h.jump('Deploy');
await page.locator('#app-predeploy').fill('');
await page.locator('#app-cmd').fill(`sh -c "echo started by the start command; exec nginx -g 'daemon off;'"`);
await c.shot('settings/start-command', { locator: '[data-settings-section="deploy"]' });
await h.commitDeploy('Set a start command', 'settings/start-command-commit');
await h.waitRunning();
s = await h.spec();
console.log('   saved:', JSON.stringify(s.image?.command), JSON.stringify(s.preDeployCommand), '| site', (await probe(url)).status);
await h.openSettings();
await tab('Logs').click();
await page.waitForTimeout(8000);
console.log('   logs has line:', (await sheetText()).includes('started by the start command'));
await c.shot('settings/start-command-logs', { locator: SHEET });
c.checkpoint();

console.log('5. Put back: clear the start command → deploy');
await tab('Settings').click();
await page.locator('nav[aria-label="Settings sections"]').waitFor();
await h.jump('Deploy');
await page.locator('#app-cmd').fill('');
await h.commitDeploy('Clear the start command');
await h.waitRunning();
s = await h.spec();
console.log('   saved:', JSON.stringify(s.image?.command), JSON.stringify(s.preDeployCommand), '| site', (await probe(url)).status);

await c.done();
