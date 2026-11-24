// Switch instance: move the apps connected to a database onto its restored
// copy, check the app now points at the copy, then switch back.
// Needs a restored copy (backups.mjs): COPY=<instance>.
import { open } from '../lib.mjs';

const PROJECT = process.env.DEMO_PROJECT ?? 'my-first-project-h22a';
const PHASE = 'dev';
const COPY = process.env.COPY;
if (!COPY) throw new Error('set COPY=<restored instance>');
const c = await open();
const { page } = c;

const refs = () => page.evaluate(async ([p, ph]) => {
  const a = await (await fetch(`/api/pipelines/${p}/apps`)).json();
  const app = (a.phases || []).find((x) => x.name === ph).apps.find((x) => x.name.startsWith('nginx'));
  return app.sharedAddons || [];
}, [PROJECT, PHASE]);

async function openSwitch(instance) {
  await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
  await page.locator(`[data-testid$="-${instance}"][data-testid^="app-card-canvas-group-"], [data-testid="app-card-addon-${instance}"]`).first().getByRole('button', { name: 'Manage PostgreSQL' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  const box = page.getByText('Point connected apps at a restored sibling.').locator('xpath=ancestor::*[contains(@class,"form-subsection-card")][1]');
  await box.locator('select').first().waitFor({ timeout: 30000 });
  await box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return box;
}

await c.goto(`/pipeline/${PROJECT}/apps?phase=${PHASE}`);
let before = await refs();
const LIVE = process.env.LIVE ?? before.find((r) => /^postgresql-/.test(r) && r !== COPY);
if (before.includes(COPY)) {
  // A previous run left nginx on the copy (setup, not captured).
  const b0 = await openSwitch(COPY);
  await b0.locator('select').nth(0).selectOption(COPY);
  await b0.locator('select').nth(1).selectOption(LIVE);
  await b0.getByRole('button', { name: 'Switch' }).click();
  for (let i = 0; i < 20 && !(before = await refs()).includes(LIVE); i++) await page.waitForTimeout(3000);
}
if (!LIVE) throw new Error(`nginx is not connected to a database: ${before}`);
console.log('nginx uses', LIVE);

console.log('1. Live database → Settings → Switch instance');
let box = await openSwitch(LIVE);
await box.locator('select').nth(0).selectOption(LIVE);
await box.locator('select').nth(1).selectOption(COPY);
await page.waitForTimeout(800);
await c.shot('backups/10-switch', { around: box, pad: 12 });

console.log('2. Switch → nginx points at the copy');
await box.getByRole('button', { name: 'Switch' }).click();
await page.waitForTimeout(2000);
console.log('    toast:', (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | '));
let after = [];
for (let i = 0; i < 20; i++) {
  after = await refs();
  if (after.includes(COPY) && !after.includes(LIVE)) break;
  await page.waitForTimeout(3000);
}
console.log('    nginx refs:', after.join(', '));
if (!after.includes(COPY) || after.includes(LIVE)) throw new Error('nginx did not move to the copy');
await page.waitForTimeout(1500);
box = await openSwitch(COPY);
await c.shot('backups/11-switched', { around: box, pad: 12 });

console.log('3. Switch back (setup, not captured)');
await box.locator('select').nth(0).selectOption(COPY);
await box.locator('select').nth(1).selectOption(LIVE);
await box.getByRole('button', { name: 'Switch' }).click();
for (let i = 0; i < 20; i++) {
  after = await refs();
  if (after.includes(LIVE) && !after.includes(COPY)) break;
  await page.waitForTimeout(3000);
}
console.log('    nginx refs:', after.join(', '));
if (!after.includes(LIVE)) throw new Error('could not switch back');

await c.done();
