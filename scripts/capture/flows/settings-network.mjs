// Settings → Network: Basic Auth (deploy, check the 401), Advanced networking
// (CORS, an inbound IP rule, the CIDR warning), then everything off again.
// Runs on github-demo-gv35's nginx.
import { open } from '../lib.mjs';
import { helpers, probe } from './_settings.mjs';

const c = await open();
const h = helpers(c, process.env.CAPTURE_PROJECT ?? 'github-demo-gv35', process.env.CAPTURE_SERVICE ?? 'nginx');
const { page } = h;
const net = () => h.section('network');
const adv = () => page.locator('.form-subsection-card').filter({ hasText: 'Advanced networking' }).last();
const MYIP = (await (await fetch('https://api.ipify.org')).text()).trim();
const PASS = `pw-${Math.random().toString(36).slice(2, 12)}`;

console.log('1. Settings → Network');
await h.openSettings();
await h.jump('Network');
let s0 = await h.spec();
if (s0.basicAuth?.enabled) {
  // A re-run: an earlier run left Basic Auth on. Turn it off first (not captured).
  await h.setSwitch('#app-basic-auth', false);
  await h.commitDeploy('Basic Auth off (reset)');
  await h.waitRunning();
  await h.openSettings();
  await h.jump('Network');
  s0 = await h.spec();
}
const url = `https://${s0.ingress.hosts[0].host}/`;
console.log('   site', (await probe(url)).status, '| annotations', JSON.stringify(s0.ingress?.annotations));
console.log('   ', (await net().innerText()).replace(/\s+/g, ' '));
console.log('   adv cards', await adv().count()); await c.shot('settings/network', { locator: '[data-settings-section="network"]' });

console.log('2. Enable Basic Auth');
await h.setSwitch('#app-basic-auth', true);
console.log('   ', (await net().innerText()).replace(/\s+/g, ' '), '| realm', await page.locator('#app-basic-realm').inputValue());
await c.shot('settings/basic-auth-empty', { locator: '[data-settings-section="network"]' });
await page.locator('#app-basic-realm').fill('Staging');
await net().getByRole('button', { name: 'Add account' }).click();
await page.waitForTimeout(300);
await page.locator('#auth-user-0').fill('demo');
// Screenshot before the password is typed: no password on the page.
await c.shot('settings/basic-auth', { locator: '[data-settings-section="network"]' });
await page.locator('#auth-pass-0').fill(PASS);
await h.commitDeploy('Basic Auth on', 'settings/basic-auth-commit');
await h.waitRunning();
let r = await probe(url);
for (let i = 0; i < 24 && r.status !== 401; i++) { await page.waitForTimeout(5000); r = await probe(url); }
console.log('   no credentials:', r.status, r.headers?.['www-authenticate']);
const auth = { headers: { Authorization: 'Basic ' + Buffer.from(`demo:${PASS}`).toString('base64') } };
console.log('   with credentials:', (await probe(url, auth)).status);
console.log('   wrong password:', (await probe(url, { headers: { Authorization: 'Basic ' + Buffer.from('demo:nope').toString('base64') } })).status);
c.checkpoint();

console.log('3. Basic Auth off; Advanced networking on: CORS');
await h.openSettings();
await h.jump('Network');
await h.setSwitch('#app-basic-auth', false);
await page.waitForTimeout(800);
await h.setSwitch('#app-advanced-networking', true);
console.log('   ', (await adv().innerText()).replace(/\s+/g, ' '));
console.log('   buffer field shown:', await page.locator('#net-buffer').count());
await h.setSwitch('#cors-enable', true);
await page.waitForTimeout(400);
console.log('   cors defaults:', await page.locator('#cors-origin').inputValue(), '|', await page.locator('#cors-headers').inputValue(), '|', await page.locator('#cors-methods').inputValue());
await page.locator('#cors-origin').fill('https://app.example.com');
await page.locator('#cors-methods').fill('GET, POST, OPTIONS');
await c.shot('settings/cors', { around: [adv()], pad: 2 });

console.log('4. Inbound IP rules: the CIDR warning');
await page.locator('#net-denylist').fill('198.51.100');
await page.waitForTimeout(400);
console.log('   warning:', await adv().locator('.text-amber-600').innerText().catch(() => ''));
await c.shot('settings/ip-rules-warning', { locator: '[data-settings-section="inbound-ip"]' });
await page.locator('#net-denylist').fill('');
await h.commitDeploy('Basic Auth off, CORS on', 'settings/cors-commit');
await h.waitRunning();
let s = await h.spec();
console.log('   saved annotations', JSON.stringify(s.ingress?.annotations), 'basicAuth', s.basicAuth?.enabled);
const pre = { method: 'OPTIONS', headers: { Origin: 'https://app.example.com', 'Access-Control-Request-Method': 'POST' } };
let cr = await probe(url, pre);
for (let i = 0; i < 24 && !cr.headers?.['access-control-allow-origin']; i++) { await page.waitForTimeout(5000); cr = await probe(url, pre); }
console.log('   preflight:', cr.status, cr.headers?.['access-control-allow-origin'], cr.headers?.['access-control-allow-methods']);
console.log('   GET no auth now:', (await probe(url, { headers: { Origin: 'https://app.example.com' } })).status, (await probe(url, { headers: { Origin: 'https://app.example.com' } })).headers?.['access-control-allow-origin']);
c.checkpoint();

console.log('5. Block this machine\'s IP → deploy');
await h.openSettings();
await h.jump('Network');
await page.locator('#net-denylist').fill(`${MYIP}/32`);
await page.waitForTimeout(300);
await c.shot('settings/ip-rules', { locator: '[data-settings-section="inbound-ip"]' });
await h.commitDeploy('Block one IP', 'settings/ip-rules-commit');
await h.waitRunning();
r = await probe(url);
for (let i = 0; i < 24 && r.status !== 403; i++) { await page.waitForTimeout(5000); r = await probe(url); }
console.log('   from the blocked IP:', r.status, r.body?.slice(0, 80));
c.checkpoint();

console.log('6. Put back: Advanced networking off → deploy');
await h.openSettings();
await h.jump('Network');
await h.setSwitch('#app-advanced-networking', false);
await h.commitDeploy('Advanced networking off', 'settings/advanced-off-commit');
await h.waitRunning();
s = await h.spec();
r = await probe(url);
for (let i = 0; i < 24 && r.status !== 200; i++) { await page.waitForTimeout(5000); r = await probe(url); }
console.log('   saved annotations', JSON.stringify(s.ingress?.annotations), 'basicAuth', s.basicAuth?.enabled, '| site', r.status);

await c.done();
