// Backups: the other ways in (right-click a database, the command bar),
// the plan cap on retention, and Deleted databases (Restore as new database).
// Runs in STEPs against github-demo-gv35 dev; every step undoes its change.
import { open } from '../lib.mjs';
const PROJECT = process.env.PROJECT ?? 'github-demo-gv35';
const PHASE = 'dev';
const STEP = process.env.STEP ?? 'explore';
const DB = process.env.DB ?? 'postgresql-7ytg';
const c = await open();
const { page } = c;
const text = async (l) => (await l.innerText()).replace(/\s+/g, ' ').slice(0, 3000);
const canvas = () => c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
const SHEET = '[role=dialog]:has-text("Backup and restore")';
await canvas();
await page.getByTestId('canvas-new-service').waitFor({ timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/claude-1001/-Users-adam/791e7dd4-162b-45fc-bc64-746b4c84360e/scratchpad/shots-data/canvas.png' });
const card = () => page.locator(`[data-testid^=app-card-][data-testid$="-${DB}"]`).first();

if (STEP === 'explore') {
  const ids = await page.locator('[data-testid]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
  console.log(ids.join('\n'));
}
if (STEP === 'rightclick') {
  await page.getByText('PostgreSQL', { exact: true }).first().click({ button: 'right' });
  await page.waitForTimeout(1500);
  const m = page.locator('[role=menu]').last();
  console.log('MENU:', await text(m));
  await c.shot('backups/x-node-menu', { locator: '[role=menu]', pad: 8 });
  await m.getByText('Backups', { exact: true }).click();
  await page.locator(SHEET).waitFor();
  await page.getByText('Recovery points', { exact: true }).waitFor();
  await page.waitForTimeout(2500);
  console.log('SHEET:', await text(page.locator(SHEET)));
  await c.shot('backups/x-focus-sheet', { locator: SHEET });
}
const clusters = () => page.evaluate(async ([p, ph]) => {
  const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  return ((a.phases || []).find((x) => x.name === ph).sharedAddons || []).filter((x) => x.kind === 'Cluster').map((x) => x.instance);
}, [PROJECT, PHASE]);
if (STEP === 'temp-setup') {
  // Setup (not captured): a second, temporary PostgreSQL.
  const before = await clusters();
  if (!(await page.getByText('ready to deploy', { exact: true }).count())) {
    await page.getByTestId('canvas-new-service').click();
    await page.getByText('PostgreSQL, MariaDB, Valkey, and more').click();
    await page.getByText('Reliable open-source relational database').click();
  }
  await page.getByText('ready to deploy', { exact: true }).first().waitFor({ timeout: 20000 });
  await page.getByText('ready to deploy', { exact: true }).first().click();
  await page.getByText(/Deploys with the catalog defaults/i).waitFor();
  await page.getByRole('button', { name: 'Deploy', exact: true }).click();
  let temp;
  for (let i = 0; i < 60 && !temp; i++) { await page.waitForTimeout(5000); temp = (await clusters()).find((x) => !before.includes(x)); }
  console.log('TEMP', temp);
}
if (STEP === 'cmdbar') {
  // Select the temp database's card, then Backup in the command bar.
  const cards = page.getByText('PostgreSQL', { exact: true });
  console.log('pg cards', await cards.count());
  await cards.nth(Number(process.env.NTH ?? 1)).click({ modifiers: ['Shift'] });
  await page.waitForTimeout(1500);
  const bar = page.getByRole('toolbar', { name: 'Canvas selection' });
  await bar.waitFor({ timeout: 10000 });
  console.log('BAR:', await text(bar));
  await c.shot('backups/x-cmdbar', { locator: '[role=toolbar][aria-label="Canvas selection"]', pad: 8 });
  await bar.getByTestId('canvas-selection-backup').dispatchEvent('click');
  await page.waitForTimeout(2500);
  console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Commit 1 change/ }).click();
  const d = page.locator('[role=dialog]').last();
  await d.getByRole('button', { name: 'Deploy 1 change' }).waitFor();
  console.log('COMMIT:', await text(d));
  await c.shot('backups/x-cmdbar-commit', { locator: '[role=dialog]' });
  await d.getByRole('button', { name: 'Deploy 1 change' }).click();
  await page.waitForTimeout(5000);
}

if (STEP === 'orphans') {
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('Snapshots and restore for this environment').click();
  await page.getByText('Recovery points', { exact: true }).waitFor();
  await page.waitForTimeout(2000);
  await page.locator(SHEET).getByRole('tab', { name: 'Restore' }).click();
  await page.getByTestId('restore-orphans-toggle').waitFor({ timeout: 20000 });
  await page.getByTestId('restore-orphans-toggle').click();
  await page.getByTestId('restore-orphans-table').waitFor();
  await page.waitForTimeout(1500);
  console.log('RESTORE:', await text(page.locator(SHEET)));
  await c.shot('backups/x-orphans', { locator: SHEET });
  if (process.env.GO) {
    await page.getByRole('button', { name: 'Restore as new database' }).first().click();
    await page.waitForTimeout(2500);
    console.log('AFTER:', await text(page.locator('[role=dialog]').last()));
    console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
    const dlg = page.locator('[role=dialog]:has-text("as a new database")').last();
    await c.shot('backups/x-orphan-restore', { locator: '[role=dialog]:has-text("as a new database") >> nth=-1' });
    if (process.env.STAGE) {
      await dlg.getByRole('button', { name: 'Stage restore' }).click();
      await page.waitForTimeout(2500);
      console.log('toasts:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ').replace(/\s+/g, ' '));
    }
  }
}
if (STEP === 'commit' || (STEP === 'orphans' && process.env.STAGE)) {
  await page.keyboard.press('Escape'); await page.waitForTimeout(800); await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
  const d = page.locator('[role=dialog]').last();
  await page.waitForTimeout(2000);
  console.log('COMMIT:', await text(d));
  await c.shot('backups/x-orphan-commit', { locator: '[role=dialog]' });
  if (await page.getByText('to confirm').count()) await page.getByPlaceholder('copy', { exact: true }).fill('copy');
  if (process.env.GO) { await d.getByRole('button', { name: /^Deploy \d+ change/ }).click(); await page.waitForTimeout(5000); }
}

await c.done();
