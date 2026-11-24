// Back up an environment, change the data, restore the backup as a copy and
// prove the copy holds the data as it was at backup time.
// Needs the demo project's PostgreSQL (postgresql.mjs).
import { open } from '../lib.mjs';
import { openConsole } from './_cloudbeaver.mjs';

const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const PHASE = 'dev';
const c = await open();
const { page } = c;
const canvas = () => c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
const SHEET = '[role=dialog]:has-text("Backup and restore")';
async function openBackups() {
  await canvas();
  await page.getByTestId('canvas-new-service').click();
  await page.getByText('Snapshots and restore for this environment').click();
  await page.getByText('Recovery points').waitFor();
  await page.waitForTimeout(1500);
}
async function commitAndDeploy(id) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Commit 1 change/ }).click();
  await page.getByRole('button', { name: 'Deploy 1 change' }).waitFor();
  await c.shot(id, { locator: '[role=dialog]' });
  // A restore asks you to type "copy" first.
  if (await page.getByText('to confirm').count()) {
    await page.getByPlaceholder('copy', { exact: true }).fill('copy');
    await c.shot(`${id}-typed`, { locator: '[role=dialog]' });
  }
  await page.getByRole('button', { name: 'Deploy 1 change' }).click();
}
const pointCount = () => page.locator(SHEET).getByText(/ · (on demand|daily|weekly|monthly)/).count();

// The running database's instance name, from the card's console link.
await canvas();
if (await page.getByRole('button', { name: /^Commit \d+ change/ }).count()) {
  console.log('(discarding changes left staged by an earlier run)');
  await page.getByRole('button', { name: /^Commit \d+ change/ }).click();
  await page.getByRole('button', { name: 'Discard all' }).click();
  await page.waitForTimeout(1500);
}
const tid = await page.locator('[data-testid^=app-card-cloudbeaver-addon-postgresql-]').first().getAttribute('data-testid');
const INSTANCE = tid.replace('app-card-cloudbeaver-addon-', '');
if (INSTANCE.endsWith('-restored')) throw new Error('first database card is a restored copy; remove it first');
console.log('database', INSTANCE);
const clusters = () => page.evaluate(async ([p, ph]) => {
  const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  return ((a.phases || []).find((x) => x.name === ph).sharedAddons || []).filter((x) => x.kind === 'Cluster').map((x) => x.instance);
}, [PROJECT, PHASE]);
for (const old of process.env.RESUME_COPY ? [] : (await clusters()).filter((i) => i !== INSTANCE && /restored/.test(i))) {
  // A copy left by an earlier run (setup, not captured).
  const st = await page.evaluate(async ([p, ph, i]) => (await fetch(`/api/pipelines/${p}/${ph}/shared-addons/${i}`, { method: 'DELETE' })).status, [PROJECT, PHASE, old]);
  console.log(`(deleted earlier copy ${old}: ${st})`);
}
const clustersBefore = await clusters();
let COPY;
let con;

