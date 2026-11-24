// The rest of the Variables tab (App pane): Generate, show / copy, the
// row errors, the inline-password hint, Raw editor (ENV and JSON), Export,
// and importing a .env file. Nothing is deployed: every staged change is
// dropped with Discard all at the end.
// Runs against nginx in github-demo-gv35 (dev).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { open } from '../lib.mjs';

const PROJECT = process.env.CAPTURE_PROJECT ?? 'github-demo-gv35';
const PHASE = 'dev';
const APP = 'nginx';
const c = await open();
const { page } = c;
page.on('dialog', (d) => { console.log('   page dialog:', d.type(), d.message()); d.accept().catch(() => {}); });
const SHEET = { x: 566, y: 113, width: 851, height: 764 };
const flat = (s) => s.replace(/\s+/g, ' ').trim();
// One row per variable ("group flex items-center gap-2" in EnvTab.vue).
const rows = () => page.locator('div.group.flex.items-center.gap-2').filter({ has: page.locator('input[id^=env-name-]') });
const center = (l) => l.evaluate((e) => e.scrollIntoView({ block: 'center' }));
const rowFor = async (name) => {
  const all = rows();
  for (let i = 0; i < (await all.count()); i++) {
    if ((await all.nth(i).locator('input[id^=env-name-]').inputValue()) === name) return all.nth(i);
  }
  throw new Error(`no row ${name}`);
};

await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
await page.getByText(APP, { exact: true }).first().click();
await page.getByRole('tab', { name: /^Variables/ }).click();
await page.getByText('Environment Variables').waitFor();
await page.locator('#env-name-0').waitFor({ timeout: 20000 });
await page.waitForTimeout(1500);
if (await page.getByRole('button', { name: /Commit \d+ change/ }).count()) {
  await page.getByRole('button', { name: /Commit \d+ change/ }).click();
  await page.waitForTimeout(1000);
  console.log('   already staged:', (await page.locator('[role=dialog]').filter({ hasText: /to apply/ }).last().innerText()).replace(/\s+/g, ' '));
  throw new Error('changes already staged in this environment');
}

console.log('1. Hover a stored value: show / copy');
const port = await rowFor('PORT');
await port.hover();
// The buttons show on hover or focus; focus keeps them up for the shot.
await port.getByTitle('Copy value').focus();
await page.waitForTimeout(400);
console.log('   row buttons:', await port.locator('button').evaluateAll((b) => b.map((x) => x.title || x.innerText)));
await c.shot('variables/app-1-hover', { around: [port], pad: 12 });
await port.getByTitle(/Show value|Hide value/).click();
await page.waitForTimeout(1500);
console.log('   after show:', await port.locator('input[id^=env-val-]').inputValue().then((v) => (v === '********' ? 'still masked' : 'shown')));

console.log('2. Add variable → Generate');
await page.getByRole('button', { name: 'Add variable' }).click();
const fresh = rows().last();
await fresh.locator('input[id^=env-name-]').fill('SESSION_SECRET');
await fresh.getByTitle('Fill with a random 32-character secret').waitFor();
await center(fresh);
await c.shot('variables/app-2-generate', { around: [fresh], pad: 12 });
await fresh.getByTitle('Fill with a random 32-character secret').click();
const gen = await fresh.locator('input[id^=env-val-]').inputValue();
console.log('   generated length:', gen.length, /^[0-9a-f]+$/.test(gen) ? 'hex' : 'other');
if (gen.length !== 32) throw new Error('generate did not fill 32 chars');
await page.getByRole('button', { name: /Commit 1 change/ }).waitFor();

console.log('3. Row errors: duplicate name, value without a name');
await page.getByRole('button', { name: 'Add variable' }).click();
await rows().last().locator('input[id^=env-name-]').fill('PORT');
await rows().last().locator('input[id^=env-val-]').fill('9000');
await page.getByRole('button', { name: 'Add variable' }).click();
await rows().last().locator('input[id^=env-val-]').fill('orphan');
await page.waitForTimeout(500);
const dupMsg = await rows().nth((await rows().count()) - 2).locator('p.text-destructive').innerText();
const nameMsg = await rows().last().locator('p.text-destructive').innerText();
console.log('   duplicate:', dupMsg, '| no name:', nameMsg);
await center(rows().last());
await c.shot('variables/app-3-errors', { around: [rows().nth((await rows().count()) - 2), rows().last()], pad: 12, extraBottom: 28 });
// Drop the two bad rows again.
await rows().last().getByTitle('Remove').click();
await rows().last().getByTitle('Remove').click();

