// Delete a recovery point (the oldest one) and check it is gone.
import { open } from '../lib.mjs';

const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const c = await open();
const { page } = c;
const SHEET = '[role=dialog]:has-text("Backup and restore")';
const points = () => page.locator(SHEET).getByText(/ · (on demand|daily|weekly|monthly)/);
async function openBackups() {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('Snapshots and restore for this environment').click();
  await page.getByText('Recovery points').waitFor();
  await page.waitForTimeout(2000);
}

await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
if (await page.getByRole('button', { name: /^Commit \d+ change/ }).count()) {
  console.log('(discarding changes left staged by an earlier run)');
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
  await page.getByRole('button', { name: 'Discard all' }).click();
  await page.waitForTimeout(1500);
}
await openBackups();
const before = await points().count();
if (before < 2) throw new Error('need at least two recovery points');
console.log('points', before);
await points().last().click();
await page.getByText('Delete recovery point').last().click();
await page.waitForTimeout(1200);
const dialog = page.locator('[role=alertdialog], [role=dialog]').last();
console.log('    asks:', (await dialog.innerText()).replace(/\s+/g, ' ').slice(0, 300));
await c.shot('backups/12-delete-point', { locator: SHEET });
// Staged like every change on the canvas, or confirmed in a dialog.
const confirm = page.getByRole('button', { name: /^(Delete|Delete recovery point|Confirm)$/ }).last();
if (await confirm.isVisible().catch(() => false)) await confirm.click();
if (await page.getByRole('button', { name: /^Commit 1 change/ }).count()) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Commit 1 change/ }).click();
  await page.getByRole('button', { name: 'Deploy 1 change' }).waitFor();
  await c.shot('backups/13-delete-commit', { locator: '[role=dialog]' });
  // "Type <environment> to confirm": the input's placeholder is the word.
  const typed = page.locator('[role=dialog] input').filter({ hasNot: page.locator('[placeholder^="How these"]') }).first();
  const word = await typed.getAttribute('placeholder');
  await typed.fill(word);
  console.log('    typed', word);
  await page.getByRole('button', { name: 'Deploy 1 change' }).click();
}
let after = before;
for (let i = 0; i < 20 && after >= before; i++) {
  await page.waitForTimeout(6000);
  await openBackups();
  after = await points().count();
}
console.log(`    points ${before} → ${after}`);
if (after >= before) throw new Error('recovery point not deleted');
await c.done();
