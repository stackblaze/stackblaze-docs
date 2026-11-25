// Deployment tab of a PRODUCTION image service: Instant Rollback on a
// superseded release. Set up first with the CLI (two releases):
//   stackblaze up --image nginx:1.26 --name docs-img -p github-demo-cw8z --phase production --port 80 --wait
//   stackblaze up --image nginx:1.27 --name docs-img -p github-demo-cw8z --phase production --wait
// STEP=explore prints the tab and the row menus; STEP=rollback performs it.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-cw8z';
const PHASE = process.env.PHASE ?? 'production';
const APP = process.env.APP ?? 'docs-img';
const STEP = process.env.STEP ?? 'explore';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 1500);
async function openTab(tab = 'Deployment') {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`); await page.waitForTimeout(2500);
  const appsBtn = page.getByRole('button', { name: 'Apps', exact: true }).first(); await appsBtn.waitFor({ timeout: 60000 }).catch(() => {}); await appsBtn.click().catch(() => {}); await page.waitForTimeout(2000);
  await page.getByRole('button', { name: new RegExp(`^Manage ${APP}\\b`) }).first().click(); await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: tab }).click(); await page.waitForTimeout(3000);
  return page.locator('[role=dialog]').last();
}
const sheet = await openTab();
const menus = sheet.locator('button:not([aria-label])').filter({ hasText: /^\s*$/ });
const rowMenu = async (i) => { await menus.nth(i).click(); await page.waitForTimeout(1200); return page.locator('[role=menu]').last(); };
console.log('1.', await text(sheet));
if (STEP === 'explore') {
  for (let i = 0; i < Math.min(await menus.count(), 3); i++) {
    console.log(`  row ${i}:`, await text(await rowMenu(i)));
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  }
}
if (STEP === 'rollback') {
  await c.shot('deployments/ir-1-history', { around: sheet, pad: 0 });
  const m = await rowMenu(Number(process.env.ROW ?? 1));
  console.log('  row 1 menu:', await text(m));
  await c.shot('deployments/ir-2-menu', { around: sheet, pad: 0 });
  await m.getByText('Instant Rollback').click(); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=alertdialog], [role=dialog]').filter({ hasText: /Roll back|rollback/i }).last();
  console.log('  confirm:', await text(dlg));
  await c.shot('deployments/ir-3-confirm', { around: dlg });
  await dlg.getByRole('button', { name: 'Rollback' }).click();
  await page.waitForTimeout(45000);
  const s2 = await openTab();
  console.log('2.', (await text(s2)).slice(0, 900));
  await c.shot('deployments/ir-4-after', { around: s2, pad: 0 });
}
if (STEP === 'after') {
  // The history once the rollback is live (the release is titled Rollback).
  await c.shot('deployments/ir-4-after', { around: sheet, pad: 0 });
  const m = await rowMenu(Number(process.env.ROW ?? 2));
  console.log('  row 1 menu:', await text(m));
  await c.shot('deployments/ir-2-menu', { around: sheet, pad: 0 });
}
if (STEP === 'menu') {
  await c.shot('deployments/ir-1-history', { around: sheet, pad: 0 });
  const m = await rowMenu(Number(process.env.ROW ?? 1));
  console.log('  row 1 menu:', await text(m));
  await c.shot('deployments/ir-2-menu', { around: sheet, pad: 0 });
}
await c.done();
