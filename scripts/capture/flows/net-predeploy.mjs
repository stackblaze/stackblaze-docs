// Pre-deploy on a Docker image service: a command that fails (exit 1),
// shipped with `stackblaze deploy --tag`, then cleared again.
// Runs on github-demo-cw8z's wsdemo (a scratch service) unless CAPTURE_SERVICE says otherwise.
import { execFileSync } from 'node:child_process';
import { open } from '../lib.mjs';
import { helpers, probe, SHEET } from './_settings.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-cw8z';
const SERVICE = process.env.CAPTURE_SERVICE ?? 'wsdemo';
const SP = process.env.SP;
const cli = (...args) => execFileSync(`${SP}/cli/bin/stackblaze`, args, { env: { ...process.env, HOME: `${SP}/cli/home`, STACKBLAZE_API_URL: 'https://api-dev.stackblaze.cloud' }, encoding: 'utf8', timeout: 600000 });
const c = await open();
const h = helpers(c, PROJECT, SERVICE);
const { page } = h;
const tab = (name) => page.locator('button,[role=tab],a').filter({ hasText: new RegExp(`^${name}`) }).first();
const sheetText = async () => (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ');

console.log('1. Settings → Deploy: pre-deploy hint');
await h.openSettings();
await h.jump('Deploy');
const s0 = await h.spec();
const url = `https://${s0.ingress.hosts[0].host}/`;
const tag = s0.image?.tag;
console.log('   ', (await h.section('deploy').innerText()).replace(/\s+/g, ' '));
await page.locator('#app-predeploy').fill('echo "migration failed"; exit 1');
await c.shot('net/predeploy-image', { locator: '[data-settings-section="deploy"]' });
await h.commitDeploy('A pre-deploy command that fails', 'net/predeploy-commit');
await page.waitForTimeout(15000);
console.log('   saved preDeployCommand:', JSON.stringify((await h.spec()).preDeployCommand));

console.log('2. stackblaze deploy --tag', tag);
try { console.log(cli('deploy', '-p', PROJECT, '-e', 'dev', '-a', SERVICE, '--tag', tag, '-m', 'Deploy with a failing pre-deploy')); } catch (e) { console.log('   cli exit', e.status, String(e.stdout).slice(-800), String(e.stderr).slice(-800)); }
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(10000);
  const st = await h.status();
  console.log(`   t+${(i + 1) * 10}s`, JSON.stringify(st?.deployments?.map((d) => `${d.ready}/${d.desired}`)), JSON.stringify(st?.build ?? st?.influence ?? st?.statusText ?? '').slice(0, 300), '| site', (await probe(url)).status);
}
await h.openSettings();
await tab('Deployment').click();
await page.waitForTimeout(6000);
console.log('   deployments:', (await sheetText()).slice(0, 1200));
await c.shot('net/predeploy-failed', { locator: SHEET });
console.log('   canvas card:', (await page.getByRole('button', { name: new RegExp(`^Manage ${SERVICE}\\b`) }).first().innerText().catch(() => '')).replace(/\s+/g, ' '));
c.checkpoint();

console.log('3. Clear pre-deploy');
await tab('Settings').click();
await page.locator('nav[aria-label="Settings sections"]').waitFor();
await h.jump('Deploy');
await page.locator('#app-predeploy').fill('');
await h.commitDeploy('Clear the pre-deploy command');
await page.waitForTimeout(10000);
console.log('   saved preDeployCommand:', JSON.stringify((await h.spec()).preDeployCommand), '| site', (await probe(url)).status);
await c.done();
