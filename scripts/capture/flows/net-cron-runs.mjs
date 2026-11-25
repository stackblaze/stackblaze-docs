// Runs of scheduled tasks set on a service with `stackblaze cron set`
// (github-demo-cw8z's crondemo, a scratch service): where they show, the run
// menu (View logs, Run again, Cancel, Remove), a failed run, and Cancel.
import { open } from '../lib.mjs';
import { SHEET } from './_settings.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-cw8z';
const SERVICE = process.env.CAPTURE_SERVICE ?? 'crondemo';
const STEP = process.env.STEP ?? 'look';
const c = await open();
const { page } = c;
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
const apps = page.getByRole('button', { name: 'Apps', exact: true }).first();
await apps.waitFor({ timeout: 60000 }).catch(() => {});
await apps.click().catch(() => {}); await page.waitForTimeout(3000);
const card = page.getByRole('button', { name: new RegExp(`^Manage ${SERVICE}\\b`) }).first();
await card.waitFor({ timeout: 90000 });
await card.click();
await page.waitForTimeout(3000);
const tabs = await page.locator(`${SHEET} [role=tab], ${SHEET} nav button`).allInnerTexts().catch(() => []);
console.log('tabs:', tabs.map((t) => t.trim()).filter(Boolean).join(' | '));
const t = page.locator('button,[role=tab],a').filter({ hasText: /^Scheduled tasks/ }).first();
if (await t.count()) { await t.click(); await page.waitForTimeout(5000); }
console.log('sheet:', (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ').slice(0, 1500));
await c.shot('net/cron-app-tasks', { locator: SHEET });
const runRows = page.locator(`${SHEET} li`).filter({ hasText: /^\s*Run / });
console.log('run rows:', await runRows.count());
if (STEP === 'menus') {
  for (const [label, id] of [[/Run running/, 'net/cron-run-menu-running'], [/Run failed/, 'net/cron-run-menu-failed']]) {
    const row = runRows.filter({ hasText: label }).first();
    if (!(await row.count())) { console.log('no row', label); continue; }
    await row.locator('button').last().click();
    await page.waitForTimeout(800);
    const menu = page.locator('[role=menu]').last();
    console.log(label, 'menu:', (await menu.innerText()).replace(/\s+/g, ' '));
    await c.shot(id, { around: [row, menu], pad: 8 });
    if (String(label).includes('running') && process.env.CANCEL) {
      await menu.getByText('Cancel').click(); await page.waitForTimeout(6000);
      console.log('after cancel:', (await page.locator(SHEET).innerText()).replace(/\s+/g, ' ').slice(0, 700));
    } else { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  }
}
await c.done();