// RESUME_COPY=<instance>: steps 0–5 already ran (their shots are saved);
// continue from the restored copy.
const RESUME = process.env.RESUME_COPY;
if (!RESUME) {
console.log('0. Marker row before the backup (setup, not captured)');
con = await openConsole(page, INSTANCE);
await con.run('create table if not exists docs_check (note text);');
await con.run("delete from docs_check where note is not null;");
await con.run("insert into docs_check values ('before backup');");
console.log('   ', (await con.run('select note from docs_check;')).replace(/\s+/g, ' ').slice(0, 80));
await con.close();

console.log('1. Backup and restore → Back up now (staged)');
await openBackups();
const before = await pointCount();
await c.shot('backups/1-sheet', { locator: SHEET });
await page.getByRole('button', { name: 'Back up now' }).click();
await page.getByRole('button', { name: /^Commit 1 change/ }).waitFor();

console.log('2. Commit → Deploy 1 change → recovery point');
await commitAndDeploy('backups/2-commit');
const until = Date.now() + 10 * 60000;
while (Date.now() < until) {
  await page.waitForTimeout(15000);
  await openBackups();
  if ((await pointCount()) > before && !/usually a minute or two/.test(await page.locator(SHEET).innerText())) break;
}
if ((await pointCount()) <= before) throw new Error('no new recovery point');
await c.shot('backups/3-point', { locator: SHEET });
await page.locator(SHEET).getByText(/ · on demand/).first().click();
await page.getByText('Delete recovery point').first().waitFor();
await c.shot('backups/4-point-open', { locator: SHEET });

c.checkpoint();
console.log('3. Change the data after the backup (setup, not captured)');
con = await openConsole(page, INSTANCE);
await con.run("insert into docs_check values ('after backup');");
await con.close();

console.log('4. Restore tab: From, What');
await openBackups();
await page.getByRole('tab', { name: 'Restore' }).click();
await page.getByText('Stage restore').waitFor();
await c.shot('backups/5-restore', { locator: SHEET });
await page.getByText('Choose…', { exact: true }).click();
await page.getByText('Tick what to restore.').waitFor();
await c.shot('backups/6-restore-choose', { locator: SHEET });
await page.getByText('Everything', { exact: true }).click();
const adds = (await page.locator(SHEET).getByText(/^Adds .* next to what is running/).innerText()).trim();
console.log('   ', adds);
const SAID = adds.match(/^Adds (\S+)/)[1];

console.log('5. Stage restore → Commit → Deploy');
await page.getByRole('button', { name: 'Stage restore' }).click();
await commitAndDeploy('backups/7-restore-commit');
// The copy's real name can differ from the one the form shows, so take the
// database that appears after the restore.
COPY = undefined;
const until2 = Date.now() + 15 * 60000;
while (Date.now() < until2) {
  await page.waitForTimeout(20000);
  COPY ??= (await clusters()).find((i) => !clustersBefore.includes(i));
  if (!COPY) continue;
  await canvas();
  const card = page.locator(`[data-testid^=app-card-cloudbeaver-][data-testid$="-${COPY}"]`);
  if (await card.count()) {
    const txt = await page.locator('body').innerText();
    if (!/Restoring|Updating|Deploying\n/.test(txt)) break;
  }
}
if (!COPY) throw new Error('no restored copy appeared');
console.log(`    copy ${COPY} (the form said ${SAID})`);
c.checkpoint();
await page.locator(`[data-testid^=app-card-cloudbeaver-][data-testid$="-${COPY}"]`).waitFor({ timeout: 10000 });
await page.waitForTimeout(3000);
await c.shot('backups/8-copy', { around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 200 });

} // end of !RESUME
if (RESUME) {
  COPY = RESUME;
  await canvas();
  await page.locator(`[data-testid^=app-card-cloudbeaver-][data-testid$="-${COPY}"]`).waitFor({ timeout: 30000 });
  await page.waitForTimeout(3000);
  await c.shot('backups/8-copy', { around: [page.getByText('DATABASES'), page.getByTestId('canvas-new-service')], pad: 24, extraBottom: 200 });
}
console.log('6. The copy has the data as it was at backup time');
con = await openConsole(page, COPY);
const copyRows = await con.run('select note from docs_check order by note;');
await c.shotPage('backups/9-copy-query', con.cb, `CloudBeaver: ${COPY}`);
await con.close();
con = await openConsole(page, INSTANCE);
const liveRows = await con.run('select note from docs_check order by note;');
await con.close();
console.log('    copy:', copyRows.replace(/\s+/g, ' ').slice(0, 80));
console.log('    live:', liveRows.replace(/\s+/g, ' ').slice(0, 80));
if (!copyRows.includes('before backup') || copyRows.includes('after backup')) throw new Error('copy does not match the backup');
if (!liveRows.includes('after backup')) throw new Error('running database changed');

await c.done();
console.log(JSON.stringify({ instance: INSTANCE, copy: COPY }));
