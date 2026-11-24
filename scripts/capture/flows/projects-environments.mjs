// Environments: switch between them in the header, add one (turn Test on in
// Project settings → General → Environments), remove it again, and see an
// environment made with the CLI listed read-only. Uses the empty project
// and leaves it as it was (dev, stage, production).
// Needs the isolated dev CLI: CLI_BIN, CLI_HOME.
import { execFileSync } from 'node:child_process';
import { open, DASHBOARD } from '../lib.mjs';

const PROJECT = process.env.EMPTY_PROJECT ?? 'github-demo-cw8z';
const BIN = process.env.CLI_BIN;
const HOME = process.env.CLI_HOME;
if (!BIN || !HOME) throw new Error('set CLI_BIN and CLI_HOME (an isolated CLI install)');
const API = DASHBOARD.replace('dashboard', 'api').replace('.stackblaze.com', '.stackblaze.cloud');
const cli = (...args) => execFileSync(BIN, args, { env: { ...process.env, HOME, STACKBLAZE_API_URL: API, NO_COLOR: '1' }, encoding: 'utf8' });
// A write can meet a background update of the project ("changed since this
// copy was loaded"): try again.
const cliRetry = (...args) => {
  for (let i = 0; ; i++) {
    try { return cli(...args); } catch (e) {
      if (i >= 5) throw e;
      execFileSync('sleep', ['10']);
    }
  }
};
const phases = () => JSON.parse(cli('api', 'GET', `/api/pipelines/${PROJECT}`)).phases.filter((p) => p.enabled).map((p) => p.name);

const c = await open();
const { page } = c;
// Log any browser dialog (e.g. leave-page prompts) and dismiss it.
page.on('dialog', (d) => { console.log(`    dialog (${d.type()}): ${d.message()}`); d.dismiss().catch(() => {}); });
const before = phases();
console.log('environments before:', before.join(', '));
if (before.join() !== 'dev,stage,production') throw new Error('expected dev, stage, production');

const menu = () => page.getByRole('menu').first();
async function openSwitcher() {
  await page.getByTestId('phase-switcher').click();
  await menu().waitFor();
  await page.waitForTimeout(400);
}


async function saveEnv(okText = 'Saved.') {
  const put = page.waitForResponse((r) => r.url().includes(`/api/pipelines/${PROJECT}`) && r.request().method() === 'PUT', { timeout: 90000 });
  await page.getByTestId('save-environments').click();
  const r = await put;
  console.log('    PUT', r.status());
  if (r.status() >= 300) console.log('    ', (await r.text()).slice(0, 300));
}

console.log('1. Header: the environment switcher');
await c.goto(`/pipeline/${PROJECT}/apps?phase=dev`);
await openSwitcher();
await c.shot('projects/env-1-switcher', { around: ['[data-testid=phase-switcher]', '[role=menu]'], pad: 12 });

console.log('2. Switch to Stage');
await menu().getByRole('menuitem', { name: 'Stage' }).click();
await page.waitForURL(/phase=stage/);
await page.waitForTimeout(1200);
await c.shot('projects/env-2-stage', { clip: { x: 0, y: 0, width: 720, height: 46 } });

console.log('3. Environment settings');
await openSwitcher();
await menu().getByRole('menuitem', { name: 'Environment settings' }).click();
await page.waitForURL(/settings\/general#environments/);
const card = page.locator('#environments');
await card.getByRole('switch').first().waitFor();
await page.waitForTimeout(1000);
await card.scrollIntoViewIfNeeded();
await c.shot('projects/env-3-card', { locator: '#environments' });

const version = () => JSON.parse(cli('api', 'GET', `/api/pipelines/${PROJECT}`)).resourceVersion;
async function settle() {
  // Opening an environment's canvas for the first time saves its layout to
  // the project a little later. Wait until the project stops changing and
  // load a fresh copy, so the save doesn't meet that update (the page would
  // then say "This project changed since you opened this page").
  for (let v = version(), i = 0; i < 20; i++) {
    await page.waitForTimeout(4000);
    const n = version();
    if (n === v) break;
    v = n;
  }
}
async function toggleTestAndSave() {
  await settle();
  await c.goto(`/pipeline/${PROJECT}/settings/general`);
  await card.getByRole('switch').nth(1).click(); // Dev, Test, Stage, Production
  await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
}

console.log('4. Add: turn Test on → Save changes');
await toggleTestAndSave();
await c.shot('projects/env-4-test-on', { locator: '#environments' });
await saveEnv();
await card.getByText('Saved.').waitFor({ timeout: 10000 });
await c.shot('projects/env-5-saved', { locator: '#environments' });
if (!phases().includes('test')) throw new Error('test was not enabled');

console.log('5. Test is in the switcher');
await c.goto(`/pipeline/${PROJECT}/apps?phase=test`);
await openSwitcher();
await c.shot('projects/env-6-switcher-test', { around: ['[data-testid=phase-switcher]', '[role=menu]'], pad: 12 });
await page.keyboard.press('Escape');

console.log('6. Remove: turn Test off → Save changes');
await toggleTestAndSave();
await saveEnv();
await card.getByText('Saved.').waitFor({ timeout: 10000 });
if (phases().includes('test')) throw new Error('test is still enabled');

console.log('7. An environment made with the CLI: listed without a switch');
await settle();
cliRetry('phases', 'create', 'qa', '-p', PROJECT);
try {
  await c.goto(`/pipeline/${PROJECT}/settings/general`);
  await card.getByTestId('other-phase').waitFor();
  await card.scrollIntoViewIfNeeded();
  await c.shot('projects/env-7-other', { locator: '#environments' });
} finally {
  cliRetry('phases', 'delete', 'qa', '-p', PROJECT, '-y');
}

const after = phases();
console.log('environments after:', after.join(', '));
if (after.join() !== before.join()) throw new Error('project not back to its environments');
await c.done();
