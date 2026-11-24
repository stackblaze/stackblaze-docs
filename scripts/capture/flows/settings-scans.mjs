// Settings → Scans: turn vulnerability scans on, wait for the Security tab's
// result, try Scan now, then turn scans off. github-demo-gv35's nginx.
import { open } from '../lib.mjs';
import { helpers, SHEET } from './_settings.mjs';
const c = await open();
const h = helpers(c, 'github-demo-gv35', 'nginx');
const { page } = h;
const sheetText = async () => (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ');
const tab = (n) => page.locator('[role=tab]').filter({ hasText: new RegExp(`^${n}`) }).first();
if (process.env.OFF) {
  await h.openSettings(); await h.jump('Scans'); await h.setSwitch('#app-vuln-scan', false);
  await h.commitDeploy('Scans off'); console.log('saved', JSON.stringify((await h.spec()).vulnerabilityscan));
  await c.done(); process.exit(0);
}
await h.openSettings(); await h.jump('Scans');
await h.setSwitch('#app-vuln-scan', true); await page.waitForTimeout(500);
await c.shot('settings/scans-on', { locator: '[data-settings-section="scans"]' });
await h.commitDeploy('Scans on', 'settings/scans-commit');
console.log('saved', JSON.stringify((await h.spec()).vulnerabilityscan));
c.checkpoint();
await h.openSettings();
await tab('Security').click();
let t = '';
for (let i = 0; i < 30; i++) { await page.waitForTimeout(10000); t = await sheetText(); if (/vulnerabilit|critical|high|clean|failed/i.test(t.split('Vulnerability scans').pop() || '') && !/Scanning|Queued/i.test(t)) break; if (i % 6 === 0) console.log('   waiting:', t.split('Scans never block a deploy.').pop().slice(0, 160)); }
console.log('security:', t.split('Scans never block a deploy.').pop().slice(0, 1200));
await c.shot('settings/security-result', { locator: SHEET });
c.checkpoint();
const row = page.locator(SHEET).getByRole('button', { name: /View latest full report/ }).first();
if (await row.count()) { await row.click(); await page.waitForTimeout(3000); const top = page.locator('[role=dialog]').last(); console.log('detail:', (await top.innerText()).replace(/\s+/g, ' ').slice(0, 1500)); await c.shot('settings/security-detail', { locator: SHEET }); }
await c.done();
