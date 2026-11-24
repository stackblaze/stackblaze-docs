// A service's Metrics tab: every chart, the time ranges, Refresh, and any
// alert controls. my-first-project-h22a's nginx.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'my-first-project-h22a';
const APP = process.env.APP ?? 'nginx';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 2500);
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(3500);
const apps = page.getByRole('button', { name: 'Apps', exact: true }).first(); await apps.waitFor({ timeout: 60000 }).catch(() => {}); await apps.click().catch(() => {}); await page.waitForTimeout(2000);
await page.getByRole('button', { name: new RegExp(`^Manage ${APP}\\b`) }).first().click(); await page.waitForTimeout(2500);
await page.getByRole('tab', { name: /^Metrics/ }).click(); await page.waitForTimeout(6000);
const sh = page.locator('[role=dialog]').last();
console.log('1.', await text(sh));
console.log('controls', JSON.stringify(await sh.locator('button, input, select, [role=switch]').evaluateAll((els) => els.map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 30)}`))));
await c.shot('metrics/1-tab');
for (const r of ['24h', '7d']) { const b = sh.getByRole('button', { name: r, exact: true }); if (await b.count()) { await b.click(); await page.waitForTimeout(4000); console.log(`== ${r}:`, (await text(sh)).slice(0, 500)); await c.shot(`metrics/range-${r}`); } }
if (process.env.CHECK) {
  page.on('dialog', () => {});
  await sh.getByRole('button', { name: '2h', exact: true }).click(); await page.waitForTimeout(3000);
  await sh.getByRole('button', { name: 'Check performance' }).click(); await page.waitForTimeout(8000);
  const top = page.locator('[role=dialog]').last();
  console.log('check:', await text(top));
  console.log('url', new URL(page.url()).pathname + new URL(page.url()).search, 'pages', page.context().pages().length);
  await c.shot('metrics/check-performance');
}
await c.done();
