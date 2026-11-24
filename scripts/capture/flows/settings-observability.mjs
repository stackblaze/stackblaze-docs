// Settings → Scans, Tracing and Logs: turn vulnerability scans on (deploy,
// the Security tab appears), turn tracing on with each language choice seen
// (deploy), read the log retention, then both off again.
// Runs on github-demo-gv35's nginx.
import { open } from '../lib.mjs';
import { helpers, SHEET } from './_settings.mjs';

const c = await open();
const h = helpers(c, process.env.CAPTURE_PROJECT ?? 'github-demo-gv35', process.env.CAPTURE_SERVICE ?? 'nginx');
const { page } = h;
const tab = (name) => page.locator('button,[role=tab],a').filter({ hasText: new RegExp(`^${name}`) }).first();
const sheetText = async () => (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ');

if (process.env.ONLY_OFF) {
  await h.openSettings();
  await h.jump('Tracing'); await page.locator('#app-tracing').click();
  await h.jump('Scans'); if (await page.locator('#app-vuln-scan').getAttribute('aria-checked') === 'true' || await page.locator('#app-vuln-scan').getAttribute('data-state') === 'checked') await page.locator('#app-vuln-scan').click();
  await h.commitDeploy('Tracing off'); await h.waitRunning();
  console.log('saved', JSON.stringify((await h.spec()).tracing), JSON.stringify((await h.spec()).vulnerabilityscan));
  await c.done(); process.exit(0);
}
console.log('1. Settings → Scans, Tracing, Logs');
await h.openSettings();
console.log('   tabs:', await page.locator('[role=tab]').allInnerTexts());
for (const id of ['scans', 'tracing', 'logs']) {
  await h.jump(id[0].toUpperCase() + id.slice(1));
  console.log(`   ${id}:`, (await h.section(id).innerText()).replace(/\s+/g, ' '));
  await c.shot(`settings/${id}`, { locator: `[data-settings-section="${id}"]` });
}

console.log('2. Scans on + Tracing on');
await h.jump('Scans');
await page.locator('#app-vuln-scan').click();
await h.jump('Tracing');
await page.locator('#app-tracing').click();
await page.waitForTimeout(400);
const lang = page.locator('#app-tracing-language');
console.log('   languages:', await lang.locator('option').allInnerTexts(), 'default', await lang.inputValue());
console.log('   hint:', (await h.section('tracing').innerText()).replace(/\s+/g, ' '));
await c.shot('settings/tracing-on', { locator: '[data-settings-section="tracing"]' });
await lang.selectOption('sdk');
await page.waitForTimeout(300);
console.log('   sdk hint:', (await h.section('tracing').innerText()).replace(/\s+/g, ' '));
await c.shot('settings/tracing-sdk', { locator: '[data-settings-section="tracing"]' });
await c.shot('settings/scans-on', { locator: '[data-settings-section="scans"]' });
await h.commitDeploy('Scans and tracing on', 'settings/observability-commit');
await h.waitRunning();
let s = await h.spec();
console.log('   saved:', JSON.stringify(s.vulnerabilityscan), JSON.stringify(s.tracing));
c.checkpoint();

if (process.env.STOP_AFTER_ON) { await c.done(); process.exit(0); }
console.log('3. The Security tab');
await h.openSettings();
console.log('   tabs:', await page.locator('[role=tab]').allInnerTexts());
await tab('Security').click();
for (let i = 0; i < 18; i++) {
  await page.waitForTimeout(10000);
  const t = await sheetText();
  if (!/scanning|queued|running/i.test(t) || i === 17) { console.log('   security:', t.slice(0, 900)); break; }
}
await c.shot('settings/security-tab', { locator: SHEET });
c.checkpoint();

console.log('4. Put back: scans off, tracing off');
await tab('Settings').click();
await page.locator('nav[aria-label="Settings sections"]').waitFor();
await h.jump('Scans');
await page.locator('#app-vuln-scan').click();
await h.jump('Tracing');
await page.locator('#app-tracing').click();
await h.commitDeploy('Scans and tracing off');
await h.waitRunning();
s = await h.spec();
console.log('   saved:', JSON.stringify(s.vulnerabilityscan), JSON.stringify(s.tracing));
await h.openSettings();
console.log('   tabs:', await page.locator('[role=tab]').allInnerTexts());

await c.done();
