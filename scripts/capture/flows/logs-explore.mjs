// A service's Logs tab: every control (source, instance, time range, search,
// pause, expand, the ⋯ menu). Runs on my-first-project-h22a's nginx.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'my-first-project-h22a';
const APP = process.env.APP ?? 'nginx';
const c = await open(); const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1200);
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`); await page.waitForTimeout(3500);
await page.getByText(APP, { exact: true }).first().click(); await page.waitForTimeout(2500);
await page.getByRole('tab', { name: /^Logs/ }).click(); await page.waitForTimeout(5000);
const sh = page.locator('[role=dialog]').last();
console.log('controls', JSON.stringify(await sh.locator('button, input, [role=combobox]').evaluateAll((els) => els.slice(0, 20).map((e) => `${e.tagName}:${e.getAttribute('aria-label') ?? ''}:${(e.innerText || e.getAttribute('placeholder') || '').trim().slice(0, 30)}`))));
await c.shot('logs/1-tab');
for (const name of (process.env.MENUS ?? 'Pod,Log source,Time range,More').split(',')) {
  const b = sh.getByRole('button', { name: new RegExp(`^${name}`, 'i') }).first();
  if (!(await b.count())) { console.log('no button', name); continue; }
  await b.click(); await page.waitForTimeout(1200);
  const m = page.locator('[role=menu], [role=listbox], [role=dialog]').last();
  console.log(`== ${name}:`, await text(m));
  await c.shot(`logs/menu-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
}
if (!process.env.TRY) for (const [id, loc] of [['source', sh.locator('[aria-label="Log source"]')], ['range', sh.locator('button').filter({ hasText: /^\s*Live tail\s*$/ })], ['pod-chip', sh.getByRole('button', { name: /^\[/ }).first()]]) {
  if (!(await loc.count())) { console.log('none', id); continue; }
  await loc.first().click(); await page.waitForTimeout(1500);
  const m = page.locator('[role=menu], [role=listbox]').last();
  console.log(`== ${id}:`, (await m.count()) ? await text(m) : '(no menu) ' + (await text(sh)).slice(0, 300));
  await c.shot(`logs/menu-${id}`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
}
const pause = sh.locator('[aria-label="Pause live updates"]');
if (await pause.count()) { await pause.click(); await page.waitForTimeout(800); }
console.log('after pause aria:', JSON.stringify(await sh.locator('[aria-label*="live updates" i]').evaluateAll(es => es.map(e => e.getAttribute('aria-label')))));
if (process.env.TRY) {
  await sh.getByPlaceholder('Search logs').fill('kube-probe'); await page.waitForTimeout(3000);
  const lines = await sh.locator('button').filter({ hasText: /^\[/ }).count();
  console.log('search kube-probe: chips', lines, '|', (await text(sh)).split('Live tail').pop().slice(0, 300));
  await c.shot('logs/2-search');
  await sh.getByPlaceholder('Search logs').fill('');
  await sh.locator('button').filter({ hasText: /^\s*Live tail\s*$/ }).first().click(); await page.waitForTimeout(800);
  await page.locator('[role=option], [role=menuitem]').filter({ hasText: 'Last 1 hour' }).first().click(); await page.waitForTimeout(5000);
  console.log('last 1 hour:', (await text(sh)).split('Settings').pop().slice(0, 400));
  await c.shot('logs/3-last-hour');
  await sh.locator('[aria-label="Log source"]').click(); await page.waitForTimeout(800);
  await page.locator('[role=option], [role=menuitem]').filter({ hasText: 'System events' }).first().click(); await page.waitForTimeout(5000);
  console.log('system events:', (await text(sh)).split('Settings').pop().slice(0, 600));
  await c.shot('logs/4-system-events');
}
await c.done();
