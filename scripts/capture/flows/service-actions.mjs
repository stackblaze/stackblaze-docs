// What you can do with a running service from its card menu: Restart,
// Pause / Resume, Rename (cancelled) and Delete (staged, then discarded).
// Runs against nginx-unprivileged in github-demo-kpw0 and leaves it running
// under its own name.
import { open } from '../lib.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-kpw0';
const PHASE = 'dev';
const APP = 'nginx-unprivileged';
const c = await open();
const { page } = c;

const card = () => page.locator('[data-node-id], .vue-flow__node, div').filter({ has: page.getByText(APP, { exact: true }) }).filter({ hasText: /Running|Paused|Stopped|Starting|Restarting/ }).last();
const cardName = () => page.getByText(APP, { exact: true }).first();
const status = () => page.evaluate(async ([p, ph, a]) => {
  const d = await (await fetch(`/api/apps/${p}/${ph}/${a}`)).json();
  return { paused: !!d?.spec?.paused, replicas: d?.status?.readyReplicas ?? d?.status?.replicas };
}, [PROJECT, PHASE, APP]);
async function menu() {
  await page.keyboard.press('Escape');
  await cardName().click({ button: 'right' });
  await page.getByRole('menuitem').first().waitFor();
  return page.getByRole('menuitem').allInnerTexts();
}
const menuBox = () => page.locator('[role=menu]').first();
const toast = () => page.locator('[data-sonner-toast]').first();
async function waitToast(re, timeout = 60000) {
  const t = page.locator('[data-sonner-toast]').filter({ hasText: re }).first();
  await t.waitFor({ timeout });
  return t;
}
async function clearToasts() {
  await page.locator('[data-sonner-toast]').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
await cardName().waitFor({ timeout: 20000 });
if ((await status()).paused) throw new Error(`${APP} is paused; resume it first`);

console.log('1. Right-click the card → menu');
const items = await menu();
console.log('   menu:', items);
await c.shot('actions/1-menu', { clip: { x: 32, y: 120, width: 520, height: 520 } });

console.log('1b. The menu items that open the service sheet');
for (const [item, tabName] of [['Settings', 'Settings'], ['Logs', 'Logs'], ['Metrics', 'Metrics'], ['Terminal', 'Terminal']]) {
  await menu();
  await page.getByRole('menuitem', { name: item, exact: true }).click();
  const t = page.getByRole('tab', { name: new RegExp(`^${tabName}`) });
  await t.waitFor({ timeout: 15000 });
  await page.waitForFunction((n) => [...document.querySelectorAll('[role=tab]')].some((e) => e.getAttribute('aria-selected') === 'true' && e.textContent.trim().startsWith(n)), tabName, { timeout: 15000 });
  console.log(`   ${item} → sheet on ${tabName}`);
  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.waitForTimeout(800);
}
await menu();
await page.getByRole('menuitem', { name: 'Backups' }).click();
await page.waitForTimeout(2500);
console.log('   Backups →', (await page.locator('[role=dialog], aside').last().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200));
await page.keyboard.press('Escape');
await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
await cardName().waitFor({ timeout: 20000 });

console.log('2. Restart');
await menu();
await page.getByRole('menuitem', { name: 'Restart' }).click();
const rt = await waitToast(/Restart requested/);
await c.shot('actions/2-restart', { around: [rt], pad: 12 });
await clearToasts();
// The rollout: wait until the card says Running again.
await page.waitForTimeout(5000);
await page.getByText('Running', { exact: true }).first().waitFor({ timeout: 240000 });

console.log('3. Pause');
await menu();
await page.getByRole('menuitem', { name: 'Pause' }).click();
const pt = await waitToast(/App paused/);
await c.shot('actions/3-paused-toast', { around: [pt], pad: 12 });
for (let i = 0; i < 30 && !(await status()).paused; i++) await page.waitForTimeout(2000);
if (!(await status()).paused) throw new Error('not paused');
await clearToasts();
await page.waitForTimeout(4000);
console.log('   card text:', (await card().innerText()).replace(/\s+/g, ' '));
console.log('   paused menu:', await menu());
await c.shot('actions/4-paused-menu', { clip: { x: 32, y: 120, width: 520, height: 520 } });

console.log('4. Resume');
await page.getByRole('menuitem', { name: 'Resume' }).click();
const rs = await waitToast(/App resumed/);
await c.shot('actions/5-resumed-toast', { around: [rs], pad: 12 });
for (let i = 0; i < 30 && (await status()).paused; i++) await page.waitForTimeout(2000);
if ((await status()).paused) throw new Error('still paused');
await clearToasts();
await page.getByText('Running', { exact: true }).first().waitFor({ timeout: 240000 });

console.log('5. Rename → dialog, cancel');
await menu();
await page.getByRole('menuitem', { name: 'Rename' }).click();
const dlg = page.locator('[role=dialog],[role=alertdialog]').last();
await dlg.waitFor();
console.log('   rename dialog:', (await dlg.innerText()).replace(/\s+/g, ' '));
await c.shot('actions/6-rename', { locator: '[role=dialog],[role=alertdialog]' });
await dlg.getByRole('button', { name: 'Cancel' }).click();
await dlg.waitFor({ state: 'hidden' });

console.log('6. Delete → staged');
await menu();
await page.getByRole('menuitem', { name: 'Delete' }).click();
await page.waitForTimeout(1500);
const commitBtn = page.getByRole('button', { name: /Commit \d+ change/ });
await commitBtn.waitFor({ timeout: 10000 });
console.log('   card after delete:', (await card().innerText().catch(() => '?')).replace(/\s+/g, ' '));
await c.shot('actions/7-delete-staged', { clip: { x: 0, y: 50, width: 1440, height: 240 } });

console.log('7. Commit dialog, then Discard all');
await commitBtn.click();
const cm = page.locator('[role=dialog]').last();
await cm.waitFor();
await page.waitForTimeout(800);
console.log('   commit dialog:', (await cm.innerText()).replace(/\s+/g, ' '));
await c.shot('actions/8-delete-commit', { locator: '[role=dialog]' });
await cm.getByRole('button', { name: 'Discard all' }).click();
await page.waitForTimeout(1500);
const still = page.locator('[role=alertdialog],[role=dialog]').last();
if (await still.isVisible().catch(() => false)) {
  console.log('   discard confirm:', (await still.innerText()).replace(/\s+/g, ' '));
  const b = still.getByRole('button', { name: /Discard/ }).last();
  if (await b.count()) await b.click();
}
await commitBtn.waitFor({ state: 'hidden', timeout: 10000 });
const after = await status();
console.log('   after discard:', after);

await c.done();