console.log('4. Inline password hint');
await page.getByRole('button', { name: 'Add variable' }).click();
const url = rows().last();
await url.locator('input[id^=env-name-]').fill('DATABASE_URL');
await url.locator('input[id^=env-val-]').fill('postgres://app:hunter2@db.internal:5432/app');
const hint = url.getByText('Password written inline');
await hint.waitFor();
console.log('   hint:', flat(await url.locator('p.text-amber-600').innerText()));
await center(url);
await c.shot('variables/app-4-inline-password', { around: [url], pad: 12 });
await url.getByRole('button', { name: /^Use \$\(/ }).click();
console.log('   after Use …:', (await url.locator('input[id^=env-val-]').inputValue()).replace(/:\/\/([^:]+):([^@]+)@/, (m, u, p) => `://${u}:${p.startsWith('$(') ? p : '•••'}@`));
await url.getByTitle('Remove').click();

console.log('5. Raw editor (ENV, then JSON)');
await page.getByRole('button', { name: 'Raw editor' }).click();
const RAW = '[role=dialog]:has(textarea)';
const raw = page.locator(RAW);
await raw.locator('textarea').waitFor({ timeout: 20000 });
console.log('   raw dialog:', flat(await raw.innerText()).slice(0, 300));
const envText = await raw.locator('textarea').inputValue();
console.log('   ENV keys:', envText.split('\n').map((l) => l.split('=')[0]).filter(Boolean));
await c.shot('variables/app-5-raw-env', { locator: RAW });
await raw.getByRole('button', { name: 'json', exact: true }).click();
await page.waitForTimeout(400);
console.log('   JSON starts:', (await raw.locator('textarea').inputValue()).slice(0, 20));
await c.shot('variables/app-6-raw-json', { locator: RAW });
// A parse error, to show what the editor says.
await raw.locator('textarea').fill('{ "BROKEN": ');
await raw.getByRole('button', { name: 'Update variables' }).click();
await page.waitForTimeout(400);
console.log('   parse error:', flat(await raw.locator('ul.text-destructive').innerText()));
await c.shot('variables/app-7-raw-error', { locator: RAW });
await raw.getByRole('button', { name: 'Cancel' }).click();
await raw.waitFor({ state: 'hidden' });
// Now a valid edit: add a line in ENV mode and apply it.
await page.getByRole('button', { name: 'Raw editor' }).click();
await raw.locator('textarea').waitFor({ timeout: 20000 });
console.log('   reopens in:', await raw.locator('button.uppercase').evaluateAll((b) => b.map((x) => x.textContent.trim() + (x.className.includes('bg-secondary text-foreground') ? '*' : ''))));
await raw.getByRole('button', { name: 'env', exact: true }).click();
const before = await raw.locator('textarea').inputValue();
await raw.locator('textarea').fill(before.replace(/\n*$/, '\n') + 'RAW_ADDED="from the raw editor"\n');
await raw.getByRole('button', { name: 'Update variables' }).click();
await raw.waitFor({ state: 'hidden' });
await page.waitForTimeout(500);
if (!(await page.locator('input[id^=env-name-]').evaluateAll((e) => e.map((x) => x.value))).includes('RAW_ADDED')) throw new Error('raw update did not add the row');
console.log('   raw update added RAW_ADDED; toolbar:', await page.getByRole('button', { name: /Commit \d+ change/ }).innerText());

console.log('6. Export');
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export' }).click()]);
const file = path.join(os.tmpdir(), `docs-export-${process.pid}.env`);
await dl.saveAs(file);
const exported = fs.readFileSync(file, 'utf8');
fs.rmSync(file);
console.log('   file name:', dl.suggestedFilename());
console.log('   header:', exported.split('\n').slice(0, 3).map((l) => l.replace(/Exported .*/, 'Exported <date>')));
console.log('   lines:', exported.split('\n').map((l) => (l.startsWith('#') ? l : l.split('=')[0] + '=…')).filter(Boolean));

console.log('7. Import a .env file');
const envFile = path.join(os.tmpdir(), `docs-import-${process.pid}.env`);
fs.writeFileSync(envFile, '# imported\nIMPORTED_FLAG=yes\nIMPORTED_NAME="hello world"\n');
await page.locator('#env-file').setInputFiles(envFile);
fs.rmSync(envFile);
await page.waitForTimeout(1000);
const names = await page.locator('input[id^=env-name-]').evaluateAll((e) => e.map((x) => x.value));
console.log('   names now:', names);
if (!names.includes('IMPORTED_FLAG')) throw new Error('import did not add rows');
const commit = page.getByRole('button', { name: /Commit \d+ change/ });
console.log('   toolbar:', await commit.innerText());
const imp = await rowFor('IMPORTED_FLAG');
await imp.scrollIntoViewIfNeeded();
await c.shot('variables/app-8-imported', { clip: SHEET });

console.log('8. Discard all');
await commit.click();
const dlg = page.locator('[role=dialog]').filter({ hasText: /changes? to apply/ }).last();
await dlg.getByRole('button', { name: 'Discard all' }).waitFor();
console.log('   commit dialog:', flat(await dlg.innerText()).slice(0, 400));
await dlg.getByRole('button', { name: 'Discard all' }).click();
await page.waitForTimeout(1500);
const again = page.locator('[role=alertdialog]').last();
if (await again.isVisible().catch(() => false)) {
  console.log('   discard confirm:', flat(await again.innerText()));
  const b = again.getByRole('button', { name: /Discard/ }).last();
  if (await b.count()) await b.click();
}
await commit.waitFor({ state: 'hidden', timeout: 10000 });
console.log('   nothing staged');

await c.done();
